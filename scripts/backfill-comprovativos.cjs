// Backfill P1-2: migra comprovativos antigos (base64 na row) para o bucket
// privado «comprovativos» e limpa a coluna — encolhe as rows para stimulate
// menos payload nas selects. Espelha a mecânica da rota nova
// (server/api.ts · guardarComprovativoStorage · pathComprovativo):
//   caminho: {pedidoId}/{ts}-{nomeSeguro}
//   bucket público? NÃO — private, leitura por download na rota admin/portal.
//
// Uso:
//   node scripts/backfill-comprovativos.cjs            # executa a migrar
//   node scripts/backfill-comprovativos.cjs --dry     # só inventaria
//
// Envs (do supabase project): SUPABASE_URL + SUPABASE_SERVICE_ROLE
// (lidas do ambiente ou do .env local, nunca impressas).
const fs = require('fs')
const path = require('path')

function loadEnvs() {
  const from = (n) => process.env[n] || ''
  let envs = { url: from('SUPABASE_URL'), key: from('SUPABASE_SERVICE_ROLE') }
  if (envs.url && envs.key) return envs
  try {
    const f = fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8')
    const clean = (s) => s.replace(/["\r]/g, '').trim()
    if (!envs.url) envs.url = clean((f.match(/^SUPABASE_URL=(.*)$/m) || [])[1] || '')
    if (!envs.key) envs.key = clean((f.match(/^SUPABASE_SERVICE_ROLE=(.*)$/m) || [])[1] || '')
  } catch { /* sem .env local — só envs do processo */ }
  return envs
}

const mimePorExt = (nome) => {
  const ext = String(nome || '').split('.').pop()?.toLowerCase() || ''
  return ext === 'pdf' ? 'application/pdf' : ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : (ext === 'jpg' || ext === 'jpeg') ? 'image/jpeg' : 'application/octet-stream'
}
const pathComprovativo = (pedidoId, nome, quando = Date.now()) => {
  const safe = String(nome).replace(/[^a-zA-Z0-9-_.]/g, '_').slice(0, 80) || 'comprovativo'
  return `${pedidoId}/${quando}-${safe}`
}

;(async () => {
  const dry = process.argv.includes('--dry')
  const { url, key } = loadEnvs()
  if (!url || !key) { console.error('Falta SUPABASE_URL / SUPABASE_SERVICE_ROLE.'); process.exit(1) }
  const h = { apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' }

  const todas = await fetch(url + '/rest/v1/pedidos_licencas?select=id,nome_empresa,comprovativo_b64,comprovativo_nome&order=created_at.asc&limit=1000', { headers: h }).then(r => r.json())
  if (!Array.isArray(todas)) { console.error('BD: ' + JSON.stringify(todas).slice(0, 160)); process.exit(1) }
  const alvos = todas.filter(r => r.comprovativo_b64 && String(r.comprovativo_b64).length > 100)
  console.log(`rows: ${todas.length} · com comprovativo_b64: ${alvos.length}${dry ? ' (DRY)' : ''}`)
  if (!alvos.length) { console.log('Nada a migrar.'); process.exit(0) }

  // bucket: se não existir, cria uma vez (mesma política da rota — privado, 2 MB)
  const s = await fetch(url + '/storage/v1/bucket/comprovativos', { headers: h }).then(r => r.json()).catch(() => null)
  if (!s || s.error) {
    const c = await fetch(url + '/storage/v1/bucket', { method: 'POST', headers: h, body: JSON.stringify({ id: 'comprovativos', name: 'comprovativos', public: false, fileSizeLimit: 2 * 1024 * 1024 }) })
    console.log('bucket criado: ' + c.status)
  }

  const ms = Math.max(2, 1000 / 10) /* ~10 req/s */
  let ok = 0, falhas = 0
  for (const r of alvos) {
    const buf = Buffer.from(String(r.comprovativo_b64), 'base64')
    const nome = r.comprovativo_nome || 'comprovativo.pdf'
    const caminho = pathComprovativo(r.id, nome)
    try {
      const up = await fetch(`${url}/storage/v1/object/comprovativos/${caminho}`, {
        method: 'POST',
        headers: { apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': mimePorExt(nome), 'x-upsert': 'false' },
        body: buf,
      })
      if (up.status !== 200) throw new Error('upload ' + up.status + ' ' + (await up.text()).slice(0, 120))
      // storage OK → limpar a coluna base64 (manter nome para a leitura de storage)
      const upd = await fetch(url + '/rest/v1/pedidos_licencas?id=eq.' + r.id, {
        method: 'PATCH', headers: h,
        body: JSON.stringify({ comprovativo_b64: null }),
      })
      if (upd.status !== 204) throw new Error('patch ' + upd.status)
      ok++
      console.log(`  ✓ ${r.id.slice(0, 8)} ${r.nome_empresa || ''} · ${nome} · ${(buf.length / 1024).toFixed(0)} KB`)
      await new Promise(x => setTimeout(x, ms))
    } catch (e) {
      falhas++
      console.log(`  ✗ ${r.id.slice(0, 8)} ${r.nome_empresa || ''} · ${e.message}`)
    }
  }
  console.log(`Fim: ${ok} migrados · ${falhas} falhas (falhas ficam com base64 — re-corre para outra tentativa).`)
  process.exit(falhas ? 1 : 0)
})().catch(e => { console.error('ERRO: ' + e.message); process.exit(1) })
