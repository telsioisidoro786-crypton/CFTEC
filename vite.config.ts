import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import type { IncomingMessage, ServerResponse } from 'node:http'
import dotenv from 'dotenv'
import webpush from 'web-push'

// Prevent process crashes from unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
})
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error)
})

// Load environment variables for server middleware
// override=true: edições ao .env têm efeito imediato mesmo em restarts no mesmo processo
dotenv.config({ override: true })

type ContactPayload = { name?: string; email?: string; phone?: string; interest?: string; message?: string }
type AdminLevel = 'super_admin' | 'gestor' | 'tecnico' | 'developer'
type AdminClaims = { sub: string; email: string; name: string; role: 'admin'; level?: AdminLevel; jti?: string }

// Supabase client (using service role for admin operations)
const supabaseUrl = process.env.SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE || ''
const supabase = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null

const JWT_SECRET = process.env.CFTEC_JWT_SECRET || process.env.MANUS_JWT_SECRET || 'dev-secret-key-min-32-chars-long-for-testing-do-not-use-in-production'

const authCookieName = 'cftec_admin_session'
const sessionMaxAge = 60 * 60 * 8

// Web Push (VAPID) — gratuito: o envio é feito pelo serviço de push do
// próprio browser, o middleware só assina o payload. Sem chaves → desligado.
const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY || ''
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY || ''
const pushActivo = !!(VAPID_PUBLIC && VAPID_PRIVATE)
if (pushActivo) webpush.setVapidDetails('mailto:suporte@cftec.co', VAPID_PUBLIC, VAPID_PRIVATE)

// Envia Web Push a toda a equipa elegível para o tipo de evento
// (pedido → comercial+super | chamado → técnico+super) e limpa subscrições mortas
async function pushNotifyEquipa(tipo: 'pedido' | 'chamado', titulo: string, corpo: string) {
  if (!pushActivo || !supabase) return
  try {
    const niveis = tipo === 'pedido' ? ['gestor', 'super_admin', 'developer'] : ['tecnico', 'super_admin', 'developer']
    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth_key')
      .in('user_level', niveis)
    for (const s of subs || []) {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth_key } },
          JSON.stringify({ type: tipo, title: titulo, body: corpo, url: '/admin' }))
      } catch (err: { statusCode?: number } | any) {
        // 404/410 = endpoint expirado; remove para não sujar a tabela
        if (err?.statusCode === 404 || err?.statusCode === 410) {
          await supabase.from('push_subscriptions').delete().eq('endpoint', s.endpoint)
        }
      }
    }
  } catch (err) {
    console.warn('[PUSH] falha silenciosa:', err instanceof Error ? err.message : err)
  }
}

// Helper functions for Supabase
async function sbQuery<T>(query: Promise<{ data: T[] | null; error: any }>): Promise<T[]> {
  if (!supabase) return []
  const { data, error } = await query
  if (error) {
    console.error('Supabase query error:', error)
    return []
  }
  return data || []
}

async function sbSingle<T>(query: Promise<{ data: T | null; error: any }>): Promise<T | null> {
  if (!supabase) return null
  const { data, error } = await query
  if (error) {
    console.error('Supabase query error:', error)
    return null
  }
  return data
}

async function readBody(req: IncomingMessage) {
  const chunks: Buffer[] = []
  for await (const chunk of req) chunks.push(Buffer.from(chunk))
  const body = Buffer.concat(chunks).toString('utf8')
  if (!body || body.trim() === '') return {}
  try {
    return JSON.parse(body) as Record<string, unknown>
  } catch (e) {
    console.error('[READBODY] JSON parse error:', e, 'body:', body)
    return {}
  }
}

function json(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(body))
}

// ============================================================
// NOTIFICAÇÕES POR E-MAIL (Resend) — uma falha de e-mail NUNCA
// bloqueia a resposta principal da API.
//   .env:  RESEND_API_KEY=...   RESEND_FROM="CFTEC <nome@dominio>"
//          NOTIFY_EMAIL_TO=destino@fallback (usado se a settings 'notify_email' estiver vazia)
// Destino do admin fica na settings 'notify_email' (editável no painel).
// ============================================================
type EmailResult = { enviado: boolean; detalhe: string }

const escHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

async function getNotifyDestino(): Promise<string> {
  try {
    if (supabase) {
      const { data } = await supabase.from('settings').select('key, value').eq('key', 'notify_email').limit(1)
      const v = (data || []).find((s: { key: string; value: string }) => s.key === 'notify_email')?.value
      if (v && String(v).trim()) return String(v).trim()
    }
  } catch { /* sem tabela settings → fallback .env */ }
  return (process.env.NOTIFY_EMAIL_TO || '').trim()
}

async function sendEmailRaw(to: string, subject: string, html: string): Promise<EmailResult> {
  const apiKey = (process.env.RESEND_API_KEY || '').trim()
  if (!apiKey) return { enviado: false, detalhe: 'sem RESEND_API_KEY no .env' }
  const from = (process.env.RESEND_FROM || '').trim() || 'CFTEC <onboarding@resend.dev>'
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: [to], subject, html }),
    })
    const body = (await response.json().catch(() => ({}))) as { id?: string; message?: string }
    if (!response.ok) return { enviado: false, detalhe: `Resend HTTP ${response.status}: ${body.message || 'erro desconhecido'}` }
    return { enviado: true, detalhe: body.id ? `id=${body.id}` : 'sem id' }
  } catch (e) {
    return { enviado: false, detalhe: e instanceof Error ? e.message : 'exception' }
  }
}

// ================= PROFORMA PDF (sem dependências — PDF 1.4 manual) =================
const escPdf = (t: string) => t.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')

function buildProformaPdf(o: {
  numero: string; pedido: string; data: string
  empresa: string; nif: string; responsavel: string; email: string; provincia: string
  software: string; forma: string; preco: number | null; iban: string
}): Buffer {
  const L: string[] = []
  let y = 772
  const tx = (x: number, size: number, bold: boolean, text: string, yy?: number, color?: string) => {
    if (yy !== undefined) y = yy
    const c = color ? ` ${color} rg` : ''
    L.push(c ? `q${c} BT /${bold ? 'F2' : 'F1'} ${size} Tf ${x} ${y} Td (${escPdf(text)}) Tj ET Q` : `BT /${bold ? 'F2' : 'F1'} ${size} Tf ${x} ${y} Td (${escPdf(text)}) Tj ET`)
  }
  const hr = () => L.push(`0.88 0.89 0.91 RG 1.2 w 60 ${y} m 535 ${y} l S`)

  // cabeçalho
  L.push('0.059 0.09 0.165 rg 0 760 595 82 re f')   // fundo navy top
  tx(60, 24, true, 'CFTEC', 800, '1 1 1')
  tx(60, 8.5, false, 'cftec.co  ·  Engenharia digital para negocios que avançam', 779, '0.48 0.74 1')
  tx(440, 15, true, 'FATURA PROFORMA', 800, '1 1 1')
  tx(440, 8.5, false, `N.º ${o.numero}`, 779, '0.68 0.81 0.94')
  y = 700

  tx(62, 9, true, 'DADOS DO CLIENTE', y)
  y -= 16
  tx(62, 11.5, true, o.empresa, y); y -= 14
  tx(62, 9.5, false, `NIF: ${o.nif || '—'}   ·   Responsável: ${o.responsavel || '—'}`, y); y -= 13
  tx(62, 9.5, false, `E-mail: ${o.email}   ·   Província: ${o.provincia}`, y)
  tx(470, 9.5, false, `Data: ${o.data}`, 700)

  y -= 26; hr(); y -= 26
  // tabela
  tx(62, 8, true, 'DESCRIÇÃO', y); tx(392, 8, true, 'QTD', y); tx(490, 8, true, 'VALOR (Kz)', y)
  y -= 18; hr(); y -= 22
  tx(62, 10.5, false, `${o.software} — licença comercial (instalador + actualizações + suporte)`, y)
  tx(400, 10.5, false, '1', y)
  tx(474, 11.5, true, o.preco !== null ? `${new Intl.NumberFormat('pt-PT').format(o.preco)}` : 'Sob consulta', y)
  y -= 20; hr(); y -= 6; hr()
  tx(400, 12.5, true, 'Total:', y - 24)
  tx(474, 13.5, true, o.preco !== null ? `${new Intl.NumberFormat('pt-PT').format(o.preco)} Kz` : 'Sob consulta', y - 24)
  y = y - 62

  // pagamento
  tx(62, 9, true, 'DADOS DE PAGAMENTO', y); y -= 16
  tx(62, 9.5, false, `Forma preferida: ${o.forma}`, y); y -= 13
  tx(62, 9.5, false, `IBAN: ${o.iban}`, y); y -= 13
  tx(62, 9.5, false, `Referência do pedido: ${o.pedido} — copiar no comprovativo de transferência`, y); y -= 26; hr()

  // notas
  y -= 26
  tx(62, 9, true, 'CONDICÇÕES', y); y -= 15
  tx(62, 8.5, false, '· Proforma válida durante 30 dias após a data de emissão.', y); y -= 12
  tx(62, 8.5, false, '· Inclui activação de licença, actualizações de versão e suporte técnico da equipa CFTEC.', y); y -= 12
  tx(62, 8.5, false, '· Após confirmação do pagamento, o cliente recebe a chave de activação e o instalador oficial.', y); y -= 12
  tx(62, 8.5, false, '· Documento proforma — não é uma factura fiscal definitiva. Consulte-nos para facturação AGT.', y)

  // rodapé
  L.push('0.059 0.09 0.165 rg 0 0 595 54 re f')
  tx(62, 8.5, false, 'CFTEC — Consultoria, Formação & Tecnologia  ·  Angola', 30, '1 1 1')
  tx(62, 8.5, false, 'Suporte: suporte@cftec.co   ·   Comercial: hello@cftec.co', 17, '0.48 0.74 1')

  const content = L.join('\n')
  const objs = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>',
    `<< /Length ${Buffer.byteLength(content, 'latin1')} >>\nstream\n${content}\nendstream`,
  ]
  let pdf = '%PDF-1.4\n'
  const offsets: number[] = []
  objs.forEach((obj, i) => { offsets.push(Buffer.byteLength(pdf, 'latin1')); pdf += `${i + 1} 0 obj\n${obj}\nendobj\n` })
  const xrefStart = Buffer.byteLength(pdf, 'latin1')
  pdf += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`
  for (const off of offsets) pdf += String(off).padStart(10, '0') + ' 00000 n \n'
  pdf += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`
  return Buffer.from(pdf, 'latin1')
}

/** Fatura interna (FT) — emissão automática após confirmação do pagamento. Não é a factura AGT certificada. */
function buildFaturaPdf(o: {
  numero: string; pedido: string; data: string
  empresa: string; nif: string; responsavel: string; email: string; provincia: string
  software: string; forma: string; preco: number | null; iban: string
}): Buffer {
  const L: string[] = []
  let y = 772
  const tx = (x: number, size: number, bold: boolean, text: string, yy?: number, color?: string) => {
    if (yy !== undefined) y = yy
    const c = color ? ` ${color} rg` : ''
    L.push(c ? `q${c} BT /${bold ? 'F2' : 'F1'} ${size} Tf ${x} ${y} Td (${escPdf(text)}) Tj ET Q` : `BT /${bold ? 'F2' : 'F1'} ${size} Tf ${x} ${y} Td (${escPdf(text)}) Tj ET`)
  }
  const hr = () => L.push(`0.88 0.89 0.91 RG 1.2 w 60 ${y} m 535 ${y} l S`)

  // cabeçalho
  L.push('0.059 0.09 0.165 rg 0 760 595 82 re f')   // fundo navy top
  tx(60, 24, true, 'CFTEC', 800, '1 1 1')
  tx(60, 8.5, false, 'cftec.co  ·  Engenharia digital para negocios que avançam', 779, '0.48 0.74 1')
  tx(440, 15, true, 'FATURA INTERNA', 800, '0.34 0.94 0.65')
  tx(440, 8.5, false, `N.º ${o.numero}`, 779, '0.68 0.81 0.94')

  y = 700
  tx(62, 8.5, false, 'Pagamento confirmado — documento de conferência interna da equipa CFTEC.', y)
  y -= 16
  tx(62, 9, true, 'DADOS DO CLIENTE', y)
  y -= 16
  tx(62, 11.5, true, o.empresa, y); y -= 14
  tx(62, 9.5, false, `NIF: ${o.nif || '—'}   ·   Responsável: ${o.responsavel || '—'}`, y); y -= 13
  tx(62, 9.5, false, `E-mail: ${o.email}   ·   Província: ${o.provincia}`, y)
  tx(435, 8.5, false, 'Data da fatura:', 716)
  tx(505, 8.5, true, o.data, 716)

  y -= 26; hr(); y -= 26
  // tabela
  tx(62, 8, true, 'DESCRIÇÃO', y); tx(392, 8, true, 'QTD', y); tx(490, 8, true, 'VALOR (Kz)', y)
  y -= 18; hr(); y -= 22
  tx(62, 10.5, false, `${o.software} — licença comercial (instalador + actualizações + suporte)`, y)
  tx(400, 10.5, false, '1', y)
  tx(474, 11.5, true, o.preco !== null ? `${new Intl.NumberFormat('pt-PT').format(o.preco)}` : 'Sob consulta', y)
  y -= 20; hr(); y -= 6; hr()
  tx(400, 12.5, true, 'Total pago:', y - 24)
  tx(474, 13.5, true, o.preco !== null ? `${new Intl.NumberFormat('pt-PT').format(o.preco)} Kz` : 'Sob consulta', y - 24)
  y = y - 62

  // pagamento
  tx(62, 9, true, 'PAGAMENTO CONFIRMADO', y); y -= 16
  tx(62, 9.5, false, `Forma de pagamento: ${o.forma}`, y); y -= 13
  tx(62, 9.5, false, `Recebido em: IBAN ${o.iban}`, y); y -= 13
  tx(62, 9.5, false, `Referência do pedido: ${o.pedido} — comprovativo arquivado pela equipa comercial`, y); y -= 26; hr()

  // notas
  y -= 26
  tx(62, 9, true, 'NOTAS', y); y -= 15
  tx(62, 8.5, false, '· Documento interno de confirmação — não é uma factura fiscal certificada AGT.', y); y -= 12
  tx(62, 8.5, false, '· Inclui activação de licença, actualizações de versão e suporte técnico da equipa CFTEC.', y); y -= 12
  tx(62, 8.5, false, '· Licença e instalador oficial entregues ou em processo de entrega ao cliente.', y); y -= 12
  tx(62, 8.5, false, '· Factura fiscal definitiva emitida por software certificado AGT quando aplicável.', y)

  // rodapé
  L.push('0.059 0.09 0.165 rg 0 0 595 54 re f')
  tx(62, 8.5, false, 'CFTEC — Consultoria, Formação & Tecnologia  ·  Angola', 30, '1 1 1')
  tx(62, 8.5, false, 'Suporte: suporte@cftec.co   ·   Comercial: hello@cftec.co', 17, '0.48 0.74 1')

  const content = L.join('\n')
  const objs = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>',
    `<< /Length ${Buffer.byteLength(content, 'latin1')} >>\nstream\n${content}\nendstream`,
  ]
  let pdf = '%PDF-1.4\n'
  const offsets: number[] = []
  objs.forEach((obj, i) => { offsets.push(Buffer.byteLength(pdf, 'latin1')); pdf += `${i + 1} 0 obj\n${obj}\nendobj\n` })
  const xrefStart = Buffer.byteLength(pdf, 'latin1')
  pdf += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`
  for (const off of offsets) pdf += String(off).padStart(10, '0') + ' 00000 n \n'
  pdf += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`
  return Buffer.from(pdf, 'latin1')
}

function emailShell(titulo: string, corpoHtml: string): string {
  return `<!doctype html><html><body style="margin:0;padding:24px;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif">
<div style="max-width:580px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e2e8f0">
<div style="background:#0f172a;padding:22px 28px"><span style="color:#ffffff;font-size:18px;font-weight:800;letter-spacing:.5px">CFTEC</span><span style="color:#60a5fa;font-size:12px;display:block;margin-top:2px">cftec.co &middot; Engenharia digital para negócios que avançam</span></div>
<div style="padding:26px 28px;color:#0f172a;font-size:14px;line-height:1.7"><h1 style="margin:0 0 16px;font-size:19px">${titulo}</h1>${corpoHtml}
<p style="margin:22px 0 0;padding-top:14px;border-top:1px solid #eef2f7;color:#94a3b8;font-size:11px">Mensagem automática do sistema CFTEC — por favor não responda directamente a este e-mail.</p></div></div></body></html>`
}

function emailLinha(label: string, valor: string): string {
  return `<tr><td style="padding:6px 12px 6px 0;color:#64748b;font-size:12px;white-space:nowrap;vertical-align:top">${label}</td><td style="padding:6px 0;color:#0f172a;font-size:13px;font-weight:600">${valor}</td></tr>`
}

/** Dispara e-mail para o admin em fire-and-forget (não bloqueia a resposta) */
function fireAdminEmail(subject: string, html: string): void {
  void getNotifyDestino().then(destino => {
    if (!destino) { console.warn(`[EMAIL] salto (sem destino configurado): ${subject}`); return }
    void sendEmailRaw(destino, subject, html).then(r =>
      console.log(`[EMAIL] ${r.enviado ? 'enviado' : 'não enviado'} → ${destino} · ${r.detalhe} · ${subject}`),
    )
  })
}

type MultipartPart = { name: string; filename?: string; mimetype?: string; data: Buffer }

/**
 * Parser multipart/form-data à prova de binário — trabalha SEMPRE com Buffer
 * (na versão antiga o corpo era convertido para string UTF-8, o que corrompia
 * ficheiros .exe/.zip com qualquer byte não-ASCII:.SizeType > 127).
 */
function parseMultipart(raw: Buffer, contentType: string): { fields: Record<string, string>; file: MultipartPart | null } {
  const fields: Record<string, string> = {}
  let file: MultipartPart | null = null

  const boundaryQuoted = contentType.match(/boundary="([^"]+)"/)
  const boundaryPlain = contentType.match(/boundary=([^;]+)/)
  const boundary = Buffer.from('--' + (boundaryQuoted ? boundaryQuoted[1] : boundaryPlain ? boundaryPlain[1].trim() : ''))

  // Localizar todas as ocorrências do delimitador no corpo
  const positions: number[] = []
  let idx = raw.indexOf(boundary)
  while (idx !== -1) {
    positions.push(idx)
    idx = raw.indexOf(boundary, idx + boundary.length)
  }

  for (let i = 0; i < positions.length - 1; i++) {
    // conteúdo do partido: entre o fim da linha do boundary e o \r\n antes do próximo boundary
    let start = positions[i] + boundary.length
    const lineEnd = raw.indexOf('\r\n', start)
    if (lineEnd === -1) continue
    // boundary final termina com '--'; ignorar
    if (raw.slice(start, Math.min(lineEnd, start + 6)).toString().startsWith('--')) break
    start = lineEnd + 2

    const headerEnd = raw.indexOf('\r\n\r\n', start)
    if (headerEnd === -1 || headerEnd >= positions[i + 1]) continue
    const headers = raw.slice(start, headerEnd).toString('utf8')

    // o conteúdo termina 2 bytes antes do próximo boundary (o \r\n que o antecede)
    const dataEnd = positions[i + 1] - 2
    if (dataEnd <= headerEnd + 4) continue
    const data = raw.subarray(headerEnd + 4, dataEnd)

    const nameMatch = headers.match(/name="([^"]*)"/)
    if (!nameMatch) continue
    const name = nameMatch[1]

    if (/filename="/.test(headers)) {
      const filenameMatch = headers.match(/filename="([^"]*)"/)
      const mimetypeMatch = headers.match(/Content-Type: *([^\r\n]+)/)
      let filename = filenameMatch ? filenameMatch[1] : 'upload'
      try { filename = decodeURIComponent(filename) } catch { /* resposta crua */ }
      const part: MultipartPart = {
        name,
        filename,
        mimetype: mimetypeMatch ? mimetypeMatch[1].trim() : 'application/octet-stream',
        data,
      }
      if (!file) file = part
    } else {
      fields[name] = data.toString('utf8')
    }
  }

  return { fields, file }
}

function cookies(req: IncomingMessage): Record<string, string> {
  const cookieHeader = req.headers.cookie || ''
  const parsed = Object.fromEntries(cookieHeader.split(';').filter(Boolean).map((part) => {
    const [key, ...value] = part.trim().split('=')
    return [key, decodeURIComponent(value.join('='))]
  }))
  return parsed
}

// ============================================================
// REVOGAÇÃO DE SESSÕES EM MEMÓRIA — logout / mudança de password
// invalidam os JWT emitidos (jti). Reiniciar o servidor limpa a
// lista; os tokens de pré-deploy expiram naturalmente (8 h).
// ============================================================
const sessionRegistry = new Map<string, Map<string, number>>() // sub → (jti → emitido em ts)
const chamadoRate = new Map<string, number[]>() // limitação pública: ip → timestamps de chamados submissos

function registerSessionJti(sub: string, jti: string) {
  const own = sessionRegistry.get(sub) || new Map<string, number>()
  own.set(jti, Date.now())
  // basta o último token do utilizador + poucos anteriores; cap de 20 registos/sub
  while (own.size > 20) {
    let oldestKey = ''; let oldestTs = Infinity
    own.forEach((t, k) => { if (t < oldestTs) { oldestTs = t; oldestKey = k } })
    own.delete(oldestKey)
  }
  sessionRegistry.set(sub, own)
}

function revokeSessionTokenByReq(req: IncomingMessage) {
  try {
    const token = cookies(req)[authCookieName]
    if (!token) return
    const payload = jwt.decode(token) as { sub?: string; jti?: string } | null
    if (payload?.sub && payload.jti) {
      const own = sessionRegistry.get(payload.sub)
      if (own) { own.delete(payload.jti); if (!own.size) sessionRegistry.delete(payload.sub) }
    }
  } catch { /* logout nunca deve falhar por isto */ }
}

function revokeAllSessionsForUser(sub: string) { sessionRegistry.delete(sub) }

function isJtiRevoked(sub: string, jti: string) { return !sessionRegistry.get(sub)?.has(jti) }

function currentAdmin(req: IncomingMessage): AdminClaims | null {
  const token = cookies(req)[authCookieName]
  const secret = JWT_SECRET
  if (!token || !secret) return null
  try {
    const claims = jwt.verify(token, secret, { algorithms: ['HS256'] }) as AdminClaims
    if (claims.role !== 'admin') return null
    // token sem jti = pré-deploy (expira sozinho); com jti = tem de estar registado (não revogado/logout)
    if (claims.jti && isJtiRevoked(claims.sub, claims.jti)) return null
    return claims
  } catch (e) {
    console.error('[AUTH] Verify error:', e)
    return null
  }
}

function setSessionCookie(res: ServerResponse, token: string) {
  const isProd = process.env.NODE_ENV === 'production'
  // For local dev: use SameSite=Lax without Secure
  // For production: use Secure + SameSite=None
  const cookie = `${authCookieName}=${encodeURIComponent(token)}; Path=/; ${isProd ? 'HttpOnly; Secure; SameSite=None' : 'SameSite=Lax'}; Max-Age=${sessionMaxAge}`
  res.setHeader('Set-Cookie', cookie)
}

function clearSessionCookie(res: ServerResponse) {
  const isProd = process.env.NODE_ENV === 'production'
  res.setHeader('Set-Cookie', `${authCookieName}=; Path=/; ${isProd ? 'HttpOnly; Secure; SameSite=None' : 'SameSite=Lax'}; Max-Age=0`)
}

// Developer (Master Admin) tem acesso pleno igual ao super_admin — mas só ele gere a licença
const nivelPleno = (nivel?: string | null) => nivel === 'super_admin' || nivel === 'developer'

// ─── AUDITORIA (audit_log) ─── Cada mutação relevante deixa rasto: quem, quando, o quê.
// fire-and-forget — a auditoria nunca atrasa nem quebra a resposta do pedido.
const logAuditoria = (actor: { email?: string; level?: string } | null | undefined, acao: string, entidade: string, entidadeId?: string | null, detalhe?: Record<string, unknown>) => {
  if (!supabase) return
  void supabase.from('audit_log').insert({
    actor_email: actor?.email || 'site público',
    actor_level: actor?.level || null,
    acao,
    entidade,
    entidade_id: entidadeId || null,
    detalhe: detalhe ? JSON.stringify(detalhe).slice(0, 2000) : null,
  }).then(({ error }) => { if (error) console.error('[AUDIT]', error.message) }, () => {})
}

// Chaves de licenciamento — geridas EXCLUSIVAMENTE pelo developer
// (nunca aparecem no painel de Definições do super_admin, que não as altera nem vê)
const CHAVES_LICENCA = ['licenca_ativa', 'modulo_comercial', 'modulo_tecnico', 'modulo_novidades', 'licenca_expira_em', 'msg_licenca']
const MSG_SEM_MODULO = 'Módulo não contratado — contacte o Developer da plataforma (Nexora Systems).'

type EstadoLicenca = { licencaAtiva: boolean; moduloComercial: boolean; moduloTecnico: boolean; moduloNovidades: boolean; expiraEm: string; mensagem: string }

async function licencaAtual(): Promise<EstadoLicenca> {
  const base: EstadoLicenca = { licencaAtiva: true, moduloComercial: true, moduloTecnico: true, moduloNovidades: true, expiraEm: '', mensagem: MSG_SEM_MODULO }
  if (!supabase) return base
  const { data } = await supabase.from('settings').select('key, value').in('key', CHAVES_LICENCA)
  const g = (k: string) => (data || []).find((c: { key: string; value: string }) => c.key === k)?.value
  return {
    licencaAtiva: g('licenca_ativa') !== 'false',
    moduloComercial: g('modulo_comercial') !== 'false',
    moduloTecnico: g('modulo_tecnico') !== 'false',
    moduloNovidades: g('modulo_novidades') !== 'false',
    expiraEm: g('licenca_expira_em') || '',
    mensagem: g('msg_licenca') || base.mensagem,
  }
}

function adminApi(): Plugin {
  return {
    name: 'cftec-admin-api',
    configureServer(server) {
      server.middlewares.use(async function(req, res, next) {
        if (!req.url?.startsWith('/api/')) return next()
        
        try {
          const path = req.url.split('?')[0]

          if (path === '/api/admin/login' && req.method === 'POST') {
            if (!JWT_SECRET) return json(res, 503, { ok: false, error: 'JWT secret não configurado.' })
            const payload = await readBody(req)
            const email = String(payload.email || '').trim().toLowerCase()
            const password = String(payload.password || '')

            let admin: { id: string; name: string; email: string; password_hash: string; level: AdminLevel } | undefined

            if (supabase) {
              // Prioridade: admin_users (multi-utilizador com níveis)
              const { data: row, error: rowErr } = await supabase
                .from('admin_users')
                .select('id, name, email, password_hash, role, is_active')
                .eq('email', email)
                .single()

              if (!rowErr && row) {
                if (row.is_active === false)
                  return json(res, 403, { ok: false, error: 'Conta desactivada. Fale com o Super Admin.' })
                admin = {
                  id: row.id,
                  name: row.name,
                  email: row.email,
                  password_hash: row.password_hash,
                  level: (['super_admin', 'gestor', 'tecnico', 'developer'].includes(row.role) ? row.role : 'gestor') as AdminLevel,
                }
              } else {
                // Compatibilidade: tabela admins antiga (utilizador único = super admin)
                const { data, error } = await supabase
                  .from('admins')
                  .select('id, name, email, password_hash')
                  .eq('email', email)
                  .single()

                if (!error && data) {
                  admin = {
                    id: data.id,
                    name: data.name,
                    email: data.email,
                    password_hash: data.password_hash,
                    level: 'super_admin',
                  }
                }
              }
            } else {
              // Fallback em memória para desenvolvimento
              const fallbackEmail = 'admin@cftec.co'
              const fallbackPassword = 'admin123456'
              if (email === fallbackEmail && password === fallbackPassword) {
                const passwordHash = await bcrypt.hash(fallbackPassword, 12)
                admin = { id: '1', name: 'Admin CFTEC', email: fallbackEmail, password_hash: passwordHash, level: 'super_admin' }
              }
            }

            if (!admin || !(await bcrypt.compare(password, admin.password_hash))) {
              logAuditoria(null, 'login_falhado', 'sessão', null, { email })
              return json(res, 401, { ok: false, error: 'E-mail ou password incorrectos.' })
            }

            const jti = crypto.randomUUID()
            const token = jwt.sign(
              { sub: admin.id, email: admin.email, name: admin.name, role: 'admin', level: admin.level, jti } satisfies AdminClaims,
              JWT_SECRET,
              { algorithm: 'HS256', expiresIn: sessionMaxAge }
            )
            registerSessionJti(admin.id, jti)
            setSessionCookie(res, token)
            logAuditoria(admin, 'login', 'sessão', admin.id, { nivel: admin.level })
            return json(res, 200, { ok: true, user: { name: admin.name, email: admin.email, level: admin.level } })
          }

          if (path === '/api/admin/session' && req.method === 'GET') {
            const admin = currentAdmin(req)
            return admin ? json(res, 200, { ok: true, user: { name: admin.name, email: admin.email, level: admin.level || 'super_admin' } }) : json(res, 401, { ok: false })
          }

          // MÓDULOS DESLIGADOS PELO DEVELOPER — defesa na API antes de qualquer handler admin
          // (rota /api/admin/system-license vem depois; o developer escreve livremente)
          if (path.startsWith('/api/admin/') && path !== '/api/admin/system-license') {
            const nivelMod = currentAdmin(req)?.level
            if (nivelMod && nivelMod !== 'developer') {
              const lic = await licencaAtual()
              if (!lic.licencaAtiva)
                return json(res, 403, { ok: false, error: lic.mensagem })
              const isComercial = path === '/api/admin/licenses' || path === '/api/admin/partners' || path === '/api/admin/license-orders' || /^\/api\/admin\/(licenses|partners|license-orders)\/?/.test(path)
              if (isComercial && !lic.moduloComercial)
                return json(res, 403, { ok: false, error: lic.mensagem })
              const isTecnico = path === '/api/admin/chamados' || /^\/api\/admin\/chamados\//.test(path) || path === '/api/admin/wiki' || /^\/api\/admin\/wiki\//.test(path)
              if (isTecnico && !lic.moduloTecnico)
                return json(res, 403, { ok: false, error: lic.mensagem })
              const isNovidadeEscrita = (path === '/api/admin/blog' || /^\/api\/admin\/blog\//.test(path) || path === '/api/admin/destaques' || /^\/api\/admin\/destaques\//.test(path)) && req.method !== 'GET'
              if (isNovidadeEscrita && !lic.moduloNovidades)
                return json(res, 403, { ok: false, error: lic.mensagem })
            }
          }

          if (path === '/api/admin/profile' && req.method === 'PATCH') {
            const admin = currentAdmin(req)
            if (!admin) return json(res, 401, { ok: false })
            if (!supabase) return json(res, 503, { ok: false, error: 'Sem base de dados configurada.' })
            const payload = await readBody(req) as { name?: string }
            const name = String(payload.name || '').trim()
            if (!name || name.length > 120) return json(res, 400, { ok: false, error: 'Nome inválido.' })
            // admin_users (multi-utilizador) primeiro; admins antiga como fallback
            let updated = await supabase.from('admin_users').update({ name }).eq('id', admin.sub).select('id, name, email, role').maybeSingle()
            let row: { id: string; name: string; email: string; role?: string } | null = updated.data
            let level: AdminLevel = admin.level || 'super_admin'
            if (row && row.role && ['super_admin', 'gestor', 'tecnico', 'developer'].includes(String(row.role))) level = row.role as AdminLevel
            if (!row) {
              const legacy = await supabase.from('admins').update({ name }).eq('id', admin.sub).select('id, name, email').single()
              if (legacy.error) return json(res, 500, { ok: false, error: legacy.error.message })
              row = legacy.data as { id: string; name: string; email: string; role?: string }
            } else if (updated.error) {
              return json(res, 500, { ok: false, error: updated.error.message })
            }
            // Re-emitir o token para o header levar o nome actualizado
            const jti2 = crypto.randomUUID()
            const token = jwt.sign(
              { sub: row.id, email: row.email, name: row.name, role: 'admin', level, jti: jti2 } satisfies AdminClaims,
              JWT_SECRET,
              { algorithm: 'HS256', expiresIn: sessionMaxAge },
            )
            registerSessionJti(row.id, jti2)
            setSessionCookie(res, token)
            logAuditoria({ email: admin.email, level: admin.level }, 'perfil_actualizado', 'utilizador', admin.sub, { nome: name })
            return json(res, 200, { ok: true, user: { name: row.name, email: row.email, level } })
          }

          if (path === '/api/admin/change-password' && req.method === 'POST') {
            const admin = currentAdmin(req)
            if (!admin) return json(res, 401, { ok: false })
            if (!supabase) return json(res, 503, { ok: false, error: 'Sem base de dados configurada.' })
            const payload = await readBody(req) as { current_password?: string; new_password?: string }
            const current = String(payload.current_password || '')
            const next = String(payload.new_password || '')
            if (next.length < 8) return json(res, 400, { ok: false, error: 'A nova password precisa de pelo menos 8 caracteres.' })
            if (next === current) return json(res, 400, { ok: false, error: 'A nova password não pode ser igual à actual.' })
            // admin_users primeiro; admins antiga como fallback
            let row: { id: string; password_hash: string } | null = null
            const own = await supabase.from('admin_users').select('id, password_hash, is_active').eq('id', admin.sub).maybeSingle()
            if (own.data) row = own.data as { id: string; password_hash: string }
            else {
              const legacy = await supabase.from('admins').select('id, password_hash').eq('id', admin.sub).single()
              row = legacy.data as { id: string; password_hash: string } | null
            }
            if (!row) return json(res, 500, { ok: false, error: 'Utilizador não encontrado.' })
            if (own.data && (own.data as { is_active?: boolean }).is_active === false)
              return json(res, 403, { ok: false, error: 'Conta desactivada.' })
            if (!(await bcrypt.compare(current, row.password_hash)))
              return json(res, 401, { ok: false, error: 'Password actual incorrecta.' })
            const hash = await bcrypt.hash(next, 12)
            const table = own.data ? 'admin_users' : 'admins'
            const { error: upErr } = await supabase.from(table).update({ password_hash: hash }).eq('id', row.id)
            if (upErr) return json(res, 500, { ok: false, error: upErr.message })
            // todas as sessões anteriores desta conta tornam-se inválidas (novo ciclo de tokens)
            revokeAllSessionsForUser(admin.sub)
            const jti3 = crypto.randomUUID()
            const token = jwt.sign(
              { sub: admin.sub, email: admin.email, name: admin.name, role: 'admin', level: admin.level, jti: jti3 } satisfies AdminClaims,
              JWT_SECRET,
              { algorithm: 'HS256', expiresIn: sessionMaxAge },
            )
            registerSessionJti(admin.sub, jti3)
            setSessionCookie(res, token)
            logAuditoria({ email: admin.email, level: admin.level }, 'password_alterada', 'utilizador', admin.sub)
            return json(res, 200, { ok: true })
          }
          
          if (path === '/api/admin/logout' && req.method === 'POST') {
            // mata o token desta sessão no servidor (não apenas no browser)
            revokeSessionTokenByReq(req)
            clearSessionCookie(res)
            return json(res, 200, { ok: true })
          }

          // PUBLIC READ ENDPOINTS (no auth required)
          if (path === '/api/services' && req.method === 'GET') {
            if (!supabase) return json(res, 503, { ok: false, error: 'Base de dados não disponível.' })
            const { data } = await supabase
              .from('services')
              .select('id, title, slug, short_description, full_description, icon, is_active, created_at')
              .eq('is_active', true)
              .order('created_at', { ascending: true })
            return json(res, 200, data || [])
          }

          if (path === '/api/software' && req.method === 'GET') {
            if (!supabase) return json(res, 503, { ok: false, error: 'Base de dados não disponível.' })
            let { data } = await supabase
              .from('softwares')
              .select('id, name, version, description, price, category, file_url, file_size, downloads_count, created_at')
              .eq('is_active', true)
              .order('downloads_count', { ascending: false })
            if (data === null) {
              // coluna `category` ainda não aplicada na BD — fallback sem ela
              const retry = await supabase
                .from('softwares')
                .select('id, name, version, description, price, file_url, file_size, downloads_count, created_at')
                .eq('is_active', true)
                .order('downloads_count', { ascending: false })
              data = (retry.data || []).map((row) => ({ ...row, category: null }))
            }
            return json(res, 200, data || [])
          }

          if (path === '/api/media' && req.method === 'GET') {
            if (!supabase) return json(res, 503, { ok: false, error: 'Base de dados não disponível.' })
            const { data } = await supabase
              .from('media')
              .select('id, filename, file_path, file_size, mime_type, alt_text, uploaded_at')
              .order('uploaded_at', { ascending: false })
              .limit(50)
            return json(res, 200, data || [])
          }

          if (path === '/api/contact-options' && req.method === 'GET') {
            if (!supabase) return json(res, 503, { ok: false, error: 'Base de dados não disponível.' })
            const [servicesRes, softwareRes] = await Promise.all([
              supabase.from('services').select('title').eq('is_active', true).order('created_at'),
              supabase.from('softwares').select('name').eq('is_active', true).order('downloads_count', { ascending: false })
            ])
            const serviceTitles = servicesRes.data?.map(s => s.title) || []
            const softwareNames = softwareRes.data?.map(s => s.name) || []
            const options = ['Pedido geral', ...serviceTitles, ...softwareNames]
            return json(res, 200, { ok: true, options })
          }

          // PUBLIC CONTACT (no auth required)
          if (path === '/api/contact' && req.method === 'POST') {
            const payload = await readBody(req) as ContactPayload
            const name = payload.name?.trim()
            const email = payload.email?.trim()
            const message = payload.message?.trim()
            if (!name || !email || !message || name.length > 150 || email.length > 150 || message.length > 5000) 
              return json(res, 400, { ok: false, error: 'Dados de contacto inválidos.' })
            
            if (!supabase) return json(res, 503, { ok: false, error: 'Base de dados não disponível.' })
            
            const { error } = await supabase.from('contacts').insert({
              name,
              email,
              phone: payload.phone?.trim() || null,
              service_interest: payload.interest?.trim() || null,
              message,
            })
            
            if (error) return json(res, 500, { ok: false, error: error.message })
            fireAdminEmail(
              `Novo contacto do site — ${name}`,
              emailShell('Novo contacto recebido', `<p>Alguém preencheu o formulário do site:</p>
<table style="border-collapse:collapse">${emailLinha('Nome', escHtml(name))}${emailLinha('E-mail', `<a href="mailto:${escHtml(email)}" style="color:#1d4ed8">${escHtml(email)}</a>`)}${emailLinha('Telefone', escHtml(payload.phone?.trim() || '—'))}${emailLinha('Interesse', escHtml(payload.interest?.trim() || '—'))}${emailLinha('Mensagem', escHtml(message).slice(0, 800).replace(/\n/g, '<br />'))}</table>`),
            )
            logAuditoria(null, 'contacto_recebido', 'contacto', null, { nome: name, interesse: payload.interest?.trim() || null })
            return json(res, 201, { ok: true })
          }
          
          // CANDIDATURA A SUB-PARCEIRO (formulário do site — sem auth)
          if (path === '/api/partners-apply' && req.method === 'POST') {
            if (!supabase) return json(res, 503, { ok: false, error: 'Base de dados não disponível.' })
            const payload = await readBody(req) as { nome_responsavel?: string; empresa_nif?: string; telefone_whatsapp?: string; provincia?: string; modalidade?: string; nota?: string }
            const nome = String(payload.nome_responsavel || '').trim()
            const telefone = String(payload.telefone_whatsapp || '').trim()
            const modalidade = String(payload.modalidade || '').trim()
            if (!nome || !telefone || !modalidade || nome.length > 150 || telefone.length > 40)
              return json(res, 400, { ok: false, error: 'Dados da candidatura inválidos.' })
            if (!['Individual', 'Profissional', 'Empresa'].includes(modalidade))
              return json(res, 400, { ok: false, error: 'Modalidade inválida.' })

            const { error } = await supabase.from('parceiros_candidaturas').insert({
              nome_responsavel: nome,
              empresa_nif: payload.empresa_nif?.trim() || null,
              telefone_whatsapp: telefone,
              provincia: payload.provincia?.trim() || null,
              modalidade,
              nota: payload.nota?.trim().slice(0, 2000) || null,
            })
            if (error) return json(res, 500, { ok: false, error: error.message })
            logAuditoria(null, 'candidatura_sub_parceiro', 'parceiro', null, { nome_responsavel: nome, modalidade })
            return json(res, 201, { ok: true, message: 'Candidatura recebida. A equipa CFTEC entrará em contacto.' })
          }

          // PEDIDO DE LICENÇA B2B (checkout PalancaSoft / Negomil — sem auth)
          // CHAMADOS DE SUPORTE — formulário público do site (alimentação directa ao painel do técnico)
          if (path === '/api/chamados' && req.method === 'POST') {
            if (!supabase) return json(res, 503, { ok: false, error: 'Base de dados não disponível.' })
            // módulo técnico suspenso pelo developer → formulário público encerrado
            if (!(await licencaAtual()).moduloTecnico)
              return json(res, 403, { ok: false, error: 'A central de suporte está temporariamente suspensa. Entre em contacto por WhatsApp.' })
            // limitação simples: máx. 5 chamados por IP por hora
            const ip = (req.socket.remoteAddress || 'desconhecido').replace(/^::ffff:/, '')
            const agora = Date.now()
            const hist = (chamadoRate.get(ip) || []).filter(ts => agora - ts < 60 * 60 * 1000)
            if (hist.length >= 5) return json(res, 429, { ok: false, error: 'Muitas solicitações seguidas — entre em contacto via WhatsApp.' })
            hist.push(agora)
            chamadoRate.set(ip, hist)
            const payload = await readBody(req) as { nome_empresa?: string; nif?: string; telefone_whatsapp?: string; software?: string; descricao_problema?: string }
            const nomeEmpresa = String(payload.nome_empresa || '').trim()
            const telefone = String(payload.telefone_whatsapp || '').trim()
            const descricao = String(payload.descricao_problema || '').trim()
            if (nomeEmpresa.length < 2 || nomeEmpresa.length > 150) return json(res, 400, { ok: false, error: 'Indique o nome da empresa.' })
            if (!/[\d+\s()-]{9,20}/.test(telefone)) return json(res, 400, { ok: false, error: 'Telefone/WhatsApp inválido (mínimo 9 dígitos).' })
            if (descricao.length < 10 || descricao.length > 1200) return json(res, 400, { ok: false, error: 'Descreve o problema com pelo menos 10 caracteres.' })
            const nif = String(payload.nif || '').trim().slice(0, 20) || null
            const software = String(payload.software || '').trim().slice(0, 120) || 'Outro'
            const { data, error } = await supabase.from('chamados_suporte')
              .insert({ cliente: nomeEmpresa, nif, telefone: telefone.slice(0, 20), software, problema: descricao, estado: 'Pendente', prioridade: 'Média', origem: 'site' })
              .select('id').single()
            if (error) {
              if (String(error.message).includes('chamados_suporte')) return json(res, 503, { ok: false, error: 'A central de suporte será activada em breve. Entre em contacto com a CFTEC via WhatsApp.' })
              return json(res, 500, { ok: false, error: error.message })
            }
            // Web Push ao técnico (fire-and-forget: não atrasa a resposta ao cliente)
            void pushNotifyEquipa('chamado', '🛠️ Novo chamado de suporte', `${nomeEmpresa} pediu apoio (${software}) — verifique no painel.`)
            logAuditoria(null, 'chamado_recebido', 'chamado', data?.id, { empresa: nomeEmpresa, software })
            return json(res, 201, { ok: true, chamado_id: data?.id })
          }

          if (path === '/api/license-orders' && req.method === 'POST') {
            if (!supabase) return json(res, 503, { ok: false, error: 'Base de dados não disponível.' })
            // módulo comercial suspenso pelo developer → checkout encerrado
            if (!(await licencaAtual()).moduloComercial)
              return json(res, 403, { ok: false, error: 'Os pedidos de licença estão temporariamente suspensos. Entre em contacto com a CFTEC por WhatsApp.' })
            const payload = await readBody(req) as Partial<{
              software_nome: string; nome_empresa: string; nif: string; nome_responsavel: string
              telefone_whatsapp: string; email: string; provincia: string; forma_pagamento: string; observacoes: string
            }>
            const softwareNome = String(payload.software_nome || '').trim()
            const nomeEmpresa = String(payload.nome_empresa || '').trim()
            const nif = String(payload.nif || '').trim()
            const responsavel = String(payload.nome_responsavel || '').trim()
            const telefone = String(payload.telefone_whatsapp || '').trim()
            const email = String(payload.email || '').trim()
            const provincia = String(payload.provincia || '').trim()
            const formaPagamento = String(payload.forma_pagamento || '').trim()
            const observacoes = String(payload.observacoes || '').trim()

            if (!softwareNome || softwareNome.length > 120)
              return json(res, 400, { ok: false, error: 'Software inválido.' })
            if (!nomeEmpresa || nomeEmpresa.length > 160)
              return json(res, 400, { ok: false, error: 'Nome da empresa é obrigatório.' })
            if (!nif || nif.length < 9 || nif.length > 20)
              return json(res, 400, { ok: false, error: 'O NIF deve ter pelo menos 9 dígitos.' })
            if (!responsavel || responsavel.length > 150)
              return json(res, 400, { ok: false, error: 'Nome do responsável é obrigatório.' })
            if (!/[\d+\s()-]{9,20}/.test(telefone) || telefone.length > 20)
              return json(res, 400, { ok: false, error: 'Telefone inválido (mínimo 9 dígitos).' })
            if (!provincia || provincia.length > 60)
              return json(res, 400, { ok: false, error: 'Província/Cidade é obrigatória.' })
            if (email && (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 160))
              return json(res, 400, { ok: false, error: 'E-mail inválido.' })
            if (!['Transferência Bancária / IBAN', 'Multicaixa Express'].includes(formaPagamento))
              return json(res, 400, { ok: false, error: 'Forma de pagamento inválida.' })

            const { data, error } = await supabase
              .from('pedidos_licencas')
              .insert({
                software_nome: softwareNome.slice(0, 120),
                nome_empresa: nomeEmpresa.slice(0, 160),
                nif: nif.slice(0, 20),
                nome_responsavel: responsavel.slice(0, 150),
                telefone_whatsapp: telefone.slice(0, 20),
                email: email || null,
                provincia: provincia.slice(0, 60),
                forma_pagamento: formaPagamento,
                observacoes: observacoes.slice(0, 1000) || null,
              })
              .select('id, created_at')
              .single()
            if (error) {
              // Fallback se a migração ainda não correu (tabela inexistente)
              if (String(error.message).includes('pedidos_licencas'))
                return json(res, 503, { ok: false, error: 'O sistema de pedidos será activado em breve. Fale connosco pelo WhatsApp.' })
              return json(res, 500, { ok: false, error: error.message })
            }

            // Instruções de pagamento (settings do portal)
            const { data: cfg } = await supabase.from('settings').select('key, value').in('key', ['iban_cftec', 'whatsapp_comercial'])
            const getCfg = (k: string) => (cfg || []).find((c: { key: string; value: string }) => c.key === k)?.value || ''
            fireAdminEmail(
              `Pedido de licença — ${nomeEmpresa} (${softwareNome})`,
              emailShell('Novo pedido de licença (checkout B2B)', `<p>Um cliente acabou de submeter o checkout do site:</p>
<table style="border-collapse:collapse">${emailLinha('Software', escHtml(softwareNome))}${emailLinha('Empresa', escHtml(nomeEmpresa))}${emailLinha('NIF', escHtml(nif))}${emailLinha('Responsável', escHtml(responsavel))}${emailLinha('WhatsApp', escHtml(telefone))}${emailLinha('E-mail', email ? `<a href="mailto:${escHtml(email)}" style="color:#1d4ed8">${escHtml(email)}</a>` : '—')}${emailLinha('Província', escHtml(provincia))}${emailLinha('Forma de pagamento', escHtml(formaPagamento))}${emailLinha('Observações', observacoes ? escHtml(observacoes).slice(0, 600).replace(/\n/g, '<br />') : '—')}${emailLinha('Ref.', `<code>#${String(data.id).slice(0, 8).toUpperCase()}</code>`)}</table>
<p style="margin:18px 0 0">Trate no painel CFTEC → Secção «Pedidos de Licença».</p>`),
            )
            // Web Push ao comercial (fire-and-forget)
            void pushNotifyEquipa('pedido', '📋 Novo pedido de licença', `${nomeEmpresa} pediu ${softwareNome} — verifique no painel.`)
            logAuditoria(null, 'pedido_recebido', 'pedido', data.id, { empresa: nomeEmpresa, software: softwareNome, forma_pagamento: formaPagamento })
            return json(res, 201, {
              ok: true,
              pedido_id: data.id,
              payment: {
                iban: getCfg('iban_cftec'),
                whatsapp: getCfg('whatsapp_comercial'),
                forma: formaPagamento,
              },
            })
          }

          // REGISTO DE DOWNLOAD PÚBLICO (incrementa contador + evento para métricas)
          if (path.match(/^\/api\/software\/([a-f0-9-]+)\/download$/) && req.method === 'POST') {
            if (!supabase) return json(res, 503, { ok: false, error: 'Base de dados não disponível.' })
            const id = path.split('/')[3]
            const { data: sw } = await supabase
              .from('softwares')
              .select('id, file_url, downloads_count')
              .eq('id', id)
              .eq('is_active', true)
              .single()
            if (!sw) return json(res, 404, { ok: false, error: 'Software não encontrado.' })

            await supabase.from('softwares').update({ downloads_count: (sw.downloads_count || 0) + 1 }).eq('id', id)
            await supabase.from('download_events').insert({ software_id: id })
            return json(res, 200, { ok: true, download_url: sw.file_url })
          }

          // SETTINGS PÚBLICOS DO PORTAL (directório, WhatsApp comercial, banner)
          if (path === '/api/settings' && req.method === 'GET') {
            if (!supabase) return json(res, 503, { ok: false, error: 'Base de dados não disponível.' })
            const { data } = await supabase.from('settings').select('key, value').eq('is_public', true)
            return json(res, 200, { ok: true, settings: Object.fromEntries((data || []).map((s: { key: string; value: string }) => [s.key, s.value])) })
          }

          // DESTAQUES & NOVIDADES (slider da página inicial — sem auth)
          if (path === '/api/destaques' && req.method === 'GET') {
            if (!supabase) return json(res, 503, { ok: false, error: 'Base de dados não disponível.' })
            // módulo novidades desligado pelo developer → slider vazio no site público
            if (!(await licencaAtual()).moduloNovidades) return json(res, 200, { ok: true, destaques: [] })
            const { data, error } = await supabase
              .from('novidades_destaques')
              .select('id, titulo, descricao, imagem_url, link_botao, texto_botao')
              .eq('ativo', true)
              .order('ordem', { ascending: true })
              .order('created_at', { ascending: false })
              .limit(10)
            if (error) {
              if (String(error.message).includes('novidades_destaques')) return json(res, 200, { ok: true, destaques: [] })
              return json(res, 500, { ok: false, error: error.message })
            }
            return json(res, 200, { ok: true, destaques: data || [] })
          }

          // BLOG PÚBLICO — artigos publicados (sem auth)
          if (path === '/api/blog' && req.method === 'GET') {
            if (!supabase) return json(res, 503, { ok: false, error: 'Base de dados não disponível.' })
            // módulo novidades desligado pelo developer → blog vazio no site público
            if (!(await licencaAtual()).moduloNovidades) return json(res, 200, { ok: true, posts: [] })
            const { data, error } = await supabase
              .from('blog_posts')
              .select('id, slug, title, excerpt, cover_url, category, author, published_at')
              .eq('is_published', true)
              .order('published_at', { ascending: false })
              .limit(30)
            if (error) {
              if (String(error.message).includes('blog_posts')) return json(res, 200, { ok: true, posts: [] })
              return json(res, 500, { ok: false, error: error.message })
            }
            return json(res, 200, { ok: true, posts: data || [] })
          }

          // BLOG PÚBLICO — artigo completo por slug
          if (path.match(/^\/api\/blog\/([a-z0-9-]+)$/) && req.method === 'GET') {
            if (!supabase) return json(res, 503, { ok: false, error: 'Base de dados não disponível.' })
            // módulo novidades desligado pelo developer → artigo indisponível no site público
            if (!(await licencaAtual()).moduloNovidades) return json(res, 404, { ok: false, error: 'Artigo não encontrado.' })
            const slug = decodeURIComponent(path.split('/').pop() || '')
            const { data, error } = await supabase
              .from('blog_posts')
              .select('id, slug, title, excerpt, content, cover_url, category, author, published_at')
              .eq('slug', slug)
              .eq('is_published', true)
              .limit(1)
            if (error) {
              if (String(error.message).includes('blog_posts')) return json(res, 404, { ok: false, error: 'Artigo não encontrado.' })
              return json(res, 500, { ok: false, error: error.message })
            }
            if (!data || !data.length) return json(res, 404, { ok: false, error: 'Artigo não encontrado.' })
            return json(res, 200, { ok: true, post: data[0] })
          }

          if (path.startsWith('/api/admin/')) {
            if (!currentAdmin(req)) return json(res, 401, { ok: false, error: 'Sessão de administrador inválida ou expirada.' })
            
            if (path === '/api/admin/health' && req.method === 'GET') {
              if (!supabase) return json(res, 503, { ok: false, error: 'Base de dados não disponível.' })

              // Latências medidas sequencialmente (honestas) + estado de cada dependência
              const dbStart = Date.now()
              const { error: dbError } = await supabase.from('services').select('id').limit(1)
              const dbLatency = Date.now() - dbStart

              const storageStart = Date.now()
              const { error: storageError } = await supabase.storage.from('media').list('', { limit: 1 })
              const storageLatency = Date.now() - storageStart

              const contentStart = Date.now()
              const [{ count: activeServices }, { count: activeSoftware }, { count: unreadCount }, { count: inactiveSoftware }, { count: pendingPartners }, { count: expiringLicenses }, { count: pendingOrders }] = await Promise.all([
                supabase.from('services').select('*', { count: 'exact', head: true }).eq('is_active', true),
                supabase.from('softwares').select('*', { count: 'exact', head: true }).eq('is_active', true),
                supabase.from('contacts').select('*', { count: 'exact', head: true }).in('status', ['unread', 'new']),
                supabase.from('softwares').select('*', { count: 'exact', head: true }).eq('is_active', false),
                supabase.from('parceiros_candidaturas').select('*', { count: 'exact', head: true }).eq('status', 'pendente'),
                supabase.from('licencas_palancasoft').select('*', { count: 'exact', head: true }).eq('status', 'activa').lte('data_expiracao', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)),
                supabase.from('pedidos_licencas').select('*', { count: 'exact', head: true }).eq('status', 'Pendente'),
              ])
              const contentLatency = Date.now() - contentStart

              const grade = (ok: boolean, latency: number) =>
                !ok ? 'unhealthy' : latency > 2000 ? 'degraded' : 'healthy'
              const componentScore = (c: string) => (c === 'unhealthy' ? 0 : c === 'degraded' ? 66 : 100)

              const database = grade(!dbError, dbLatency)
              const storage = grade(!storageError, storageLatency)

              // Conteúdo público: saudável quando as consultas respondem fast e há catálogo
              const content = !dbError
                ? ((activeServices || 0) === 0 || (activeSoftware || 0) === 0 ? 'degraded' : grade(true, contentLatency))
                : 'unhealthy'

              const score = Math.round((componentScore(database) + componentScore(storage) + componentScore(content)) / 3)
              const status = score >= 95 ? 'healthy' : score >= 60 ? 'degraded' : 'critical'

              const warnings: { level: 'info' | 'warning'; message: string }[] = []
              if (activeServices === 0) warnings.push({ level: 'warning', message: 'Nenhum serviço activo no site público.' })
              if (activeSoftware === 0) warnings.push({ level: 'warning', message: 'O catálogo de downloads está vazio.' })
              if (inactiveSoftware > 0) warnings.push({ level: 'info', message: `${inactiveSoftware} software(s) inactivo(s) escondido(s) do site.` })
              if (unreadCount > 0)
                warnings.push({
                  level: unreadCount > 10 ? 'warning' : 'info',
                  message: `${unreadCount} pedido(s) de contacto ainda sem resposta.`,
                })
              if ((pendingPartners || 0) > 0)
                warnings.push({
                  level: (pendingPartners || 0) > 5 ? 'warning' : 'info',
                  message: `${pendingPartners} candidatura(s) de sub-parceiro pendente(s) de análise.`,
                })
              if ((pendingOrders || 0) > 0)
                warnings.push({
                  level: (pendingOrders || 0) > 5 ? 'warning' : 'info',
                  message: `${pendingOrders} pedido(s) de licença B2B a aguardar confirmação de pagamento.`,
                })
              if ((expiringLicenses || 0) > 0)
                warnings.push({
                  level: (expiringLicenses || 0) > 3 ? 'warning' : 'info',
                  message: `${expiringLicenses} licença(s) activa(s) expiram nos próximos 30 dias.`,
                })

              return json(res, 200, {
                score,
                status,
                checkedAt: new Date().toISOString(),
                checks: {
                  database: { status: database, latency: dbLatency },
                  storage: { status: storage, latency: storageLatency },
                  content: { status: content, latency: contentLatency, activeServices, activeSoftware },
                },
                warnings,
              })
            }
            
            if (path === '/api/admin/summary' && req.method === 'GET') {
              if (!supabase) return json(res, 503, { ok: false, error: 'Base de dados não disponível.' })

              const count = async (table: string, match: Record<string, unknown> = {}) => {
                const { count: c } = await supabase.from(table).select('*', { count: 'exact', head: true }).match(match)
                return c || 0
              }

              const [
                servicesCount, servicesActive, mediaCount, softwareCount, softwareActive,
                licensesCount, licensesActivas,
                ordersCount, ordersPending, ordersApproved,
                partnersCount, partnersPending,
                contactsCount,
              ] = await Promise.all([
                count('services'),
                count('services', { is_active: true }),
                count('media'),
                count('softwares'),
                count('softwares', { is_active: true }),
                count('licencas_palancasoft'),
                count('licencas_palancasoft', { status: 'activa' }),
                count('pedidos_licencas'),
                count('pedidos_licencas', { status: 'Pendente' }),
                count('pedidos_licencas', { status: 'Aprovado' }),
                count('parceiros_candidaturas'),
                count('parceiros_candidaturas', { status: 'pendente' }),
                count('contacts'),
              ])

              const { count: contactsNew } = await supabase.from('contacts').select('*', { count: 'exact', head: true }).in('status', ['new', 'unread'])
              const { count: ordersVer } = await supabase.from('pedidos_licencas').select('*', { count: 'exact', head: true }).eq('status', 'Em Verificação')
              const expiringLim = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
              const { count: licensesExpiringSoon } = await supabase.from('licencas_palancasoft').select('*', { count: 'exact', head: true }).eq('status', 'activa').lte('data_expiracao', expiringLim)
              // meta mensal (Kz) definida pelo super admin — alimenta a barra de progresso dos relatórios
              const { data: metaRow } = await supabase.from('settings').select('value').eq('key', 'meta_mensal_kz').limit(1)

              // o retorno adapta-se ao nível: técnicos não precisam de números comerciais
              const full = {
                services: servicesCount,
                servicesActive,
                media: mediaCount,
                softwares: softwareCount,
                software: softwareCount,
                softwaresActive: softwareActive,
                licenses: licensesCount,
                licensesActivas: licensesActivas,
                licensesExpiring: (licensesExpiringSoon || 0) + 0,
                orders: ordersCount,
                ordersPending,
                ordersApproved,
                ordersVerificacao: ordersVer || 0,
                partners: partnersCount,
                partnersPending,
                contacts: contactsCount,
                contactsUnread: (contactsNew || 0) + 0,
                metaMensal: Number((metaRow?.[0] as { value?: string } | undefined)?.value || 0) || 0,
              }
              const level = currentAdmin(req)?.level
              if (level === 'tecnico') {
                const { orders, ordersPending, ordersApproved, ordersVerificacao, partners, partnersPending, licenses, licensesActivas, licensesExpiring, ...tecnico } = full
                void orders; void ordersPending; void ordersApproved; void ordersVerificacao; void partners; void partnersPending; void licenses; void licensesActivas; void licensesExpiring
                return json(res, 200, { ok: true, summary: tecnico })
              }
              return json(res, 200, { ok: true, summary: full })
            }
            
            if (path === '/api/admin/contacts' && req.method === 'GET') {
              const { data } = await supabase
                .from('contacts')
                .select('id, name, email, phone, service_interest, message, status, created_at')
                .order('created_at', { ascending: false })
                .limit(30)
              return json(res, 200, data || [])
            }

            if (path.match(/^\/api\/admin\/contacts\/([a-f0-9-]+)$/) && req.method === 'PATCH') {
              const id = path.split('/').pop()
              const payload = await readBody(req) as { status?: string }
              const allowed = ['unread', 'read', 'archived', 'em_contacto', 'proposta', 'fechado']
              if (!payload.status || !allowed.includes(payload.status))
                return json(res, 400, { ok: false, error: `Estado inválido. Use: ${allowed.join(', ')}.` })

              const { data, error } = await supabase
                .from('contacts')
                .update({ status: payload.status })
                .eq('id', id)
                .select('id, status')
                .single()
              if (error) return json(res, 500, { ok: false, error: error.message })
              logAuditoria(currentAdmin(req), 'contacto_estado', 'contacto', id, { status: payload.status })
              return json(res, 200, { ok: true, contact: data })
            }

            if (path.match(/^\/api\/admin\/contacts\/([a-f0-9-]+)$/) && req.method === 'DELETE') {
              const id = path.split('/').pop()
              const { error } = await supabase.from('contacts').delete().eq('id', id)
              if (error) return json(res, 500, { ok: false, error: error.message })
              logAuditoria(currentAdmin(req), 'contacto_apagado', 'contacto', id)
              return json(res, 200, { ok: true })
            }

            // GUARD COMERCIAL — licenças, pedidos e parceiros são área super_admin + gestor
            // (colocado antes de qualquer handler destes paths, senão a cadeia de ifs devolve antes)
            // GUARD COMERCIAL — licenças, parceiros e pedidos: super_admin + gestor.
            // O técnico tem acesso apenas de SÓ LEITURA às licenças (consulta de clientes/chaves para suporte)
            // + módulo comercial desligado pelo developer → bloqueio geral (o developer vê sempre tudo)
            {
              const comercialLevel = currentAdmin(req)?.level
              const isCommercialPath = path === '/api/admin/licenses' || path === '/api/admin/partners' || path === '/api/admin/license-orders' || /^\/api\/admin\/(licenses|partners|license-orders)\/[a-f0-9-]+$/.test(path)
              const licensesReadOnly = isCommercialPath && req.method === 'GET' && (path === '/api/admin/licenses' || /^\/api\/admin\/licenses\/[a-f0-9-]+$/.test(path))
              if (isCommercialPath && comercialLevel === 'tecnico' && !licensesReadOnly)
                return json(res, 403, { ok: false, error: 'Sem permissão para esta área (apenas Super Admin e Gestor Comercial).' })
            }

            // PARCEIROS — candidaturas e carteira de sub-parceiros (revenda Negomil)
            if (path === '/api/admin/partners' && req.method === 'GET') {
              const { data, error } = await supabase
                .from('parceiros_candidaturas')
                .select('id, nome_responsavel, empresa_nif, telefone_whatsapp, provincia, modalidade, status, nota, volume_vendas, clientes_angariados, created_at')
                .order('created_at', { ascending: false })
                .limit(60)
              if (error) return json(res, 500, { ok: false, error: error.message })
              return json(res, 200, data || [])
            }

            if (path.match(/^\/api\/admin\/partners\/([a-f0-9-]+)$/) && req.method === 'PATCH') {
              const id = path.split('/').pop()
              const payload = await readBody(req) as Partial<{ status: string; volume_vendas: number; clientes_angariados: number; provincia: string }>
              const allowed = ['pendente', 'em_analise', 'aprovado', 'rejeitado']
              const updates: Record<string, unknown> = {}
              if (payload.status !== undefined) {
                if (!allowed.includes(payload.status))
                  return json(res, 400, { ok: false, error: `Estado inválido. Use: ${allowed.join(', ')}.` })
                updates.status = payload.status
              }
              if (payload.volume_vendas !== undefined) updates.volume_vendas = Math.max(0, Math.round(Number(payload.volume_vendas) || 0))
              if (payload.clientes_angariados !== undefined) updates.clientes_angariados = Math.max(0, Math.round(Number(payload.clientes_angariados) || 0))
              if (payload.provincia !== undefined) updates.provincia = String(payload.provincia).trim() || null
              if (!Object.keys(updates).length) return json(res, 400, { ok: false, error: 'Nenhum campo para actualizar.' })
              const { data, error } = await supabase.from('parceiros_candidaturas').update(updates).eq('id', id).select('id, status, volume_vendas, clientes_angariados').single()
              if (error) return json(res, 500, { ok: false, error: error.message })
              logAuditoria(currentAdmin(req), 'parceiro_actualizado', 'parceiro', id, Object.keys(updates).length === 1 && updates.status ? { status: updates.status } : { campos: Object.keys(updates) })
              return json(res, 200, { ok: true, partner: data })
            }

            if (path.match(/^\/api\/admin\/partners\/([a-f0-9-]+)$/) && req.method === 'DELETE') {
              const id = path.split('/').pop()
              const { error } = await supabase.from('parceiros_candidaturas').delete().eq('id', id)
              if (error) return json(res, 500, { ok: false, error: error.message })
              logAuditoria(currentAdmin(req), 'parceiro_apagado', 'parceiro', id)
              return json(res, 200, { ok: true })
            }

            // PEDIDOS DE LICENÇA B2B (checkout PalancaSoft / Negomil)
            if (path === '/api/admin/license-orders' && req.method === 'GET') {
              const orderBy = ((req.url || '').split('status=')[1] || '').split('&')[0]
              const allowed = ['Pendente', 'Em Verificação', 'Aprovado', 'Rejeitado']
              let query = supabase
                .from('pedidos_licencas')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(500)
              if (orderBy && allowed.includes(decodeURIComponent(orderBy))) query = query.eq('status', decodeURIComponent(orderBy))
              const { data, error } = await query
              if (error) {
                if (String(error.message).includes('pedidos_licencas')) return json(res, 200, [])
                return json(res, 500, { ok: false, error: error.message })
              }
              return json(res, 200, data || [])
            }

            // PROFORMA PDF (2ª via) — Super Admin e Gestor Comercial
            const proformaMatch = path.match(/^\/api\/admin\/license-orders\/([a-f0-9-]+)\/proforma/)
            if (proformaMatch && req.method === 'GET') {
              const nivelPro = currentAdmin(req)?.level
              if (nivelPro && !nivelPleno(nivelPro) && nivelPro !== 'gestor')
                return json(res, 403, { ok: false, error: 'Sem permissão para emitir proformas.' })
              const { data: order } = await supabase.from('pedidos_licencas').select('*').eq('id', proformaMatch[1]).maybeSingle()
              if (!order) return json(res, 404, { ok: false, error: 'Pedido não encontrado.' })
              // nº sequencial de proforma (settings.proforma_seq) — auditoria sem duplicações
              let seq = 1
              const { data: curSeq } = await supabase.from('settings').select('value').eq('key', 'proforma_seq').maybeSingle()
              if (curSeq?.value && !isNaN(parseInt(curSeq.value))) seq = parseInt(curSeq.value)
              const numero = `PF-${new Date().getFullYear()}-${String(seq).padStart(4, '0')}`
              await supabase.from('settings').upsert({ key: 'proforma_seq', value: String(seq + 1), description: 'Contador de faturas proforma emitidas no painel' }, { onConflict: 'key' })
              // preço de catálogo do software pedido (nome semelhante)
              const { data: catalogo } = await supabase.from('softwares').select('name, price')
              const nomeLower = String(order.software_nome || '').toLowerCase().trim()
              const match = (catalogo || []).find(s => s.price && (s.name.toLowerCase() === nomeLower || s.name.toLowerCase().includes(nomeLower) || nomeLower.includes(s.name.toLowerCase().split(' ')[0])))
              const preco = match?.price ?? null
              const { data: ibanRow } = await supabase.from('settings').select('value').eq('key', 'iban_cftec').maybeSingle()
              const pdf = buildProformaPdf({
                numero,
                pedido: String(order.id).slice(0, 8).toUpperCase(),
                data: new Date(order.created_at).toLocaleDateString('pt-PT'),
                empresa: order.nome_empresa, nif: order.nif, responsavel: order.nome_responsavel,
                email: order.email || '—', provincia: order.provincia || '—',
                software: order.software_nome, forma: order.forma_pagamento || 'Transferência / IBAN',
                preco, iban: ibanRow?.value || '(ver IBAN válido no painel de definições)',
              })
              res.writeHead(200, { 'Content-Type': 'application/pdf', 'Content-Disposition': `inline; filename="proforma-${numero}.pdf"` })
              return res.end(pdf)
            }

            // FATURA INTERNA PDF — só para pedidos com pagamento confirmado (status Pago)
            const faturaMatch = path.match(/^\/api\/admin\/license-orders\/([a-f0-9-]+)\/fatura/)
            if (faturaMatch && req.method === 'GET') {
              const nivelFat = currentAdmin(req)?.level
              if (nivelFat && !nivelPleno(nivelFat) && nivelFat !== 'gestor')
                return json(res, 403, { ok: false, error: 'Sem permissão para emitir faturas internas.' })
              const { data: order } = await supabase.from('pedidos_licencas').select('*').eq('id', faturaMatch[1]).maybeSingle()
              if (!order) return json(res, 404, { ok: false, error: 'Pedido não encontrado.' })
              if (order.status !== 'Pago')
                return json(res, 400, { ok: false, error: 'A fatura interna só é emitida depois de confirmar o pagamento (estado Pago).' })
              // nº sequencial de fatura interna (settings.fatura_seq) — auditoria sem duplicações
              let seq = 1
              const { data: curSeqF } = await supabase.from('settings').select('value').eq('key', 'fatura_seq').maybeSingle()
              if (curSeqF?.value && !isNaN(parseInt(curSeqF.value))) seq = parseInt(curSeqF.value)
              const numeroF = `FT-${new Date().getFullYear()}-${String(seq).padStart(4, '0')}`
              await supabase.from('settings').upsert({ key: 'fatura_seq', value: String(seq + 1), description: 'Contador de faturas internas emitidas no painel' }, { onConflict: 'key' })
              const { data: catalogoF } = await supabase.from('softwares').select('name, price')
              const nomeLowerF = String(order.software_nome || '').toLowerCase().trim()
              const matchF = (catalogoF || []).find(s => s.price && (s.name.toLowerCase() === nomeLowerF || s.name.toLowerCase().includes(nomeLowerF) || nomeLowerF.includes(s.name.toLowerCase().split(' ')[0])))
              const { data: ibanRowF } = await supabase.from('settings').select('value').eq('key', 'iban_cftec').maybeSingle()
              const pdfF = buildFaturaPdf({
                numero: numeroF,
                pedido: String(order.id).slice(0, 8).toUpperCase(),
                data: new Date().toLocaleDateString('pt-PT'),
                empresa: order.nome_empresa, nif: order.nif, responsavel: order.nome_responsavel,
                email: order.email || '—', provincia: order.provincia || '—',
                software: order.software_nome, forma: order.forma_pagamento || 'Transferência / IBAN',
                preco: matchF?.price ?? null, iban: ibanRowF?.value || '(ver IBAN válido no painel de definições)',
              })
              res.writeHead(200, { 'Content-Type': 'application/pdf', 'Content-Disposition': `inline; filename="fatura-interna-${numeroF}.pdf"` })
              return res.end(pdfF)
            }

            if (path.match(/^\/api\/admin\/license-orders\/([a-f0-9-]+)$/) && req.method === 'PATCH') {
              const id = path.split('/').pop()
              const payload = await readBody(req) as Partial<{ status: string; observacoes: string }>
              const updates: Record<string, unknown> = {}
              if (payload.status !== undefined) {
                const st = String(payload.status).trim()
                if (!['Pendente', 'Em Verificação', 'Aprovado', 'Pago', 'Rejeitado'].includes(st))
                  return json(res, 400, { ok: false, error: 'Status inválido. Use: Pendente, Em Verificação, Aprovado, Pago ou Rejeitado.' })
                updates.status = st
              }
              if (payload.observacoes !== undefined) updates.observacoes = String(payload.observacoes).slice(0, 1000)
              if (!Object.keys(updates).length) return json(res, 400, { ok: false, error: 'Nenhum campo para actualizar.' })
              // estado prévio — o e-mail ao cliente só dispara quando o status muda de verdade
              const { data: antes } = await supabase.from('pedidos_licencas').select('status, email, nome_empresa, software_nome').eq('id', id).limit(1)
              const prevStatus = (antes && antes[0]?.status) || null
              const { data, error } = await supabase
                .from('pedidos_licencas')
                .update(updates)
                .eq('id', id)
                .select('*')
                .single()
              if (error) return json(res, 500, { ok: false, error: error.message })
              // E-MAIL AO CLIENTE na aprovação/rejeição (se tiver e-mail e o mudou de status)
              let emailCliente: EmailResult | null = null
              const cliMail = String((data as { email?: string }).email || '').trim()
              const novoStatus = String((data as { status?: string }).status || '')
              if (cliMail && novoStatus && novoStatus !== prevStatus && ['Aprovado', 'Rejeitado'].includes(novoStatus)) {
                const empresa = escHtml(String((data as { nome_empresa?: string }).nome_empresa || 'empresa'))
                const software = escHtml(String((data as { software_nome?: string }).software_nome || ''))
                const ref = `#${String((data as { id?: string }).id || '').slice(0, 8).toUpperCase()}`
                const { data: cfg2 } = await supabase.from('settings').select('key, value').in('key', ['iban_cftec', 'whatsapp_comercial'])
                const g2 = (k: string) => escHtml((cfg2 || []).find((c: { key: string; value: string }) => c.key === k)?.value || '')
                const obsAr = String((data as { observacoes?: string }).observacoes || '').trim()
                if (novoStatus === 'Aprovado') {
                  emailCliente = await sendEmailRaw(
                    cliMail,
                    `Licença aprovada — CFTEC (${software})`,
                    emailShell('O seu pedido foi aprovado',
                      `<p>Olá <b>${empresa}</b>,</p><p>O pedido de licença <code>${ref}</code> para <b>${software || 'o software'}</b> foi <b style="color:#16a34a">aprovado</b>. Confirme os dados de pagamento:</p>
<table style="border-collapse:collapse;background:#f8fafc;border-radius:8px;padding:8px">${emailLinha('Forma de pagamento', escHtml(String((data as { forma_pagamento?: string }).forma_pagamento || '—')))}${emailLinha('IBAN', `<code style="user-select:all">${g2('iban_cftec') || '—'}</code>`)}</table>
<p style="margin:16px 0 0">Depois da transferência, envie o comprovativo para o nosso WhatsApp comercial: <b>+${g2('whatsapp_comercial') || '—'}</b> e a licença será emitida.</p>
${obsAr ? `<p style="margin:14px 0 0;background:#eff6ff;border-radius:8px;padding:10px 12px"><b>Nota da equipa:</b><br />${escHtml(obsAr)}</p>` : ''}`),
                  )
                } else {
                  emailCliente = await sendEmailRaw(
                    cliMail,
                    `Pedido não aprovado — CFTEC (${software})`,
                    emailShell('Sobre o seu pedido', `<p>Olá <b>${empresa}</b>,</p>
<p>O pedido <code>${ref}</code> para <b>${software}</b> não pôde ser aprovado neste momento.</p>
${obsAr ? `<p style="background:#fef2f2;border-radius:8px;padding:10px 12px"><b>Motivo indicado pela equipa:</b><br />${escHtml(obsAr)}</p>` : '<p>Sinta-se livre para contactar-nos para entender os próximos passos ou submeter um novo pedido com dados actualizados.</p>'}
<p style="margin:16px 0 0">Fala com a equipa comercial no WhatsApp: <b>+${g2('whatsapp_comercial') || '—'}</b></p>`),
                  )
                }
                console.log(`[EMAIL] cliente ${novoStatus} → ${cliMail} · ${emailCliente.detalhe}`)
              }
              logAuditoria(currentAdmin(req), 'pedido_estado', 'pedido', id, Object.keys(updates).length === 1 && updates.status ? { de: prevStatus, para: novoStatus } : { estado_anterior: prevStatus, estado_novo: novoStatus, campos: Object.keys(updates) })
              return json(res, 200, { ok: true, pedido: data, emailCliente: emailCliente ? (emailCliente.enviado ? 'enviado' : emailCliente.detalhe) : 'nenhum' })
            }

            if (path.match(/^\/api\/admin\/license-orders\/([a-f0-9-]+)$/) && req.method === 'DELETE') {
              const id = path.split('/').pop()
              const { error } = await supabase.from('pedidos_licencas').delete().eq('id', id)
              if (error) return json(res, 500, { ok: false, error: error.message })
              logAuditoria(currentAdmin(req), 'pedido_apagado', 'pedido', id)
              return json(res, 200, { ok: true })
            }

            // LICENÇAS PALANCASOFT
            if (path === '/api/admin/licenses' && req.method === 'GET') {
              const { data, error } = await supabase
                .from('licencas_palancasoft')
                .select('id, cliente_nome, nif, chave_licenca, data_ativacao, data_expiracao, status, created_at')
                .order('created_at', { ascending: false })
                .limit(100)
              if (error) return json(res, 500, { ok: false, error: error.message })
              return json(res, 200, data || [])
            }

            if (path === '/api/admin/licenses' && req.method === 'POST') {
              const payload = await readBody(req) as { cliente_nome?: string; nif?: string; data_expiracao?: string }
              const cliente = String(payload.cliente_nome || '').trim()
              if (!cliente || cliente.length > 150) return json(res, 400, { ok: false, error: 'Nome do cliente inválido.' })
              if (payload.data_expiracao && !/^\d{4}-\d{2}-\d{2}$/.test(payload.data_expiracao))
                return json(res, 400, { ok: false, error: 'Data de expiração inválida (use AAAA-MM-DD).' })

              // Gerador de chave única: PS-XXXX-XXXX-XXXX (sem caracteres confundíveis)
              const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
              const seg = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')

              let chave = ''
              for (let attempt = 0; attempt < 5; attempt++) {
                const candidate = `PS-${seg()}-${seg()}-${seg()}`
                const { data: existing } = await supabase
                  .from('licencas_palancasoft')
                  .select('id')
                  .eq('chave_licenca', candidate)
                  .maybeSingle()
                if (!existing) { chave = candidate; break }
              }
              if (!chave) return json(res, 500, { ok: false, error: 'Não foi possível gerar uma chave única.' })

              const { data, error } = await supabase
                .from('licencas_palancasoft')
                .insert({ cliente_nome: cliente, nif: payload.nif?.trim() || null, chave_licenca: chave, data_expiracao: payload.data_expiracao || null })
                .select('id, cliente_nome, nif, chave_licenca, data_ativacao, data_expiracao, status, created_at')
                .single()
              if (error) return json(res, 500, { ok: false, error: error.message })
              logAuditoria(currentAdmin(req), 'licenca_emitida', 'licença', data.id, { cliente, chave })
              return json(res, 201, { ok: true, license: data })
            }

            if (path.match(/^\/api\/admin\/licenses\/([a-f0-9-]+)$/) && req.method === 'PATCH') {
              const id = path.split('/').pop()
              const payload = await readBody(req) as Partial<{ status: string; data_expiracao: string | null }>
              const updates: Record<string, unknown> = {}
              if (payload.status !== undefined) {
                if (!['activa', 'expirada', 'cancelada'].includes(payload.status))
                  return json(res, 400, { ok: false, error: 'Estado inválido. Use: activa, expirada ou cancelada.' })
                updates.status = payload.status
              }
              if (payload.data_expiracao !== undefined) {
                if (payload.data_expiracao && !/^\d{4}-\d{2}-\d{2}$/.test(payload.data_expiracao))
                  return json(res, 400, { ok: false, error: 'Data de expiração inválida.' })
                updates.data_expiracao = payload.data_expiracao || null
              }
              if (!Object.keys(updates).length) return json(res, 400, { ok: false, error: 'Nenhum campo para actualizar.' })
              const { data, error } = await supabase.from('licencas_palancasoft').update(updates).eq('id', id).select('id, status, data_expiracao').single()
              if (error) return json(res, 500, { ok: false, error: error.message })
              logAuditoria(currentAdmin(req), 'licenca_actualizada', 'licença', id, { campos: Object.keys(updates), ...(updates.status ? { status: updates.status } : {}) })
              return json(res, 200, { ok: true, license: data })
            }

            if (path.match(/^\/api\/admin\/licenses\/([a-f0-9-]+)$/) && req.method === 'DELETE') {
              const id = path.split('/').pop()
              const { error } = await supabase.from('licencas_palancasoft').delete().eq('id', id)
              if (error) return json(res, 500, { ok: false, error: error.message })
              logAuditoria(currentAdmin(req), 'licenca_apagada', 'licença', id)
              return json(res, 200, { ok: true })
            }

            // SETTINGS DO PORTAL (config geral) — alteração restrita ao Super Admin
            if (path === '/api/admin/settings' && req.method !== 'GET') {
              const level = currentAdmin(req)?.level
              if (level && !nivelPleno(level))
                return json(res, 403, { ok: false, error: 'Apenas o Super Admin ou o Developer alteram a configuração do portal.' })
            }
            if (path === '/api/admin/settings' && req.method === 'GET') {
              // IBAN/notify/etc. são sensíveis — apenas o Super Admin/Developer lê a configuração
              const level = currentAdmin(req)?.level
              if (level && !nivelPleno(level)) return json(res, 403, { ok: false, error: 'Apenas o Super Admin vê a configuração do portal.' })
              const { data, error } = await supabase.from('settings').select('key, value, description').order('key')
              if (error) return json(res, 500, { ok: false, error: error.message })
              // chaves de licenciamento ficam visíveis APENAS ao próprio developer
              const lidas = level === 'developer' ? (data || []) : (data || []).filter((s: { key: string }) => !CHAVES_LICENCA.includes(s.key))
              return json(res, 200, { ok: true, settings: lidas })
            }

            if (path === '/api/admin/settings' && req.method === 'PATCH') {
              const payload = await readBody(req) as { entries?: { key: string; value: string }[] }
              const entries = (payload.entries || []).filter((e) => e && e.key && typeof e.value === 'string').slice(0, 20)
              if (!entries.length) return json(res, 400, { ok: false, error: 'Envie pelo menos uma chave/valor.' })
              // chaves de licenciamento: tentativa do super_admin (ou outro) é recusada
              if (currentAdmin(req)?.level !== 'developer' && entries.some((e) => CHAVES_LICENCA.includes(e.key.trim())))
                return json(res, 403, { ok: false, error: 'As chaves de licenciamento da plataforma são geridas exclusivamente pelo Developer.' })
              // chaves visíveis no site público (GET /api/settings → is_public)
              const PUBLIC_KEYS = ['whatsapp_comercial', 'whatsapp_tecnico', 'email_contacto', 'telefone_directorio', 'banner_activo', 'banner_mensagem', 'linkedin_url', 'x_url']
              for (const entry of entries) {
                const row: Record<string, unknown> = { key: entry.key.trim().slice(0, 80), value: entry.value.slice(0, 2000) }
                if (PUBLIC_KEYS.includes(row.key as string)) row.is_public = true
                const { error } = await supabase
                  .from('settings')
                  .upsert(row, { onConflict: 'key' })
                if (error) return json(res, 500, { ok: false, error: error.message })
              }
              logAuditoria(currentAdmin(req), 'definicoes_gravadas', 'definições', null, { chaves: entries.map((e) => e.key.trim()) })
              return json(res, 200, { ok: true })
            }

            // GUARDS DE NÍVEL — utilizadores: super_admin + developer (developer só gere developers)
            if (path === '/api/admin/users' || path.match(/^\/api\/admin\/users\/[a-f0-9-]+$/)) {
              const level = currentAdmin(req)?.level
              if (level && !nivelPleno(level))
                return json(res, 403, { ok: false, error: 'Apenas o Super Admin ou o Developer gere utilizadores.' })
            }
            // GUARD COMERCIAL — licenças, parceiros e pedidos: super_admin + gestor.
            // O técnico tem acesso apenas de SÓ LEITURA às licenças (consulta de clientes/chaves para suporte)
            // + módulo comercial desligado pelo developer → bloqueio geral (o developer vê sempre tudo)
            {
              const comercialLevel = currentAdmin(req)?.level
              const isCommercialPath = path === '/api/admin/licenses' || path === '/api/admin/partners' || path === '/api/admin/license-orders' || /^\/api\/admin\/(licenses|partners|license-orders)\/[a-f0-9-]+$/.test(path)
              const licensesReadOnly = isCommercialPath && req.method === 'GET' && (path === '/api/admin/licenses' || /^\/api\/admin\/licenses\/[a-f0-9-]+$/.test(path))
              if (isCommercialPath && comercialLevel === 'tecnico' && !licensesReadOnly)
                return json(res, 403, { ok: false, error: 'Sem permissão para esta área (apenas Super Admin e Gestor Comercial).' })
            }

            // LICENCIAMENTO DA PLATAFORMA — leitura para todos os admins; escrita EXCLUSIVA do Developer
            if (path === '/api/admin/system-license' && req.method === 'GET') {
              if (!currentAdmin(req)) return json(res, 401, { ok: false })
              return json(res, 200, { ok: true, ...(await licencaAtual()) })
            }
            if (path === '/api/admin/system-license' && req.method === 'PATCH') {
              const vez = currentAdmin(req)
              if (!vez) return json(res, 401, { ok: false })
              if (vez.level !== 'developer') return json(res, 403, { ok: false, error: 'Só o Developer (Master Admin) gere a licença da plataforma.' })
              const payload = await readBody(req) as Partial<{ licencaAtiva: boolean; moduloComercial: boolean; moduloTecnico: boolean; moduloNovidades: boolean; expiraEm: string; mensagem: string }>
              const boolOf = (v?: boolean) => (typeof v === 'boolean' ? (v ? 'true' : 'false') : null)
              const descr: Record<string, string> = {
                licenca_ativa: 'Licença da plataforma — false suspende o painel para todos excepto developers',
                modulo_comercial: 'Módulo Comercial: pedidos B2B, proformas, faturas internas, relatórios e revenda Negomil',
                modulo_tecnico: 'Módulo Técnico: chamados de suporte e wiki técnica',
                modulo_novidades: 'Módulo Novidades: blog/CMS e destaques (site + painel)',
                licenca_expira_em: 'Data de validade da licença de manutenção (YYYY-MM-DD; vazio = sem prazo)',
                msg_licenca: 'Mensagem exibida quando um módulo/licença está bloqueado',
              }
              const atual: { key: string; value: string; description: string }[] = []
              const la = boolOf(payload.licencaAtiva); if (la) atual.push({ key: 'licenca_ativa', value: la, description: descr.licenca_ativa })
              const mc = boolOf(payload.moduloComercial); if (mc) atual.push({ key: 'modulo_comercial', value: mc, description: descr.modulo_comercial })
              const mt = boolOf(payload.moduloTecnico); if (mt) atual.push({ key: 'modulo_tecnico', value: mt, description: descr.modulo_tecnico })
              const mn = boolOf(payload.moduloNovidades); if (mn) atual.push({ key: 'modulo_novidades', value: mn, description: descr.modulo_novidades })
              if (payload.expiraEm !== undefined) atual.push({ key: 'licenca_expira_em', value: String(payload.expiraEm).slice(0, 10), description: descr.licenca_expira_em })
              if (payload.mensagem !== undefined) atual.push({ key: 'msg_licenca', value: String(payload.mensagem).slice(0, 300), description: descr.msg_licenca })
              for (const a of atual) {
                const { error } = await supabase.from('settings').upsert(a, { onConflict: 'key' })
                if (error) return json(res, 500, { ok: false, error: error.message })
              }
              const resultado = await licencaAtual()
              logAuditoria(vez, 'licenca_alterada', 'plataforma', null, { alteracoes: atual.map((a) => `${a.key}=${a.value}`), resultado: { licencaAtiva: resultado.licencaAtiva, comercial: resultado.moduloComercial, tecnico: resultado.moduloTecnico, novidades: resultado.moduloNovidades, expiraEm: resultado.expiraEm } })
              return json(res, 200, { ok: true, ...resultado })
            }

            // MÓDULOS DESLIGADOS PELO DEVELOPER — defesa na API além do UI (o Developer vê sempre tudo)
            {
              const nivelNow = currentAdmin(req)?.level
              if (nivelNow !== 'developer') {
                const lic = await licencaAtual()
                const isComercial = path === '/api/admin/licenses' || path === '/api/admin/partners' || path === '/api/admin/license-orders' || /^\/api\/admin\/(licenses|partners|license-orders)\//.test(path)
                if (isComercial && !lic.moduloComercial)
                  return json(res, 403, { ok: false, error: lic.mensagem })
                const isTecnico = path === '/api/admin/chamados' || /^\/api\/admin\/chamados\//.test(path) || path === '/api/admin/wiki' || /^\/api\/admin\/wiki\//.test(path)
                if (isTecnico && !lic.moduloTecnico)
                  return json(res, 403, { ok: false, error: lic.mensagem })
                const isNovidadeEscrita = (path === '/api/admin/blog' || /^\/api\/admin\/blog\//.test(path) || path === '/api/admin/destaques' || /^\/api\/admin\/destaques\//.test(path)) && req.method !== 'GET'
                if (isNovidadeEscrita && !lic.moduloNovidades)
                  return json(res, 403, { ok: false, error: lic.mensagem })
              }
            }

            // UTILIZADORES DO PAINEL — gestão restrita ao super_admin
            const ROLES = ['super_admin', 'gestor', 'tecnico', 'developer']
            const isSuperAdmin = currentAdmin(req)?.level !== undefined
              ? nivelPleno(currentAdmin(req)!.level)
              : true // tokens antigos (sem nível) = admin único = super admin

            // UTILIZADORES DO PAINEL (endpoint handlers)
            if (path === '/api/admin/users' && req.method === 'GET') {
              if (!isSuperAdmin) return json(res, 403, { ok: false, error: 'Apenas o Super Admin gere utilizadores.' })
              const { data, error } = await supabase
                .from('admin_users')
                .select('id, name, email, role, is_active, created_at')
                .order('created_at', { ascending: true })
              if (error) return json(res, 500, { ok: false, error: error.message })
              return json(res, 200, data || [])
            }

            if (path === '/api/admin/users' && req.method === 'POST') {
              if (!isSuperAdmin) return json(res, 403, { ok: false, error: 'Apenas o Super Admin gere utilizadores.' })
              const payload = await readBody(req) as { name?: string; email?: string; password?: string; role?: string }
              const name = String(payload.name || '').trim()
              const email = String(payload.email || '').trim().toLowerCase()
              const password = String(payload.password || '')
              const role = String(payload.role || 'gestor')
              if (!name || name.length > 120) return json(res, 400, { ok: false, error: 'Nome inválido.' })
              if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 160)
                return json(res, 400, { ok: false, error: 'E-mail inválido.' })
              if (password.length < 8)
                return json(res, 400, { ok: false, error: 'A password precisa de pelo menos 8 caracteres.' })
              if (!ROLES.includes(role))
                return json(res, 400, { ok: false, error: 'Nível inválido. Use: super_admin, gestor, tecnico ou developer.' })

              // bootstrap: ninguém fora do círculo developer cria contas developer
              // EXCEPTO na fase inicial — sem nenhum developer, o super_admin cria a PRIMEIRA
              if (role === 'developer' && currentAdmin(req)?.level !== 'developer') {
                const { data: devs0 } = await supabase.from('admin_users').select('id').eq('role', 'developer').limit(1)
                if (devs0 && devs0.length) return json(res, 403, { ok: false, error: 'Só o Developer (Master Admin) cria contas developer.' })
              }

              const { data: existing } = await supabase.from('admin_users').select('id').eq('email', email).maybeSingle()
              if (existing) return json(res, 409, { ok: false, error: 'Já existe um utilizador com este e-mail.' })

              const hash = await bcrypt.hash(password, 12)
              const { data, error } = await supabase
                .from('admin_users')
                .insert({ name, email, password_hash: hash, role })
                .select('id, name, email, role, is_active, created_at')
                .single()
              if (error) return json(res, 500, { ok: false, error: error.message })
              logAuditoria(currentAdmin(req), 'utilizador_criado', 'utilizador', data.id, { email, nivel: role })
              return json(res, 201, { ok: true, user: data })
            }

            if (path.match(/^\/api\/admin\/users\/([a-f0-9-]+)$/) && req.method === 'PATCH') {
              const id = path.split('/').pop()
              if (!isSuperAdmin) return json(res, 403, { ok: false, error: 'Apenas o Super Admin gere utilizadores.' })
              // contas developer não são editáveis por quem não é developer (o Master Admin é intocável)
              const { data: alvoDev } = await supabase.from('admin_users').select('role').eq('id', id).maybeSingle()
              if (alvoDev?.role === 'developer' && currentAdmin(req)?.level !== 'developer')
                return json(res, 403, { ok: false, error: 'A conta Developer (Master Admin) só é gerida por outra conta Developer.' })
              const payload = await readBody(req) as Partial<{ name: string; role: string; is_active: boolean; password: string }>
              const updates: Record<string, unknown> = {}
              if (payload.name !== undefined) {
                const n = String(payload.name).trim()
                if (!n || n.length > 120) return json(res, 400, { ok: false, error: 'Nome inválido.' })
                updates.name = n
              }
              if (payload.role !== undefined) {
                if (!ROLES.includes(String(payload.role)))
                  return json(res, 400, { ok: false, error: 'Nível inválido. Use: super_admin, gestor, tecnico ou developer.' })
                if (id === currentAdmin(req)!.sub)
                  return json(res, 400, { ok: false, error: 'Não pode alterar o seu próprio nível.' })
                // garantir bootstrap: nível developer → só developers promote, embora super possa so quando nenum developer existe ainda
                if (String(payload.role) === 'developer' && currentAdmin(req)!.level !== 'developer') {
                  const { data: devs0 } = await supabase.from('admin_users').select('id').eq('role', 'developer').limit(1)
                  if (devs0 && devs0.length) return json(res, 403, { ok: false, error: 'Só o Developer (Master Admin) promove contas a developer.' })
                }
                updates.role = String(payload.role)
              }
              if (payload.is_active !== undefined) {
                if (id === currentAdmin(req)!.sub)
                  return json(res, 400, { ok: false, error: 'Não pode desactivar a sua própria conta.' })
                updates.is_active = Boolean(payload.is_active)
              }
              if (payload.password !== undefined) {
                if (String(payload.password).length < 8)
                  return json(res, 400, { ok: false, error: 'A password precisa de pelo menos 8 caracteres.' })
                updates.password_hash = await bcrypt.hash(String(payload.password), 12)
              }
              if (!Object.keys(updates).length) return json(res, 400, { ok: false, error: 'Nenhum campo para actualizar.' })
              // password/desactivação/nível alterados → a(s) sessão(ões) do utilizador perdido/degradado morrem já
              if (updates.password_hash || updates.is_active === false || updates.role) revokeAllSessionsForUser(String(id))
              const { data, error } = await supabase
                .from('admin_users')
                .update(updates)
                .eq('id', id)
                .select('id, name, email, role, is_active, created_at')
                .single()
              if (error) return json(res, 500, { ok: false, error: error.message })
              logAuditoria(currentAdmin(req), 'utilizador_actualizado', 'utilizador', id, { campos: Object.keys(updates).filter((k) => k !== 'password_hash'), ...( updates.role !== undefined ? { nivel: updates.role } : {}),...(updates.is_active !== undefined ? { activo: updates.is_active } : {}) })
              return json(res, 200, { ok: true, user: data })
            }

            if (path.match(/^\/api\/admin\/users\/([a-f0-9-]+)$/) && req.method === 'DELETE') {
              const id = path.split('/').pop()
              if (!isSuperAdmin) return json(res, 403, { ok: false, error: 'Apenas o Super Admin gere utilizadores.' })
              // não eliminar a conta developer (só a própria conta developer o faria)
              const { data: alvoDel } = await supabase.from('admin_users').select('role').eq('id', id).maybeSingle()
              if (alvoDel?.role === 'developer' && currentAdmin(req)?.level !== 'developer')
                return json(res, 403, { ok: false, error: 'A conta Developer (Master Admin) só é gerida por outra conta Developer.' })
              if (id === currentAdmin(req)!.sub)
                return json(res, 400, { ok: false, error: 'Não pode eliminar a sua própria conta.' })
              const { error } = await supabase.from('admin_users').delete().eq('id', id)
              if (error) return json(res, 500, { ok: false, error: error.message })
              revokeAllSessionsForUser(String(id))
              logAuditoria(currentAdmin(req), 'utilizador_apagado', 'utilizador', id, alvoDel?.role ? { nivel: alvoDel.role } : undefined)
              return json(res, 200, { ok: true })
            }

            // GUARDAS DE NÍVEL
            if (path === '/api/admin/settings' && req.method !== 'GET') {
              const level = currentAdmin(req)?.level
              if (level && !nivelPleno(level))
                return json(res, 403, { ok: false, error: 'Apenas o Super Admin ou o Developer alteram a configuração do portal.' })
            }
            if (path === '/api/admin/users' || path.match(/^\/api\/admin\/users\/[a-f0-9-]+$/)) {
              // trata nos blocos acima via isSuperAdmin
            }
            // GUARD COMERCIAL — licenças, parceiros e pedidos: super_admin + gestor.
            // O técnico tem acesso apenas de SÓ LEITURA às licenças (consulta de clientes/chaves para suporte)
            // + módulo comercial desligado pelo developer → bloqueio geral (o developer vê sempre tudo)
            {
              const comercialLevel = currentAdmin(req)?.level
              const isCommercialPath = path === '/api/admin/licenses' || path === '/api/admin/partners' || path === '/api/admin/license-orders' || /^\/api\/admin\/(licenses|partners|license-orders)\/[a-f0-9-]+$/.test(path)
              const licensesReadOnly = isCommercialPath && req.method === 'GET' && (path === '/api/admin/licenses' || /^\/api\/admin\/licenses\/[a-f0-9-]+$/.test(path))
              if (isCommercialPath && comercialLevel === 'tecnico' && !licensesReadOnly)
                return json(res, 403, { ok: false, error: 'Sem permissão para esta área (apenas Super Admin e Gestor Comercial).' })
            }

            // CHAMADOS DE SUPORTE — helpdesk do técnico (todos os níveis de admin)
            if (path === '/api/admin/chamados' && req.method === 'GET') {
              const { data, error } = await supabase.from('chamados_suporte').select('*').order('created_at', { ascending: false }).limit(120)
              if (error) return json(res, 500, { ok: false, error: error.message })
              return json(res, 200, data || [])
            }

            if (path === '/api/admin/chamados' && req.method === 'POST') {
              const payload = await readBody(req) as { cliente?: string; nif?: string; telefone?: string; software?: string; problema?: string; estado?: string; prioridade?: string }
              const cliente = String(payload.cliente || '').trim()
              const problema = String(payload.problema || '').trim()
              if (!cliente || cliente.length > 150) return json(res, 400, { ok: false, error: 'Indique o cliente/empresa.' })
              if (!problema || problema.length > 1200) return json(res, 400, { ok: false, error: 'Descreve o problema entregado.' })
              const ESTADOS = ['Pendente', 'Em Resolução', 'Resolvido']
              const PRIOS = ['Baixa', 'Média', 'Crítica']
              const estado = ESTADOS.includes(payload.estado || '') ? payload.estado! : 'Pendente'
              const prioridade = PRIOS.includes(payload.prioridade || '') ? payload.prioridade! : 'Média'
              const nif = String(payload.nif || '').trim().slice(0, 30) || null
              const telefone = String(payload.telefone || '').trim().slice(0, 20) || null
              const software = String(payload.software || '').trim().slice(0, 120) || null
              const { data, error } = await supabase.from('chamados_suporte')
                .insert({ cliente, nif, telefone, software, problema, estado, prioridade, origem: 'painel' })
                .select('*').single()
              if (error) return json(res, 500, { ok: false, error: error.message })
              logAuditoria(currentAdmin(req), 'chamado_criado', 'chamado', data.id, { cliente, estado, prioridade })
              return json(res, 201, { ok: true, chamado: data })
            }

            if (path.match(/^\/api\/admin\/chamados\/[a-f0-9-]+$/)) {
              const id = path.split('/').pop()
              if (req.method === 'PATCH') {
                const payload = await readBody(req) as { estado?: string; prioridade?: string; resolucao?: string }
                const update: Record<string, string> = {}
                if (payload.estado && ['Pendente', 'Em Resolução', 'Resolvido'].includes(payload.estado)) update.estado = payload.estado
                if (payload.prioridade && ['Baixa', 'Média', 'Crítica'].includes(payload.prioridade)) update.prioridade = payload.prioridade
                if (typeof payload.resolucao === 'string') update.resolucao = payload.resolucao.trim().slice(0, 1200) || null
                if (!Object.keys(update).length) return json(res, 400, { ok: false, error: 'Nada para actualizar.' })
                const { data, error } = await supabase.from('chamados_suporte').update(update).eq('id', id).select('*').single()
                if (error) return json(res, 500, { ok: false, error: error.message })
                logAuditoria(currentAdmin(req), 'chamado_actualizado', 'chamado', id, { campos: Object.keys(update) })
                return json(res, 200, { ok: true, chamado: data })
              }
              if (req.method === 'DELETE') {
                const { error } = await supabase.from('chamados_suporte').delete().eq('id', id)
                if (error) return json(res, 500, { ok: false, error: error.message })
                logAuditoria(currentAdmin(req), 'chamado_apagado', 'chamado', id)
                return json(res, 200, { ok: true })
              }
            }

            // WEB PUSH — chave pública VAPID para o banner do painel assinar o dispositivo
            if (path === '/api/admin/push-key' && req.method === 'GET') {
              if (!pushActivo) return json(res, 501, { ok: false, error: 'Web Push não configurado (.env sem VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY).' })
              return json(res, 200, { ok: true, publicKey: VAPID_PUBLIC })
            }

            // WEB PUSH — grava/atualiza a subscrição do browser que pediu para receber alertas
            if (path === '/api/admin/push-subscribe' && req.method === 'POST') {
              const payload = await readBody(req) as { endpoint?: string; keys?: { p256dh?: string; auth?: string } }
              const endpoint = String(payload.endpoint || '').trim()
              const p256dh = String(payload.keys?.p256dh || '').trim()
              const auth = String(payload.keys?.auth || '').trim()
              if (!/^https?:\/\//.test(endpoint) || endpoint.length > 1024) return json(res, 400, { ok: false, error: 'Endpoint de subscrição inválido.' })
              if (!p256dh || !auth || p256dh.length > 300 || auth.length > 300) return json(res, 400, { ok: false, error: 'Chaves de encriptação ausentes na subscrição.' })
              const sub = await currentAdmin(req)
              const row = { endpoint, p256dh, auth_key: auth, user_email: sub?.email || null, user_level: sub?.level || 'super_admin' }
              const { error } = await supabase.from('push_subscriptions')
                .upsert({ ...row, updated_at: new Date().toISOString() }, { onConflict: 'endpoint' })
              if (error) return json(res, 500, { ok: false, error: error.message })
              return json(res, 200, { ok: true })
            }

            // WEB PUSH — disparo de teste (email/level do próprio admin autenticado)
            if (path === '/api/admin/push-test' && req.method === 'POST') {
              const sub = await currentAdmin(req)
              if (!pushActivo) return json(res, 501, { ok: false, error: 'Web Push não configurado.' })
              const { data: subs } = await supabase.from('push_subscriptions')
                .select('endpoint, p256dh, auth_key').eq('user_email', sub?.email || '')
              let enviadas = 0
              for (const s of subs || []) {
                try {
                  await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth_key } },
                    JSON.stringify({ type: sub?.level === 'tecnico' ? 'chamado' : 'pedido', title: '🔔 CFTEC — alertas activos', body: 'Web Push operacional: será notificado de novos pedidos/chamados.', url: '/admin' }))
                  enviadas++
                } catch (err: { statusCode?: number } | any) {
                  if (err?.statusCode === 404 || err?.statusCode === 410) {
                    await supabase.from('push_subscriptions').delete().eq('endpoint', s.endpoint)
                  }
                }
              }
              if (!enviadas) return json(res, 404, { ok: false, error: 'Nenhuma subscrição activa para o seu dispositivo.' })
              return json(res, 200, { ok: true, enviadas })
            }

            // WIKI TÉCNICA — base de conhecimento interna (só super_admin + técnico)
            if (path === '/api/admin/wiki' && req.method === 'GET') {
              if (!['super_admin', 'tecnico', 'developer'].includes(currentAdmin(req)?.level || '')) return json(res, 403, { ok: false, error: 'Sem permissão para a wiki técnica.' })
              const { data, error } = await supabase.from('wiki_tecnica').select('*').order('updated_at', { ascending: false }).limit(200)
              if (error) return json(res, 500, { ok: false, error: error.message })
              return json(res, 200, data || [])
            }

            if (path === '/api/admin/wiki' && req.method === 'POST') {
              if (!['super_admin', 'tecnico', 'developer'].includes(currentAdmin(req)?.level || '')) return json(res, 403, { ok: false, error: 'Sem permissão para a wiki técnica.' })
              const payload = await readBody(req) as { titulo?: string; software?: string; problema?: string; solucao?: string; tags?: string }
              const titulo = String(payload.titulo || '').trim()
              const problema = String(payload.problema || '').trim()
              const solucao = String(payload.solucao || '').trim()
              if (!titulo || titulo.length > 160) return json(res, 400, { ok: false, error: 'Indique um título (máx. 160 caracteres).' })
              if (!problema || problema.length > 1500) return json(res, 400, { ok: false, error: 'Descreve o problema/sintoma (máx. 1500).' })
              if (!solucao || solucao.length > 8000) return json(res, 400, { ok: false, error: 'Escreve a solução passo-a-passo (máx. 8000).' })
              const autor = currentAdmin(req)?.name || currentAdmin(req)?.email || null
              const { data, error } = await supabase.from('wiki_tecnica')
                .insert({ titulo, software: String(payload.software || '').trim().slice(0, 120) || null, problema, solucao, tags: String(payload.tags || '').trim().slice(0, 200) || null, autor })
                .select('*').single()
              if (error) return json(res, 500, { ok: false, error: error.message })
              logAuditoria(currentAdmin(req), 'wiki_criada', 'wiki', data.id, { titulo })
              return json(res, 201, { ok: true, artigo: data })
            }

            if (path.match(/^\/api\/admin\/wiki\/[a-f0-9-]+$/)) {
              if (!['super_admin', 'tecnico', 'developer'].includes(currentAdmin(req)?.level || '')) return json(res, 403, { ok: false, error: 'Sem permissão para a wiki técnica.' })
              const id = path.split('/').pop()
              if (req.method === 'PATCH') {
                const payload = await readBody(req) as { titulo?: string; software?: string; problema?: string; solucao?: string; tags?: string }
                const update: Record<string, string> = {}
                if (payload.titulo !== undefined) { const t = payload.titulo.trim(); if (!t || t.length > 160) return json(res, 400, { ok: false, error: 'Título inválido.' }); update.titulo = t }
                if (payload.software !== undefined) update.software = payload.software.trim().slice(0, 120) || null
                if (payload.problema !== undefined) { const p = payload.problema.trim(); if (!p || p.length > 1500) return json(res, 400, { ok: false, error: 'Problema inválido (máx. 1500).' }); update.problema = p }
                if (payload.solucao !== undefined) { const s = payload.solucao.trim(); if (!s || s.length > 8000) return json(res, 400, { ok: false, error: 'Solução inválida (máx. 8000).' }); update.solucao = s }
                if (payload.tags !== undefined) update.tags = payload.tags.trim().slice(0, 200) || null
                if (!Object.keys(update).length) return json(res, 400, { ok: false, error: 'Nada para actualizar.' })
                const { data, error } = await supabase.from('wiki_tecnica').update(update).eq('id', id).select('*').single()
                if (error) return json(res, 500, { ok: false, error: error.message })
                logAuditoria(currentAdmin(req), 'wiki_actualizada', 'wiki', id, { campos: Object.keys(update) })
                return json(res, 200, { ok: true, artigo: data })
              }
              if (req.method === 'DELETE') {
                const { error } = await supabase.from('wiki_tecnica').delete().eq('id', id)
                if (error) return json(res, 500, { ok: false, error: error.message })
                logAuditoria(currentAdmin(req), 'wiki_apagada', 'wiki', id)
                return json(res, 200, { ok: true })
              }
            }

            // MÉTRICAS DE DOWNLOADS — os eventuais últimos 30 dias (agregado)
            if (path === '/api/admin/downloads' && req.method === 'GET') {
              const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
              const { data, error } = await supabase
                .from('download_events')
                .select('software_id, created_at')
                .gte('created_at', since)
                .limit(5000)
              if (error) return json(res, 500, { ok: false, error: error.message })
              const porDia: Record<string, number> = {}
              const porSoftware: Record<string, number> = {}
              for (const ev of data || []) {
                const dia = (ev.created_at as string).slice(0, 10)
                porDia[dia] = (porDia[dia] || 0) + 1
                porSoftware[ev.software_id as string] = (porSoftware[ev.software_id as string] || 0) + 1
              }
              const nomes = await supabase.from('softwares').select('id, name')
              const nomesMap: Record<string, string> = {}
              for (const s of nomes.data || []) nomesMap[s.id as string] = s.name as string
              const topo = Object.entries(porSoftware)
                .map(([id, count]) => ({ id, name: nomesMap[id] || 'Software', count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 5)
              return json(res, 200, { ok: true, total30: data?.length || 0, porDia, topo })
            }

            // MÉTRICAS DE DOWNLOADS — últimos 30 dias de um software
            if (path.match(/^\/api\/admin\/software\/([a-f0-9-]+)\/events$/) && req.method === 'GET') {
              const id = path.split('/')[4]
              const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
              const { data, error } = await supabase
                .from('download_events')
                .select('created_at')
                .eq('software_id', id)
                .gte('created_at', since)
                .order('created_at', { ascending: false })
                .limit(2000)
              if (error) return json(res, 500, { ok: false, error: error.message })
              const porDia: Record<string, number> = {}
              for (const ev of data || []) porDia[(ev.created_at as string).slice(0, 10)] = (porDia[(ev.created_at as string).slice(0, 10)] || 0) + 1
              return json(res, 200, { ok: true, total: data?.length || 0, porDia })
            }
            

            if (path === '/api/admin/services' && req.method === 'GET') {
              const { data } = await supabase
                .from('services')
                .select('id, title, slug, short_description, full_description, icon, is_active, created_at')
                .order('created_at', { ascending: false })
              return json(res, 200, data || [])
            }
            
            if (path === '/api/admin/services' && req.method === 'POST') {
              const payload = await readBody(req) as { title: string; short_description: string; full_description?: string; icon?: string; is_active?: boolean }
              const title = payload.title?.trim()
              const short_description = payload.short_description?.trim()
              if (!title || !short_description || title.length > 150 || short_description.length > 500) 
                return json(res, 400, { ok: false, error: 'Título e descrição curta são obrigatórios.' })
              
              const slugBase = title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
              let slug = slugBase
              let counter = 1
              
              while (true) {
                const { data } = await supabase.from('services').select('id').eq('slug', slug).single()
                if (!data) break
                slug = `${slugBase}-${counter++}`
              }
              
              const { data, error } = await supabase
                .from('services')
                .insert({
                  title,
                  slug,
                  short_description,
                  full_description: payload.full_description?.trim() || null,
                  icon: payload.icon?.trim() || 'code',
                  is_active: payload.is_active !== false,
                })
                .select('id')
                .single()
              
              if (error) return json(res, 500, { ok: false, error: error.message })
              logAuditoria(currentAdmin(req), 'servico_criado', 'serviço', data.id, { titulo: title })
              return json(res, 201, { ok: true, id: data.id })
            }
            
            if (path.match(/^\/api\/admin\/services\/([a-f0-9-]+)$/) && req.method === 'PATCH') {
              const id = path.split('/').pop()
              const payload = await readBody(req) as Partial<{ title: string; short_description: string; full_description: string; icon: string; is_active: boolean }>
              
              const updates: Record<string, any> = {}
              if (payload.title !== undefined) { 
                const t = payload.title.trim()
                if (!t || t.length > 150) return json(res, 400, { ok: false, error: 'Título inválido.' })
                updates.title = t 
              }
              if (payload.short_description !== undefined) { 
                const d = payload.short_description.trim()
                if (!d || d.length > 500) return json(res, 400, { ok: false, error: 'Descrição curta inválida.' })
                updates.short_description = d 
              }
              if (payload.full_description !== undefined) updates.full_description = payload.full_description.trim() || null
              if (payload.icon !== undefined) updates.icon = payload.icon.trim() || 'code'
              if (payload.is_active !== undefined) updates.is_active = payload.is_active
              
              if (!Object.keys(updates).length) return json(res, 400, { ok: false, error: 'Nenhum campo para atualizar.' })
              
              const { error } = await supabase.from('services').update(updates).eq('id', id)
              if (error) return json(res, 500, { ok: false, error: error.message })
              logAuditoria(currentAdmin(req), 'servico_actualizado', 'serviço', id, { campos: Object.keys(updates) })
              return json(res, 200, { ok: true })
            }
            
            const deleteMatch = path.match(/^\/api\/admin\/services\/([a-f0-9-]+)$/)
            if (deleteMatch && req.method === 'DELETE') {
              const id = path.split('/').pop()
              try {
                const { error } = await supabase.from('services').delete().eq('id', id)
                if (error) return json(res, 500, { ok: false, error: error.message })
                logAuditoria(currentAdmin(req), 'servico_apagado', 'serviço', id)
                return json(res, 200, { ok: true })
              } catch (e) {
                console.error('[DELETE] Exception:', e)
                return json(res, 500, { ok: false, error: 'Erro interno' })
              }
            }
            
            if (path.match(/^\/api\/admin\/services\/([a-f0-9-]+)\/toggle$/) && req.method === 'POST') {
              const id = path.split('/')[4]
              const { data: current } = await supabase.from('services').select('is_active').eq('id', id).single()
              if (!current) return json(res, 404, { ok: false, error: 'Serviço não encontrado.' })
              
              const { error } = await supabase.from('services').update({ is_active: !current.is_active }).eq('id', id)
              if (error) return json(res, 500, { ok: false, error: error.message })
              logAuditoria(currentAdmin(req), 'servico_alternado', 'serviço', id, { is_active: !current.is_active })
              return json(res, 200, { ok: true, is_active: !current.is_active })
            }
            
            // MEDIA CRUD
            if (path === '/api/admin/media' && req.method === 'GET') {
              const { data } = await supabase
                .from('media')
                .select('id, filename, file_path, file_size, mime_type, alt_text, uploaded_at')
                .order('uploaded_at', { ascending: false })
                .limit(50)
              return json(res, 200, data || [])
            }

            // DESTAQUES & NOVIDADES — CRUD (mesmos níveis das mídias/serviços: qualquer admin)
            if (path === '/api/admin/destaques' && req.method === 'GET') {
              const { data, error } = await supabase
                .from('novidades_destaques')
                .select('id, created_at, titulo, descricao, imagem_url, link_botao, texto_botao, ativo, ordem')
                .order('ordem', { ascending: true })
                .order('created_at', { ascending: false })
              if (error) {
                if (String(error.message).includes('novidades_destaques')) return json(res, 200, [])
                return json(res, 500, { ok: false, error: error.message })
              }
              return json(res, 200, data || [])
            }

            if (path === '/api/admin/destaques' && req.method === 'POST') {
              const payload = await readBody(req) as Partial<{ titulo: string; descricao: string; imagem_url: string; link_botao: string; texto_botao: string; ativo: boolean; ordem: number }>
              const titulo = String(payload.titulo || '').trim()
              const descricao = String(payload.descricao || '').trim()
              const imagem = String(payload.imagem_url || '').trim()
              if (!titulo || titulo.length > 120) return json(res, 400, { ok: false, error: 'Título é obrigatório (máx. 120 caracteres).' })
              if (!descricao || descricao.length > 400) return json(res, 400, { ok: false, error: 'Descrição é obrigatória (máx. 400 caracteres).' })
              if (!imagem) return json(res, 400, { ok: false, error: 'Selecione uma imagem para o destaque.' })
              const { data, error } = await supabase
                .from('novidades_destaques')
                .insert({
                  titulo: titulo.slice(0, 120),
                  descricao: descricao.slice(0, 400),
                  imagem_url: imagem.slice(0, 500),
                  link_botao: String(payload.link_botao || '').trim().slice(0, 300) || null,
                  texto_botao: String(payload.texto_botao || '').trim().slice(0, 40) || 'Saber Mais',
                  ativo: payload.ativo !== false,
                  ordem: Number.isFinite(Number(payload.ordem)) ? Math.max(1, Math.min(99, Number(payload.ordem))) : 1,
                })
                .select('*')
                .single()
              if (error) return json(res, 500, { ok: false, error: error.message })
              logAuditoria(currentAdmin(req), 'destaque_criado', 'destaque', data.id, { titulo: titulo.slice(0, 120) })
              return json(res, 201, { ok: true, destaque: data })
            }

            if (path.match(/^\/api\/admin\/destaques\/([a-f0-9-]+)$/) && req.method === 'PATCH') {
              const id = path.split('/').pop()
              const payload = await readBody(req) as Partial<{ titulo: string; descricao: string; imagem_url: string; link_botao: string; texto_botao: string; ativo: boolean; ordem: number }>
              const updates: Record<string, unknown> = {}
              if (payload.titulo !== undefined) { const v = String(payload.titulo).trim(); if (!v || v.length > 120) return json(res, 400, { ok: false, error: 'Título inválido.' }); updates.titulo = v }
              if (payload.descricao !== undefined) { const v = String(payload.descricao).trim(); if (!v || v.length > 400) return json(res, 400, { ok: false, error: 'Descrição inválida.' }); updates.descricao = v }
              if (payload.imagem_url !== undefined) { const v = String(payload.imagem_url).trim(); if (!v) return json(res, 400, { ok: false, error: 'Imagem inválida.' }); updates.imagem_url = v.slice(0, 500) }
              if (payload.link_botao !== undefined) updates.link_botao = String(payload.link_botao).trim().slice(0, 300) || null
              if (payload.texto_botao !== undefined) updates.texto_botao = String(payload.texto_botao).trim().slice(0, 40) || 'Saber Mais'
              if (payload.ativo !== undefined) updates.ativo = !!payload.ativo
              if (payload.ordem !== undefined) { const n = Number(payload.ordem); if (!Number.isFinite(n)) return json(res, 400, { ok: false, error: 'Ordem inválida.' }); updates.ordem = Math.max(1, Math.min(99, n)) }
              if (!Object.keys(updates).length) return json(res, 400, { ok: false, error: 'Nenhum campo para actualizar.' })
              const { data, error } = await supabase
                .from('novidades_destaques')
                .update(updates)
                .eq('id', id)
                .select('*')
                .single()
              if (error) return json(res, 500, { ok: false, error: error.message })
              logAuditoria(currentAdmin(req), 'destaque_actualizado', 'destaque', id, { campos: Object.keys(updates) })
              return json(res, 200, { ok: true, destaque: data })
            }

            if (path.match(/^\/api\/admin\/destaques\/([a-f0-9-]+)$/) && req.method === 'DELETE') {
              const id = path.split('/').pop()
              const { error } = await supabase.from('novidades_destaques').delete().eq('id', id)
              if (error) return json(res, 500, { ok: false, error: error.message })
              logAuditoria(currentAdmin(req), 'destaque_apagado', 'destaque', id)
              return json(res, 200, { ok: true })
            }

            // BLOG — CRUD (mesmos níveis das mídias/serviços: qualquer admin)
            if (path === '/api/admin/blog' && req.method === 'GET') {
              const { data, error } = await supabase
                .from('blog_posts')
                .select('id, created_at, updated_at, slug, title, excerpt, cover_url, category, author, is_published, published_at')
                .order('created_at', { ascending: false })
              if (error) {
                if (String(error.message).includes('blog_posts')) return json(res, 200, [])
                return json(res, 500, { ok: false, error: error.message })
              }
              return json(res, 200, data || [])
            }

            if (path === '/api/admin/blog' && req.method === 'POST') {
              const payload = await readBody(req) as Partial<{ title: string; excerpt: string; content: string; cover_url: string; category: string; author: string; is_published: boolean }>
              const title = String(payload.title || '').trim()
              const excerpt = String(payload.excerpt || '').trim()
              const content = String(payload.content || '').trim()
              if (!title || title.length > 200) return json(res, 400, { ok: false, error: 'O título é obrigatório (máx. 200 caracteres).' })
              if (!excerpt || excerpt.length > 300) return json(res, 400, { ok: false, error: 'O resumo é obrigatório (máx. 300 caracteres).' })
              if (!content || content.length > 40000) return json(res, 400, { ok: false, error: 'O conteúdo é obrigatório (máx. 40.000 caracteres).' })
              // slug único gerado do título
              const base = title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 80) || 'artigo'
              let slug = base
              for (let n = 2; n <= 50; n++) {
                const { data: dupe } = await supabase.from('blog_posts').select('id').eq('slug', slug).maybeSingle()
                if (!dupe) break
                slug = `${base}-${n}`
              }
              const isPub = payload.is_published !== false
              const { data, error } = await supabase
                .from('blog_posts')
                .insert({
                  slug,
                  title: title.slice(0, 200),
                  excerpt: excerpt.slice(0, 300),
                  content: content.slice(0, 40000),
                  cover_url: String(payload.cover_url || '').trim().slice(0, 500) || null,
                  category: String(payload.category || '').trim().slice(0, 60) || null,
                  author: String(payload.author || '').trim().slice(0, 80) || 'Equipa CFTEC',
                  is_published: isPub,
                  published_at: isPub ? new Date().toISOString() : null,
                  updated_at: new Date().toISOString(),
                })
                .select('id, created_at, updated_at, slug, title, excerpt, cover_url, category, author, is_published, published_at')
                .single()
              if (error) return json(res, 500, { ok: false, error: error.message })
              logAuditoria(currentAdmin(req), 'artigo_blog_criado', 'blog', data.id, { titulo: title.slice(0, 90), publicado: isPub })
              return json(res, 201, { ok: true, post: data })
            }

            if (path.match(/^\/api\/admin\/blog\/([a-f0-9-]+)$/) && req.method === 'PATCH') {
              const id = path.split('/').pop()
              const payload = await readBody(req) as Partial<{ title: string; excerpt: string; content: string; cover_url: string; category: string; author: string; is_published: boolean }>
              const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
              if (payload.title !== undefined) { const v = String(payload.title).trim(); if (!v || v.length > 200) return json(res, 400, { ok: false, error: 'Título inválido.' }); updates.title = v }
              if (payload.excerpt !== undefined) { const v = String(payload.excerpt).trim(); if (!v || v.length > 300) return json(res, 400, { ok: false, error: 'Resumo inválido.' }); updates.excerpt = v }
              if (payload.content !== undefined) { const v = String(payload.content).trim(); if (!v || v.length > 40000) return json(res, 400, { ok: false, error: 'Conteúdo inválido.' }); updates.content = v }
              if (payload.cover_url !== undefined) updates.cover_url = String(payload.cover_url).trim().slice(0, 500) || null
              if (payload.category !== undefined) updates.category = String(payload.category).trim().slice(0, 60) || null
              if (payload.author !== undefined) updates.author = String(payload.author).trim().slice(0, 80) || 'Equipa CFTEC'
              if (payload.is_published !== undefined) {
                updates.is_published = !!payload.is_published
                if (updates.is_published) {
                  // publicar pela primeira vez → inicia published_at; re-publicar não muda a data
                  const { data: cur } = await supabase.from('blog_posts').select('published_at').eq('id', id).limit(1)
                  if (!cur || !cur.length || !cur[0]?.published_at) updates.published_at = new Date().toISOString()
                } else {
                  updates.published_at = null
                }
              }
              if (!Object.keys(updates).length) return json(res, 400, { ok: false, error: 'Nenhum campo para actualizar.' })
              const { data, error } = await supabase
                .from('blog_posts')
                .update(updates)
                .eq('id', id)
                .select('id, created_at, updated_at, slug, title, excerpt, cover_url, category, author, is_published, published_at')
                .single()
              if (error) return json(res, 500, { ok: false, error: error.message })
              logAuditoria(currentAdmin(req), 'artigo_blog_actualizado', 'blog', id, { campos: Object.keys(updates).filter((k) => k !== 'updated_at') })
              return json(res, 200, { ok: true, post: data })
            }

            if (path.match(/^\/api\/admin\/blog\/([a-f0-9-]+)$/) && req.method === 'DELETE') {
              const id = path.split('/').pop()
              const { error } = await supabase.from('blog_posts').delete().eq('id', id)
              if (error) return json(res, 500, { ok: false, error: error.message })
              logAuditoria(currentAdmin(req), 'artigo_blog_apagado', 'blog', id)
              return json(res, 200, { ok: true })
            }
            
            if (path === '/api/admin/media' && req.method === 'POST') {
              const contentType = req.headers['content-type'] || ''
              if (!contentType.includes('multipart/form-data')) {
                return json(res, 400, { ok: false, error: 'Content-Type deve ser multipart/form-data' })
              }
              
              const chunks: Buffer[] = []
              for await (const chunk of req) chunks.push(Buffer.from(chunk))
              const parsed = parseMultipart(Buffer.concat(chunks), contentType)
              const fileData = parsed.file
                ? { buffer: parsed.file.data, filename: parsed.file.filename || 'upload', mimetype: parsed.file.mimetype || 'application/octet-stream' }
                : null
              const altText = (parsed.fields['alt_text'] || '').trim()
              
              if (!fileData) return json(res, 400, { ok: false, error: 'Ficheiro não enviado' })
              
              const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
              if (!allowedTypes.includes(fileData.mimetype)) {
                return json(res, 400, { ok: false, error: 'Tipo de ficheiro não permitido. Use JPEG, PNG, WebP ou GIF.' })
              }
              
              if (fileData.buffer.length > 10 * 1024 * 1024) {
                return json(res, 400, { ok: false, error: 'Ficheiro excede 10MB' })
              }
              
              // Check if supabase is configured
              if (!supabase) {
                console.error('[UPLOAD] Supabase not configured')
                return json(res, 503, { ok: false, error: 'Base de dados não configurada. Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE.' })
              }
              
              // Upload to Supabase Storage
              const ext = fileData.filename.split('.').pop()
              const safeName = fileData.filename.replace(/[^a-zA-Z0-9-_]/g, '_').slice(0, 50)
              const uniqueName = `${safeName}-${Date.now()}.${ext}`
              const storagePath = `uploads/${uniqueName}`
              
              const { error: uploadError } = await supabase.storage
                .from('media')
                .upload(storagePath, fileData.buffer, {
                  contentType: fileData.mimetype,
                  upsert: false,
                })
              
              if (uploadError) {
                console.error('[UPLOAD] Storage error:', uploadError)
                return json(res, 500, { ok: false, error: `Erro no storage: ${uploadError.message}. Verifique se o bucket 'media' existe e as políticas RLS estão corretas.` })
              }
              
              const { data: publicUrlData } = supabase.storage.from('media').getPublicUrl(storagePath)
              const publicPath = publicUrlData.publicUrl
              
              const { data, error } = await supabase
                .from('media')
                .insert({
                  filename: fileData.filename,
                  file_path: publicPath,
                  file_size: fileData.buffer.length,
                  mime_type: fileData.mimetype,
                  alt_text: altText || null,
                })
                .select('id, filename, file_path, file_size, mime_type, alt_text, uploaded_at')
                .single()
              
              if (error) {
                console.error('[UPLOAD] Database error:', error)
                // Try to delete the uploaded file from storage to avoid orphaned files
                await supabase.storage.from('media').remove([`uploads/${uniqueName}`])
                return json(res, 500, { ok: false, error: `Erro na base de dados: ${error.message}. Verifique se a tabela 'media' existe.` })
              }
              
              logAuditoria(currentAdmin(req), 'midia_enviada', 'mídia', data.id, { ficheiro: fileData.filename })
              return json(res, 201, { ok: true, media: data })
            }
            
            if (path.match(/^\/api\/admin\/media\/([a-f0-9-]+)$/) && req.method === 'DELETE') {
              const id = path.split('/').pop()
              
              // Get media info first to delete from storage
              const { data: mediaItem } = await supabase.from('media').select('file_path').eq('id', id).single()
              
              if (mediaItem) {
                // Extract storage path from public URL
                const url = new URL(mediaItem.file_path)
                const storagePath = url.pathname.replace(/^\/storage\/v1\/object\/public\/media\//, '')
                await supabase.storage.from('media').remove([storagePath])
              }
              
              const { error } = await supabase.from('media').delete().eq('id', id)
              if (error) return json(res, 500, { ok: false, error: error.message })
              logAuditoria(currentAdmin(req), 'midia_apagada', 'mídia', id)
              return json(res, 200, { ok: true })
            }
            
            if (path.match(/^\/api\/admin\/media\/([a-f0-9-]+)$/) && req.method === 'PATCH') {
              const id = path.split('/').pop()
              const payload = await readBody(req) as { alt_text?: string }
              if (payload.alt_text !== undefined) {
                const { error } = await supabase.from('media').update({ alt_text: payload.alt_text.trim() || null }).eq('id', id)
                if (error) return json(res, 500, { ok: false, error: error.message })
                logAuditoria(currentAdmin(req), 'midia_actualizada', 'mídia', id, { campos: ['alt_text'] })
              }
              return json(res, 200, { ok: true })
            }
            
            // SOFTWARE CRUD
            if (path === '/api/admin/software' && req.method === 'GET') {
              let { data } = await supabase
                .from('softwares')
                .select('id, name, version, description, price, category, changelog, file_url, file_size, downloads_count, is_active, created_at')
                .order('downloads_count', { ascending: false })
                .limit(20)
              if (data === null) {
                // coluna `category` ainda não aplicada na BD — fallback sem ela
                const retry = await supabase
                  .from('softwares')
                  .select('id, name, version, description, price, changelog, file_url, file_size, downloads_count, is_active, created_at')
                  .order('downloads_count', { ascending: false })
                  .limit(20)
                data = (retry.data || []).map((row) => ({ ...row, category: null }))
              }
              return json(res, 200, data || [])
            }
            
            // URL DE UPLOAD ASSINADO — o browser envia o ficheiro DIRECTO ao bucket
            // (bypassa o dev-server: sem timeout de 300s nem recodificação de bytes)
            // GUARD CATÁLOGO — uploads e edições de softwares são competência do Técnico (não do Gestor Comercial)
            {
              const nivelCat = currentAdmin(req)?.level
              if (path.startsWith('/api/admin/software') && req.method !== 'GET' && nivelCat === 'gestor')
                return json(res, 403, { ok: false, error: 'O catálogo e uploads de instaladores são geridos pelo Técnico de Suporte.' })
            }

            if (path === '/api/admin/software/upload-url' && req.method === 'POST') {
              const admin = currentAdmin(req)
              if (!admin) return json(res, 401, { ok: false, error: 'Sessão de administrador inválida ou expirada.' })
              if (!supabase) return json(res, 503, { ok: false, error: 'Base de dados não disponível.' })
              const { filename } = await readBody(req) as { filename?: string }
              const safe = String(filename || 'instalador.zip').replace(/[^a-zA-Z0-9-_.() ]/g, '_').slice(-80)
              const objectPath = `software/upload-${Date.now()}-${safe.replace(/\s+/g, '-')}`
              const { data: signed, error } = await supabase.storage.from('software').createSignedUploadUrl(objectPath)
              if (error || !signed) return json(res, 500, { ok: false, error: error?.message || 'Falha ao gerar o URL de upload.' })
              const { data: pub } = supabase.storage.from('software').getPublicUrl(objectPath)
              return json(res, 200, { ok: true, signedUrl: signed.signedUrl, path: objectPath, publicUrl: pub.publicUrl })
            }

            if (path === '/api/admin/software' && req.method === 'POST') {
              const contentType = req.headers['content-type'] || ''

              // Modo B — metadados em JSON (o ficheiro já está no bucket via URL assinado)
              if (contentType.includes('application/json')) {
                const payload = await readBody(req) as Partial<{ name: string; version: string; price: string; description: string; category: string; changelog: string; storage_path: string; file_size: string }>
                const name = String(payload.name || '').trim()
                const version = String(payload.version || '').trim()
                const price = String(payload.price || '').replace(',', '.')
                const description = String(payload.description || '').trim()
                const storagePath = String(payload.storage_path || '')
                if (!name || !version || !price || !description)
                  return json(res, 400, { ok: false, error: 'Todos os campos são obrigatórios.' })
                if (!storagePath.startsWith('software/'))
                  return json(res, 400, { ok: false, error: 'Caminho de storage inválido.' })
                const filedSize = String(payload.file_size || '').match(/^\d+(\.\d{1,2})? MB$/)
                  ? String(payload.file_size)
                  : `${Number(payload.file_size || 0) > 0 ? Number(payload.file_size).toFixed(2) + ' MB' : '0 MB'}`
                const { data: pub } = supabase.storage.from('software').getPublicUrl(storagePath)
                const { data, error } = await supabase
                  .from('softwares')
                  .insert({
                    name,
                    version,
                    description,
                    price: parseFloat(price),
                    category: String(payload.category || '').trim() || null,
                    changelog: String(payload.changelog || '').trim() || null,
                    file_url: pub.publicUrl,
                    file_size: filedSize,
                    downloads_count: 0,
                    is_active: true,
                  })
                  .select('id, name, version, file_size, downloads_count, created_at')
                  .single()
                if (error) return json(res, 500, { ok: false, error: error.message })
                logAuditoria(currentAdmin(req), 'software_criado', 'software', data.id, { name, modo: 'assinado' })
                return json(res, 201, { ok: true, software: data })
              }

              // Modo A — multipart legado (ficheiro no corpo, para ferramentas/testes)
              if (!contentType.includes('multipart/form-data')) {
                return json(res, 400, { ok: false, error: 'Content-Type deve ser multipart/form-data ou application/json' })
              }
              
              const chunks: Buffer[] = []
              for await (const chunk of req) chunks.push(Buffer.from(chunk))
              const parsed = parseMultipart(Buffer.concat(chunks), contentType)
              const fields: Record<string, string> = parsed.fields
              const fileData = parsed.file
                ? { buffer: parsed.file.data, filename: parsed.file.filename || 'upload', mimetype: parsed.file.mimetype || 'application/octet-stream' }
                : null
              
              if (!fields.name || !fields.version || !fields.price || !fields.description) {
                return json(res, 400, { ok: false, error: 'Todos os campos são obrigatórios.' })
              }
              if (!fileData) return json(res, 400, { ok: false, error: 'Ficheiro do instalador é obrigatório' })
              if (fileData.buffer.length > 50 * 1024 * 1024)
                return json(res, 413, { ok: false, error: 'O ficheiro excede o limite de 50 MB por ficheiro do Supabase (plano Free).' })
              
              // Upload software file to storage
              const ext = fileData.filename.split('.').pop()
              const uniqueName = `software/${fields.name.replace(/[^a-zA-Z0-9-_]/g, '_')}-${Date.now()}.${ext}`
              
              const { error: uploadError } = await supabase.storage
                .from('software')
                .upload(uniqueName, fileData.buffer, {
                  contentType: fileData.mimetype,
                  upsert: false,
                })
              
              if (uploadError) return json(res, 500, { ok: false, error: uploadError.message })
              
              const { data: publicUrlData } = supabase.storage.from('software').getPublicUrl(uniqueName)
              const fileUrl = publicUrlData.publicUrl
              
              const { data, error } = await supabase
                .from('softwares')
                .insert({
                  name: fields.name,
                  version: fields.version,
                  description: fields.description,
                  price: parseFloat(fields.price),
                  category: fields.category?.trim() || null,
                  changelog: fields.changelog?.trim() || null,
                  file_url: fileUrl,
                  file_size: `${(fileData.buffer.length / 1024 / 1024).toFixed(2)} MB`,
                  downloads_count: 0,
                  is_active: true,
                })
                .select('id, name, version, file_size, downloads_count, created_at')
                .single()
              
              if (error) return json(res, 500, { ok: false, error: error.message })
              logAuditoria(currentAdmin(req), 'software_criado', 'software', data.id, { name: fields.name, modo: 'multipart' })
              return json(res, 201, { ok: true, software: data })
            }

            if (path.match(/^\/api\/admin\/software\/([a-f0-9-]+)$/) && req.method === 'PATCH') {
              const id = path.split('/').pop()
              const payload = await readBody(req) as Partial<{ name: string; version: string; description: string; price: number; is_active: boolean; changelog: string; category: string }>

              const updates: Record<string, unknown> = {}
              if (payload.name !== undefined) {
                const n = payload.name.trim()
                if (!n || n.length > 150) return json(res, 400, { ok: false, error: 'Nome inválido.' })
                updates.name = n
              }
              if (payload.version !== undefined) {
                const v = payload.version.trim()
                if (!v || v.length > 30) return json(res, 400, { ok: false, error: 'Versão inválida.' })
                updates.version = v
              }
              if (payload.description !== undefined) updates.description = payload.description.trim() || null
              if (payload.changelog !== undefined) updates.changelog = payload.changelog.trim() || null
              if (payload.category !== undefined) {
                const c = payload.category.trim()
                if (c.length > 40) return json(res, 400, { ok: false, error: 'Categoria demasiado longa (máx. 40).' })
                updates.category = c || null
              }
              if (payload.price !== undefined) {
                const p = Number(payload.price)
                if (Number.isNaN(p) || p < 0) return json(res, 400, { ok: false, error: 'Preço inválido.' })
                updates.price = p
              }
              if (payload.is_active !== undefined) updates.is_active = Boolean(payload.is_active)

              if (!Object.keys(updates).length) return json(res, 400, { ok: false, error: 'Nenhum campo para actualizar.' })

              let { data, error } = await supabase
                .from('softwares')
                .update(updates)
                .eq('id', id)
                .select('id, name, version, description, price, category, changelog, file_url, file_size, downloads_count, is_active, created_at')
                .single()
              if (error && updates.category !== undefined && String(error.message).includes('category')) {
                // coluna `category` ainda não aplicada na BD — repetir sem ela
                const withoutCategory: Record<string, unknown> = { ...updates }
                delete withoutCategory.category
                const retry = await supabase
                  .from('softwares')
                  .update(withoutCategory)
                  .eq('id', id)
                  .select('id, name, version, description, price, changelog, file_url, file_size, downloads_count, is_active, created_at')
                  .single()
                data = retry.data ? { ...retry.data, category: null } : null
                error = retry.error
              }
              if (error) return json(res, 500, { ok: false, error: error.message })
              logAuditoria(currentAdmin(req), 'software_actualizado', 'software', id, { campos: Object.keys(updates) })
              return json(res, 200, { ok: true, software: data })
            }

            if (path.match(/^\/api\/admin\/software\/([a-f0-9-]+)\/toggle$/) && req.method === 'POST') {
              const id = path.split('/')[4]
              const { data: current } = await supabase.from('softwares').select('is_active').eq('id', id).single()
              if (!current) return json(res, 404, { ok: false, error: 'Software não encontrado.' })

              const { error } = await supabase.from('softwares').update({ is_active: !current.is_active }).eq('id', id)
              if (error) return json(res, 500, { ok: false, error: error.message })
              logAuditoria(currentAdmin(req), 'software_alternado', 'software', id, { is_active: !current.is_active })
              return json(res, 200, { ok: true, is_active: !current.is_active })
            }

            if (path.match(/^\/api\/admin\/software\/([a-f0-9-]+)$/) && req.method === 'DELETE') {
              const id = path.split('/').pop()
              const { data: item } = await supabase.from('softwares').select('file_url').eq('id', id).single()

              if (item?.file_url) {
                try {
                  const url = new URL(item.file_url)
                  const storagePath = decodeURIComponent(url.pathname.replace(/^\/storage\/v1\/object\/public\/software\//, ''))
                  if (storagePath) await supabase.storage.from('software').remove([storagePath])
                } catch {
                  // URL inválido ou ficheiro local — seguir para a remoção da linha
                }
              }

              const { error } = await supabase.from('softwares').delete().eq('id', id)
              if (error) return json(res, 500, { ok: false, error: error.message })
              logAuditoria(currentAdmin(req), 'software_apagado', 'software', id)
              return json(res, 200, { ok: true })
            }
            
            // AUDITORIA — histórico de acções (super_admin + developer apenas)
            if (path === '/api/admin/auditoria' && req.method === 'GET') {
              const nivelAud = currentAdmin(req)?.level
              if (!nivelPleno(nivelAud)) return json(res, 403, { ok: false, error: 'O registo de actividades é visível apenas ao Super Admin e ao Developer.' })
              const { data, error } = await supabase
                .from('audit_log')
                .select('id, created_at, actor_email, actor_level, acao, entidade, entidade_id, detalhe')
                .order('created_at', { ascending: false })
                .limit(300)
              if (error) return json(res, 500, { ok: false, error: error.message })
              return json(res, 200, data || [])
            }

            // CÓPIAS DE SEGURANÇA — exportação completa exclusiva do Developer (Master Admin).
            // O ficheiro NUNCA é gravado no servidor: sai por download directo e cada exportação fica no audit log.
            if (path === '/api/admin/backup' && req.method === 'GET') {
              const vez = currentAdmin(req)
              if (!vez) return json(res, 401, { ok: false })
              if (vez.level !== 'developer')
                return json(res, 403, { ok: false, error: 'As cópias de segurança são exclusivas do Developer (Master Admin).' })
              const tabelasBackup = ['pedidos_licencas', 'licencas_palancasoft', 'chamados_suporte', 'wiki_tecnica', 'admin_users', 'settings', 'parceiros_candidaturas', 'contacts', 'blog_posts', 'novidades_destaques', 'media', 'softwares', 'services', 'audit_log']
              const dados: Record<string, unknown[]> = {}
              for (const tabela of tabelasBackup) {
                const { data, error } = tabela === 'audit_log'
                  ? await supabase.from(tabela).select('*').order('created_at', { ascending: false }).limit(20000)
                  : await supabase.from(tabela).select('*').limit(20000)
                if (error) return json(res, 500, { ok: false, error: `${tabela}: ${error.message}` })
                dados[tabela] = data || []
              }
              // nunca exportar credenciais — admin_users sai sem password_hash
              dados.admin_users = (dados.admin_users as Record<string, unknown>[]).map(({ password_hash, ...resto }) => resto)
              const licenca = await licencaAtual()
              const payload = {
                _backup: {
                  app: 'CFTEC',
                  gerado_em: new Date().toISOString(),
                  por: vez.email,
                  licenca: { activa: licenca.licencaAtiva, comercial: licenca.moduloComercial, tecnico: licenca.moduloTecnico, novidades: licenca.moduloNovidades, expiraEm: licenca.expiraEm },
                  restauro: 'Cada chave de topo é uma tabela do Supabase, pronta para bulk insert.',
                },
                ...dados,
              }
              logAuditoria(vez, 'backup_exportado', 'plataforma', null, Object.fromEntries(tabelasBackup.map((t) => [t, (dados[t] as unknown[]).length])))
              return json(res, 200, payload)
            }

            return next()
          }
        } catch (error) {
          console.error('CFTEC API failed:', error)
          return json(res, 500, { ok: false, error: 'Não foi possível processar o pedido.' })
        }
      });
    },
  }
}

export default defineConfig({
  plugins: [react(), adminApi()],
  server: { port: 3000, host: '0.0.0.0', hmr: { protocol: 'wss', clientPort: 443 } },
})