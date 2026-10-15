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
type AdminClaims = { sub: string; email: string; name: string; role: 'admin' }

// Supabase client (using service role for admin operations)
const supabaseUrl = process.env.SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE || ''
const supabase = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null

const jwtSecret = () => process.env.CFTEC_JWT_SECRET || process.env.MANUS_JWT_SECRET || 'dev-secret-key-min-32-chars-long-for-testing-do-not-use-in-production'

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
  return JSON.parse(Buffer.concat(chunks).toString('utf8')) as Record<string, unknown>
}

function json(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(body))
}

function cookies(req: IncomingMessage): Record<string, string> {
  const cookieHeader = req.headers.cookie || ''
  console.log('[COOKIES] Raw header:', cookieHeader)
  const parsed = Object.fromEntries(cookieHeader.split(';').filter(Boolean).map((part) => {
    const [key, ...value] = part.trim().split('=')
    return [key, decodeURIComponent(value.join('='))]
  }))
  console.log('[COOKIES] Parsed:', parsed)
  return parsed
}

function currentAdmin(req: IncomingMessage): AdminClaims | null {
  const token = cookies(req)[authCookieName]
  const secret = jwtSecret()
  console.log('[AUTH] Looking for cookie:', authCookieName)
  console.log('[AUTH] Cookie token:', token ? 'present' : 'missing')
  console.log('[AUTH] JWT secret:', secret ? 'present' : 'missing')
  if (!token || !secret) return null
  try {
    const claims = jwt.verify(token, secret, { algorithms: ['HS256'] }) as AdminClaims
    console.log('[AUTH] Claims verified:', claims)
    return claims.role === 'admin' ? claims : null
  } catch (e) {
    console.error('[AUTH] Verify error:', e)
    return null
  }
}

function setSessionCookie(res: ServerResponse, token: string) {
  const isProd = process.env.NODE_ENV === 'production'
  // Em dev: sem HttpOnly para debug, SameSite=Lax, sem Secure
  // Em prod: HttpOnly, Secure, SameSite=None
  const cookie = `${authCookieName}=${encodeURIComponent(token)}; Path=/; ${isProd ? 'HttpOnly; Secure; SameSite=None' : 'SameSite=Lax'}; Max-Age=${sessionMaxAge}`
  console.log('[COOKIE] Set:', cookie)
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
          console.log('[MIDDLEWARE] Path:', path, 'Cookie header:', req.headers.cookie || 'none')

          if (path === '/api/admin/login' && req.method === 'POST') {
            if (!jwtSecret()) return json(res, 503, { ok: false, error: 'JWT secret não configurado.' })
            const payload = await readBody(req)
            const email = String(payload.email || '').trim().toLowerCase()
            const password = String(payload.password || '')
            
            let admin: { id: string; name: string; email: string; password_hash: string } | undefined
            
            if (supabase) {
              // Query Supabase for admin
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
                  password_hash: data.password_hash 
                }
              }
            } else {
              // Fallback em memória para desenvolvimento
              const fallbackEmail = 'admin@cftec.co'
              const fallbackPassword = 'admin123456'
              if (email === fallbackEmail && password === fallbackPassword) {
                const passwordHash = await bcrypt.hash(fallbackPassword, 12)
                admin = { id: '1', name: 'Admin CFTEC', email: fallbackEmail, password_hash: passwordHash }
              }
            }
            
            if (!admin || !(await bcrypt.compare(password, admin.password_hash))) 
              return json(res, 401, { ok: false, error: 'E-mail ou password incorrectos.' })
            
            const token = jwt.sign(
              { sub: admin.id, email: admin.email, name: admin.name, role: 'admin' } satisfies AdminClaims, 
              jwtSecret(), 
              { algorithm: 'HS256', expiresIn: sessionMaxAge }
            )
            setSessionCookie(res, token)
            return json(res, 200, { ok: true, user: { name: admin.name, email: admin.email } })
          }
          
          if (path === '/api/admin/session' && req.method === 'GET') {
            console.log('[SESSION] Endpoint hit')
            const admin = currentAdmin(req)
            return admin ? json(res, 200, { ok: true, user: { name: admin.name, email: admin.email } }) : json(res, 401, { ok: false })
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
            const { data } = await supabase
              .from('softwares')
              .select('id, name, version, description, price, file_url, file_size, downloads_count, created_at')
              .eq('is_active', true)
              .order('downloads_count', { ascending: false })
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
          
          if (path.startsWith('/api/admin/')) {
            console.log('[ADMIN] Protected route:', path, 'Method:', req.method)
            if (!currentAdmin(req)) return json(res, 401, { ok: false, error: 'Sessão de administrador inválida ou expirada.' })
            console.log('[ADMIN] Auth passed for:', path)
            
            if (path === '/api/admin/health' && req.method === 'GET') {
              if (!supabase) return json(res, 503, { ok: false, error: 'Base de dados não disponível.' })
              
              const start = Date.now()
              const { error: dbError } = await supabase.from('services').select('id').limit(1)
              const dbLatency = Date.now() - start
              
              const storageStart = Date.now()
              const { error: storageError } = await supabase.storage.from('media').list('', { limit: 1 })
              const storageLatency = Date.now() - storageStart
              
              const dbHealthy = !dbError
              const storageHealthy = !storageError
              const apiHealthy = true
              const overallScore = (dbHealthy ? 1 : 0) + (storageHealthy ? 1 : 0) + (apiHealthy ? 1 : 0)
              const score = Math.round((overallScore / 3) * 100)
              
              return json(res, 200, { 
                score,
                status: score === 100 ? 'healthy' : score >= 66 ? 'degraded' : 'critical',
                checks: {
                  database: { status: dbHealthy ? 'healthy' : 'unhealthy', latency: dbLatency },
                  storage: { status: storageHealthy ? 'healthy' : 'unhealthy', latency: storageLatency },
                  api: { status: apiHealthy ? 'healthy' : 'unhealthy', latency: 0 },
                }
              })
            }
            
            if (path === '/api/admin/summary' && req.method === 'GET') {
            console.log('[SUMMARY] Endpoint hit')
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
                .select('id, name, email, service_interest, status, created_at')
                .order('created_at', { ascending: false })
                .limit(8)
              return json(res, 200, data || [])
            }
            
            if (path === '/api/admin/software' && req.method === 'GET') {
              const { data } = await supabase
                .from('softwares')
                .select('id, name, version, file_size, downloads_count, created_at')
                .eq('is_active', true)
                .order('downloads_count', { ascending: false })
                .limit(20)
              return json(res, 200, data || [])
            }
            
            // SERVICES CRUD
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
            
            if (path.match(/^\/api\/admin\/services\/(\d+)$/) && req.method === 'PATCH') {
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
            
            if (path.match(/^\/api\/admin\/services\/(\d+)$/) && req.method === 'DELETE') {
              const id = path.split('/').pop()
              const { error } = await supabase.from('services').delete().eq('id', id)
              if (error) return json(res, 500, { ok: false, error: error.message })
              return json(res, 200, { ok: true })
            }
            
            if (path.match(/^\/api\/admin\/services\/(\d+)\/toggle$/) && req.method === 'POST') {
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
              
              console.log('[UPLOAD] Starting upload:', fileData.filename, fileData.mimetype, fileData.buffer.length)
              
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
              
              console.log('[UPLOAD] Uploading to storage:', storagePath)
              
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
              
              console.log('[UPLOAD] Storage upload successful')
              
              const { data: publicUrlData } = supabase.storage.from('media').getPublicUrl(storagePath)
              const publicPath = publicUrlData.publicUrl
              
              console.log('[UPLOAD] Inserting into database...')
              
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
              
              console.log('[UPLOAD] Database insert successful:', data.id)
              
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
              const { data } = await supabase
                .from('softwares')
                .select('id, name, version, file_size, downloads_count, created_at')
                .eq('is_active', true)
                .order('downloads_count', { ascending: false })
                .limit(20)
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
            
            // CONTACTS
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