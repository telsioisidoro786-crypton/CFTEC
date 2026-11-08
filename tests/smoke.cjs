/* eslint-disable */
// ============================================================
// CFTEC · Smoke tests dos endpoints críticos (sem credenciais)
// Corre: node tests/smoke.cjs  (ou: npm run smoke)
// Testa o que um atacante ou um visitante o comum veria:
//  - páginas de entrada a responder 200
//  - privados a devolver 401/403 SEM sessão (nada exposto)
//  - validações dos endpoints públicos a rebentar bem (400)
//  - rota de report de erros a aceitar bem-formatado
// Pressupõe dev/prod server em BASE_URL (default http://localhost:3000).
// ============================================================
'use strict'
const BASE = process.env.BASE_URL || 'http://localhost:3000'

const compartimentos = []
let falhas = 0

function verificar(nome, cond, extra) {
  if (cond) compartimentos.push(`  ok  ${nome}`)
  else { falhas++; compartimentos.push(`  X   ${nome}  ${extra || ''}`) }
}

async function pedir(rota, init) {
  try {
    const r = await fetch(BASE + rota, { redirect: 'manual', ...init, headers: { ...(init && init.headers || {}) }, timeout: 15000 })
    return r
  } catch (e) {
    return { status: 0, networkError: String(e) }
  }
}

async function principal() {
  console.log(`Smoke CFTEC → ${BASE}\n`)

  // 1. Site e entradas de app
  const site = await pedir('/')
  verificar('GET / (site) → 200', site.status === 200, `res=${site.status} ${site.networkError || ''}`)
  const admin = await pedir('/admin')
  verificar('GET /admin (painel) → 200', admin.status === 200, `res=${admin.status}`)
  const portal = await pedir('/cliente')
  verificar('GET /cliente (portal) → 200', portal.status === 200, `res=${portal.status}`)

  // 2b. SEO — robots.txt + sitemap servidos como ficheiros estáticos
  const robots = await pedir('/robots.txt')
  verificar('GET /robots.txt → 200 + sitemap declarado', robots.status === 200 && /sitemap\.xml/.test(await robots.text()), `res=${robots.status}`)
  const sitemap = await pedir('/sitemap.xml')
  verificar('GET /sitemap.xml → 200 com cftec.co', sitemap.status === 200 && /cftec\.co/.test(await sitemap.text()), `res=${sitemap.status}`)

  // 2. Públicos de leitura (5000 = sem supabase → aceitável como aviso, não falha dura?)
  const opts = await pedir('/api/contact-options')
  verificar('GET /api/contact-options → 200', opts.status === 200, `res=${opts.status} [${opts.status === 503 ? 'supabase off — ignora' : ''}]`)

  // 3. Guardas de sessão — nada deve estar aberto por engano
  const casos = [
    ['/api/admin/contacts', 'contactos admin'],
    ['/api/admin/license-orders', 'pedidos admin'],
    ['/api/admin/licenses', 'licenças admin'],
    ['/api/admin/log-erros', 'logs de erros'],
    ['/api/admin/settings', 'definições'],
    ['/api/admin/analytics', 'analytics de negócio (7.3)'],
    ['/api/admin/cliente360?nif=5007770001', 'ficha Cliente 360 (7.6)'],
    ['/api/admin/renovacoes-lote', 'machine renovações lote (7.7)'],
    ['/api/admin/alertas', 'central de alertas (8.2)'],
    ['/api/admin/alertas/testar', 'teste de canal alertas (8.2)'],
    // Parte 7.1 — auto-serviço do portal
    ['/api/portal/downloads', 'downloads do portal'],
    ['/api/portal/pedidos', 'pedidos do portal'],
    ['/api/portal/licencas', 'licenças do portal'],
    // Parte 7.2 — FAQ do portal
    ['/api/portal/faq', 'FAQ do portal'],
  ]
  for (const [rota, nome] of casos) {
    const r = await pedir(rota)
    verificar(`GET ${rota} (sem sessão) → 401/403 · ${nome}`, r.status === 401 || r.status === 403, `res=${r.status}`)
  }

  // 4. Portal do cliente — PDFs e dados só com sessão própria
  const pdf = await pedir('/api/portal/pedidos/00000000-0000-0000-0000-000000000000/proforma.pdf')
  verificar('GET /api/portal/pedidos/:id/proforma.pdf (sem sessão) → 401', pdf.status === 401, `res=${pdf.status}`)

  // 5. Validações dos públicos de escrita
  const contatoVazio = await pedir('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) })
  verificar('POST /api/contact (vazio) → 400', contatoVazio.status === 400, `res=${contatoVazio.status}`)
  const pedidoLixo = await pedir('/api/license-orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
  verificar('POST /api/license-orders (sem dados) → 400', pedidoLixo.status === 400, `res=${pedidoLixo.status}`)

  // 5b. Parte 7.1 — auto-serviço: sem sessão não se pede renovação nem anexam comprovativos
  const renSemSessao = await pedir('/api/portal/pedidos/renovar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ licenca_id: '00000000-0000-0000-0000-000000000000' }) })
  verificar('POST /api/portal/pedidos/renovar (sem sessão) → 401', renSemSessao.status === 401 || renSemSessao.status === 403, `res=${renSemSessao.status}`)
  const compSemSessao = await pedir('/api/portal/pedidos/00000000-0000-0000-0000-000000000000/comprovativo', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ comprovativo_b64: 'x' }) })
  verificar('POST /api/portal/pedidos/:id/comprovativo (sem sessão) → 401', compSemSessao.status === 401 || compSemSessao.status === 403, `res=${compSemSessao.status}`)
  // Lote A/C — o comprovativo próprio e o perfil também são dados do cliente: sem sessão nada sai
  const verCompSemSessao = await pedir('/api/portal/pedidos/00000000-0000-0000-0000-000000000000/comprovativo')
  verificar('GET /api/portal/pedidos/:id/comprovativo (sem sessão) → 401', verCompSemSessao.status === 401 || verCompSemSessao.status === 403, `res=${verCompSemSessao.status}`)
  const perfilSemSessao = await pedir('/api/portal/perfil', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nome_responsavel: 'x', telefone_whatsapp: '+244900000000' }) })
  verificar('PATCH /api/portal/perfil (sem sessão) → 401', perfilSemSessao.status === 401 || perfilSemSessao.status === 403, `res=${perfilSemSessao.status}`)
  // Storage — URL de upload assinado (instaladores) também é mutação: só com sessão
  const upUrl = await pedir('/api/admin/software/upload-url', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ filename: 'x.exe', size: 10 }) })
  verificar('POST /api/admin/software/upload-url (sem sessão) → 401', upUrl.status === 401 || upUrl.status === 403, `res=${upUrl.status}`)
  // GitHub Releases — publicação de instaladores: mutações todas exigem sessão
  const ghRel = await pedir('/api/admin/github/releases', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tag: 'x' }) })
  verificar('POST /api/admin/github/releases (sem sessão) → 401', ghRel.status === 401 || ghRel.status === 403, `res=${ghRel.status}`)
  const ghAsset = await pedir('/api/admin/github/releases/1/asset?name=x.bin', { method: 'POST', headers: { 'Content-Type': 'application/octet-stream' } })
  verificar('POST /api/admin/github/releases/:id/asset (sem sessão) → 401', ghAsset.status === 401 || ghAsset.status === 403, `res=${ghAsset.status}`)

  // 5b. Parte 8.3 — Backups 2.0: mutações e restauro só com sessão developer
  const bg = await pedir('/api/admin/backup/gerar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
  verificar('POST /api/admin/backup/gerar (sem sessão) → 401/403', bg.status === 401 || bg.status === 403, `res=${bg.status}`)
  const bp = await pedir('/api/admin/backup/prever', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
  verificar('POST /api/admin/backup/prever (sem sessão) → 401/403', bp.status === 401 || bp.status === 403, `res=${bp.status}`)
  const br = await pedir('/api/admin/backup/restaurar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
  verificar('POST /api/admin/backup/restaurar (sem sessão) → 401/403', br.status === 401 || br.status === 403, `res=${br.status}`)

  // 6. Report de erros (client) — formato completo e formato mínimo
  const rep1 = await pedir('/api/log-erro', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mensagem: '[smoke] teste de report', detalhe: 'Stack de teste', pagina: BASE + '/smoke' }) })
  verificar('POST /api/log-erro (completo) → 2xx', rep1.status >= 200 && rep1.status < 300, `res=${rep1.status}`)
  const rep2 = await pedir('/api/log-erro', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) })
  verificar('POST /api/log-erro (mínimo) → 2xx (tolerante)', rep2.status >= 200 && rep2.status < 300, `res=${rep2.status}`)

  console.log(compartimentos.join('\n'))
  console.log(falhas ? `\n${falhas} falha(s) de ${compartimentos.length} verificações.` : `\nTudo certo — ${compartimentos.length} verificações verdes.`)
  process.exit(falhas ? 1 : 0)
}

principal().catch((e) => { console.error('smoke crash:', e); process.exit(1) })
