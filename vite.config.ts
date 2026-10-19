import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import type { IncomingMessage, ServerResponse } from 'node:http'
import dotenv from 'dotenv'

// Prevent process crashes from unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
})
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error)
})

// Load environment variables for server middleware
dotenv.config()

type ContactPayload = { name?: string; email?: string; phone?: string; interest?: string; message?: string }
type AdminLevel = 'super_admin' | 'gestor' | 'tecnico'
type AdminClaims = { sub: string; email: string; name: string; role: 'admin'; level?: AdminLevel }

// Supabase client (using service role for admin operations)
const supabaseUrl = process.env.SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE || ''
const supabase = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null

const JWT_SECRET = process.env.CFTEC_JWT_SECRET || process.env.MANUS_JWT_SECRET || 'dev-secret-key-min-32-chars-long-for-testing-do-not-use-in-production'

const authCookieName = 'cftec_admin_session'
const sessionMaxAge = 60 * 60 * 8

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

function cookies(req: IncomingMessage): Record<string, string> {
  const cookieHeader = req.headers.cookie || ''
  const parsed = Object.fromEntries(cookieHeader.split(';').filter(Boolean).map((part) => {
    const [key, ...value] = part.trim().split('=')
    return [key, decodeURIComponent(value.join('='))]
  }))
  return parsed
}

function currentAdmin(req: IncomingMessage): AdminClaims | null {
  const token = cookies(req)[authCookieName]
  const secret = JWT_SECRET
  if (!token || !secret) return null
  try {
    const claims = jwt.verify(token, secret, { algorithms: ['HS256'] }) as AdminClaims
    return claims.role === 'admin' ? claims : null
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
                  level: (['super_admin', 'gestor', 'tecnico'].includes(row.role) ? row.role : 'gestor') as AdminLevel,
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

            if (!admin || !(await bcrypt.compare(password, admin.password_hash)))
              return json(res, 401, { ok: false, error: 'E-mail ou password incorrectos.' })

            const token = jwt.sign(
              { sub: admin.id, email: admin.email, name: admin.name, role: 'admin', level: admin.level } satisfies AdminClaims,
              JWT_SECRET,
              { algorithm: 'HS256', expiresIn: sessionMaxAge }
            )
            setSessionCookie(res, token)
            return json(res, 200, { ok: true, user: { name: admin.name, email: admin.email, level: admin.level } })
          }

          if (path === '/api/admin/session' && req.method === 'GET') {
            const admin = currentAdmin(req)
            return admin ? json(res, 200, { ok: true, user: { name: admin.name, email: admin.email, level: admin.level || 'super_admin' } }) : json(res, 401, { ok: false })
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
            if (row && row.role && ['super_admin', 'gestor', 'tecnico'].includes(String(row.role))) level = row.role as AdminLevel
            if (!row) {
              const legacy = await supabase.from('admins').update({ name }).eq('id', admin.sub).select('id, name, email').single()
              if (legacy.error) return json(res, 500, { ok: false, error: legacy.error.message })
              row = legacy.data as { id: string; name: string; email: string; role?: string }
            } else if (updated.error) {
              return json(res, 500, { ok: false, error: updated.error.message })
            }
            // Re-emitir o token para o header levar o nome actualizado
            const token = jwt.sign(
              { sub: row.id, email: row.email, name: row.name, role: 'admin', level } satisfies AdminClaims,
              JWT_SECRET,
              { algorithm: 'HS256', expiresIn: sessionMaxAge },
            )
            setSessionCookie(res, token)
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
            return json(res, 200, { ok: true })
          }
          
          if (path === '/api/admin/logout' && req.method === 'POST') {
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
            return json(res, 201, { ok: true, message: 'Candidatura recebida. A equipa CFTEC entrará em contacto.' })
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
              const [{ count: activeServices }, { count: activeSoftware }, { count: unreadCount }, { count: inactiveSoftware }, { count: pendingPartners }, { count: expiringLicenses }] = await Promise.all([
                supabase.from('services').select('*', { count: 'exact', head: true }).eq('is_active', true),
                supabase.from('softwares').select('*', { count: 'exact', head: true }).eq('is_active', true),
                supabase.from('contacts').select('*', { count: 'exact', head: true }).in('status', ['unread', 'new']),
                supabase.from('softwares').select('*', { count: 'exact', head: true }).eq('is_active', false),
                supabase.from('parceiros_candidaturas').select('*', { count: 'exact', head: true }).eq('status', 'pendente'),
                supabase.from('licencas_palancasoft').select('*', { count: 'exact', head: true }).eq('status', 'activa').lte('data_expiracao', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)),
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
              
              const [{ count: servicesCount }, { count: contactsCount }, { count: mediaCount }, { count: softwareCount }] = await Promise.all([
                supabase.from('services').select('*', { count: 'exact', head: true }),
                supabase.from('contacts').select('*', { count: 'exact', head: true }),
                supabase.from('media').select('*', { count: 'exact', head: true }),
                supabase.from('softwares').select('*', { count: 'exact', head: true }),
              ])
              
              return json(res, 200, {
                ok: true,
                summary: {
                  services: servicesCount || 0,
                  contacts: contactsCount || 0,
                  media: mediaCount || 0,
                  software: softwareCount || 0,
                }
              })
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
              return json(res, 200, { ok: true, contact: data })
            }

            if (path.match(/^\/api\/admin\/contacts\/([a-f0-9-]+)$/) && req.method === 'DELETE') {
              const id = path.split('/').pop()
              const { error } = await supabase.from('contacts').delete().eq('id', id)
              if (error) return json(res, 500, { ok: false, error: error.message })
              return json(res, 200, { ok: true })
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
              return json(res, 200, { ok: true, partner: data })
            }

            if (path.match(/^\/api\/admin\/partners\/([a-f0-9-]+)$/) && req.method === 'DELETE') {
              const id = path.split('/').pop()
              const { error } = await supabase.from('parceiros_candidaturas').delete().eq('id', id)
              if (error) return json(res, 500, { ok: false, error: error.message })
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
              return json(res, 200, { ok: true, license: data })
            }

            if (path.match(/^\/api\/admin\/licenses\/([a-f0-9-]+)$/) && req.method === 'DELETE') {
              const id = path.split('/').pop()
              const { error } = await supabase.from('licencas_palancasoft').delete().eq('id', id)
              if (error) return json(res, 500, { ok: false, error: error.message })
              return json(res, 200, { ok: true })
            }

            // SETTINGS DO PORTAL (config geral) — alteração restrita ao Super Admin
            if (path === '/api/admin/settings' && req.method !== 'GET') {
              const level = currentAdmin(req)?.level
              if (level && level !== 'super_admin')
                return json(res, 403, { ok: false, error: 'Apenas o Super Admin altera a configuração do portal.' })
            }
            if (path === '/api/admin/settings' && req.method === 'GET') {
              const { data, error } = await supabase.from('settings').select('key, value, description').order('key')
              if (error) return json(res, 500, { ok: false, error: error.message })
              return json(res, 200, { ok: true, settings: data || [] })
            }

            if (path === '/api/admin/settings' && req.method === 'PATCH') {
              const payload = await readBody(req) as { entries?: { key: string; value: string }[] }
              const entries = (payload.entries || []).filter((e) => e && e.key && typeof e.value === 'string').slice(0, 20)
              if (!entries.length) return json(res, 400, { ok: false, error: 'Envie pelo menos uma chave/valor.' })
              for (const entry of entries) {
                const { error } = await supabase
                  .from('settings')
                  .upsert({ key: entry.key.trim().slice(0, 80), value: entry.value.slice(0, 2000) }, { onConflict: 'key' })
                if (error) return json(res, 500, { ok: false, error: error.message })
              }
              return json(res, 200, { ok: true })
            }

            // GUARDAS DE NÍVEL
            if (path === '/api/admin/users' || path.match(/^\/api\/admin\/users\/[a-f0-9-]+$/)) {
              const level = currentAdmin(req)?.level
              if (level && level !== 'super_admin')
                return json(res, 403, { ok: false, error: 'Apenas o Super Admin gere utilizadores.' })
            }
            if (path === '/api/admin/licenses' || path === '/api/admin/partners' || path.match(/^\/api\/admin\/(licenses|partners)\/[a-f0-9-]+$/)) {
              const level = currentAdmin(req)?.level
              if (level && level !== 'super_admin' && level !== 'gestor')
                return json(res, 403, { ok: false, error: 'Sem permissão para esta área (apenas Super Admin e Gestor Comercial).' })
            }

            // UTILIZADORES DO PAINEL — gestão restrita ao super_admin
            const ROLES = ['super_admin', 'gestor', 'tecnico']
            const isSuperAdmin = currentAdmin(req)?.level !== undefined
              ? currentAdmin(req)!.level === 'super_admin'
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
                return json(res, 400, { ok: false, error: 'Nível inválido. Use: super_admin, gestor ou tecnico.' })

              const { data: existing } = await supabase.from('admin_users').select('id').eq('email', email).maybeSingle()
              if (existing) return json(res, 409, { ok: false, error: 'Já existe um utilizador com este e-mail.' })

              const hash = await bcrypt.hash(password, 12)
              const { data, error } = await supabase
                .from('admin_users')
                .insert({ name, email, password_hash: hash, role })
                .select('id, name, email, role, is_active, created_at')
                .single()
              if (error) return json(res, 500, { ok: false, error: error.message })
              return json(res, 201, { ok: true, user: data })
            }

            if (path.match(/^\/api\/admin\/users\/([a-f0-9-]+)$/) && req.method === 'PATCH') {
              const id = path.split('/').pop()
              if (!isSuperAdmin) return json(res, 403, { ok: false, error: 'Apenas o Super Admin gere utilizadores.' })
              const payload = await readBody(req) as Partial<{ name: string; role: string; is_active: boolean; password: string }>
              const updates: Record<string, unknown> = {}
              if (payload.name !== undefined) {
                const n = String(payload.name).trim()
                if (!n || n.length > 120) return json(res, 400, { ok: false, error: 'Nome inválido.' })
                updates.name = n
              }
              if (payload.role !== undefined) {
                if (!ROLES.includes(String(payload.role)))
                  return json(res, 400, { ok: false, error: 'Nível inválido. Use: super_admin, gestor ou tecnico.' })
                if (id === currentAdmin(req)!.sub)
                  return json(res, 400, { ok: false, error: 'Não pode alterar o seu próprio nível.' })
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
              const { data, error } = await supabase
                .from('admin_users')
                .update(updates)
                .eq('id', id)
                .select('id, name, email, role, is_active, created_at')
                .single()
              if (error) return json(res, 500, { ok: false, error: error.message })
              return json(res, 200, { ok: true, user: data })
            }

            if (path.match(/^\/api\/admin\/users\/([a-f0-9-]+)$/) && req.method === 'DELETE') {
              const id = path.split('/').pop()
              if (!isSuperAdmin) return json(res, 403, { ok: false, error: 'Apenas o Super Admin gere utilizadores.' })
              if (id === currentAdmin(req)!.sub)
                return json(res, 400, { ok: false, error: 'Não pode eliminar a sua própria conta.' })
              const { error } = await supabase.from('admin_users').delete().eq('id', id)
              if (error) return json(res, 500, { ok: false, error: error.message })
              return json(res, 200, { ok: true })
            }

            // GUARDAS DE NÍVEL
            if (path === '/api/admin/settings' && req.method !== 'GET') {
              const level = currentAdmin(req)?.level
              if (level && level !== 'super_admin')
                return json(res, 403, { ok: false, error: 'Apenas o Super Admin altera a configuração do portal.' })
            }
            if (path === '/api/admin/users' || path.match(/^\/api\/admin\/users\/[a-f0-9-]+$/)) {
              // trata nos blocos acima via isSuperAdmin
            }
            if (path === '/api/admin/licenses' || path === '/api/admin/partners' || path.match(/^\/api\/admin\/(licenses|partners)\/[a-f0-9-]+$/)) {
              const level = currentAdmin(req)?.level
              if (level && level !== 'super_admin' && level !== 'gestor')
                return json(res, 403, { ok: false, error: 'Sem permissão para esta área (apenas Super Admin e Gestor Comercial).' })
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
              return json(res, 200, { ok: true })
            }
            
            const deleteMatch = path.match(/^\/api\/admin\/services\/([a-f0-9-]+)$/)
            if (deleteMatch && req.method === 'DELETE') {
              const id = path.split('/').pop()
              try {
                const { error } = await supabase.from('services').delete().eq('id', id)
                if (error) return json(res, 500, { ok: false, error: error.message })
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
            
            if (path === '/api/admin/media' && req.method === 'POST') {
              const contentType = req.headers['content-type'] || ''
              if (!contentType.includes('multipart/form-data')) {
                return json(res, 400, { ok: false, error: 'Content-Type deve ser multipart/form-data' })
              }
              
              const chunks: Buffer[] = []
              for await (const chunk of req) chunks.push(Buffer.from(chunk))
              const body = Buffer.concat(chunks).toString('utf8')
              
              const boundaryMatch = contentType.match(/boundary=([^;]+)/)
              if (!boundaryMatch) return json(res, 400, { ok: false, error: 'Boundary não encontrado' })
              const boundary = '--' + boundaryMatch[1]
              
              const parts = body.split(boundary).slice(1, -1)
              let fileData: { buffer: Buffer; filename: string; mimetype: string } | null = null
              let altText = ''
              
              for (const part of parts) {
                const headerEnd = part.indexOf('\r\n\r\n')
                if (headerEnd === -1) continue
                const headers = part.slice(0, headerEnd)
                const content = part.slice(headerEnd + 4, -2)
                
                if (headers.includes('name="file"')) {
                  const filenameMatch = headers.match(/filename="([^"]+)"/)
                  const mimetypeMatch = headers.match(/Content-Type: ([^\r\n]+)/)
                  fileData = {
                    buffer: Buffer.from(content, 'binary'),
                    filename: filenameMatch ? filenameMatch[1] : 'upload',
                    mimetype: mimetypeMatch ? mimetypeMatch[1].trim() : 'application/octet-stream',
                  }
                } else if (headers.includes('name="alt_text"')) {
                  altText = content.trim()
                }
              }
              
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
              return json(res, 200, { ok: true })
            }
            
            if (path.match(/^\/api\/admin\/media\/([a-f0-9-]+)$/) && req.method === 'PATCH') {
              const id = path.split('/').pop()
              const payload = await readBody(req) as { alt_text?: string }
              if (payload.alt_text !== undefined) {
                const { error } = await supabase.from('media').update({ alt_text: payload.alt_text.trim() || null }).eq('id', id)
                if (error) return json(res, 500, { ok: false, error: error.message })
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
            
            if (path === '/api/admin/software' && req.method === 'POST') {
              const contentType = req.headers['content-type'] || ''
              if (!contentType.includes('multipart/form-data')) {
                return json(res, 400, { ok: false, error: 'Content-Type deve ser multipart/form-data' })
              }
              
              const chunks: Buffer[] = []
              for await (const chunk of req) chunks.push(Buffer.from(chunk))
              const body = Buffer.concat(chunks).toString('utf8')
              
              const boundaryMatch = contentType.match(/boundary=([^;]+)/)
              if (!boundaryMatch) return json(res, 400, { ok: false, error: 'Boundary não encontrado' })
              const boundary = '--' + boundaryMatch[1]
              
              const parts = body.split(boundary).slice(1, -1)
              const fields: Record<string, string> = {}
              let fileData: { buffer: Buffer; filename: string; mimetype: string } | null = null
              
              for (const part of parts) {
                const headerEnd = part.indexOf('\r\n\r\n')
                if (headerEnd === -1) continue
                const headers = part.slice(0, headerEnd)
                const content = part.slice(headerEnd + 4, -2)
                
                const nameMatch = headers.match(/name="([^"]+)"/)
                if (headers.includes('name="file"')) {
                  const filenameMatch = headers.match(/filename="([^"]+)"/)
                  const mimetypeMatch = headers.match(/Content-Type: ([^\r\n]+)/)
                  fields.file = filenameMatch ? filenameMatch[1] : ''
                  fileData = {
                    buffer: Buffer.from(content, 'binary'),
                    filename: filenameMatch ? filenameMatch[1] : 'upload',
                    mimetype: mimetypeMatch ? mimetypeMatch[1].trim() : 'application/octet-stream',
                  }
                } else if (nameMatch) {
                  fields[nameMatch[1]] = content
                }
              }
              
              if (!fields.name || !fields.version || !fields.price || !fields.description) {
                return json(res, 400, { ok: false, error: 'Todos os campos são obrigatórios.' })
              }
              if (!fileData) return json(res, 400, { ok: false, error: 'Ficheiro do instalador é obrigatório' })
              
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
              return json(res, 200, { ok: true, software: data })
            }

            if (path.match(/^\/api\/admin\/software\/([a-f0-9-]+)\/toggle$/) && req.method === 'POST') {
              const id = path.split('/')[4]
              const { data: current } = await supabase.from('softwares').select('is_active').eq('id', id).single()
              if (!current) return json(res, 404, { ok: false, error: 'Software não encontrado.' })

              const { error } = await supabase.from('softwares').update({ is_active: !current.is_active }).eq('id', id)
              if (error) return json(res, 500, { ok: false, error: error.message })
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
              return json(res, 200, { ok: true })
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