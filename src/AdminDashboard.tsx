import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { Button } from './components/ui/button'
import { Card } from './components/ui/card'
import { Avatar, AvatarFallback } from './components/ui/avatar'
import { Input } from './components/ui/input'
import { Label } from './components/ui/label'
import { Textarea } from './components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select'
import { Badge } from './components/ui/badge'
import { MediaTile } from './components/ui/MediaTile'
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Archive,
  ArrowDownToLine,
  BarChart3,
  Bell,
  Check,
  ChevronRight,
  CircleHelp,
  CloudUpload,
  Code2,
  Copy,
  Cpu,
  Database,
  DollarSign,
  FileImage,
  FilePlus2,
  FolderOpen,
  Globe2,
  Headphones,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Layers3,
  Menu,
  MoreHorizontal,
  Network,
  Package,
  PanelLeftClose,
  Pencil,
  Plus,
  Power,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Trash2,
  UploadCloud,
  Users,
  UsersRound,
  Wallet,
  X,
  Zap,
  Loader2,
  FileText,
  Hash,
  ShoppingCart,
  MessageCircle,
  LifeBuoy,
  Undo2,
  BookOpen,
  Banknote,
  ScrollText,
} from 'lucide-react'
import PushNotificationBanner from './components/PushNotificationBanner'
import SystemTour, { marcarTour, tourFeito } from './SystemTour'
import { Pricing } from './components/ui/pricing-9'

// Icon mapping for services
const serviceIcons: Record<string, React.ComponentType<{ size?: number }>> = {
  Code2: Code2 as any,
  Network: Network as any,
  BarChart3: BarChart3 as any,
  Headphones: Headphones as any,
  Cpu: Cpu as any,
  Database: Database as any,
  Globe2: Globe2 as any,
  Layers3: Layers3 as any,
  ShieldCheck: ShieldCheck as any,
  Zap: Zap as any,
  Sparkles: Sparkles as any,
  UsersRound: UsersRound as any,
}

type AdminSection = 'dashboard' | 'services' | 'media' | 'software' | 'licencas' | 'pedidos' | 'destaques' | 'blog' | 'parceiros' | 'contactos' | 'chamados' | 'wiki' | 'relatorios' | 'settings' | 'developer' | 'auditoria'
type Chamado = { id: string; created_at: string; updated_at: string; cliente: string; nif: string | null; software: string | null; problema: string; resolucao: string | null; estado: string; prioridade: string; telefone?: string | null; origem?: string | null }
const CHAMADO_ESTADOS = ['Pendente', 'Em Resolução', 'Resolvido'] as const
const CHAMADO_PRIOS = ['Baixa', 'Média', 'Crítica'] as const
const chamadoEstadoClass = (estado: string) => estado === 'Pendente' ? 'Pendente' : estado === 'Em Resolução' ? 'EmResol' : 'Resolvido'
type Destaque = { id: string; created_at: string; titulo: string; descricao: string; imagem_url: string; link_botao: string | null; texto_botao: string | null; ativo: boolean; ordem: number }
type BlogPost = { id: string; created_at: string; updated_at: string; slug: string; title: string; excerpt: string; cover_url: string | null; category: string | null; author: string | null; is_published: boolean; published_at: string | null }
const emptyBlogForm = { title: '', excerpt: '', content: '', category: '', author: 'Equipa CFTEC', isPublished: true }
const emptyDestaqueForm = { titulo: '', descricao: '', linkBotao: '', textoBotao: 'Saber Mais', ordem: '1', ativo: true }

type Summary = {
  softwares: number; media: number; services: number; contacts: number
  servicesActive?: number; softwaresActive?: number
  licenses?: number; licensesActivas?: number; licensesExpiring?: number
  orders?: number; ordersPending?: number; ordersApproved?: number; ordersVerificacao?: number
  partners?: number; partnersPending?: number
  contactsUnread?: number
  metaMensal?: number
}
type Contact = { id: string; name: string; email: string; phone: string | null; service_interest: string; message: string; status: string; created_at: string }
type Software = { id: string; name: string; version: string; description?: string | null; price?: number | null; category?: string | null; changelog?: string | null; file_url?: string; file_size: string; downloads_count: number; is_active?: boolean; created_at: string }
type Service = { id: string; title: string; slug: string; short_description: string; full_description: string | null; icon: string; is_active: boolean; created_at: string }
export type Media = { id: string; filename: string; file_path: string; file_size: number; mime_type: string; alt_text: string | null; uploaded_at: string }
type AdminUser = { name: string; email: string; level?: 'super_admin' | 'gestor' | 'tecnico' | 'developer' }
type AdminUserRow = { id: string; name: string; email: string; role: string; is_active: boolean; created_at: string }
type LicenseOrder = { id: string; created_at: string; software_nome: string; nome_empresa: string; nif: string; nome_responsavel: string; telefone_whatsapp: string; email: string | null; provincia: string; forma_pagamento: string; status: string; observacoes: string | null }
const ORDER_STATUSES = ['Pendente', 'Em Verificação', 'Aprovado', 'Rejeitado'] as const
type Partner = { id: string; nome_responsavel: string; empresa_nif: string | null; telefone_whatsapp: string; provincia: string | null; modalidade: string; status: string; nota: string | null; volume_vendas: number; clientes_angariados: number; created_at: string }
type License = { id: string; cliente_nome: string; nif: string | null; chave_licenca: string; data_ativacao: string | null; data_expiracao: string | null; status: string; parceiro_id?: string | null; created_at: string }
type AuditRow = { id: string; created_at: string; actor_email: string; actor_level: string | null; acao: string; entidade: string; entidade_id: string | null; detalhe: string | null }
const ACAO_LABEL: Record<string, string> = {
  login: 'Entrou no painel', login_falhado: 'Login falhado',
  perfil_actualizado: 'Actualizou o perfil', password_alterada: 'Alterou a password',
  contacto_recebido: 'Contacto recebido', contacto_estado: 'Mudou estado do contacto', contacto_apagado: 'Apagou contacto',
  candidatura_sub_parceiro: 'Candidatura de sub-parceiro recebida', parceiro_criado: 'Criou parceiro no painel',
  chamado_recebido: 'Chamado recebido', chamado_criado: 'Criou chamado', chamado_actualizado: 'Actualizou chamado', chamado_apagado: 'Apagou chamado',
  pedido_recebido: 'Pedido de licença recebido', pedido_estado: 'Mudou estado do pedido', pedido_apagado: 'Apagou pedido',
  licenca_emitida: 'Emitiu licença', licenca_actualizada: 'Actualizou licença', licenca_apagada: 'Apagou licença',
  licenca_atribuida: 'Atribuiu licença a parceiro',
  definicoes_gravadas: 'Gravou definições do portal', licenca_alterada: 'Alterou a licença da plataforma',
  backup_exportado: 'Exportou cópia de segurança',
  backup_automatico: 'Cópia de segurança automática (diária)',
  '2fa_setup': 'Iniciou configuração do 2FA',
  '2fa_activada': 'Activou o 2FA',
  '2fa_desactivada': 'Desactivou o 2FA',
  '2fa': '2FA',
  sessao_revogada: 'Revogou uma sessão',
  sessoes_revogadas: 'Revogou as outras sessões',
  login_bloqueado: 'Login bloqueado (demasiadas falhas)',
  login_2fa_falhado: 'Login: código 2FA errado',
  '2FA': '2FA',
  utilizador_criado: 'Criou utilizador', utilizador_actualizado: 'Actualizou utilizador', utilizador_apagado: 'Apagou utilizador',
  wiki_criada: 'Registou artigo na wiki', wiki_actualizada: 'Actualizou artigo da wiki', wiki_apagada: 'Apagou artigo da wiki',
  servico_criado: 'Criou serviço', servico_actualizado: 'Actualizou serviço', servico_alternado: 'Activou/desactivou serviço', servico_apagado: 'Apagou serviço',
  destaque_criado: 'Criou destaque', destaque_actualizado: 'Actualizou destaque', destaque_apagado: 'Apagou destaque',
  artigo_blog_criado: 'Criou artigo do blog', artigo_blog_actualizado: 'Actualizou artigo do blog', artigo_blog_apagado: 'Apagou artigo do blog',
  midia_enviada: 'Enviou mídia', midia_actualizada: 'Actualizou mídia', midia_apagada: 'Apagou mídia',
  software_criado: 'Publicou software', software_actualizado: 'Actualizou software', software_alternado: 'Activou/desactivou software', software_apagado: 'Apagou software',
}
// cor do selo conforme o tipo de acção (criar=verde, apagar=vermelho, mudar estado=azul, licença=roxo…)
const ACAO_TOM = (acao: string) => acao.endsWith('_apagado') ? 'vermelho'
  : acao.endsWith('_criado') || acao.endsWith('_criada') || acao.endsWith('_emitida') || acao.endsWith('_recebido') ? 'verde'
  : acao === 'licenca_alterada' ? 'roxo'
  : acao === 'login_falhado' ? 'ambar'
  : acao === 'login' ? 'neutro' : 'azul'
const fmtAuditDetalhe = (raw: string | null) => {
  if (!raw) return ''
  try {
    const obj = JSON.parse(raw) as Record<string, unknown>
    return Object.entries(obj).map(([k, v]) => `${k}: ${typeof v === 'string' ? v : JSON.stringify(v).replace(/"/g, '')}`).join(' · ')
  } catch { return raw }
}

type HealthCheck = {
  score: number
  status: 'healthy' | 'degraded' | 'critical'
  checkedAt?: string
  checks: {
    database: { status: 'healthy' | 'degraded' | 'unhealthy'; latency: number }
    storage: { status: 'healthy' | 'degraded' | 'unhealthy'; latency: number }
    content: { status: 'healthy' | 'degraded' | 'unhealthy'; latency: number; activeServices?: number; activeSoftware?: number }
  }
  warnings?: { level: 'info' | 'warning'; message: string }[]
}

const fallbackSummary: Summary = { softwares: 3, media: 18, services: 4, contacts: 24 }
const fallbackContacts: Contact[] = [
  { id: '1', name: 'Marta Silva', email: 'marta@atlas.co', phone: '+244 923 111 222', service_interest: 'CFTEC Flow', message: 'Gostaria de uma demonstração do CFTEC Flow para a nossa equipa comercial.', status: 'unread', created_at: 'Hoje, 09:42' },
  { id: '2', name: 'Paulo António', email: 'paulo@kairo.co', phone: null, service_interest: 'Serviço à medida', message: 'Precisamos de integrar o nosso sistema de stock com relatórios executivos.', status: 'read', created_at: 'Ontem, 16:18' },
  { id: '3', name: 'Inês Gomes', email: 'ines@nortelab.co', phone: null, service_interest: 'CFTEC Insight', message: 'Quanto custa a licença anual do CFTEC Insight?', status: 'archived', created_at: '12 Out, 11:05' },
]
const fallbackSoftware: Software[] = [
  { id: '1', name: 'CFTEC Flow', version: 'v2.4', file_size: '45 MB', downloads_count: 183, created_at: '12 Out 2025' },
  { id: '2', name: 'CFTEC Insight', version: 'v1.8', file_size: '32 MB', downloads_count: 97, created_at: '07 Out 2025' },
  { id: '3', name: 'CFTEC Desk', version: 'v3.1', file_size: '58 MB', downloads_count: 246, created_at: '27 Set 2025' },
]
const fallbackServices: Service[] = [
  { id: '1', title: 'Desenvolvimento à medida', slug: 'desenvolvimento-a-medida', short_description: 'Aplicações web robustas para a realidade da sua equipa.', full_description: 'Produtos digitais pensados para os processos e objectivos específicos do seu negócio.', icon: 'Code2', is_active: true, created_at: '2025-01-15' },
  { id: '2', title: 'Cloud & conectividade', slug: 'cloud-conectividade', short_description: 'Arquitecturas seguras, escaláveis e sob controlo.', full_description: 'Infraestrutura preparada para manter os seus dados disponíveis e a sua operação em movimento.', icon: 'Network', is_active: true, created_at: '2025-02-20' },
  { id: '3', title: 'Dados & automação', slug: 'dados-automacao', short_description: 'Informação accionável para decidir com confiança.', full_description: 'Dashboards, integrações e automações que reduzem ruído e desbloqueiam performance.', icon: 'BarChart3', is_active: true, created_at: '2025-03-10' },
  { id: '4', title: 'Suporte especializado', slug: 'suporte-especializado', short_description: 'Uma equipa técnica próxima para manter tudo a avançar.', full_description: 'Acompanhamento contínuo, resolução rápida e evolução sustentada da sua tecnologia.', icon: 'Headphones', is_active: true, created_at: '2025-04-05' },
]

type SysLic = {
  licencaAtiva: boolean; moduloComercial: boolean; moduloTecnico: boolean; moduloNovidades: boolean
  expiraEm: string; mensagem: string
  diasAviso: number; maxUsuarios: number; maxStorageMb: number; somenteLeitura: boolean
  expirada: boolean; licencaEfetiva: boolean
  estado?: 'activa' | 'aviso' | 'expirada' | 'suspensa' | 'leitura'
  diasParaVencer: number | null
  storageUsadoMb?: number | null
  bypassActivo?: boolean
}

const navItems: { id: AdminSection; label: string; icon: typeof LayoutDashboard; levels: AdminUser['level'][] }[] = [
  { id: 'dashboard', label: 'Visão Geral', icon: LayoutDashboard, levels: ['super_admin', 'gestor', 'tecnico', 'developer'] },
  { id: 'services', label: 'Gerir Serviços', icon: Code2, levels: ['super_admin', 'gestor', 'tecnico', 'developer'] },
  { id: 'media', label: 'Gestão de Mídias', icon: FileImage, levels: ['super_admin', 'gestor', 'tecnico', 'developer'] },
  { id: 'software', label: 'Softwares & Downloads', icon: Package, levels: ['super_admin', 'gestor', 'tecnico', 'developer'] },
  { id: 'licencas', label: 'Licenças PalancaSoft', icon: KeyRound, levels: ['super_admin', 'gestor', 'tecnico', 'developer'] },
  { id: 'pedidos', label: 'Pedidos de Licença', icon: ShoppingCart, levels: ['super_admin', 'gestor', 'developer'] },
  { id: 'relatorios', label: 'Relatórios & Metas', icon: BarChart3, levels: ['super_admin', 'gestor', 'developer'] },
  { id: 'blog', label: 'Blog / CMS', icon: FileText, levels: ['super_admin', 'gestor', 'tecnico', 'developer'] },
  { id: 'destaques', label: 'Novidades & Destaques', icon: Sparkles, levels: ['super_admin', 'gestor', 'tecnico', 'developer'] },
  { id: 'parceiros', label: 'Revenda Negomil', icon: Network, levels: ['super_admin', 'gestor', 'developer'] },
  { id: 'contactos', label: 'Contactos', icon: UsersRound, levels: ['super_admin', 'gestor', 'tecnico', 'developer'] },
  { id: 'chamados', label: 'Chamados de Suporte', icon: LifeBuoy, levels: ['super_admin', 'gestor', 'tecnico', 'developer'] },
  { id: 'wiki', label: 'Wiki Técnica', icon: BookOpen, levels: ['super_admin', 'tecnico', 'developer'] },
  { id: 'settings', label: 'Definições', icon: Settings, levels: ['super_admin', 'developer'] },
  { id: 'auditoria', label: 'Registo de actividades', icon: ScrollText, levels: ['super_admin', 'developer'] },
  { id: 'developer', label: 'Painel do Developer', icon: ShieldCheck, levels: ['developer'] },
]

function getServiceIcon(iconName: string) {
  const Icon = serviceIcons[iconName] || serviceIcons['Code2']
  return Icon
}

function AdminMark() {
  return <a href="/" className="admin-brand"><span className="admin-brand-mark"><span /><span /><span /></span><span><strong>CFTEC</strong><small>Painel Admin</small></span></a>
}

function useCountUp(value: number, duration = 1100) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    let raf = 0
    const start = performance.now()
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplay(Math.round(value * eased))
      if (t < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    // garantia: rAF pode não correr em tabs em segundo plano
    const fallback = window.setTimeout(() => setDisplay(value), duration + 80)
    return () => { cancelAnimationFrame(raf); window.clearTimeout(fallback) }
  }, [value, duration])
  return display
}

function StatCard({ label, value, sub, badge, icon: Icon, tone, onClick, index = 0, share = 0 }: { label: string; value: number; sub: string; badge?: number; icon: typeof Users; tone: string; onClick?: () => void; index?: number; share?: number }) {
  const shown = useCountUp(value)
  return (
    <Card className="admin-stat admin-stat--link admin-stat--in" style={{ animationDelay: `${index * 110}ms` }} onClick={onClick}>
      {badge != null && badge > 0 && <span className="admin-stat-badge" title={`${badge} por tratar`}>{badge > 9 ? '9+' : badge}</span>}
      <div className="admin-stat-head">
        <span>{label}</span>
        <span className={`admin-stat-icon admin-stat-icon--${tone}`}><Icon size={17} /></span>
      </div>
      <div className="admin-stat-value">
        <strong>{shown}</strong>
        <small>{sub}</small>
      </div>
      <span className="admin-stat-bar"><i style={{ width: `${Math.round(share * 100)}%` }} /></span>
    </Card>
  )
}

function AdminLogin({ onAuthenticated }: { onAuthenticated: (user: AdminUser) => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code2fa, setCode2fa] = useState('')
  const [needs2fa, setNeeds2fa] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const response = await fetch('/api/admin/login', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password, code: code2fa.trim() }) })
      const result = await response.json()
      if (result.needs2fa) {
        // password certa, falta o segundo passo (código TOTP do app autenticador)
        setNeeds2fa(true)
        setError(result.error || 'Introduza o código de verificação (2FA).')
        return
      }
      if (!response.ok) throw new Error(result.error || 'Não foi possível iniciar sessão.')
      onAuthenticated(result.user)
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Não foi possível iniciar sessão.')
    } finally {
      setSubmitting(false)
    }
  }

  return <div className="admin-auth-shell"><Card className="admin-auth-card"><AdminMark /><div className="admin-auth-heading"><span className="admin-kicker">ÁREA RESTRITA</span><h1>Entrar no painel.</h1><p>Use as credenciais de administrador da CFTEC para continuar.</p></div><form onSubmit={submit} className="admin-auth-form"><label>E-mail<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="admin@cftec.co" autoComplete="username" required readOnly={needs2fa} /></label><label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="A sua password" autoComplete="current-password" required readOnly={needs2fa} /></label>{needs2fa && <label>Código de verificação (app autenticador)<input inputMode="numeric" pattern="[0-9]*" maxLength={6} value={code2fa} onChange={(event) => setCode2fa(event.target.value.replace(/\D/g, ''))} placeholder="000000" autoFocus autoComplete="one-time-code" required /></label>}{error && <div className="admin-auth-error" role="alert">{error}</div>}<Button type="submit" size="lg" disabled={submitting}>{submitting ? 'A validar…' : needs2fa ? 'Confirmar código' : 'Entrar no painel'} <ChevronRight size={16} /></Button></form><div className="admin-auth-note"><ShieldCheck size={15} /> Sessão protegida por JWT, cookie HttpOnly e 2FA (quando activo).</div><a href="/" className="admin-back-link">← Voltar ao website público</a></Card></div>
}

// INTERCEPTOR DE SESSÃO (equivalente ao onAuthStateChange do Supabase):
// qualquer resposta admin com 401 → sessão morreu/foi revogada → volta ao login
let sessionExpiredHandler: (() => void) | null = null

function installSessionInterceptor() {
  if ((window as { __cftecSessionHooked?: boolean }).__cftecSessionHooked) return
  ;(window as { __cftecSessionHooked?: boolean }).__cftecSessionHooked = true
  const originalFetch = window.fetch.bind(window)
  window.fetch = async (input, init) => {
    const response = await originalFetch(input as RequestInfo, init)
    try {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : String((input as Request).url)
      if (url.includes('/api/admin/') && !url.includes('/api/admin/login') && !url.includes('/api/admin/session') && response.status === 401)
        sessionExpiredHandler?.()
    } catch { /* nunca interromper a resposta original */ }
    return response
  }
}

export default function AdminDashboard() {
  const [authStatus, setAuthStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading')
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null)
  const [activeSection, setActiveSection] = useState<AdminSection>('dashboard')
  const [tourOpen, setTourOpen] = useState(false)
  // tour guiado: abre automaticamente no primeiro login do utilizador (por conta)
  useEffect(() => {
    if (adminUser?.email && !tourFeito(adminUser.email)) setTourOpen(true)
  }, [adminUser?.email])
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [summary, setSummary] = useState<Summary>(fallbackSummary)
  const [contacts, setContacts] = useState<Contact[]>(fallbackContacts)
  const [software, setSoftware] = useState<Software[]>(fallbackSoftware)
  const [services, setServices] = useState<Service[]>(fallbackServices)
  const [media, setMedia] = useState<Media[]>([])
  const [health, setHealth] = useState<HealthCheck | null>(null)
  const [toast, setToast] = useState('')
  const [showSoftwareForm, setShowSoftwareForm] = useState(false)
  const [showServiceForm, setShowServiceForm] = useState<Service | false | null>(false)
  const [dragActive, setDragActive] = useState(false)
  const [search, setSearch] = useState('')
  const [deletingServiceId, setDeletingServiceId] = useState<string | null>(null)
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null)
  const [deletingContactId, setDeletingContactId] = useState<string | null>(null)
  const [editingSoftware, setEditingSoftware] = useState<Software | null>(null)
  const [deletingSoftwareId, setDeletingSoftwareId] = useState<string | null>(null)
  const [notifOpen, setNotifOpen] = useState(false)
  const [profileName, setProfileName] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [pwCurrent, setPwCurrent] = useState('')
  const [pwNew, setPwNew] = useState('')
  const [pwConfirm, setPwConfirm] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)
  const [licenses, setLicenses] = useState<License[]>([])
  const [partners, setPartners] = useState<Partner[]>([])
  const [partnerEstado, setPartnerEstado] = useState<'todos' | 'pendente' | 'em_analise' | 'aprovado' | 'rejeitado'>('todos')
  const [partnerQuery, setPartnerQuery] = useState('')
  const [fichaPartner, setFichaPartner] = useState<Partner | null>(null)
  const [fichaForm, setFichaForm] = useState({ nome: '', telefone: '', nif: '', provincia: '', modalidade: 'Individual', status: 'pendente', vendas: '0', clientes: '0', nota: '' })
  const [savingFicha, setSavingFicha] = useState(false)
  const [licNovaId, setLicNovaId] = useState('')
  const [novaParceiro, setNovaParceiro] = useState(false)
  const [novaParceiroForm, setNovaParceiroForm] = useState({ nome: '', telefone: '', nif: '', provincia: '', modalidade: 'Individual', nota: '' })
  const [savingNovaParceiro, setSavingNovaParceiro] = useState(false)
  const [showLicenseForm, setShowLicenseForm] = useState(false)
  const [licenseForm, setLicenseForm] = useState({ clienteNome: '', nif: '', expiracao: '' })
  const [licenseSaving, setLicenseSaving] = useState(false)
  const [deletingLicenseId, setDeletingLicenseId] = useState<string | null>(null)
  const [licenseQuery, setLicenseQuery] = useState('')
  const [chamados, setChamados] = useState<Chamado[]>([])
  const [chamadoEstadoFilter, setChamadoEstadoFilter] = useState<'Todos' | 'Pendente' | 'Em Resolução' | 'Resolvido'>('Todos')
  const [showChamadoForm, setShowChamadoForm] = useState(false)
  const [chamadoSaving, setChamadoSaving] = useState(false)
  const [chamadoForm, setChamadoForm] = useState({ cliente: '', nif: '', telefone: '', software: '', problema: '', prioridade: 'Média' })

  // WIKI TÉCNICA — base de conhecimento interna do técnico
  type WikiArtigo = { id: string; created_at: string; updated_at: string; titulo: string; software: string | null; problema: string; solucao: string; tags: string | null; autor: string | null }
  const [wiki, setWiki] = useState<WikiArtigo[]>([])
  const [wikiSearch, setWikiSearch] = useState('')
  const [showWikiForm, setShowWikiForm] = useState(false)
  const [editingWiki, setEditingWiki] = useState<WikiArtigo | null>(null)
  const [wikiForm, setWikiForm] = useState({ titulo: '', software: '', problema: '', solucao: '', tags: '' })
  const [savingWiki, setSavingWiki] = useState(false)
  const [audit, setAudit] = useState<AuditRow[]>([])
  const [auditSearch, setAuditSearch] = useState('')
  const [deletingWikiId, setDeletingWikiId] = useState<string | null>(null)

  const loadWiki = async () => {
    try {
      const r = await fetch('/api/admin/wiki', { credentials: 'include' })
      if (r.ok) setWiki(await r.json())
    } catch { /* silencioso */ }
  }

  const loadAudit = async () => {
    try {
      const r = await fetch('/api/admin/auditoria', { credentials: 'include' })
      if (r.ok) setAudit(await r.json())
    } catch { /* silencioso */ }
  }

  // carregar o histórico ao entrar na secção + mantê-lo fresco NO polling enquanto estiver aberta
  const auditVisivelRef = useRef(false)
  useEffect(() => {
    auditVisivelRef.current = activeSection === 'auditoria'
    if (activeSection === 'auditoria' && adminUser) void loadAudit()
  }, [activeSection, adminUser])

  const guardarWiki = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (savingWiki) return // evita duplo clique a duplicar artigos
    setSavingWiki(true)
    try {
      const method = editingWiki ? 'PATCH' : 'POST'
      const url = editingWiki ? `/api/admin/wiki/${editingWiki.id}` : '/api/admin/wiki'
      const response = await fetch(url, {
        method,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(wikiForm),
      })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(body.error || 'Falha ao guardar o artigo')
      if (editingWiki) {
        setWiki(list => list.map(a => a.id === editingWiki.id ? body.artigo : a))
        notify('Artigo da wiki actualizado')
      } else {
        setWiki(list => [body.artigo, ...list])
        notify('Solução registada na wiki')
      }
      setShowWikiForm(false)
      setEditingWiki(null)
      setWikiForm({ titulo: '', software: '', problema: '', solucao: '', tags: '' })
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Erro ao guardar o artigo')
    } finally {
      setSavingWiki(false)
    }
  }

  const handleWikiDelete = async () => {
    if (!deletingWikiId) return
    try {
      const response = await fetch(`/api/admin/wiki/${deletingWikiId}`, { method: 'DELETE', credentials: 'include' })
      if (!response.ok) throw new Error('Falha ao eliminar o artigo')
      setWiki(list => list.filter(a => a.id !== deletingWikiId))
      notify('Artigo eliminado da wiki')
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Erro ao eliminar')
    } finally {
      setDeletingWikiId(null)
    }
  }

  const abrirWikiNaSecao = (software: string | null) => {
    setWikiSearch(software || '')
    setActiveSection('wiki')
  }
  const [deletingChamadoId, setDeletingChamadoId] = useState<string | null>(null)
  const [deletingPartnerId, setDeletingPartnerId] = useState<string | null>(null)
  const [downloadMetrics, setDownloadMetrics] = useState<{ total30: number; porDia: Record<string, number>; topo: { id: string; name: string; count: number }[] } | null>(null)
  const [portalSettings, setPortalSettings] = useState<Record<string, string>>({})
  const [savingPortal, setSavingPortal] = useState(false)
  const [users, setUsers] = useState<AdminUserRow[]>([])
  const [showUserForm, setShowUserForm] = useState(false)
  const [userForm, setUserForm] = useState({ name: '', email: '', password: '', role: 'gestor' })
  const [savingUser, setSavingUser] = useState(false)
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null)
  const [pwResetUser, setPwResetUser] = useState<AdminUserRow | null>(null)
  const [pwResetForm, setPwResetForm] = useState({ pw: '', pw2: '' })
  const [licenseOrders, setLicenseOrders] = useState<LicenseOrder[]>([])
  const [orderFilter, setOrderFilter] = useState<'Todos' | 'Pendente' | 'Em Verificação' | 'Aprovado' | 'Pago' | 'Rejeitado'>('Todos')
  // regras de contrato SaaS — quotas/vencimento/read-only + código de emergência mestre
  const [regrasForm, setRegrasForm] = useState<{ diasAviso: string; maxUsuarios: string; maxStorageMb: string }>({ diasAviso: '5', maxUsuarios: '0', maxStorageMb: '0' })
  const regrasSyncedRef = useRef(false)
  const [codigoMaster, setCodigoMaster] = useState<string | null>(null)
  const [gerandoCodigo, setGerandoCodigo] = useState(false)
  const [codigoEmergencia, setCodigoEmergencia] = useState('')
  const [enviandoCodigo, setEnviandoCodigo] = useState(false)
  const [baixandoBackup, setBaixandoBackup] = useState(false)
  // pop-up de upgrade (Pricing 9) — abre quando uma quota do contrato bloqueia uma acção
  const [showUpgrade, setShowUpgrade] = useState(false)
  // pedidos de pagamento/manutenção (super vê os seus; developer autoriza/recusa)
  const [upgradePedidos, setUpgradePedidos] = useState<Array<{ id: string; empresa: string; email: string; itens: string; total: string; estado: 'pendente' | 'autorizado' | 'recusado'; nota_dev: string | null; created_at: string; resolvido_em: string | null; resolvido_por: string | null }>>([])
  // licenciamento da plataforma — flags geridas pelo developer (Master Admin)
  const [sysLic, setSysLic] = useState<SysLic>({ licencaAtiva: true, licencaEfetiva: true, expirada: false, moduloComercial: true, moduloTecnico: true, moduloNovidades: true, expiraEm: '', mensagem: '', diasAviso: 5, maxUsuarios: 0, maxStorageMb: 0, somenteLeitura: false, diasParaVencer: null })
  // vista kanban do pipeline comercial (arrastar cartões muda o estado do pedido)
  const [orderView, setOrderView] = useState<'tabela' | 'kanban'>('tabela')
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null)
  const knownOrderIdsRef = useRef<string[]>([])
  const knownChamadosRef = useRef<string[]>([])
  const audioCtxRef = useRef<AudioContext | null>(null)

  // Odd alerta no dispositivo quando o painel está aberto: notificação nativa
  // do sistema + som suave (Web Push via SW cobre o caso do painel fechado)
  const alertaDispositivo = (tipo: 'pedido' | 'chamado', titulo: string, corpo: string) => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return
    try {
      const n = new Notification(titulo, { body: corpo, icon: '/cftec-icon.svg', tag: tipo })
      n.onclick = () => { window.focus(); n.close() }
    } catch { /* alguns navegadores exigem SW — sem problema, o push cobre */ }
    try {
      if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      const ctx = audioCtxRef.current
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = tipo === 'chamado' ? 660 : 880
      gain.gain.setValueAtTime(0.001, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.06, ctx.currentTime + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35)
      osc.connect(gain).connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.36)
    } catch { /* áudio bloqueado até 1.ª interacção — ignora */ }
  }
  const [destaques, setDestaques] = useState<Destaque[]>([])
  const [destaqueForm, setDestaqueForm] = useState({ ...emptyDestaqueForm, imagem: null as File | null, imagemNome: '' })
  const [editingDestaque, setEditingDestaque] = useState<Destaque | null>(null)
  const [showDestaqueForm, setShowDestaqueForm] = useState(false)
  const [deletingDestaqueId, setDeletingDestaqueId] = useState<string | null>(null)
  const [savingDestaque, setSavingDestaque] = useState(false)
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([])
  const [blogForm, setBlogForm] = useState({ ...emptyBlogForm, cover: null as File | null, coverNome: '' })
  const [editingBlog, setEditingBlog] = useState<BlogPost | null>(null)
  const [showBlogForm, setShowBlogForm] = useState(false)
  const [deletingBlogId, setDeletingBlogId] = useState<string | null>(null)
  const [savingBlog, setSavingBlog] = useState(false)

  useEffect(() => {
    installSessionInterceptor()
    sessionExpiredHandler = () => {
      // sessão expirada/revogada a meio do trabalho → deITA a UI e mostra o login
      setAdminUser(null)
      setAuthStatus(prev => prev === 'authenticated' ? 'unauthenticated' : prev)
    }
    return () => { sessionExpiredHandler = null }
  }, [])

  useEffect(() => {
    fetch('/api/admin/session', { credentials: 'include' }).then((response) => {
      if (!response.ok) throw new Error('unauthenticated')
      return response.json()
    }).then((result) => {
      setAdminUser(result.user)
      setProfileName(result.user?.name || '')
      setAuthStatus('authenticated')
    }).catch(() => setAuthStatus('unauthenticated'))
  }, [])

  const loadDashboardData = async () => {
    if (authStatus !== 'authenticated') return
    
    try {
      const [summaryRes, contactsRes, softwareRes, servicesRes, mediaRes, healthRes, licensesRes, partnersRes, downloadsRes, settingsRes, usersRes, ordersRes, destaquesRes, blogRes, chamadosRes] = await Promise.all([
        fetch('/api/admin/summary', { credentials: 'include' }),
        fetch('/api/admin/contacts', { credentials: 'include' }),
        fetch('/api/admin/software', { credentials: 'include' }),
        fetch('/api/admin/services', { credentials: 'include' }),
        fetch('/api/admin/media', { credentials: 'include' }),
        fetch('/api/admin/health', { credentials: 'include' }),
        fetch('/api/admin/licenses', { credentials: 'include' }),
        fetch('/api/admin/partners', { credentials: 'include' }),
        fetch('/api/admin/downloads', { credentials: 'include' }),
        fetch('/api/admin/settings', { credentials: 'include' }),
        fetch('/api/admin/users', { credentials: 'include' }),
        fetch('/api/admin/license-orders', { credentials: 'include' }),
        fetch('/api/admin/destaques', { credentials: 'include' }),
        fetch('/api/admin/blog', { credentials: 'include' }),
        fetch('/api/admin/chamados', { credentials: 'include' }),
      ])

      const [summaryData, contactsData, softwareData, servicesData, mediaData, healthData, licensesData, partnersData, downloadsData, settingsData, usersData, ordersData, destaquesData, blogData, chamadosData] = await Promise.all([
        summaryRes.ok ? summaryRes.json() : fallbackSummary,
        contactsRes.ok ? contactsRes.json() : fallbackContacts,
        softwareRes.ok ? softwareRes.json() : fallbackSoftware,
        servicesRes.ok ? servicesRes.json() : fallbackServices,
        mediaRes.ok ? mediaRes.json() : [],
        healthRes.ok ? healthRes.json() : null,
        licensesRes.ok ? licensesRes.json() : [],
        partnersRes.ok ? partnersRes.json() : [],
        downloadsRes.ok ? downloadsRes.json() : null,
        settingsRes.ok ? settingsRes.json() : null,
        usersRes.ok ? usersRes.json() : [],
        ordersRes.ok ? ordersRes.json() : [],
        destaquesRes.ok ? destaquesRes.json() : [],
        blogRes.ok ? blogRes.json() : [],
        chamadosRes.ok ? chamadosRes.json() : [],
      ])
      
      const resolvedSoftware = Array.isArray(softwareData) && softwareData.length > 0 ? softwareData : fallbackSoftware
      const resolvedServices = Array.isArray(servicesData) && servicesData.length > 0 ? servicesData : fallbackServices

      setSummary(summaryData.summary || summaryData)
      setContacts(contactsData)
      setSoftware(resolvedSoftware)
      setServices(resolvedServices)
      setMedia(mediaData)
      setHealth(healthData)
      setLicenses(Array.isArray(licensesData) ? licensesData : [])
      setPartners(Array.isArray(partnersData) ? partnersData : [])
      setDownloadMetrics(downloadsData && downloadsData.ok ? { total30: downloadsData.total30, porDia: downloadsData.porDia || {}, topo: downloadsData.topo || [] } : null)
      setUsers(Array.isArray(usersData) ? usersData : [])
      setLicenseOrders(Array.isArray(ordersData) ? ordersData : [])
      const ordersNow = Array.isArray(ordersData) ? ordersData : []
      knownOrderIdsRef.current = ordersNow.map(o => o.id)
      setDestaques(Array.isArray(destaquesData) ? destaquesData : [])
      setBlogPosts(Array.isArray(blogData) ? blogData : [])
      setChamados(Array.isArray(chamadosData) ? chamadosData : [])
      knownChamadosRef.current = (Array.isArray(chamadosData) ? chamadosData : []).map((c: { id: string }) => c.id)
      if (settingsData && settingsData.ok) {
        const map: Record<string, string> = {}
        for (const entry of settingsData.settings || []) map[entry.key] = entry.value
        setPortalSettings(map)
      }
    } catch (err) {
      console.error('[ADMIN] Error loading data:', err)
      setSummary(fallbackSummary)
      setContacts(fallbackContacts)
      setSoftware(fallbackSoftware)
      setServices(fallbackServices)
      setMedia([])
      setHealth(null)
    }
  }

  useEffect(() => {
    loadDashboardData()
    loadSysLic()
    loadUpgradePedidos()
  }, [authStatus])

  // POP-UP DE UPGRADE — abre sozinho quando a API devolve 403/413 de quota do contrato
  useEffect(() => {
    const fetchOriginal = window.fetch.bind(window)
    window.fetch = async (...args: Parameters<typeof fetch>) => {
      const resposta = await fetchOriginal(...(args as Parameters<typeof fetch>))
      if (resposta.status === 403 || resposta.status === 413) {
        try {
          const b = await resposta.clone().json()
          const erro = String(b?.error || '')
          if (/Limite do contrato atingido|Limite de armazenamento do contrato/.test(erro)) {
            setShowUpgrade(true)
          }
        } catch { /* corpo não-JSON (ex.: blob) — ignora */ }
      }
      return resposta
    }
    return () => { window.fetch = fetchOriginal }
  }, [])

  // fecha o pop-up de upgrade com ESC
  useEffect(() => {
    if (!showUpgrade) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowUpgrade(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [showUpgrade])

  // pedido real de upgrade → API própria (fica na tabela pedidos_upgrade e o Developer autoriza/recusa)
  const solicitarUpgrade = async (itens: string, total: string): Promise<boolean> => {
    try {
      const r = await fetch('/api/admin/upgrade-request', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itens, total }),
      })
      const b = await r.json().catch(() => null)
      if (r.ok) {
        notify('Pedido de upgrade enviado — a Nexora Systems autoriza em breve')
        loadUpgradePedidos()
        return true
      }
      notify(b?.error || 'Não foi possível enviar o pedido de upgrade')
      return false
    } catch {
      notify('Não foi possível enviar o pedido de upgrade')
      return false
    }
  }

  // PEDIDOS DE PAGAMENTO/MANUTENÇÃO — lista para Definições (super) e Painel do Developer
  const loadUpgradePedidos = async () => {
    try {
      const r = await fetch('/api/admin/upgrade-requests', { credentials: 'include' })
      if (r.ok) setUpgradePedidos(await r.json())
    } catch { /* silencioso — repete no ciclo de 20 s */ }
  }

  // decisão do developer sobre um pedido de upgrade (autorizar/recusar + e-mail ao cliente)
  const resolverUpgrade = async (id: string, estado: 'autorizado' | 'recusado'): Promise<void> => {
    try {
      const r = await fetch(`/api/admin/upgrade-requests/${id}`, {
        method: 'PATCH', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado }),
      })
      const b = await r.json().catch(() => null)
      if (r.ok) {
        const auto = Array.isArray((b as { auto?: string[] })?.auto) ? (b as { auto: string[] }).auto : []
        notify(estado === 'autorizado' ? `Pedido autorizado — contrato actualizado: ${auto.slice(0, 3).join(' · ')}${auto.length > 3 ? '…' : ''}` : 'Pedido recusado — cliente notificado por e-mail')
        loadUpgradePedidos()
      } else {
        notify(b?.error || 'Não foi possível resolver o pedido')
      }
    } catch {
      notify('Não foi possível resolver o pedido')
    }
  }

  const [refreshingHealth, setRefreshingHealth] = useState(false)

  const refreshHealth = async () => {
    setRefreshingHealth(true)
    try {
      const response = await fetch('/api/admin/health', { credentials: 'include' })
      if (response.ok) setHealth(await response.json())
    } catch {
      // silencioso — o painel mantém a última verificação
    } finally {
      setRefreshingHealth(false)
    }
  }

  // Re-verificação automática da saúde a cada 60 s
  useEffect(() => {
    if (authStatus !== 'authenticated') return
    const interval = window.setInterval(refreshHealth, 60000)
    return () => window.clearInterval(interval)
  }, [authStatus])

  const notify = (message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 3200)
  }
  const visibleSoftware = useMemo(() => software.filter((item) => item.name.toLowerCase().includes(search.toLowerCase())), [software, search])
  const sectionTitle = navItems.find((item) => item.id === activeSection)?.label || 'Visão Geral'
  const contactStatusLabel = (status: string) => (status === 'unread' || status === 'new' ? 'Novo' : status === 'em_contacto' ? 'Em contacto' : status === 'proposta' ? 'Proposta enviada' : status === 'fechado' ? 'Fechado' : status === 'archived' ? 'Arquivado' : 'Lido')
  const contactStatusTone = (status: string) => (status === 'unread' || status === 'new' || !['read', 'archived'].includes(status) ? 'unread' : status)
  const formatDate = (value: string) => {
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return value
    return d.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' + d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })
  }
  const visibleContacts = useMemo(() => contacts.filter((c) => `${c.name} ${c.email} ${c.service_interest || ''}`.toLowerCase().includes(search.toLowerCase())), [contacts, search])
  const visibleMedia = useMemo(() => media.filter((m) => `${m.filename} ${m.alt_text || ''}`.toLowerCase().includes(search.toLowerCase())), [media, search])
  const unreadContacts = useMemo(() => contacts.filter((c) => contactStatusTone(c.status) === 'unread'), [contacts])

  // Definições — perfil e password
  const handleProfileSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSavingProfile(true)
    try {
      const response = await fetch('/api/admin/profile', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: profileName.trim() }),
      })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(body.error || 'Falha ao guardar o perfil')
      setAdminUser(prev => prev ? { ...prev, name: body.user.name } : prev)
      notify('Perfil actualizado com sucesso')
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Erro ao guardar o perfil')
    } finally {
      setSavingProfile(false)
    }
  }

  const handlePasswordChange = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (pwNew !== pwConfirm) { notify('As passwords não coincidem'); return }
    setSavingPassword(true)
    try {
      const response = await fetch('/api/admin/change-password', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_password: pwCurrent, new_password: pwNew }),
      })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(body.error || 'Falha ao alterar a password')
      notify('Password alterada com sucesso')
      setPwCurrent(''); setPwNew(''); setPwConfirm('')
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Erro ao alterar a password')
    } finally {
      setSavingPassword(false)
    }
  }

  // ─── SEGURANÇA: 2FA (TOTP) e sessões activas ───
  type SessaoActiva = { jti: string; actual: boolean; emitida: string; dispositivo: string }
  const [twofaEstado, setTwofaEstado] = useState<'loading' | 'desligado' | 'activado'>('loading')
  const [setup2fa, setSetup2fa] = useState<{ secret: string; otpauth: string } | null>(null)
  const [codigo2fa, setCodigo2fa] = useState('')
  const [pw2fa, setPw2fa] = useState('')
  const [busy2fa, setBusy2fa] = useState(false)
  const [sessoes, setSessoes] = useState<SessaoActiva[] | null>(null)
  const [revogando, setRevogando] = useState(false)

  useEffect(() => {
    if (authStatus !== 'authenticated') return
    fetch('/api/admin/2fa/status', { credentials: 'include' }).then((r) => r.json()).then((j) => setTwofaEstado(j.activado ? 'activado' : 'desligado')).catch(() => setTwofaEstado('desligado'))
    fetch('/api/admin/sessions', { credentials: 'include' }).then((r) => r.json()).then((j) => setSessoes(j.sessoes || [])).catch(() => setSessoes([]))
  }, [authStatus])

  const iniciar2fa = async () => {
    setBusy2fa(true)
    try {
      const response = await fetch('/api/admin/2fa/setup', { method: 'POST', credentials: 'include' })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(body.error || 'Falha ao gerar o segredo 2FA')
      setSetup2fa({ secret: body.secret, otpauth: body.otpauth })
      setCodigo2fa('')
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Erro ao configurar o 2FA')
    } finally {
      setBusy2fa(false)
    }
  }

  const activar2fa = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setBusy2fa(true)
    try {
      const response = await fetch('/api/admin/2fa/activate', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: codigo2fa.trim() }) })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(body.error || 'Código inválido')
      setTwofaEstado('activado')
      setSetup2fa(null)
      notify('2FA activado — o próximo login pede o código do autenticador')
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Erro ao activar o 2FA')
    } finally {
      setBusy2fa(false)
    }
  }

  const desactivar2fa = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setBusy2fa(true)
    try {
      const response = await fetch('/api/admin/2fa/disable', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: pw2fa }) })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(body.error || 'Falha ao desactivar o 2FA')
      setTwofaEstado('desligado')
      setPw2fa('')
      notify('2FA desactivado')
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Erro ao desactivar o 2FA')
    } finally {
      setBusy2fa(false)
    }
  }

  const revogarSessao = async (jti: string) => {
    try {
      const response = await fetch(`/api/admin/sessions/${jti}`, { method: 'DELETE', credentials: 'include' })
      if (!response.ok) throw new Error('Falha ao revogar a sessão')
      setSessoes(prev => (prev || []).filter(s => s.jti !== jti))
      notify('Sessão revogada — esse dispositivo precisará de entrar de novo')
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Erro ao revogar a sessão')
    }
  }

  const revogarOutras = async () => {
    setRevogando(true)
    try {
      const response = await fetch('/api/admin/sessions/revoke-others', { method: 'POST', credentials: 'include' })
      if (!response.ok) throw new Error('Falha ao fechar as outras sessões')
      const refech = await fetch('/api/admin/sessions', { credentials: 'include' }).then((r) => r.json()).catch(() => null)
      setSessoes(refech?.sessoes || [])
      notify('As outras sessões foram fechadas')
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Erro ao fechar as outras sessões')
    } finally {
      setRevogando(false)
    }
  }

  // Contact handlers
  const handleContactStatus = async (contact: Contact, status: 'read' | 'unread' | 'archived' | 'em_contacto' | 'proposta' | 'fechado') => {
    if (!contact.id) return
    try {
      const response = await fetch(`/api/admin/contacts/${contact.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!response.ok) throw new Error('Falha ao actualizar o contacto')
      setContacts(prev => prev.map(c => c.id === contact.id ? { ...c, status } : c))
      // bolha de notificação: recalcula novos/não lidos em tempo real
      const wasNew = contact.status === 'new' || contact.status === 'unread'
      const isNew = (status as string) === 'new' || status === 'unread'
      if (wasNew !== isNew)
        setSummary(prev => ({ ...prev, contactsUnread: Math.max(0, (prev.contactsUnread || 0) + (wasNew ? -1 : 1)) }))
      notify(`Contacto ${status === 'archived' ? 'arquivado' : status === 'read' ? 'marcado como lido' : 'marcado como novo'}`)
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Erro ao actualizar o contacto')
    }
  }

  const handleContactDelete = async () => {
    if (!deletingContactId) return
    try {
      const response = await fetch(`/api/admin/contacts/${deletingContactId}`, { method: 'DELETE', credentials: 'include' })
      if (!response.ok) throw new Error('Falha ao eliminar contacto')
      notify('Contacto eliminado')
      setContacts(prev => prev.filter(c => c.id !== deletingContactId))
      setSummary(prev => ({ ...prev, contacts: Math.max(0, (prev.contacts || 0) - 1), contactsUnread: Math.max(0, (prev.contactsUnread || 0) - (contacts.find(c => c.id === deletingContactId)?.status === 'new' || contacts.find(c => c.id === deletingContactId)?.status === 'unread' ? 1 : 0)) }))
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Erro ao eliminar contacto')
    } finally {
      setDeletingContactId(null)
    }
  }

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return
    
    for (const file of files) {
      const formData = new FormData()
      formData.append('file', file)
      
      // Optimistic update - create temporary media item
      const tempId = `temp-${Date.now()}`
      const tempMedia: Media = {
        id: tempId,
        filename: file.name,
        file_path: URL.createObjectURL(file),
        file_size: file.size,
        mime_type: file.type,
        alt_text: null,
        uploaded_at: new Date().toISOString()
      }
      setMedia(prev => [tempMedia, ...prev])
      setSummary(prev => ({ ...prev, media: prev.media + 1 }))
      
      try {
        const response = await fetch('/api/admin/media', {
          method: 'POST',
          credentials: 'include',
          body: formData,
        })
        
        const result = await response.json()
        
        if (response.ok && result.ok) {
          notify(`"${file.name}" enviado com sucesso`)
          // Full sync from server
          await loadDashboardData()
          window.dispatchEvent(new CustomEvent('cftec-refresh-data'))
        } else {
          // Rollback optimistic update on error
          notify(`Erro ao enviar "${file.name}": ${result.error || 'Erro desconhecido'}`)
          setMedia(prev => prev.filter(m => m.id !== tempId))
          setSummary(prev => ({ ...prev, media: prev.media - 1 }))
        }
      } catch (error) {
        // Rollback optimistic update on error
        notify(`Erro ao enviar "${file.name}": ${error instanceof Error ? error.message : 'Erro de rede'}`)
        setMedia(prev => prev.filter(m => m.id !== tempId))
        setSummary(prev => ({ ...prev, media: prev.media - 1 }))
      }
    }
    setDragActive(false)
  }

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST', credentials: 'include' })
    window.location.href = '/'
  }

  // Service CRUD handlers
  const handleServiceSubmit = async (event: FormEvent<HTMLFormElement>, editingService: Service | null) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const payload = {
      title: formData.get('title') as string,
      short_description: formData.get('short_description') as string,
      full_description: formData.get('full_description') as string,
      icon: formData.get('icon') as string,
      is_active: formData.get('is_active') === 'on',
    }
    try {
      if (editingService) {
        const response = await fetch(`/api/admin/services/${editingService.id}`, {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!response.ok) throw new Error('Falha ao atualizar serviço')
        notify('Serviço actualizado com sucesso')
      } else {
        // Optimistic update for new service
        const tempId = `temp-${Date.now()}`
        const tempService: Service = {
          id: tempId,
          title: payload.title,
          slug: payload.title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
          short_description: payload.short_description,
          full_description: payload.full_description,
          icon: payload.icon,
          is_active: payload.is_active,
          created_at: new Date().toISOString()
        }
        setServices(prev => [...prev, tempService])
        setSummary(prev => ({ ...prev, services: prev.services + 1 }))
        
        const response = await fetch('/api/admin/services', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!response.ok) throw new Error('Falha ao criar serviço')
        notify('Serviço criado com sucesso')
      }
      // Full sync from server
      await loadDashboardData()
      window.dispatchEvent(new CustomEvent('cftec-refresh-data'))
      setShowServiceForm(false)
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Erro ao guardar serviço')
    }
  }

  const handleServiceDelete = async () => {
    if (!deletingServiceId) return
    try {
      const response = await fetch(`/api/admin/services/${deletingServiceId}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!response.ok) throw new Error('Falha ao eliminar serviço')
      notify('Serviço eliminado')
      await loadDashboardData()
      window.dispatchEvent(new CustomEvent('cftec-refresh-data'))
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Erro ao eliminar serviço')
    } finally {
      setDeletingServiceId(null)
    }
  }

  const handleToggleService = async (service: Service) => {
    try {
      const response = await fetch(`/api/admin/services/${service.id}/toggle`, {
        method: 'POST',
        credentials: 'include',
      })
      if (!response.ok) throw new Error('Falha ao alterar estado')
      const { is_active } = await response.json()
      setServices(prev => prev.map(s => s.id === service.id ? { ...s, is_active } : s))
      notify(`Serviço ${is_active ? 'activado' : 'desactivado'}`)
      await loadDashboardData()
      window.dispatchEvent(new CustomEvent('cftec-refresh-data'))
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Erro ao alterar estado')
    }
  }

  // Media delete handler
  const handleMediaDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/media/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!response.ok) throw new Error('Falha ao eliminar mídia')
      notify('Mídia eliminada')
      await loadDashboardData()
      window.dispatchEvent(new CustomEvent('cftec-refresh-data'))
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Erro ao eliminar mídia')
    }
  }

  // Software handlers
  const handleToggleSoftware = async (item: Software) => {
    try {
      const response = await fetch(`/api/admin/software/${item.id}/toggle`, { method: 'POST', credentials: 'include' })
      if (!response.ok) throw new Error('Falha ao alterar estado')
      const { is_active } = await response.json()
      setSoftware(prev => prev.map(s => s.id === item.id ? { ...s, is_active } : s))
      notify(`Software "${item.name}" ${is_active ? 'activado' : 'desactivado'}`)
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Erro ao alterar estado')
    }
  }

  const handleSoftwareDelete = async () => {
    if (!deletingSoftwareId) return
    try {
      const response = await fetch(`/api/admin/software/${deletingSoftwareId}`, { method: 'DELETE', credentials: 'include' })
      if (!response.ok) throw new Error('Falha ao eliminar software')
      notify('Software eliminado do catálogo')
      setSoftware(prev => prev.filter(s => s.id !== deletingSoftwareId))
      setSummary(prev => ({ ...prev, softwares: Math.max(0, prev.softwares - 1) }))
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Erro ao eliminar software')
    } finally {
      setDeletingSoftwareId(null)
    }
  }

  const openEditSoftware = (item: Software) => {
    setEditingSoftware(item)
    setSoftwareFormState({
      name: item.name,
      version: item.version,
      price: item.price != null ? String(item.price) : '',
      description: item.description || '',
      category: item.category || '',
      changelog: item.changelog || '',
      file: null,
      fileName: '',
      progress: -1,
      isLoading: false,
      errors: {},
    })
    setShowSoftwareForm(true)
  }

  // Config do portal (Definições)
  const handlePortalSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSavingPortal(true)
    try {
      const entries = ['telefone_directorio', 'whatsapp_comercial', 'email_contacto', 'iban_cftec', 'linkedin_url', 'x_url', 'banner_mensagem', 'banner_activo', 'notify_email'].map(k => ({ key: k, value: portalSettings[k] || '' }))
      const response = await fetch('/api/admin/settings', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries }),
      })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(body.error || 'Falha ao guardar a configuração')
      notify('Configuração do portal guardada — o site usa os novos valores no próximo carregamento')
      window.dispatchEvent(new CustomEvent('cftec-refresh-data'))
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Erro ao guardar a configuração')
    } finally {
      setSavingPortal(false)
    }
  }

  // Licenças PalancaSoft
  const labelLicenca = (status: string) => (status === 'activa' ? 'Activa' : status === 'expirada' ? 'Expirada' : 'Cancelada')
  const copyKey = (key: string) => {
    navigator.clipboard?.writeText(key).then(
      () => notify('Chave copiada para a área de transferência'),
      () => notify('Não foi possível copiar a chave'),
    )
  }

  const createLicense = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLicenseSaving(true)
    try {
      const response = await fetch('/api/admin/licenses', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cliente_nome: licenseForm.clienteNome.trim(), nif: licenseForm.nif.trim() || null, data_expiracao: licenseForm.expiracao || null }),
      })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(body.error || 'Falha ao criar a licença')
      setLicenses(prev => [body.license, ...prev])
      notify('Licença criada com sucesso')
      setShowLicenseForm(false)
      setLicenseForm({ clienteNome: '', nif: '', expiracao: '' })
      copyKey(body.license.chave_licenca)
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Erro ao criar a licença')
    } finally {
      setLicenseSaving(false)
    }
  }

  const updateLicenseStatus = async (license: License, status: 'activa' | 'cancelada') => {
    try {
      const response = await fetch(`/api/admin/licenses/${license.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!response.ok) throw new Error('Falha ao actualizar a licença')
      setLicenses(prev => prev.map(l => l.id === license.id ? { ...l, status } : l))
      notify(`Licença ${status === 'activa' ? 'reactivada' : 'cancelada'}`)
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Erro ao actualizar a licença')
    }
  }

  const handleLicenseDelete = async () => {
    if (!deletingLicenseId) return
    try {
      const response = await fetch(`/api/admin/licenses/${deletingLicenseId}`, { method: 'DELETE', credentials: 'include' })
      if (!response.ok) throw new Error('Falha ao eliminar a licença')
      setLicenses(prev => prev.filter(l => l.id !== deletingLicenseId))
      notify('Licença eliminada')
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Erro ao eliminar a licença')
    } finally {
      setDeletingLicenseId(null)
    }
  }

  // Parceiros (revenda Negomil)
  const labelParceiro = (status: string) => (status === 'pendente' ? 'Pendente' : status === 'em_analise' ? 'Em análise' : status === 'aprovado' ? 'Aprovado' : 'Rejeitado')

  // Chamados de suporte (helpdesk do técnico)
  const createChamado = async (e: React.FormEvent) => {
    e.preventDefault()
    setChamadoSaving(true)
    try {
      const response = await fetch('/api/admin/chamados', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(chamadoForm),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Falha ao registar o chamado')
      setChamados(prev => [data.chamado, ...prev])
      notify(`Chamado registado · ${data.chamado.cliente}`)
      setShowChamadoForm(false)
      setChamadoForm({ cliente: '', nif: '', telefone: '', software: '', problema: '', prioridade: 'Média' })
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Erro ao registar o chamado')
    } finally {
      setChamadoSaving(false)
    }
  }

  const updateChamado = async (chamado: Chamado, patch: { estado?: string; prioridade?: string }) => {
    const prev = chamados
    setChamados(list => list.map(c => c.id === chamado.id ? { ...c, ...patch } : c))
    try {
      const response = await fetch(`/api/admin/chamados/${chamado.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(patch),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Falha ao actualizar o chamado')
      if (data.chamado) setChamados(list => list.map(c => c.id === chamado.id ? data.chamado : c))
      notify(patch.estado ? `Chamado · ${patch.estado}` : `Prioridade · ${patch.prioridade}`)
    } catch (error) {
      setChamados(prev)
      notify(error instanceof Error ? error.message : 'Erro ao actualizar o chamado')
    }
  }

  const handleChamadoDelete = async () => {
    if (!deletingChamadoId) return
    try {
      const response = await fetch(`/api/admin/chamados/${deletingChamadoId}`, { method: 'DELETE', credentials: 'include' })
      if (!response.ok) throw new Error('Falha ao eliminar o chamado')
      setChamados(prev => prev.filter(c => c.id !== deletingChamadoId))
      notify('Chamado eliminado')
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Erro ao eliminar o chamado')
    } finally {
      setDeletingChamadoId(null)
    }
  }

  const updatePartnerStatus = async (partner: Partner, status: string) => {
    try {
      const response = await fetch(`/api/admin/partners/${partner.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!response.ok) throw new Error('Falha ao actualizar o parceiro')
      setPartners(prev => prev.map(p => p.id === partner.id ? { ...p, status } : p))
      notify(`Candidatura ${labelParceiro(status).toLowerCase()}`)
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Erro ao actualizar o parceiro')
    }
  }

  const updatePartnerMetric = async (partner: Partner, field: 'volume_vendas' | 'clientes_angariados', value: string) => {
    const parsed = Math.max(0, Math.round(Number(value) || 0))
    try {
      const response = await fetch(`/api/admin/partners/${partner.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: parsed }),
      })
      if (!response.ok) throw new Error('Falha ao guardar a métrica')
      setPartners(prev => prev.map(p => p.id === partner.id ? { ...p, [field]: parsed } : p))
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Erro ao guardar a métrica')
    }
  }

  const handlePartnerDelete = async () => {
    if (!deletingPartnerId) return
    try {
      const response = await fetch(`/api/admin/partners/${deletingPartnerId}`, { method: 'DELETE', credentials: 'include' })
      if (!response.ok) throw new Error('Falha ao eliminar a candidatura')
      setPartners(prev => prev.filter(p => p.id !== deletingPartnerId))
      notify('Candidatura eliminada')
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Erro ao eliminar a candidatura')
    } finally {
      setDeletingPartnerId(null)
    }
  }

  // ── Ficha do parceiro (revenda Negomil): dados editáveis + licenças vendidas via ele
  const abrirFicha = async (partner: Partner) => {
    setFichaPartner(partner)
    setFichaForm({
      nome: partner.nome_responsavel, telefone: partner.telefone_whatsapp, nif: partner.empresa_nif || '',
      provincia: partner.provincia || '', modalidade: partner.modalidade, status: partner.status,
      vendas: String(partner.volume_vendas), clientes: String(partner.clientes_angariados), nota: partner.nota || '',
    })
    setLicNovaId('')
    try {
      const r = await fetch('/api/admin/licenses', { credentials: 'include' })
      if (r.ok) setLicenses(await r.json())
    } catch { /* silencioso — a carteira de licenças usa o que já está em memória */ }
  }

  const guardarFicha = async () => {
    if (!fichaPartner || savingFicha) return
    setSavingFicha(true)
    try {
      const response = await fetch(`/api/admin/partners/${fichaPartner.id}`, {
        method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome_responsavel: fichaForm.nome, telefone_whatsapp: fichaForm.telefone,
          empresa_nif: fichaForm.nif, provincia: fichaForm.provincia,
          modalidade: fichaForm.modalidade, status: fichaForm.status, nota: fichaForm.nota,
          volume_vendas: Number(fichaForm.vendas) || 0, clientes_angariados: Number(fichaForm.clientes) || 0,
        }),
      })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(body.error || 'Falha ao guardar a ficha')
      const actualizado = body.parceiro as Partner
      setPartners(prev => prev.map(p => p.id === actualizado.id ? { ...p, ...actualizado } : p))
      setFichaPartner(actualizado)
      notify('Ficha do parceiro guardada')
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Erro ao guardar a ficha')
    } finally {
      setSavingFicha(false)
    }
  }

  const criarParceiroNovo = async () => {
    if (savingNovaParceiro) return
    setSavingNovaParceiro(true)
    try {
      const r = await fetch('/api/admin/partners', {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome_responsavel: novaParceiroForm.nome, telefone_whatsapp: novaParceiroForm.telefone,
          empresa_nif: novaParceiroForm.nif, provincia: novaParceiroForm.provincia,
          modalidade: novaParceiroForm.modalidade, nota: novaParceiroForm.nota,
        }),
      })
      const body = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(body.error || 'Falha a inscrever parceiro')
      setPartners(prev => [body.parceiro as Partner, ...prev])
      setNovaParceiro(false)
      setNovaParceiroForm({ nome: '', telefone: '', nif: '', provincia: '', modalidade: 'Individual', nota: '' })
      notify('Parceiro inscrito na carteira da revenda')
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Erro a inscrever parceiro')
    } finally {
      setSavingNovaParceiro(false)
    }
  }

  const atribuirLicenca = async () => {
    if (!fichaPartner || !licNovaId) return
    try {
      const r = await fetch(`/api/admin/licenses/${licNovaId}`, {
        method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parceiro_id: fichaPartner.id }),
      })
      const body = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(body.error || 'Falha ao atribuir a licença')
      setLicenses(prev => prev.map(l => l.id === licNovaId ? { ...l, parceiro_id: fichaPartner.id } : l))
      setLicNovaId('')
      notify('Licença atribuída ao parceiro')
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Erro ao atribuir a licença')
    }
  }

  const removerLicencaParceiro = async (licId: string) => {
    if (!fichaPartner) return
    try {
      const r = await fetch(`/api/admin/licenses/${licId}`, {
        method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parceiro_id: null }),
      })
      const body = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(body.error || 'Falha ao remover a licença do parceiro')
      setLicenses(prev => prev.map(l => l.id === licId ? { ...l, parceiro_id: null } : l))
      notify('Licença devolvida à carteira livre')
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Erro ao remover a licença')
    }
  }

  // Utilizadores do painel (Super Admin)
  const ROLES: AdminUserRow['role'][] = ['super_admin', 'gestor', 'tecnico', 'developer']
  const labelRole = (role: string) => (role === 'super_admin' ? 'Super Admin' : role === 'gestor' ? 'Gestor Comercial' : role === 'developer' ? 'Developer · Master' : role === 'tecnico' ? 'Técnico de Suporte' : role)

  const createUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSavingUser(true)
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userForm),
      })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(body.error || 'Falha ao criar o utilizador')
      setUsers(prev => [...prev, body.user])
      notify(`Utilizador ${body.user.name} criado`)
      setShowUserForm(false)
      setUserForm({ name: '', email: '', password: '', role: 'gestor' })
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Erro ao criar o utilizador')
    } finally {
      setSavingUser(false)
    }
  }

  const updateUser = async (user: AdminUserRow, payload: Partial<{ name: string; role: string; is_active: boolean; password: string }>) => {
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(body.error || 'Falha ao actualizar o utilizador')
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, ...body.user } : u))
      notify(payload.is_active !== undefined ? (payload.is_active ? 'Utilizador activado' : 'Utilizador desactivado') : 'Utilizador actualizado')
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Erro ao actualizar o utilizador')
    }
  }

  const handlePwReset = async () => {
    if (!pwResetUser) return
    if (pwResetForm.pw.length < 8) { notify('A nova password precisa de pelo menos 8 caracteres'); return }
    if (pwResetForm.pw !== pwResetForm.pw2) { notify('As passwords não coincidem'); return }
    try {
      const response = await fetch(`/api/admin/users/${pwResetUser.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pwResetForm.pw }),
      })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(body.error || 'Falha ao redefinir a password')
      notify(`Password de ${pwResetUser.name} redefinida`)
      setPwResetUser(null)
      setPwResetForm({ pw: '', pw2: '' })
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Erro ao redefinir a password')
    }
  }

  const handleUserDelete = async () => {
    if (!deletingUserId) return
    try {
      const response = await fetch(`/api/admin/users/${deletingUserId}`, { method: 'DELETE', credentials: 'include' })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(body.error || 'Falha ao eliminar o utilizador')
      setUsers(prev => prev.filter(u => u.id !== deletingUserId))
      notify('Utilizador eliminado')
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Erro ao eliminar o utilizador')
    } finally {
      setDeletingUserId(null)
    }
  }

  // Pedidos de licença B2B (Super Admin + Gestor Comercial)
  const orderLabelStatus = (status: string) => ({ Pendente: 'Pendente', 'Em Verificação': 'Em verificação', Aprovado: 'Aprovado', Pago: 'Pago', Rejeitado: 'Rejeitado' } as Record<string, string>)[status] || status
  const waLinkAdmin = (phone: string, order: LicenseOrder) => {
    const num = phone.replace(/[^\d]/g, '')
    const full = num.startsWith('244') ? num : '244' + num
    return `https://wa.me/${full}?text=${encodeURIComponent(`Olá ${order.nome_responsavel}! Falamos da CFTEC sobre o pedido de licença ${order.id.slice(0, 8).toUpperCase()} (${order.software_nome}) para ${order.nome_empresa}.`)}`.replace(/'/g, '%27')
  }

  const updateOrderStatus = async (order: LicenseOrder, status: string) => {
    try {
      const response = await fetch(`/api/admin/license-orders/${order.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(body.error || 'Falha ao actualizar o pedido')
      setLicenseOrders(prev => prev.map(o => o.id === order.id ? { ...o, ...body.pedido } : o))
      const mail = typeof body.emailCliente === 'string' ? body.emailCliente : 'nenhum'
      notify(`Pedido ${order.id.slice(0, 8).toUpperCase()} → ${status}${mail === 'enviado' ? ' · e-mail enviado ao cliente' : ''}`)
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Erro ao actualizar o pedido')
    }
  }

  const handleOrderDelete = async () => {
    if (!deletingOrderId) return
    try {
      const response = await fetch(`/api/admin/license-orders/${deletingOrderId}`, { method: 'DELETE', credentials: 'include' })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(body.error || 'Falha ao eliminar o pedido')
      setLicenseOrders(prev => prev.filter(o => o.id !== deletingOrderId))
      knownOrderIdsRef.current = knownOrderIdsRef.current.filter(id => id !== deletingOrderId)
      notify('Pedido eliminado')
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Erro ao eliminar o pedido')
    } finally {
      setDeletingOrderId(null)
    }
  }

  // Actualização "tempo real" dos pedidos (polling seguro a cada 20 s
  // — o Realtime do Supabase exigiria leitura pública da tabela de B2B)
  const loadLicenseOrders = async (silent = true) => {
    try {
      const response = await fetch('/api/admin/license-orders', { credentials: 'include' })
      if (!response.ok) return
      const data = await response.json()
      if (!Array.isArray(data)) return
      const known = new Set(knownOrderIdsRef.current)
      const novos = known.size ? data.filter(o => !known.has(o.id)) : []
      if (novos.length) {
        const nomes = novos.map(n => n.empresa || n.id.slice(0, 8).toUpperCase()).join(', ')
        notify(`Novo(s) pedido(s) de licença recebido(s): ${nomes}`)
        alertaDispositivo('pedido', '📋 Novo pedido de licença', `${nomes} — verifique na secção Pedidos.`)
      }
      setLicenseOrders(data)
      knownOrderIdsRef.current = data.map(o => o.id)
    } catch { /* silencioso */ }
  }

  // Licenciamento — leitura periódica do estado dos módulos/licença definido pelo developer
  const loadSysLic = async () => {
    try {
      const r = await fetch('/api/admin/system-license', { credentials: 'include' })
      if (!r.ok) return
      const b = await r.json()
      setSysLic(b)
      // sincroniza as regras de contrato com o estado do servidor (primeira leitura real)
      if (!regrasSyncedRef.current) {
        regrasSyncedRef.current = true
        setRegrasForm({ diasAviso: String(b.diasAviso ?? 5), maxUsuarios: String(b.maxUsuarios ?? 0), maxStorageMb: String(b.maxStorageMb ?? 0) })
      }
    } catch { /* silencioso — mantém o último estado conhecido */ }
  }
  // cópias de segurança — o backup sai DIRECTO para o computador do developer (nada fica no servidor)
  const exportarBackup = async () => {
    if (baixandoBackup) return
    setBaixandoBackup(true)
    try {
      const r = await fetch('/api/admin/backup', { credentials: 'include' })
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || 'Falha a gerar a cópia de segurança')
      const blob = await r.blob()
      const agora = new Date()
      const stamp = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}-${String(agora.getDate()).padStart(2, '0')} ${String(agora.getHours()).padStart(2, '0')}h${String(agora.getMinutes()).padStart(2, '0')}`
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `cftec-backup-${stamp}.json`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      notify('Cópia de segurança descarregada — guarde o ficheiro num local seguro (disco externo ou nuvem privada)')
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Erro ao exportar a cópia de segurança')
    } finally {
      setBaixandoBackup(false)
    }
  }

  const guardarLicenca = async (parcial: Partial<SysLic>) => {
    try {
      const response = await fetch('/api/admin/system-license', {
        method: 'PATCH', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parcial),
      })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(body.error || 'Falha ao actualizar a licença')
      setSysLic(body)
      setRegrasForm({ diasAviso: String(body.diasAviso ?? 5), maxUsuarios: String(body.maxUsuarios ?? 0), maxStorageMb: String(body.maxStorageMb ?? 0) })
      notify('Licença actualizada — efeitos em todos os painéis imediatamente')
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Erro ao actualizar a licença')
    }
  }

  // guardar as REGRAS DE CONTRATO (vencimento automático + quotas + read-only)
  const guardarRegras = async (parcial: { somenteLeitura?: boolean } = {}) => {
    await guardarLicenca({
      diasAviso: Math.max(0, Math.min(30, Math.round(Number(regrasForm.diasAviso) || 0))),
      maxUsuarios: Math.max(0, Math.min(999, Math.round(Number(regrasForm.maxUsuarios) || 0))),
      maxStorageMb: Math.max(0, Math.min(999999, Math.round(Number(regrasForm.maxStorageMb) || 0))),
      ...parcial,
    })
  }

  // CÓDIGO DE EMERGÊNCIA MESTRO — gerar (developer) / usar (ecrã de bloqueio)
  const gerarCodigoMaster = async () => {
    if (gerandoCodigo) return
    setGerandoCodigo(true)
    try {
      const r = await fetch('/api/admin/licenca-bypass/generate', { method: 'POST', credentials: 'include' })
      const b = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(b.error || 'Falha a gerar o código de emergência')
      setCodigoMaster(b.codigo)
      notify(`Código gerado — válido até ${new Date(b.expiraEm).toLocaleString('pt-PT')}`)
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Erro ao gerar o código')
    } finally {
      setGerandoCodigo(false)
    }
  }
  const usarCodigoEmergencia = async () => {
    if (!codigoEmergencia.trim() || enviandoCodigo) return
    setEnviandoCodigo(true)
    try {
      const r = await fetch('/api/admin/licenca-bypass', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigo: codigoEmergencia.trim() }),
      })
      const b = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(b.error || 'Código inválido ou expirado')
      notify('Acesso de emergência activo por 48 horas — a reentrar…')
      setTimeout(() => window.location.reload(), 700)
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Erro ao validar o código')
    } finally {
      setEnviandoCodigo(false)
    }
  }

  const loadChamadosLeve = async () => {
    try {
      const r = await fetch('/api/admin/chamados', { credentials: 'include' })
      if (!r.ok) return
      const data = await r.json()
      const known = new Set(knownChamadosRef.current)
      const novos = known.size ? data.filter((c: { id: string }) => !known.has(c.id)) : []
      if (novos.length) {
        const nomes = novos.map((c: { cliente?: string; id: string }) => c.cliente || c.id.slice(0, 8).toUpperCase()).join(', ')
        notify(`Novo(s) chamado(s) de suporte: ${nomes}`)
        alertaDispositivo('chamado', '🛠️ Novo chamado de suporte', `${nomes} — verifique na secção Chamados.`)
      }
      setChamados(data)
      knownChamadosRef.current = data.map((c: { id: string }) => c.id)
    } catch { /* silencioso */ }
  }

  useEffect(() => {
    if (!adminUser) return
    // polling 20 s: pedidos (comercial) + chamados (técnico) + licença do developer — actualização sem F5
    const timer = window.setInterval(() => { loadLicenseOrders(false); loadChamadosLeve(); loadSysLic(); loadUpgradePedidos(); if (auditVisivelRef.current) void loadAudit() }, 20000)
    return () => window.clearInterval(timer)
  }, [adminUser])

  // cada papel entra directo na sua área: comercial → pedidos | técnico → chamados
  const roleLandedRef = useRef(false)
  useEffect(() => {
    if (authStatus !== 'authenticated' || !adminUser || roleLandedRef.current) return
    roleLandedRef.current = true
    void loadWiki()
    void loadSysLic()
    if (adminUser.level === 'gestor') setActiveSection('pedidos')
    else if (adminUser.level === 'tecnico') setActiveSection('chamados')
    else if (adminUser.level === 'developer') setActiveSection('developer')
  }, [authStatus, adminUser])

  // Modais — ESC fecha o do topo; backdrop desactiva o scroll da página
  const anyModalOpen = !!(notifOpen || (showServiceForm !== false) || showUserForm || pwResetUser || showLicenseForm || showSoftwareForm || showDestaqueForm || showBlogForm || showWikiForm || showChamadoForm || deletingServiceId || deletingOrderId || deletingContactId || deletingSoftwareId || deletingLicenseId || deletingPartnerId || deletingUserId || deletingDestaqueId || deletingBlogId || deletingWikiId || deletingChamadoId)
  useEffect(() => {
    document.body.style.overflow = anyModalOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [anyModalOpen])
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      if (deletingServiceId) setDeletingServiceId(null)
      else if (deletingOrderId) setDeletingOrderId(null)
      else if (deletingContactId) setDeletingContactId(null)
      else if (deletingSoftwareId) setDeletingSoftwareId(null)
      else if (deletingLicenseId) setDeletingLicenseId(null)
      else if (deletingPartnerId) setDeletingPartnerId(null)
      else if (deletingUserId) setDeletingUserId(null)
      else if (deletingDestaqueId) setDeletingDestaqueId(null)
      else if (deletingBlogId) setDeletingBlogId(null)
      else if (notifOpen) setNotifOpen(false)
      else if (showServiceForm !== false) setShowServiceForm(false)
      else if (showUserForm) setShowUserForm(false)
      else if (pwResetUser) setPwResetUser(null)
      else if (showLicenseForm) setShowLicenseForm(false)
      else if (showDestaqueForm) setShowDestaqueForm(false)
      else if (showBlogForm) setShowBlogForm(false)
      else if (showSoftwareForm) setShowSoftwareForm(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [deletingServiceId, deletingOrderId, deletingContactId, deletingSoftwareId, deletingLicenseId, deletingPartnerId, deletingUserId, deletingDestaqueId, deletingBlogId, notifOpen, showServiceForm, showUserForm, pwResetUser, showLicenseForm, showDestaqueForm, showBlogForm, showSoftwareForm])

  // Blog / CMS
  const openBlogForm = (post: BlogPost | null) => {
    setEditingBlog(post)
    setBlogForm(post ? {
      title: post.title, excerpt: post.excerpt, content: '',
      category: post.category || '', author: post.author || 'Equipa CFTEC', isPublished: post.is_published,
      cover: null, coverNome: '',
    } : { ...emptyBlogForm, cover: null, coverNome: '' })
    setShowBlogForm(true)
  }

  const selectBlogCover = (file: File | null) => {
    if (!file) { setBlogForm(f => ({ ...f, cover: null, coverNome: '' })); return }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { notify('Formato inválido — use JPEG, PNG ou WebP'); return }
    if (file.size > 10 * 1024 * 1024) { notify('Imagem excede 10 MB'); return }
    setBlogForm(f => ({ ...f, cover: file, coverNome: file.name }))
  }

  const saveBlogPost = async () => {
    const form = document.getElementById('modal-blog') as HTMLDivElement | null
    if (!editingBlog) {
      const content = (form?.querySelector('textarea[name="blog-content"]') as HTMLTextAreaElement | null)?.value || ''
      blogForm.content = content
    }
    if (!blogForm.title.trim()) { notify('Escreva o título do artigo'); return }
    if (!editingBlog && (!blogForm.excerpt.trim() || !blogForm.content.trim())) { notify('Resumo e conteúdo são obrigatórios no novo artigo'); return }
    setSavingBlog(true)
    try {
      let coverUrl = editingBlog?.cover_url || ''
      if (blogForm.cover) {
        const fd = new FormData()
        fd.append('file', blogForm.cover)
        const mediaRes = await fetch('/api/admin/media', { method: 'POST', credentials: 'include', body: fd })
        const mediaBody = await mediaRes.json().catch(() => ({}))
        if (!mediaRes.ok) throw new Error(mediaBody.error || 'Falha no upload da capa')
        coverUrl = mediaBody.media?.file_path || ''
        if (!coverUrl) throw new Error('O upload não devolveu o URL da capa')
      }
      if (editingBlog) {
        const response = await fetch(`/api/admin/blog/${editingBlog.id}`, {
          method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: blogForm.title.trim(), excerpt: blogForm.excerpt.trim(),
            category: blogForm.category.trim(), author: blogForm.author.trim(), is_published: blogForm.isPublished,
            ...(coverUrl ? { cover_url: coverUrl } : {}),
          }),
        })
        const body = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(body.error || 'Falha ao actualizar o artigo')
        setBlogPosts(prev => prev.map(p => p.id === editingBlog.id ? { ...p, ...body.post } : p))
        notify(body.post.is_published ? 'Artigo actualizado — publicado no site' : 'Artigo actualizado (rascunho)')
      } else {
        const response = await fetch('/api/admin/blog', {
          method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: blogForm.title.trim(), excerpt: blogForm.excerpt.trim(), content: blogForm.content,
            category: blogForm.category.trim(), author: blogForm.author.trim(), is_published: blogForm.isPublished,
            cover_url: coverUrl || undefined,
          }),
        })
        const body = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(body.error || 'Falha ao criar o artigo')
        setBlogPosts(prev => [body.post, ...prev])
        notify(body.post.is_published ? 'Artigo publicado no site' : 'Rascunho guardado')
      }
      setShowBlogForm(false)
      setEditingBlog(null)
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Erro ao guardar o artigo')
    } finally {
      setSavingBlog(false)
    }
  }

  const toggleBlogPublish = async (post: BlogPost) => {
    try {
      const response = await fetch(`/api/admin/blog/${post.id}`, {
        method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_published: !post.is_published }),
      })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(body.error || 'Falha ao publicar o artigo')
      setBlogPosts(prev => prev.map(p => p.id === post.id ? { ...p, ...body.post } : p))
      notify(body.post.is_published ? 'Artigo publicado — visível no site' : 'Artigo despublicado (apenas rascunho no painel)')
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Erro ao alternar publicação')
    }
  }

  const handleBlogDelete = async () => {
    if (!deletingBlogId) return
    try {
      const response = await fetch(`/api/admin/blog/${deletingBlogId}`, { method: 'DELETE', credentials: 'include' })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(body.error || 'Falha ao eliminar o artigo')
      setBlogPosts(prev => prev.filter(p => p.id !== deletingBlogId))
      notify('Artigo eliminado')
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Erro ao eliminar o artigo')
    } finally {
      setDeletingBlogId(null)
    }
  }

  // Destaques & Novidades (carrossel do site)
  const openDestaqueForm = (item: Destaque | null) => {
    setEditingDestaque(item)
    setDestaqueForm(item ? {
      titulo: item.titulo,
      descricao: item.descricao,
      linkBotao: item.link_botao || '',
      textoBotao: item.texto_botao || 'Saber Mais',
      ordem: String(item.ordem || 1),
      ativo: item.ativo,
      imagem: null,
      imagemNome: '',
    } : { ...emptyDestaqueForm, imagem: null, imagemNome: '' })
    setShowDestaqueForm(true)
  }

  const selectDestaqueImage = (file: File | null) => {
    if (!file) { setDestaqueForm(f => ({ ...f, imagem: null, imagemNome: '' })); return }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { notify('Formato inválido — use JPEG, PNG ou WebP'); return }
    if (file.size > 10 * 1024 * 1024) { notify('Imagem excede 10 MB'); return }
    setDestaqueForm(f => ({ ...f, imagem: file, imagemNome: file.name }))
  }

  const saveDestaque = async () => {
    if (!destaqueForm.imagem && !editingDestaque) { notify('Seleccione a imagem do destaque'); return }
    setSavingDestaque(true)
    try {
      let imagemUrl = editingDestaque?.imagem_url || ''
      if (destaqueForm.imagem) {
        const fd = new FormData()
        fd.append('file', destaqueForm.imagem)
        const mediaRes = await fetch('/api/admin/media', { method: 'POST', credentials: 'include', body: fd })
        const mediaBody = await mediaRes.json().catch(() => ({}))
        if (!mediaRes.ok) throw new Error(mediaBody.error || 'Falha no upload da imagem')
        imagemUrl = mediaBody.media?.file_path || mediaBody.file_path || mediaBody.item?.file_path || ''
        if (!imagemUrl) throw new Error('O upload não devolveu o URL da imagem')
      }
      const payloadBruto: Record<string, unknown> = {
        titulo: destaqueForm.titulo.trim(),
        descricao: destaqueForm.descricao.trim(),
        link_botao: destaqueForm.linkBotao.trim(),
        texto_botao: destaqueForm.textoBotao.trim() || 'Saber Mais',
        ativo: destaqueForm.ativo,
        ordem: Number(destaqueForm.ordem) || 1,
      }
      if (editingDestaque) {
        const response = await fetch(`/api/admin/destaques/${editingDestaque.id}`, {
          method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(destaqueForm.imagem ? { ...payloadBruto, imagem_url: imagemUrl } : payloadBruto),
        })
        const body = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(body.error || 'Falha ao actualizar o destaque')
        setDestaques(prev => prev.map(d => d.id === editingDestaque.id ? { ...d, ...body.destaque } : d))
        notify('Destaque actualizado')
      } else {
        const response = await fetch('/api/admin/destaques', {
          method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payloadBruto, imagem_url: imagemUrl }),
        })
        const body = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(body.error || 'Falha ao criar o destaque')
        setDestaques(prev => [...prev, body.destaque])
        notify('Destaque criado — já aparece no site')
      }
      setShowDestaqueForm(false)
      setEditingDestaque(null)
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Erro ao guardar o destaque')
    } finally {
      setSavingDestaque(false)
    }
  }

  const toggleDestaque = async (item: Destaque) => {
    try {
      const response = await fetch(`/api/admin/destaques/${item.id}`, {
        method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ativo: !item.ativo }),
      })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(body.error || 'Falha ao alternar o destaque')
      setDestaques(prev => prev.map(d => d.id === item.id ? { ...d, ...body.destaque } : d))
      notify(body.destaque.ativo ? 'Destaque activo no site' : 'Destaque desactivado')
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Erro ao alternar o destaque')
    }
  }

  const moveDestaque = async (item: Destaque, dir: 'up' | 'down') => {
    const sorted = [...destaques].sort((a, b) => a.ordem - b.ordem || +new Date(b.created_at) - +new Date(a.created_at))
    const idx = sorted.findIndex(d => d.id === item.id)
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= sorted.length) return
    const other = sorted[swapIdx]
    try {
      const applyOrder = (id: string, ordem: number) => fetch(`/api/admin/destaques/${id}`, { method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ordem }) })
      await Promise.all([applyOrder(item.id, other.ordem), applyOrder(other.id, item.ordem)])
      setDestaques(prev => prev.map(d => d.id === item.id ? { ...d, ordem: other.ordem } : d.id === other.id ? { ...d, ordem: item.ordem } : d))
      notify('Ordem actualizada')
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Erro a reordenar')
    }
  }

  const handleDestaqueDelete = async () => {
    if (!deletingDestaqueId) return
    try {
      const response = await fetch(`/api/admin/destaques/${deletingDestaqueId}`, { method: 'DELETE', credentials: 'include' })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(body.error || 'Falha ao eliminar o destaque')
      setDestaques(prev => prev.filter(d => d.id !== deletingDestaqueId))
      notify('Destaque eliminado')
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Erro ao eliminar o destaque')
    } finally {
      setDeletingDestaqueId(null)
    }
  }

  // Software Modal Handlers
  const [softwareFormState, setSoftwareFormState] = useState({
    name: '',
    version: '',
    price: '',
    description: '',
    category: '',
    changelog: '',
    file: null as File | null,
    fileName: '',
    progress: -1,
    isLoading: false,
    errors: {} as Record<string, string>,
  })

  const handleSoftwareInputChange = (field: string, value: string | File | null) => {
    setSoftwareFormState(prev => ({
      ...prev,
      [field]: value,
      errors: { ...prev.errors, [field]: '' },
    }))
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null
    if (file) {
      const validTypes = ['application/zip', 'application/x-zip-compressed', 'application/x-msdownload', 'application/octet-stream']
      const maxSize = 50 * 1024 * 1024 // 50MB — limite por ficheiro do Supabase (plano Free)
      
      if (!validTypes.includes(file.type) && !file.name.match(/\.(zip|exe)$/i)) {
        setSoftwareFormState(prev => ({
          ...prev,
          errors: { ...prev.errors, file: 'Apenas ficheiros .zip ou .exe são permitidos' },
          fileName: '',
          file: null,
        }))
        return
      }
      if (file.size > maxSize) {
        setSoftwareFormState(prev => ({
          ...prev,
          errors: { ...prev.errors, file: 'O ficheiro excede o limite de 50 MB por ficheiro do Supabase (plano Free). Comprime o instalador ou reduz o pacote.' },
          fileName: '',
          file: null,
        }))
        return
      }
      setSoftwareFormState(prev => ({
        ...prev,
        file,
        fileName: file.name,
        errors: { ...prev.errors, file: '' },
      }))
    }
  }

  const validateSoftwareForm = () => {
    const errors: Record<string, string> = {}
    if (!softwareFormState.name.trim()) errors.name = 'Nome é obrigatório'
    if (!softwareFormState.version.trim()) errors.version = 'Versão é obrigatória'
    if (!softwareFormState.price.trim()) errors.price = 'Preço é obrigatório'
    if (!softwareFormState.description.trim()) errors.description = 'Descrição é obrigatória'
    if (!editingSoftware && !softwareFormState.file) errors.file = 'Ficheiro do instalador é obrigatório'

    setSoftwareFormState(prev => ({ ...prev, errors }))
    return Object.keys(errors).length === 0
  }

  const handleSoftwareSubmit = async () => {
    if (!validateSoftwareForm()) return

    setSoftwareFormState(prev => ({ ...prev, isLoading: true }))

    // Optimistic update for new software
    let tempSoftware: Software | null = null
    if (!editingSoftware) {
      tempSoftware = {
        id: `temp-${Date.now()}`,
        name: softwareFormState.name.trim(),
        version: softwareFormState.version.trim(),
        description: null,
        price: null,
        file_size: softwareFormState.file ? `${(softwareFormState.file.size / 1024 / 1024).toFixed(2)} MB` : '0 MB',
        downloads_count: 0,
        created_at: new Date().toISOString()
      }
      setSoftware(prev => [tempSoftware!, ...prev])
      setSummary(prev => ({ ...prev, softwares: prev.softwares + 1 }))
    }

    try {
      let response: Response
      if (editingSoftware) {
        // Edição: PATCH em JSON (sem substituição de ficheiro)
        response = await fetch(`/api/admin/software/${editingSoftware.id}`, {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: softwareFormState.name.trim(),
            version: softwareFormState.version.trim(),
            price: Number(softwareFormState.price.replace(',', '.')),
            description: softwareFormState.description.trim(),
            category: softwareFormState.category.trim() || null,
            changelog: softwareFormState.changelog.trim() || null,
          }),
        })
      } else {
        // Upload DIRECTO do browser ao bucket via URL assinado (sem passar pelo dev-server) + metadados JSON
        const urlRes = await fetch('/api/admin/software/upload-url', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filename: softwareFormState.fileName || 'instalador.zip', size: softwareFormState.file?.size || undefined }),
        })
        const urlBody = await urlRes.json().catch(() => ({}))
        if (!urlRes.ok || !urlBody.ok) throw new Error(urlBody.error || 'Falha ao preparar o upload')
        setSoftwareFormState(prev => ({ ...prev, progress: 0 }))
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest()
          xhr.open('PUT', urlBody.signedUrl)
          xhr.upload.onprogress = (ev) => {
            if (ev.lengthComputable) {
              const pct = Math.round((ev.loaded / ev.total) * 100)
              setSoftwareFormState(prev => ({ ...prev, progress: pct }))
            }
          }
          xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error('Falha ao enviar o ficheiro ao storage (HTTP ' + xhr.status + ')')))
          xhr.onerror = () => reject(new Error('A rede interrompeu o upload do ficheiro.'))
          xhr.send(softwareFormState.file)
        })

        response = await fetch('/api/admin/software', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: softwareFormState.name.trim(),
            version: softwareFormState.version.trim(),
            price: softwareFormState.price.trim().replace(',', '.'),
            description: softwareFormState.description.trim(),
            category: softwareFormState.category.trim(),
            changelog: softwareFormState.changelog.trim(),
            storage_path: urlBody.path,
            file_size: `${(softwareFormState.file!.size / 1024 / 1024).toFixed(2)} MB`,
          }),
        })
      }

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Falha ao guardar software')
      }

      notify(editingSoftware ? 'Software actualizado com sucesso' : 'Software criado com sucesso')

      // Full sync from server
      await loadDashboardData()
      window.dispatchEvent(new CustomEvent('cftec-refresh-data'))

      setShowSoftwareForm(false)
      setEditingSoftware(null)
      resetSoftwareForm()
    } catch (error) {
      // Rollback optimistic update on error
      if (tempSoftware) {
        setSoftware(prev => prev.filter(s => s.id !== tempSoftware!.id))
        setSummary(prev => ({ ...prev, softwares: prev.softwares - 1 }))
      }
      notify(error instanceof Error ? error.message : 'Erro ao guardar software')
    } finally {
      setSoftwareFormState(prev => ({ ...prev, isLoading: false }))
    }
  }

  const resetSoftwareForm = () => {
    setSoftwareFormState({
      name: '',
      version: '',
      price: '',
      description: '',
      category: '',
      changelog: '',
      file: null,
      fileName: '',
      progress: -1,
      isLoading: false,
      errors: {},
    })
  }

  // Software Modal Component
  function SoftwareModal({ isOpen, onClose, onSubmit }: { 
    isOpen: boolean; 
    onClose: () => void; 
    onSubmit: () => void;
  }) {
    if (!isOpen) return null

    return (
      <div className="admin-modal-backdrop" onMouseDown={onClose}>
        <div className="admin-modal admin-modal--lg" onMouseDown={e => e.stopPropagation()}>
          <div className="admin-modal-head">
            <div>
              <span className="admin-panel-kicker">{editingSoftware ? 'EDITAR REGISTO' : 'NOVO REGISTO'}</span>
              <h2>{editingSoftware ? `Editar ${editingSoftware.name}` : 'Adicionar Software'}</h2>
            </div>
            <button onClick={onClose} className="admin-modal-close" aria-label="Fechar">
              <X size={18} />
            </button>
          </div>
          
          <form onSubmit={e => { e.preventDefault(); onSubmit() }}>
            <div className="admin-modal-body">
              {/* Section 1: Basic Info */}
              <fieldset className="admin-form-section">
                <legend><Hash size={16} /> Informações Básicas</legend>
                <div className="admin-form-grid">
                  <div className="admin-form-field">
                    <Label htmlFor="sw-name">Nome do Software</Label>
                    <div className="admin-input-wrapper">
                      <Package size={18} className="admin-input-icon" />
                      <Input
                        id="sw-name"
                        value={softwareFormState.name}
                        onChange={e => handleSoftwareInputChange('name', e.target.value)}
                        placeholder="Ex.: CFTEC Flow"
                        required
                        className={softwareFormState.errors.name ? 'admin-input-error' : ''}
                      />
                    </div>
                    {softwareFormState.errors.name && (
                      <p className="admin-field-error">{softwareFormState.errors.name}</p>
                    )}
                  </div>
                  
                  <div className="admin-form-field">
                    <Label htmlFor="sw-version">Versão</Label>
                    <div className="admin-input-wrapper">
                      <Hash size={18} className="admin-input-icon" />
                      <Input
                        id="sw-version"
                        value={softwareFormState.version}
                        onChange={e => handleSoftwareInputChange('version', e.target.value)}
                        placeholder="Ex.: v2.5"
                        required
                        className={softwareFormState.errors.version ? 'admin-input-error' : ''}
                      />
                    </div>
                    {softwareFormState.errors.version && (
                      <p className="admin-field-error">{softwareFormState.errors.version}</p>
                    )}
                  </div>
                  
                  <div className="admin-form-field">
                    <Label htmlFor="sw-price">Preço</Label>
                    <div className="admin-input-wrapper">
                      <DollarSign size={18} className="admin-input-icon" />
                      <Input
                        id="sw-price"
                        type="number"
                        step="0.01"
                        min="0"
                        value={softwareFormState.price}
                        onChange={e => handleSoftwareInputChange('price', e.target.value)}
                        placeholder="0.00"
                        required
                        className={softwareFormState.errors.price ? 'admin-input-error' : ''}
                      />
                    </div>
                    {softwareFormState.errors.price && (
                      <p className="admin-field-error">{softwareFormState.errors.price}</p>
                    )}
                  </div>
                </div>
              </fieldset>

              {/* Section 2: File Upload */}
              <fieldset className="admin-form-section">
                <legend><FileText size={16} /> Ficheiro do Instalador</legend>
                {editingSoftware ? (
                  <p className="admin-field-hint">
                    O instalador actual (<code>{editingSoftware.file_url?.split('/').pop() || editingSoftware.file_size}</code>) é mantido. Para o substituir elimine este software e volte a criá-lo.
                  </p>
                ) : (
                <div className="admin-file-upload">
                  <input
                    type="file"
                    id="sw-file"
                    accept=".zip,.exe"
                    onChange={handleFileChange}
                    disabled={softwareFormState.isLoading}
                    className="admin-file-input"
                  />
                  <label 
                    htmlFor="sw-file" 
                    className={`admin-file-label ${softwareFormState.fileName ? 'has-file' : ''}`}
                  >
                    {softwareFormState.fileName ? (
                      <>
                        <div className="admin-file-info">
                          <FileText size={20} className="admin-file-icon" />
                          <div>
                            <span className="admin-file-name">{softwareFormState.fileName}</span>
                            <span className="admin-file-size">
                              {(softwareFormState.file?.size || 0 / 1024 / 1024).toFixed(2)} MB
                            </span>
                          </div>
                        </div>
                        <button 
                          type="button" 
                          onClick={() => handleSoftwareInputChange('file', null)}
                          className="admin-file-remove"
                          aria-label="Remover ficheiro"
                        >
                          <X size={16} />
                        </button>
                      </>
                    ) : (
                      <>
                        <UploadCloud size={32} className="admin-upload-icon" />
                        <strong>Arraste o ficheiro aqui</strong>
                        <span>ou clique para seleccionar · .zip, .exe até 50 MB (com barra de progresso)</span>
                      </>
                    )}
                  </label>
                  {softwareFormState.errors.file && (
                    <p className="admin-field-error">{softwareFormState.errors.file}</p>
                  )}
                  {softwareFormState.progress >= 0 && softwareFormState.isLoading && (
                    <div className="admin-upload-progress">
                      <div className="admin-upload-progress-bar"><i style={{ width: `${softwareFormState.progress}%` }} /></div>
                      <span>{softwareFormState.progress < 100 ? `A carregar para o storage… ${softwareFormState.progress}%` : 'A concluir o registo…'}</span>
                    </div>
                  )}
                </div>
                )}
              </fieldset>

              {/* Section 3: Category & Description */}
              <fieldset className="admin-form-section">
                <legend><FileText size={16} /> Categoria & Descrição</legend>
                <div className="admin-form-grid">
                  <div className="admin-form-field admin-form-field--full">
                    <Label htmlFor="sw-category">Categoria / Etiqueta</Label>
                    <select
                      id="sw-category"
                      value={softwareFormState.category}
                      onChange={e => handleSoftwareInputChange('category', e.target.value)}
                      className="admin-category-select"
                    >
                      <option value="">— Sem categoria —</option>
                      <option value="PalancaSoft">PalancaSoft (software próprio)</option>
                      <option value="Oficial AGT">Oficial AGT (Negomil)</option>
                      <option value="Utilitário AGT">Utilitário AGT</option>
                      <option value="Versão Demo">Versão Demo</option>
                      <option value="Estável">Estável</option>
                    </select>
                    <p className="admin-field-hint">Dinamiza as etiquetas dos cards no site público.</p>
                  </div>
                </div>
                <div className="admin-form-field admin-form-field--full">
                  <Label htmlFor="sw-description">Descrição Detalhada</Label>
                  <Textarea
                    id="sw-description"
                    value={softwareFormState.description}
                    onChange={e => handleSoftwareInputChange('description', e.target.value)}
                    placeholder="Descreva o software, funcionalidades principais, requisitos de sistema..."
                    rows={5}
                    required
                    className={softwareFormState.errors.description ? 'admin-input-error' : ''}
                  />
                  {softwareFormState.errors.description && (
                    <p className="admin-field-error">{softwareFormState.errors.description}</p>
                  )}
                  <p className="admin-field-hint">Máximo 2000 caracteres • Suporta Markdown básico</p>
                </div>
                <div className="admin-form-field admin-form-field--full">
                  <Label htmlFor="sw-changelog">Notas da versão (changelog)</Label>
                  <Textarea
                    id="sw-changelog"
                    value={softwareFormState.changelog}
                    onChange={e => handleSoftwareInputChange('changelog', e.target.value)}
                    placeholder="Ex.: v2.4.1 — Correção do emissor de facturas; novo relatório de IVA..."
                    rows={3}
                  />
                  <p className="admin-field-hint">Aparece no site quando o software tem instalador público.</p>
                </div>
              </fieldset>
            </div>

            <div className="admin-modal-actions">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                disabled={softwareFormState.isLoading}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={softwareFormState.isLoading}
                className="admin-btn-primary"
              >
                {softwareFormState.isLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    A guardar...
                  </>
                ) : (
                  <>
                    <Check size={15} />
                    {editingSoftware ? 'Guardar Alterações' : 'Guardar Software'}
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  // Downloads — últimos 14 dias para o gráfico de barras
  const dlDays = downloadMetrics ? Array.from({ length: 14 }, (_, i) => {
    const d = new Date(Date.now() - (13 - i) * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    return { d, n: downloadMetrics.porDia[d] || 0 }
  }) : []
  const dlMax = Math.max(1, ...dlDays.map(x => x.n))

  // Linha do tempo — eventos de todos os módulos (mais recentes primeiro)
  const timeAgo = (iso: string) => {
    const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000)
    if (s < 60) return 'agora mesmo'
    if (s < 3600) return `há ${Math.floor(s / 60)} min`
    if (s < 86400) return `há ${Math.floor(s / 3600)} h`
    if (s < 172800) return 'ontem'
    return new Date(iso).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' })
  }
  type TimelineEvent = { id: string; at: string; icon: typeof Users; title: string; desc: string; tone: string; section: AdminSection; badge: string | null }
  const role = adminUser?.level || 'super_admin'
  // licenciamento: developer vê tudo sempre; outros níveis dependem dos flags do developer
  const ehDev = role === 'developer'
  const MOD_POR_SEC: Partial<Record<AdminSection, 'moduloComercial' | 'moduloTecnico' | 'moduloNovidades'>> = {
    pedidos: 'moduloComercial', relatorios: 'moduloComercial', parceiros: 'moduloComercial',
    chamados: 'moduloTecnico', wiki: 'moduloTecnico',
    blog: 'moduloNovidades', destaques: 'moduloNovidades',
  }
  const modBloqueado = (sec: AdminSection) => {
    const m = MOD_POR_SEC[sec]
    return !!m && !ehDev && !sysLic[m]
  }
  const statMax = role === 'gestor'
    ? Math.max(1, summary.orders || 0, summary.contacts || 0, summary.licenses || 0, summary.partners || 0)
    : role === 'tecnico'
      ? Math.max(1, summary.softwares || 0, summary.services || 0, summary.media || 0, blogPosts.length)
      : Math.max(1, summary.orders || 0, summary.contacts || 0, summary.softwares || 0, summary.licenses || 0)
  const timelineEvents: TimelineEvent[] = ([
    ...contacts.map(c => ({ id: 'ct-' + c.id, at: c.created_at, icon: Users, title: `Novo contacto · ${c.name}`, desc: `${c.email}${c.service_interest ? ' · ' + c.service_interest : ''}`, tone: 'lime', section: 'contactos' as AdminSection, badge: contactStatusLabel(c.status) || c.status })),
    ...licenseOrders.map(o => ({ id: 'or-' + o.id, at: o.created_at, icon: ShoppingCart, title: `Pedido de licença · ${o.nome_empresa}`, desc: `${o.software_nome} · ${o.forma_pagamento}`, tone: 'blue', section: 'pedidos' as AdminSection, badge: orderLabelStatus(o.status) })),
    ...partners.map(p => ({ id: 'pv-' + p.id, at: p.created_at, icon: Network, title: `Candidatura de revenda · ${p.nome_responsavel}`, desc: `${p.modalidade}${p.provincia ? ' · ' + p.provincia : ''}`, tone: 'violet', section: 'parceiros' as AdminSection, badge: p.status === 'pendente' ? 'Pendente' : p.status })),
    ...licenses.map(l => ({ id: 'lc-' + l.id, at: l.created_at, icon: KeyRound, title: `Licença criada · ${l.cliente_nome}`, desc: `${l.chave_licenca} · activa até ${l.data_expiracao || '—'}`, tone: 'lime', section: 'licencas' as AdminSection, badge: l.status === 'activa' ? 'Activa' : l.status })),
    ...media.map(m => ({ id: 'md-' + m.id, at: m.uploaded_at, icon: FileImage, title: `Upload de mídia · ${m.filename}`, desc: `${Math.round(m.file_size / 1024)} KB · ${m.mime_type}`, tone: 'cyan', section: 'media' as AdminSection, badge: null as string | null })),
    ...software.map(s => ({ id: 'sw-' + s.id, at: s.created_at, icon: Package, title: `Software no catálogo · ${s.name}`, desc: `${s.version}${s.description ? ' · ' + s.description : ''}`, tone: 'blue', section: 'software' as AdminSection, badge: null as string | null })),
    ...services.map(s => ({ id: 'sv-' + s.id, at: s.created_at, icon: Code2, title: `Serviço · ${s.title}`, desc: s.short_description, tone: 'violet', section: 'services' as AdminSection, badge: null as string | null })),
    ...blogPosts.map(b => ({ id: 'bl-' + b.id, at: b.published_at || b.updated_at || b.created_at, icon: FileText, title: `Artigo · ${b.title}`, desc: `${b.is_published ? 'Publicado' : 'Rascunho'} · ${b.category || 'sem categoria'} · ${b.author || 'Equipa CFTEC'}`, tone: 'cyan', section: 'blog' as AdminSection, badge: b.is_published ? 'Publicado' : 'Rascunho' })),
    ...destaques.map(d => ({ id: 'ds-' + d.id, at: d.created_at, icon: Sparkles, title: `Destaque ${d.ativo ? 'activa' : 'removido do carrossel'} · ${d.titulo.slice(0, 34)}`, desc: `ordem ${d.ordem} no carrossel do site`, tone: 'violet', section: 'destaques' as AdminSection, badge: d.ativo ? 'Activo' : 'Inactivo' })),
    ...chamados.map(ch => ({ id: 'ck-' + ch.id, at: ch.created_at, icon: LifeBuoy, title: `Chamado de suporte · ${ch.cliente}`, desc: `${ch.software || 'suporte geral'} · ${ch.problema.slice(0, 62)}`, tone: ch.estado === 'Resolvido' ? 'lime' : 'blue', section: 'chamados' as AdminSection, badge: ch.estado })),
  ]).filter((e) => {
    // cada nível vê a linha do tempo da sua área
    if (role === 'gestor') return ['pedidos', 'contactos', 'parceiros', 'licencas'].includes(e.section)
    if (role === 'tecnico') return ['blog', 'media', 'services', 'software', 'destaques', 'chamados'].includes(e.section)
    return true
  }).sort((a, b) => +new Date(b.at) - +new Date(a.at)).slice(0, 18)

  if (authStatus === 'loading') return <div className="admin-auth-shell"><div className="admin-auth-loading"><span className="admin-loading-dot" /> A validar sessão…</div></div>
  if (authStatus === 'unauthenticated') return <AdminLogin onAuthenticated={(user) => { setAdminUser(user); setProfileName(p => p || user.name || ''); setAuthStatus('authenticated') }} />

  return <div className="admin-shell">
    {toast && <div className="admin-toast"><Check size={16} /> {toast}</div>}
    <aside className={`admin-sidebar ${sidebarOpen ? 'admin-sidebar--open' : ''}`}>
      <div className="admin-sidebar-top"><AdminMark /><button className="admin-close" onClick={() => setSidebarOpen(false)} aria-label="Fechar menu"><X size={20} /></button></div>
      <div className="admin-workspace"><span className="admin-avatar">CF</span><div><strong>CFTEC Workspace</strong><small>Plano empresarial <span /></small></div><ChevronRight size={15} /></div>
      <nav className="admin-nav"><span className="admin-nav-label">Workspace</span>{navItems.filter(n => !adminUser?.level || n.levels.includes(adminUser.level)).filter(n => !modBloqueado(n.id)).map(({ id, label, icon: Icon }) => { const navId = String(id); const pendingBadge = summary.contactsUnread || 0; const badgeMap: Record<string, number> = { contactos: pendingBadge, pedidos: (summary.ordersPending || 0) + (summary.ordersVerificacao || 0), parceiros: summary.partnersPending || 0, licencas: summary.licensesExpiring || 0, chamados: chamados.filter(c => c.estado !== 'Resolvido').length, developer: upgradePedidos.filter(p => p.estado === 'pendente').length }; const badge = badgeMap[navId] || 0; return <button className={activeSection === id ? 'is-active' : ''} key={id} onClick={() => { setActiveSection(id); setSidebarOpen(false) }}><Icon size={17} /><span>{label}</span>{badge > 0 ? <i className="admin-nav-badge">{badge > 9 ? '9+' : badge}</i> : id === 'dashboard' ? <i className="admin-nav-pip" /> : null}</button> })}</nav>
      <div className="admin-sidebar-bottom"><div className="admin-help"><CircleHelp size={17} /><div><strong>Precisa de ajuda?</strong><small>Fale com o suporte CFTEC</small></div></div><button className="admin-logout" onClick={handleLogout}><LogOut size={16} /> Sair do painel</button></div>
    </aside>

    <div className="admin-main">
      <header className="admin-topbar"><div className="admin-topbar-left"><button className="admin-menu" onClick={() => setSidebarOpen(true)} aria-label="Abrir menu"><Menu size={21} /></button><div className="admin-breadcrumb"><span>Painel Admin</span><ChevronRight size={13} /><strong>{sectionTitle}</strong></div></div><div className="admin-topbar-actions"><div className="admin-search"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Pesquisar no painel..." /></div><div className="admin-notif"><button className="admin-icon-btn" aria-label="Notificações" onClick={() => setNotifOpen(v => !v)}><Bell size={17} />{unreadContacts.length > 0 && <i />}</button>{notifOpen && <div className="admin-notif-popover"><div className="admin-notif-head"><strong>Novos pedidos</strong><button onClick={() => setNotifOpen(false)} aria-label="Fechar"><X size={15} /></button></div>{unreadContacts.length === 0 ? <p className="admin-notif-empty">Sem pedidos não lidos.</p> : unreadContacts.slice(0, 4).map((c) => <div className="admin-notif-item" key={c.id}><div className="contact-main"><strong>{c.name}</strong><span>{c.service_interest || 'Pedido geral'}</span></div><button className="icon-btn" title="Marcar como lido" onClick={() => handleContactStatus(c, 'read')}><Check size={15} /></button></div>)}<button className="admin-notif-all" onClick={() => { setNotifOpen(false); setActiveSection('contactos') }}>Ver todos os contactos <ChevronRight size={14} /></button></div>}</div><button className="admin-icon-btn" aria-label="Guia de Uso" title="Guia de Uso do Sistema" onClick={() => setTourOpen(true)}><CircleHelp size={17} /></button><span className="admin-separator" /><button className="admin-icon-btn" aria-label="Terminar sessão" title="Terminar sessão" onClick={handleLogout}><LogOut size={17} /></button><div className="admin-profile"><span className="admin-avatar">AM</span><div><strong>{adminUser?.name || 'Admin CFTEC'}</strong><small>{adminUser?.email || 'Administrador'} · {labelRole(adminUser?.level || 'super_admin')}</small></div><ChevronRight size={14} /></div></div></header>
      <main className="admin-content">
        {(ehDev || sysLic.bypassActivo || (sysLic.licencaAtiva !== false && sysLic.licencaEfetiva !== false)) ? null : <div className="licenca-suspensa"><span className="licenca-suspensa-icon"><Power size={44} /></span><h2>{sysLic.expirada ? 'Licença expirada' : 'Plataforma suspensa'}</h2><p>{sysLic.expirada && !sysLic.mensagem ? 'A licença de manutenção venceu-se — a plataforma entrou em suspensão automática.' : sysLic.mensagem}</p><small>Licença de uso do software — contacte o Developer da plataforma (Nexora Systems) para reactivar.</small>
          {sysLic.bypassActivo ? <small className="licenca-bypass-activo">🔓 Acesso de emergência activo — as suas acções estão desbloqueadas temporariamente.</small> : <>
          <form className="licenca-bloqueio-codigo" onSubmit={(e) => { e.preventDefault(); usarCodigoEmergencia() }}>
            <input value={codigoEmergencia} onChange={(e) => setCodigoEmergencia(e.target.value)} placeholder="Código de emergência (ex.: NEX-CFTEC-...)" maxLength={60} autoComplete="off" aria-label="Código de emergência" />
            <Button type="submit" size="sm" variant="outline" disabled={enviandoCodigo || !codigoEmergencia.trim()}>{enviandoCodigo ? 'A validar…' : 'Desbloquear 48h'}</Button>
          </form>
          <button type="button" className="licenca-aviso-cta licenca-aviso-cta--escuro" onClick={() => setShowUpgrade(true)}><Sparkles size={13} /> Não tem o código? Solicitar plano ao developer</button>
        </>}
        </div>}
        {!ehDev && sysLic.licencaEfetiva !== false && sysLic.somenteLeitura && <div className="licenca-aviso licenca-aviso--leitura" data-tip="Activo pelo Developer da plataforma — consulta livre, escrita bloqueada"><AlertTriangle size={15} /> Modo somente leitura: pode consultar tudo, mas criar/alterar/apagar está bloqueado até regularizar o contrato.<button type="button" className="licenca-aviso-cta" onClick={() => setShowUpgrade(true)}><Sparkles size={13} /> Ver planos de upgrade</button></div>}
        {!ehDev && sysLic.licencaEfetiva !== false && sysLic.expiraEm && (() => {
          const dias = typeof sysLic.diasParaVencer === 'number' ? sysLic.diasParaVencer : null
          const aviso = dias !== null && dias >= 0 && dias <= (sysLic.diasAviso || 5)
          return <div className={`licenca-aviso ${aviso ? 'licenca-aviso--forte' : ''}`} data-tip={aviso ? `Aviso de vencimento (regra de ${sysLic.diasAviso || 5} dias definida pelo developer)` : 'Aviso de validade definido pelo developer da plataforma'}>{aviso ? '⚠️ ' : ''}{aviso ? `A sua licença de manutenção vence em ${dias === 0 ? 'hoje' : `${dias} dia(s)`}. Regularize o pagamento para evitar interrupções.` : `Licença de manutenção expira a ${new Date(sysLic.expiraEm).toLocaleDateString('pt-PT')}`}</div>
        })()}
        <PushNotificationBanner />
        <SystemTour
          open={tourOpen}
          level={adminUser?.level}
          userName={adminUser?.name}
          onClose={() => { if (adminUser?.email) marcarTour(adminUser.email); setTourOpen(false) }}
          onNavigate={(s) => { setActiveSection(s); setSidebarOpen(false) }}
        />
        {showUpgrade && (
          <div
            className="fixed inset-0 z-[200] flex items-start justify-center overflow-y-auto bg-slate-950/70 p-4 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) setShowUpgrade(false) }}
            role="dialog" aria-modal="true" aria-label="Upgrade do plano"
          >
            <div className="relative my-8">
              <button
                type="button"
                onClick={() => setShowUpgrade(false)}
                aria-label="Fechar"
                className="absolute right-3 top-3 z-20 flex size-9 items-center justify-center rounded-full bg-background/80 text-foreground shadow-md transition-colors hover:bg-muted"
              ><X size={17} /></button>
              <Pricing onRequest={solicitarUpgrade} />
            </div>
          </div>
        )}
        <div className="admin-page-heading"><div><span className="admin-kicker">{new Date().toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' })}</span><h1>{activeSection === 'dashboard' ? `${new Date().getHours() < 12 ? 'Bom dia' : new Date().getHours() < 19 ? 'Boa tarde' : 'Boa noite'}, ${(adminUser?.name || 'Admin').split(' ')[0]}.` : sectionTitle}</h1><p>{activeSection === 'dashboard' ? 'Aqui está o que está a acontecer no seu workspace hoje.' : 'Faça a gestão do conteúdo que alimenta a experiência CFTEC.'}</p></div><div className="admin-page-actions"><span className="admin-online"><i /> Sistema online</span>{activeSection === 'software' && role !== 'gestor' && <Button size="sm" onClick={() => { setEditingSoftware(null); resetSoftwareForm(); setShowSoftwareForm(true) }}><Plus size={15} /> Adicionar software</Button>}</div></div>

        {activeSection !== 'dashboard' && modBloqueado(activeSection) && <Card className="admin-panel admin-section-panel"><div className="admin-empty-state module-off"><AlertTriangle size={48} /><h3>Módulo não disponível</h3><p>{sysLic.mensagem}</p><Button variant="outline" size="sm" onClick={() => setActiveSection('dashboard')}><ChevronRight size={14} /> Voltar à visão geral</Button></div></Card>}
        {activeSection === 'dashboard' && <>
          <div className="admin-stats-grid admin-stats-grid--four">
            {role === 'gestor' ? <>
              <StatCard index={0} label="Pedidos de Licença" value={summary.orders || 0} sub={`${summary.ordersPending ?? 0} pendente(s) · ${summary.ordersApproved ?? 0} aprovado(s)`} badge={(summary.ordersPending || 0) + (summary.ordersVerificacao || 0)} icon={ShoppingCart} tone="blue" share={(summary.orders || 0) / statMax} onClick={() => setActiveSection('pedidos')} />
              <StatCard index={1} label="Contactos" value={summary.contacts || 0} sub={`${summary.contactsUnread ?? 0} novo(s) por responder`} badge={summary.contactsUnread} icon={Users} tone="cyan" share={(summary.contacts || 0) / statMax} onClick={() => setActiveSection('contactos')} />
              <StatCard index={2} label="Licenças" value={summary.licenses || 0} sub={`${summary.licensesActivas ?? 0} activa(s) · ${summary.licensesExpiring ?? 0} a expirar`} badge={summary.licensesExpiring} icon={KeyRound} tone="lime" share={(summary.licenses || 0) / statMax} onClick={() => setActiveSection('licencas')} />
              <StatCard index={3} label="Revenda Negomil" value={summary.partners || 0} sub={`${summary.partnersPending ?? 0} em análise`} badge={summary.partnersPending} icon={Network} tone="violet" share={(summary.partners || 0) / statMax} onClick={() => setActiveSection('parceiros')} />
            </> : role === 'tecnico' ? <>
              <StatCard index={0} label="Softwares" value={summary.softwares || 0} sub={`${summary.softwaresActive ?? 0} no catálogo · ${downloadMetrics?.total30 ?? 0} download(s)/30d`} icon={Package} tone="blue" share={(summary.softwares || 0) / statMax} onClick={() => setActiveSection('software')} />
              <StatCard index={1} label="Chamados de Suporte" value={chamados.length} sub={`${chamados.filter(c => c.estado !== 'Resolvido').length} em aberto`} badge={chamados.filter(c => c.estado !== 'Resolvido').length} icon={LifeBuoy} tone="cyan" share={chamados.length / Math.max(1, (summary.softwares || 0) + chamados.length)} onClick={() => setActiveSection('chamados')} />
              <StatCard index={2} label="Mídias" value={summary.media || 0} sub="galeria do site público" icon={FileImage} tone="violet" share={(summary.media || 0) / statMax} onClick={() => setActiveSection('media')} />
              <StatCard index={3} label="Blog" value={blogPosts.length} sub={`${blogPosts.filter(b => b.is_published).length} publicado(s)`} badge={blogPosts.filter(b => !b.is_published).length} icon={FileText} tone="lime" share={blogPosts.length / statMax} onClick={() => setActiveSection('blog')} />
            </> : <>
              <StatCard index={0} label="Pedidos de Licença" value={summary.orders || 0} sub={`${summary.ordersPending ?? 0} pendente(s) · ${summary.ordersApproved ?? 0} aprovado(s)`} badge={(summary.ordersPending || 0) + (summary.ordersVerificacao || 0)} icon={ShoppingCart} tone="blue" share={(summary.orders || 0) / statMax} onClick={() => setActiveSection('pedidos')} />
              <StatCard index={1} label="Contactos" value={summary.contacts || 0} sub={`${summary.contactsUnread ?? 0} novo(s) por responder`} badge={summary.contactsUnread} icon={Users} tone="cyan" share={(summary.contacts || 0) / statMax} onClick={() => setActiveSection('contactos')} />
              <StatCard index={2} label="Softwares" value={summary.softwares || 0} sub={`${downloadMetrics?.total30 ?? 0} download(s) · 30 dias`} icon={Package} tone="violet" share={(summary.softwares || 0) / statMax} onClick={() => setActiveSection('software')} />
              <StatCard index={3} label="Licenças" value={summary.licenses || 0} sub={`${summary.licensesActivas ?? 0} activa(s)`} badge={summary.licensesExpiring} icon={KeyRound} tone="lime" share={(summary.licenses || 0) / statMax} onClick={() => setActiveSection('licencas')} />
            </>}
          </div>
          <div className="admin-dashboard-grid"><Card className="admin-panel admin-panel--activity"><div className="admin-panel-head"><div><span className="admin-panel-kicker">LINHA DO TEMPO</span><h2>Actividade do workspace</h2></div><div className="timeline-chips">{(role === 'gestor' ? [['Pedidos', 'pedidos'], ['Revenda', 'parceiros'], ['Licenças', 'licencas']] : role === 'tecnico' ? [['Blog', 'blog'], ['Softwares', 'software'], ['Chamados', 'chamados']] : [['Pedidos', 'pedidos'], ['Revenda', 'parceiros'], ['Licenças', 'licencas']]).map(([chip, sec]) => <button key={chip} className="order-filter-tab" onClick={() => setActiveSection(sec as AdminSection)}>{chip}</button>)}</div></div><div className="timeline">{timelineEvents.length === 0 ? <div className="admin-empty-state"><Sparkles size={40} /><h3>Sem eventos ainda</h3><p>Assim que houver pedidos, contactos, uploads ou alterações, aparecem aqui por ordem cronológica.</p></div> : timelineEvents.map((event, i) => { const Icon = event.icon as React.ComponentType<{ size?: number }>; return <button type="button" className={`timeline-row timeline-tone--${event.tone}`} style={{ animationDelay: `${Math.min(i * 45, 500)}ms` }} key={event.id} onClick={() => setActiveSection(event.section)}><span className="timeline-icon"><Icon size={15} /></span><div className="timeline-main"><strong>{event.title}</strong><span>{event.desc}</span></div><span className="timeline-when"><i />{timeAgo(event.at)}</span>{event.badge && <span className={`timeline-badge tl-badge-${String(event.badge).toLowerCase().replace(/[^a-zA-Z0-9]/g, '')}`}>{String(event.badge)}</span>}</button> })}</div></Card><Card className="admin-panel admin-panel--health"><div className="admin-panel-head"><div><span className="admin-panel-kicker">SISTEMA</span><h2>Saúde do workspace</h2></div><div className="health-actions"><button className="icon-btn" title="Verificar agora" onClick={refreshHealth}>{refreshingHealth ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={15} />}</button><Activity size={18} className="panel-accent" /></div></div>
              <>
              {health ? (
                <>
                <div className="health-score">
                  <div className="health-ring" style={{ background: `conic-gradient(${health.score >= 95 ? '#22c55e' : health.score >= 60 ? '#f59e0b' : '#ef4444'} 0% ${health.score}%, #e2e8f0 ${Math.max(0, health.score - 0.5)}% 100%)` }}>
                    <strong>{health.score}</strong>
                    <span>/100</span>
                  </div>
                  <div>
                    <strong>{health.status === 'healthy' ? 'Excelente' : health.status === 'degraded' ? 'Atenção' : 'Crítico'}</strong>
                    <p>{health.status === 'healthy' ? 'Todas as métricas estão dentro dos parâmetros.' : health.status === 'degraded' ? 'Alguns sistemas precisam de atenção.' : 'Sistemas críticos precisam de intervenção imediata.'}</p>
                    {health.checkedAt && <small className="health-timestamp">Verificado às {new Date(health.checkedAt).toLocaleTimeString('pt-PT')}</small>}
                  </div>
                </div>
                <div className="health-lines">
                  <div><span>Base de dados</span><strong><span className={health.checks.database.status === 'unhealthy' ? 'status-error' : health.checks.database.status === 'degraded' ? 'status-warn' : 'status-ok'} /> {health.checks.database.status === 'unhealthy' ? 'Indisponível' : health.checks.database.status === 'degraded' ? 'Lento' : 'Operacional'} <em>{health.checks.database.latency} ms</em></strong></div>
                  <div><span>Storage</span><strong><span className={health.checks.storage.status === 'unhealthy' ? 'status-error' : health.checks.storage.status === 'degraded' ? 'status-warn' : 'status-ok'} /> {health.checks.storage.status === 'unhealthy' ? 'Indisponível' : health.checks.storage.status === 'degraded' ? 'Lento' : 'Operacional'} <em>{health.checks.storage.latency} ms</em></strong></div>
                  <div><span>Conteúdo público</span><strong><span className={health.checks.content.status === 'unhealthy' ? 'status-error' : health.checks.content.status === 'degraded' ? 'status-warn' : 'status-ok'} /> {health.checks.content.activeServices || 0} serviço(s) · {health.checks.content.activeSoftware || 0} software(s) <em>{health.checks.content.latency} ms</em></strong></div>
                </div>
                {health.warnings && health.warnings.length > 0 && <div className="health-warnings">{health.warnings.map((w, index) => <div key={index} className={`health-warning health-warning--${w.level}`}><p>{w.message}</p></div>)}</div>}
                </>
              ) : (
                <div className="health-score">
                  <div className="health-ring"><strong>--</strong><span>/100</span></div>
                  <div><strong>Carregando...</strong><p>A verificar estado dos sistemas.</p></div>
                </div>
              )}
              </>
              </Card></div>
          <div className="admin-dashboard-grid admin-dashboard-grid--bottom"><Card className="admin-panel"><div className="admin-panel-head"><div><span className="admin-panel-kicker">CATÁLOGO</span><h2>Softwares mais descarregados</h2></div><button onClick={() => setActiveSection('software')}>Gerir catálogo <ChevronRight size={14} /></button></div><div className="catalog-split"><div className="mini-table">{software.slice(0, 3).map((item, index) => <div key={item.id}><span className="software-rank">0{index + 1}</span><span className="software-symbol"><Package size={15} /></span><strong>{item.name}</strong><span>{item.version}</span><b>{item.downloads_count} downloads</b><span className="mini-table-bar"><i style={{ width: `${Math.min(100, 28 + item.downloads_count / 3)}%` }} /></span></div>)}</div>{downloadMetrics && <div className="dl-metrics dl-metrics--panel"><div className="dl-metrics-head"><div><span className="admin-panel-kicker">ACTIVIDADE · ÚLTIMOS 30 DIAS</span><strong>{downloadMetrics.total30} download(s)</strong></div></div><div className="dl-bars">{dlDays.map((day) => <div key={day.d} className="dl-bar" title={`${day.d}: ${day.n} download(s)`}><i style={{ height: `${Math.max(4, Math.round((day.n / dlMax) * 100))}%` }} /><span>{day.d.slice(8)}</span></div>)}</div></div>}</div></Card><Card className="admin-panel admin-panel--quick"><span className="admin-panel-kicker">ACÇÕES RÁPIDAS</span><h2>O que precisa de fazer?</h2><button onClick={() => setActiveSection('software')}><FilePlus2 size={17} /><span><strong>Novo software</strong><small>Adicionar ao catálogo</small></span><ChevronRight size={15} /></button><button onClick={() => setActiveSection('media')}><CloudUpload size={17} /><span><strong>Subir imagens</strong><small>Actualizar galeria</small></span><ChevronRight size={15} /></button><button onClick={() => setActiveSection('services')}><Code2 size={17} /><span><strong>Editar serviços</strong><small>Gerir oferta pública</small></span><ChevronRight size={15} /></button></Card></div>
        </>}

        {activeSection === 'services' && <Card className="admin-panel admin-section-panel"><div className="admin-panel-head"><div><span className="admin-panel-kicker">CONTEÚDO PÚBLICO</span><h2>Serviços prestados</h2></div><Button size="sm" onClick={() => setShowServiceForm(null)}><Plus size={15} /> Novo serviço</Button></div><div className="service-admin-list">{services.map((service) => { const Icon = getServiceIcon(service.icon); const displayId = String(service.id).slice(0, 8); return <div key={service.id} className="service-admin-row"><span className="admin-order">{displayId}</span><span className="admin-service-icon"><Icon size={17} /></span><div className="service-admin-info"><strong>{service.title}</strong><p>{service.short_description}</p><span className="service-slug">{service.slug}</span></div><span className={`active-pill ${service.is_active ? '' : 'inactive'}`} data-tip={service.is_active ? 'Este serviço está visível no site público' : 'Escondido do site até ser reactivado'}><span className={service.is_active ? 'status-ok' : 'status-error'} /> {service.is_active ? 'Activo' : 'Inativo'}</span><div className="service-admin-actions"><button className="icon-btn" onClick={() => setShowServiceForm(service)} title="Editar"><Pencil size={16} /></button><button className="icon-btn danger" onClick={() => setDeletingServiceId(service.id)} title="Eliminar"><Trash2 size={16} /></button></div></div>})}</div></Card>}

        {activeSection === 'media' && <Card className="admin-panel admin-section-panel"><div className="admin-panel-head"><div><span className="admin-panel-kicker">ASSETS DIGITAIS</span><h2>Gestão de mídias</h2></div><span className="admin-muted">{media.length} ficheiros no storage</span></div><label className={`upload-zone ${dragActive ? 'upload-zone--active' : ''}`} onDragOver={(event) => { event.preventDefault(); setDragActive(true) }} onDragLeave={() => setDragActive(false)} onDrop={(event) => { event.preventDefault(); handleFiles(event.dataTransfer.files) }}><input type="file" accept="image/*" multiple onChange={(event) => handleFiles(event.target.files)} /><span className="upload-cloud"><UploadCloud size={28} /></span><strong>Arraste imagens para aqui</strong><span>ou clique para seleccionar ficheiros · PNG, JPG, WebP até 10 MB</span><Button type="button" variant="outline" size="sm"><FolderOpen size={14} /> Seleccionar ficheiros</Button></label>{visibleMedia.length === 0 && <div className="admin-empty-state"><FileImage size={48} /><h3>{media.length ? 'Sem correspondências' : 'Nenhuma mídia ainda'}</h3><p>{media.length ? `Nenhum ficheiro corresponde a "${search}".` : 'Faça upload da primeira imagem para começar a galeria.'}</p></div>}<div className="media-preview-grid">{visibleMedia.map((item) => <MediaTile key={item.id} item={item} onDelete={handleMediaDelete} notify={notify} />)}</div></Card>}

        {activeSection === 'blog' && !modBloqueado('blog') && <Card className="admin-panel admin-section-panel"><div className="admin-panel-head"><div><span className="admin-panel-kicker">BLOG / CMS</span><h2>Artigos & guias</h2></div><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><a className="settings-site-link" href="/#blog" target="_blank" rel="noreferrer noopener">Ver no site <ChevronRight size={14} /></a><Button size="sm" onClick={() => openBlogForm(null)}><Plus size={15} /> Novo artigo</Button></div></div><p style={{ margin: '0 0 18px', color: '#64748b', fontSize: '.72rem', lineHeight: 1.6 }}>Publicados aparecem em <b>#blog</b> no site; rascunhos ficam só no painel. No conteúdo use <b>## título</b>, <b>**negrito**</b>, <b>*itálico*</b>, listas com <b>-</b> e links <b>[texto](url)</b>.</p>{blogPosts.length === 0 ? <div className="admin-empty-state"><FileText size={48} /><h3>Sem artigos ainda</h3><p>Crie o primeiro artigo — guias de faturação AGE, novidades AGT, casos de clientes — e publique com um clique.</p><Button size="lg" onClick={() => openBlogForm(null)}><Plus size={16} /> Novo artigo</Button></div> : <div className="blog-admin-list">{blogPosts.map(post => <div className="blog-admin-row" key={post.id}>{post.cover_url ? <img className="blog-admin-cover" src={post.cover_url} alt="" loading="lazy" /> : <span className="blog-admin-cover blog-admin-cover--ph"><FileText size={20} /></span>}<div className="blog-admin-main"><div className="blog-admin-titlewrap"><strong>{post.title}</strong>{post.is_published ? <span className="tl-badge tl-badge-ordem" data-tip="Visível na secção #blog do site">Publicado</span> : <span className="tl-badge tl-badge-servico" data-tip="Existe apenas no painel — clica no interruptor ⚡ para publicar">Rascunho</span>}{post.category && <span className="tl-badge tl-badge-media">{post.category}</span>}</div><span>{post.excerpt}</span><small>{post.published_at ? new Date(post.published_at).toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' }) : '— sem data'} · {post.author || 'Equipa CFTEC'}</small></div><div className="blog-admin-ctrl"><button className="icon-btn" title={post.is_published ? 'Despublicar' : 'Publicar'} onClick={() => toggleBlogPublish(post)}><Power size={15} /></button><button className="icon-btn" title="Editar" onClick={() => openBlogForm(post)}><Pencil size={16} /></button><button className="icon-btn danger" title="Eliminar" onClick={() => setDeletingBlogId(post.id)}><Trash2 size={16} /></button></div></div>)}</div>}</Card>}

        {activeSection === 'destaques' && !modBloqueado('destaques') && <Card className="admin-panel admin-section-panel"><div className="admin-panel-head"><div><span className="admin-panel-kicker">CARROSSEL DO SITE</span><h2>Novidades & destaques</h2></div><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><a className="settings-site-link" href="/" target="_blank" rel="noreferrer noopener">Ver site <ChevronRight size={14} /></a><Button size="sm" onClick={() => openDestaqueForm(null)}><Plus size={15} /> Novo destaque</Button></div></div><p style={{ margin: '0 0 18px', color: '#64748b', fontSize: '.72rem', lineHeight: 1.6 }}>Aparecem em fundo escuro logo abaixo da hero no site. Com <b>1 destaque</b> mostra um banner imóvel; com <b>2 ou mais</b> entra o carrossel automático (5 s, setas e pontos). Ordenar = ordem de exibição.</p>{destaques.length === 0 ? <div className="admin-empty-state"><Sparkles size={48} /><h3>Sem destaques ainda</h3><p>Crie o primeiro anúncio — lançamento de software, promoção ou campanha — e o site mostra no carrossel.</p><Button size="lg" onClick={() => openDestaqueForm(null)}><Plus size={16} /> Novo destaque</Button></div> : <div className="destaques-list">{[...destaques].sort((a, b) => a.ordem - b.ordem || +new Date(b.created_at) - +new Date(a.created_at)).map((item) => <div className="destaque-row" key={item.id}><img className="destaque-thumb" src={item.imagem_url} alt={item.titulo} loading="lazy" /><div className="destaque-main"><strong>{item.titulo}</strong><span>{item.descricao.slice(0, 90)}{item.descricao.length > 90 ? '…' : ''}</span><small data-tip="Posição no carrossel do site — 1° aparece primeiro">#{item.ordem} · {item.link_botao ? item.link_botao : 'sem link'}{item.link_botao && item.texto_botao ? ` (“${item.texto_botao}”)` : ''}</small></div><div className="destaque-ctrl"><button className="icon-btn" title="Subir na ordem" disabled={item.ordem <= 1} onClick={() => moveDestaque(item, 'up')}><ArrowRight size={15} style={{ transform: 'rotate(-135deg)' }} /></button><button className="icon-btn" title="Descer na ordem" onClick={() => moveDestaque(item, 'down')}><ArrowRight size={15} style={{ transform: 'rotate(45deg)' }} /></button><label className="destaque-toggle"><input type="checkbox" checked={item.ativo} onChange={() => toggleDestaque(item)} /><i /><span>{item.ativo ? 'Activo' : 'Inactivo'}</span></label><button className="icon-btn" title="Editar" onClick={() => openDestaqueForm(item)}><Pencil size={16} /></button><button className="icon-btn danger" title="Eliminar" onClick={() => setDeletingDestaqueId(item.id)}><Trash2 size={16} /></button></div></div>)}</div>}</Card>}

        {activeSection === 'software' && <Card className="admin-panel admin-section-panel"><div className="admin-panel-head"><div><span className="admin-panel-kicker">CATÁLOGO DIGITAL</span><h2>Softwares & downloads</h2></div>{role !== 'gestor' && <Button size="sm" onClick={() => { setEditingSoftware(null); resetSoftwareForm(); setShowSoftwareForm(true) }}><Plus size={15} /> Adicionar software</Button>}</div>{downloadMetrics && <div className="dl-metrics"><div className="dl-metrics-head"><div><span className="admin-panel-kicker">MÉTRICAS · ÚLTIMOS 30 DIAS</span><strong>{downloadMetrics.total30} download(s) registados</strong></div><small>{downloadMetrics.topo.length ? downloadMetrics.topo.map(t => `${t.name}: ${t.count}`).join(' · ') : 'Sem downloads no período — os registos começam quando o site usa o link de download real.'}</small></div><div className="dl-bars">{dlDays.map((day) => <div key={day.d} className="dl-bar" title={`${day.d}: ${day.n} download(s)`}><i style={{ height: `${Math.max(4, Math.round((day.n / dlMax) * 100))}%` }} /><span>{day.d.slice(8)}</span></div>)}</div></div>}{visibleSoftware.length === 0 ? <div className="admin-empty-state"><Package size={48} /><h3>Nenhum software cadastrado</h3><p>Adicione o primeiro software ao catálogo para começar.</p>{role !== 'gestor' && <Button size="lg" onClick={() => { setEditingSoftware(null); resetSoftwareForm(); setShowSoftwareForm(true) }}><Plus size={16} /> Adicionar software</Button>}</div> : <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Software</th><th>Versão</th><th>Tamanho</th><th>Downloads</th><th>Estado</th><th>Actualizado</th>{role !== 'gestor' && <th />}</tr></thead><tbody>{visibleSoftware.map((item) => <tr key={item.id}><td><span className="software-symbol"><Package size={15} /></span><strong>{item.name}</strong>{item.category && <span className="software-tag">{item.category}</span>}</td><td><span className="version-pill" data-tip="Versão do ficheiro instalável no bucket">{item.version}</span></td><td>{item.file_size}</td><td>{item.downloads_count}</td><td><span className={`active-pill ${item.is_active === false ? 'inactive' : ''}`} data-tip={item.is_active === false ? 'Escondido do catálogo do site' : 'Visível e descarregável no site'}>{item.is_active === false ? 'Inactivo' : 'Activo'}</span></td><td>{formatDate(item.created_at)}</td>{role !== 'gestor' ? <td className="row-actions"><button className="icon-btn" title="Editar" onClick={() => openEditSoftware(item)}><Pencil size={15} /></button><button className="icon-btn" title={item.is_active === false ? 'Activar' : 'Desactivar'} onClick={() => handleToggleSoftware(item)}><Power size={15} /></button><button className="icon-btn danger" title="Eliminar" onClick={() => setDeletingSoftwareId(item.id)}><Trash2 size={15} /></button></td> : <td className="row-actions"><span className="admin-muted" style={{ fontSize: '.58rem' }} data-tip="Uploads e edições de instaladores são feitos pelo Técnico de Suporte">só leitura</span></td>}</tr>)}</tbody></table></div>}</Card>}

                {activeSection === 'licencas' && <Card className="admin-panel admin-section-panel"><div className="admin-panel-head"><div><span className="admin-panel-kicker">PALANCASOFT</span><h2>{role === 'tecnico' ? 'Consulta de licenças & chaves' : 'Licenças & activações'}</h2></div><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><div className="license-search"><Search size={15} /><input value={licenseQuery} onChange={(e) => setLicenseQuery(e.target.value)} placeholder="Pesquisar cliente, NIF ou chave..." /></div>{role !== 'tecnico' && <Button size="sm" onClick={() => setShowLicenseForm(true)}><Plus size={15} /> Nova licença</Button>}</div></div>{role !== 'tecnico' && (() => { const renov = licenses.filter(l => l.status === 'activa' && l.data_expiracao).map(l => ({ ...l, dias: Math.ceil((new Date(l.data_expiracao + 'T00:00:00').getTime() - new Date(new Date().toDateString()).getTime()) / 86400000) })).filter(l => l.dias >= 0 && l.dias <= 15).sort((a, b) => a.dias - b.dias); return renov.length > 0 ? <div className="renew-strip"><span className="renew-icon"><RefreshCw size={15} /></span><div><strong>🔔 {renov.length} licença(s) a renovar nos próximos 15 dias — ligue ao cliente e proponha a renovação</strong>{renov.map(l => <small key={l.id}>{l.cliente_nome} · expira {new Date(l.data_expiracao + 'T00:00:00').toLocaleDateString('pt-PT')} ({l.dias === 0 ? 'hoje' : `em ${l.dias} dia(s)`}) · chave {l.chave_licenca}</small>)}</div></div> : null })()}{licenses.length === 0 ? <div className="admin-empty-state"><KeyRound size={48} /><h3>Sem licenças registadas</h3><p>{role === 'tecnico' ? 'Assim que as licenças forem criadas, as chaves e clientes aparecem aqui para consulta no suporte.' : 'Crie a primeira licença — a chave de activação é gerada automaticamente.'}</p>{role !== 'tecnico' && <Button size="lg" onClick={() => setShowLicenseForm(true)}><Plus size={16} /> Nova licença</Button>}</div> : (() => { const q = licenseQuery.trim().toLowerCase(); const visible = q ? licenses.filter(l => [l.chave_licenca, l.cliente_nome, l.nif].some(v => (v || '').toLowerCase().includes(q))) : licenses; return q && visible.length === 0 ? <div className="admin-empty-state"><Search size={40} /><h3>Sem resultados</h3><p>Nenhuma licença corresponde a "{licenseQuery}".</p></div> : <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Chave de activação</th><th>Cliente</th><th>NIF</th><th>Activada</th><th>Expira</th><th>Estado</th>{role !== 'tecnico' && <th />}</tr></thead><tbody>{visible.map((license) => <tr key={license.id}><td><code className="license-key" data-tip="Chave partilhável — o cliente activa o PalancaSoft com ela">{license.chave_licenca}</code> <button className="icon-btn" title="Copiar chave" onClick={() => copyKey(license.chave_licenca)}><Copy size={13} /></button></td><td>{license.cliente_nome}</td><td>{license.nif || '—'}</td><td>{license.data_ativacao || '—'}</td><td>{license.data_expiracao || 'Sem prazo'}</td><td><span className={`active-pill ${license.status === 'activa' ? '' : 'inactive'}`} data-tip={license.status === 'activa' ? 'Licença em vigor e pronta a activar' : 'Não em vigor — não pode activar um cliente com esta chave'}>{labelLicenca(license.status)}</span></td>{role !== 'tecnico' && <td className="row-actions">{license.status === 'activa' ? <button className="icon-btn" title="Cancelar licença" onClick={() => updateLicenseStatus(license, 'cancelada')}><Power size={15} /></button> : <button className="icon-btn" title="Reactivar licença" onClick={() => updateLicenseStatus(license, 'activa')}><Check size={15} /></button>}<button className="icon-btn danger" title="Eliminar" onClick={() => setDeletingLicenseId(license.id)}><Trash2 size={14} /></button></td>}</tr>)}</tbody></table></div> })()}</Card>}

        {activeSection === 'chamados' && !modBloqueado('chamados') && <Card className="admin-panel admin-section-panel"><div className="admin-panel-head"><div><span className="admin-panel-kicker">HELPDESK · SUPORTE TÉCNICO</span><h2>Chamados de suporte</h2></div><div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}><div className="timeline-chips">{(['Todos', 'Pendente', 'Em Resolução', 'Resolvido'] as const).map(tab => <button key={tab} className={`order-filter-tab ${chamadoEstadoFilter === tab ? 'is-active' : ''}`} onClick={() => setChamadoEstadoFilter(tab)}>{tab}</button>)}</div><Button size="sm" onClick={() => setShowChamadoForm(true)}><Plus size={15} /> Novo chamado</Button></div></div>{chamados.length === 0 ? <div className="admin-empty-state"><LifeBuoy size={48} /><h3>Sem chamados registados</h3><p>Os problemas que chegam por WhatsApp ou telefone ficam aqui registados — cliente, software, estado e prioridade — para nada se perder.</p><Button size="lg" onClick={() => setShowChamadoForm(true)}><Plus size={16} /> Novo chamado</Button></div> : (() => { const visible = chamadoEstadoFilter === 'Todos' ? chamados : chamados.filter(c => c.estado === chamadoEstadoFilter); return visible.length === 0 ? <div className="admin-empty-state"><LifeBuoy size={40} /><h3>Nada neste estado</h3><p>Não há chamados "{chamadoEstadoFilter}" neste momento. 👍</p></div> : <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Data</th><th>Cliente / empresa</th><th>Software</th><th>Problema reportado</th><th>Prioridade</th><th>Estado</th><th /></tr></thead><tbody>{visible.map((ch) => <tr key={ch.id}><td>{new Date(ch.created_at).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' })}{ch.origem === 'site' && <span className="chamado-origem" data-tip="Chegou pelo formulário do site">site</span>}</td><td><strong>{ch.cliente}</strong>{(ch.telefone || ch.nif) && <><br /><small style={{ color: '#64748b' }}>{ch.telefone ? `${ch.telefone} · ` : ''}{ch.nif ? `NIF ${ch.nif}` : ''}</small></>}</td><td>{ch.software || '—'}</td><td className="chamado-problema">{ch.problema.length > 90 ? `${ch.problema.slice(0, 88)}…` : ch.problema}</td><td><span className={`chamado-prio chamado-prio--${ch.prioridade.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')}`} data-tip={ch.prioridade === 'Crítica' ? 'Loja parada — resolver antes de tudo' : ch.prioridade === 'Média' ? 'Impacta o trabalho, sem bloquear' : 'Sem urgência'}>{ch.prioridade}</span></td><td><span className={`order-status-pill order-status--${chamadoEstadoClass(ch.estado)}`} data-tip={ch.estado === 'Pendente' ? 'Ainda sem técnico no caso' : ch.estado === 'Em Resolução' ? 'Um técnico está a tratar do caso' : 'Resolvido e encerrado'}>{ch.estado}</span></td><td className="row-actions">{ch.estado === 'Pendente' && <button className="icon-btn" title="Marcar como em resolução" onClick={() => updateChamado(ch, { estado: 'Em Resolução' })}><LifeBuoy size={15} /></button>}{ch.estado !== 'Resolvido' && <button className="icon-btn" title="Marcar como resolvido" onClick={() => updateChamado(ch, { estado: 'Resolvido' })}><Check size={15} /></button>}{ch.estado === 'Resolvido' && <button className="icon-btn" title="Reabrir chamado" onClick={() => updateChamado(ch, { estado: 'Em Resolução' })}><Undo2 size={15} /></button>}{ch.prioridade !== 'Crítica' && <button className="icon-btn" title={`Elevar prioridade — agora ${ch.prioridade.toLowerCase()}`} onClick={() => updateChamado(ch, { prioridade: ch.prioridade === 'Baixa' ? 'Média' : 'Crítica' })}><Zap size={15} /></button>}<button className="icon-btn" title="Consultar na wiki técnica" data-tip="Pesquisa a wiki por este software do chamado" onClick={() => abrirWikiNaSecao(ch.software)}><BookOpen size={14} /></button><button className="icon-btn danger" title="Eliminar chamado" onClick={() => setDeletingChamadoId(ch.id)}><Trash2 size={14} /></button></td></tr>)}</tbody></table></div> })()}</Card>}
                {activeSection === 'wiki' && !modBloqueado('wiki') && <Card className="admin-panel admin-section-panel"><div className="admin-panel-head"><div><span className="admin-panel-kicker">BASE DE CONHECIMENTO INTERNA</span><h2>Wiki técnica</h2></div><div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}><div className="license-search"><Search size={15} /><input value={wikiSearch} onChange={(e) => setWikiSearch(e.target.value)} placeholder="Pesquisar problema, software ou tag..." /></div><Button size="sm" onClick={() => { setEditingWiki(null); setWikiForm({ titulo: '', software: '', problema: '', solucao: '', tags: '' }); setShowWikiForm(true) }}><Plus size={15} /> Nova solução</Button></div></div><p style={{ margin: '0 0 16px', color: '#64748b', fontSize: '.72rem', lineHeight: 1.6 }}>Soluções que a equipa técnica já resolveu — quando um chamado igual voltar, pesquise aqui antes de gastar tempo a descobrir de novo. Os <b>manuais públicos</b> do cliente moram no Blog/CMS.</p>{wiki.length === 0 ? <div className="admin-empty-state"><BookOpen size={48} /><h3>{wikiSearch ? 'Nada encontrado' : 'Wiki vazia'}</h3><p>{wikiSearch ? `Nenhum artigo corresponde a "${wikiSearch}" — tenta outros termos ou tags.` : 'Regista a primeira solução — passo-a-passo de um problema real que já resolveste. Da próxima vez, pesquise e resolva em segundos.'}</p><Button size="lg" onClick={() => { setEditingWiki(null); setWikiForm({ titulo: '', software: '', problema: '', solucao: '', tags: '' }); setShowWikiForm(true) }}><Plus size={16} /> Nova solução</Button></div> : (() => { const q = wikiSearch.trim().toLowerCase(); const visiveis = q ? wiki.filter(a => `${a.titulo} ${a.software || ''} ${a.problema} ${a.solucao} ${a.tags || ''}`.toLowerCase().includes(q)) : wiki; return visiveis.length === 0 ? <div className="admin-empty-state"><BookOpen size={40} /><h3>Nada para "{wikiSearch}"</h3><p>Guarda mesmo assim uma solução nova com este problema — assim o próximo collega encontra.</p></div> : <div className="wiki-list">{visiveis.map((a) => <details key={a.id} className="wiki-item"><summary><span className="wiki-software" data-tip={a.software ? `Aplica-se a ${a.software}` : 'Software não especificado'}>{a.software || 'Geral'}</span><strong>{a.titulo}</strong><small>actualizado {new Date(a.updated_at).toLocaleDateString('pt-PT')} · {a.autor || '—'}</small><b className="wiki-open-hint"><ChevronRight size={14} /></b></summary><div className="wiki-body"><div className="wiki-block"><span>Problema / sintoma</span><p>{a.problema}</p></div><div className="wiki-block wiki-block--sol"><span>Solução passo-a-passo</span><p>{a.solucao}</p></div>{a.tags && <div className="wiki-tags">{a.tags.split(',').map((t) => t.trim()).filter(Boolean).map((t) => <span key={t} className="wiki-tag"><b onClick={(e) => { e.preventDefault(); e.stopPropagation(); setWikiSearch(t) }}>#{t}</b></span>)}</div>}<div className="service-admin-actions"><button className="icon-btn" title="Editar solução" onClick={(e) => { e.preventDefault(); setEditingWiki(a); setWikiForm({ titulo: a.titulo, software: a.software || '', problema: a.problema, solucao: a.solucao, tags: a.tags || '' }); setShowWikiForm(true) }}><Pencil size={16} /></button><button className="icon-btn danger" title="Eliminar" onClick={(e) => { e.preventDefault(); setDeletingWikiId(a.id) }}><Trash2 size={16} /></button></div></div></details>)}</div> })()}{showWikiForm && (() => {
          // sugestões datalist: softwares do catálogo + os já usados na wiki; tags existentes
          const sugerirSoft = [...new Set([...software.map(s => s.name), ...wiki.map(a => a.software).filter((s): s is string => Boolean(s))])].sort((a, b) => a.localeCompare(b))
          const sugerirTags = [...new Set(wiki.flatMap(a => (a.tags || '').split(',').map(t => t.trim()).filter(Boolean)))].sort((a, b) => a.localeCompare(b))
          const pLen = wikiForm.problema.length
          const sLen = wikiForm.solucao.length
          return <div className="admin-modal-backdrop" onMouseDown={() => setShowWikiForm(false)}><div className="admin-modal admin-modal--lg" onMouseDown={(e) => e.stopPropagation()}><div className="admin-modal-head"><div><span className="admin-panel-kicker">{editingWiki ? 'EDITAR SOLUÇÃO · WIKI TÉCNICA' : 'NOVA SOLUÇÃO · WIKI TÉCNICA'}</span><h2>{editingWiki ? `Editar "${editingWiki.titulo.slice(0, 24)}${editingWiki.titulo.length > 24 ? '…' : ''}"` : 'Registar solução na wiki'}</h2></div><button onClick={() => setShowWikiForm(false)} className="admin-modal-close" aria-label="Fechar"><X size={18} /></button></div><form className="admin-modal-body" onSubmit={guardarWiki}>
          <fieldset className="admin-form-section"><legend>Identificação</legend><div className="admin-form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <label className="full-width">Título do artigo<input value={wikiForm.titulo} onChange={(e) => setWikiForm(f => ({ ...f, titulo: e.target.value }))} placeholder="Ex.: Impressora térmica não imprime após actualização de driver" required maxLength={160} autoFocus /></label>
          <label>Software (opcional)<input value={wikiForm.software} onChange={(e) => setWikiForm(f => ({ ...f, software: e.target.value }))} placeholder="Ex.: PalancaSoft ERP" maxLength={120} list="wiki-soft-sugestoes" /><datalist id="wiki-soft-sugestoes">{sugerirSoft.map(s => <option key={s} value={s} />)}</datalist><small className="settings-hint">Sugere os do catálogo e os já registados na wiki</small></label>
          <label>Tags (vírgulas)<input value={wikiForm.tags} onChange={(e) => setWikiForm(f => ({ ...f, tags: e.target.value }))} placeholder="Ex.: impressora, usb, talões" maxLength={200} list="wiki-tags-sugestoes" /><datalist id="wiki-tags-sugestoes">{sugerirTags.map(t => <option key={t} value={t} />)}</datalist><small className="settings-hint">Vazio = sem sugestões ainda</small></label>
          </div></fieldset>
          <fieldset className="admin-form-section"><legend>Diagnóstico</legend>
          <label>Problema / sintoma<textarea rows={3} value={wikiForm.problema} onChange={(e) => setWikiForm(f => ({ ...f, problema: e.target.value }))} placeholder="O que o cliente vê: mensagens de erro, comportamento estranho..." required maxLength={1500} style={{ marginTop: 8 }} /></label><small className={`wiki-char-count ${pLen > 1350 ? 'wiki-char-count--max' : pLen > 1050 ? 'wiki-char-count--warn' : ''}`}>{pLen} / 1500 caracteres</small>
          <label>Solução passo-a-passo<textarea rows={7} value={wikiForm.solucao} onChange={(e) => setWikiForm(f => ({ ...f, solucao: e.target.value }))} placeholder={'1. Verificar cabo USB e alimentação\n2. Painel de controlo → dispositivos → thermal\n3. Reinstalar driver X do fabricante'} required maxLength={8000} style={{ marginTop: 8 }} /></label><small className={`wiki-char-count ${sLen > 7200 ? 'wiki-char-count--max' : sLen > 5600 ? 'wiki-char-count--warn' : ''}`}>{sLen} / 8000 caracteres</small>
          <p className="admin-field-hint">Escreve passos numerados — as quebras de linha ficam preservadas na leitura do artigo.</p>
          </fieldset>
          <div className="admin-modal-actions"><Button variant="outline" type="button" onClick={() => setShowWikiForm(false)}>Cancelar</Button><Button type="submit" disabled={savingWiki}><Check size={15} /> {savingWiki ? 'A guardar…' : editingWiki ? 'Guardar alterações' : 'Registar solução'}</Button></div></form></div></div>
        })()}{deletingWikiId && <div className="admin-modal-backdrop" onMouseDown={() => setDeletingWikiId(null)}><div className="admin-modal admin-modal--confirm" onMouseDown={(e) => e.stopPropagation()}><div className="admin-modal-head"><span className="admin-modal-warn"><AlertTriangle size={20} /></span><div><span className="admin-panel-kicker">CONFIRMAÇÃO</span><h2>Eliminar artigo da wiki</h2></div><button onClick={() => setDeletingWikiId(null)}><X size={18} /></button></div><p>Eliminar esta solução da base de conhecimento? O técnico perde esta referência. Esta acção não pode ser desfeita.</p><div className="admin-modal-actions"><Button variant="outline" onClick={() => setDeletingWikiId(null)}>Cancelar</Button><Button variant="dark" onClick={handleWikiDelete}><Trash2 size={15} /> Eliminar artigo</Button></div></div></div>}</Card>}

        {activeSection === 'parceiros' && !modBloqueado('parceiros') && (() => {
          const q = partnerQuery.trim().toLowerCase()
          const visiveis = partners.filter(p => (partnerEstado === 'todos' || p.status === partnerEstado) && (!q || [p.nome_responsavel, p.empresa_nif, p.telefone_whatsapp, p.provincia, p.modalidade].some(v => String(v || '').toLowerCase().includes(q))))
          const contagem = (s: string) => s === 'todos' ? partners.length : partners.filter(p => p.status === s).length
          return <>
          <Card className="admin-panel admin-section-panel"><div className="admin-panel-head"><div><span className="admin-panel-kicker">REVENDA NEGOMIL — AGT</span><h2>Sub-parceiros & candidaturas</h2></div><div className="health-actions"><Button size="sm" onClick={() => setNovaParceiro(true)}><Plus size={14} /> Inscrever parceiro</Button></div></div><div className="partner-filtros"><div className="order-filter-tabs">{([['todos', 'Todos'], ['pendente', 'Pendentes'], ['em_analise', 'Em análise'], ['aprovado', 'Aprovados'], ['rejeitado', 'Rejeitados']] as [string, string][]).map(([id, lb]) => <button key={id} className={`order-filter-tab ${partnerEstado === id ? 'is-active' : ''}`} onClick={() => setPartnerEstado(id as 'todos' | 'pendente' | 'em_analise' | 'aprovado' | 'rejeitado')}>{lb} <i>{contagem(id)}</i></button>)}</div><div className="license-search"><Search size={15} /><input value={partnerQuery} onChange={(e) => setPartnerQuery(e.target.value)} placeholder="Pesquisar parceiro, NIF, província, telefone..." /></div></div>{visiveis.length === 0 ? <div className="admin-empty-state"><Network size={48} /><h3>{q || partnerEstado !== 'todos' ? 'Nada corresponde aos filtros' : 'Sem parceiros ainda'}</h3><p>{q || partnerEstado !== 'todos' ? 'Ajuste o estado selecionado ou limpe a pesquisa.' : 'As candidaturas do site e as inscrições manuais aparecem aqui.'}</p></div> : <div className="partner-list">{visiveis.map((partner) => <div className="partner-row" key={partner.id}><div className="partner-main"><strong>{partner.nome_responsavel}</strong><small>{partner.modalidade} · {partner.provincia || '—'} · {partner.telefone_whatsapp}{partner.empresa_nif ? ` · NIF ${partner.empresa_nif}` : ''}{licenses.some(l => l.parceiro_id === partner.id) ? ` · ${licenses.filter(l => l.parceiro_id === partner.id).length} licença(s)` : ''}</small>{partner.nota && <p className="partner-note">"${partner.nota.slice(0, 110)}${partner.nota.length > 110 ? '…' : ''}"</p>}</div><span className={`contact-status contact-status--${partner.status}`} data-tip={partner.status === 'aprovado' ? 'Aprovado — autorizado a revender Negomil' : partner.status === 'em_analise' ? 'Candidatura em análise pela equipa de parcerias' : partner.status === 'rejeitado' ? 'Candidatura recusada' : 'Aguarda primeira análise'}>{labelParceiro(partner.status)}</span><div className="partner-metrics"><label>Vendas<input className="metric-input" type="number" min="0" defaultValue={partner.volume_vendas} onBlur={(e) => updatePartnerMetric(partner, 'volume_vendas', e.target.value)} /></label><label>Clientes<input className="metric-input" type="number" min="0" defaultValue={partner.clientes_angariados} onBlur={(e) => updatePartnerMetric(partner, 'clientes_angariados', e.target.value)} /></label></div><div className="service-admin-actions"><button className="icon-btn" title="Abrir ficha & licenças" data-tip="Ficha completa, nota interna e licenças vendidas via este parceiro" onClick={() => { void abrirFicha(partner) }}><FolderOpen size={16} /></button><a className="icon-btn" title="WhatsApp do parceiro" data-tip="Abrir WhatsApp com este contacto" href={`https://wa.me/${partner.telefone_whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer"><MessageCircle size={16} /></a>{partner.status !== 'aprovado' && <button className="icon-btn" title="Aprovar" onClick={() => updatePartnerStatus(partner, 'aprovado')}><Check size={16} /></button>}{partner.status !== 'rejeitado' && <button className="icon-btn" title="Rejeitar" onClick={() => updatePartnerStatus(partner, 'rejeitado')}><X size={16} /></button>}<button className="icon-btn" title="Eliminar" onClick={() => setDeletingPartnerId(partner.id)}><Trash2 size={16} /></button></div></div>)}</div>}</Card>

          {fichaPartner && <div className="admin-modal-backdrop" onMouseDown={() => setFichaPartner(null)}><div className="admin-modal admin-modal--lg" onMouseDown={(e) => e.stopPropagation()}><div className="admin-modal-head"><div><span className="admin-panel-kicker">REVENDA NEGOMIL · FICHA</span><h2>{fichaPartner.nome_responsavel}</h2></div><button onClick={() => setFichaPartner(null)}><X size={18} /></button></div><form className="settings-form" onSubmit={(e) => { e.preventDefault(); void guardarFicha() }}><div className="settings-row"><label className="settings-field">Responsável<input value={fichaForm.nome} onChange={(e) => setFichaForm(f => ({ ...f, nome: e.target.value }))} required maxLength={150} /></label><label className="settings-field">WhatsApp<input value={fichaForm.telefone} onChange={(e) => setFichaForm(f => ({ ...f, telefone: e.target.value }))} required maxLength={20} /></label></div><div className="settings-row"><label className="settings-field">Empresa / NIF<input value={fichaForm.nif} onChange={(e) => setFichaForm(f => ({ ...f, nif: e.target.value }))} maxLength={40} placeholder="Opcional" /></label><label className="settings-field">Província<input value={fichaForm.provincia} onChange={(e) => setFichaForm(f => ({ ...f, provincia: e.target.value }))} maxLength={60} placeholder="Opcional" /></label></div><div className="settings-row"><label className="settings-field">Modalidade<select value={fichaForm.modalidade} onChange={(e) => setFichaForm(f => ({ ...f, modalidade: e.target.value }))}><option>Individual</option><option>Profissional</option><option>Empresa</option></select></label><label className="settings-field">Estado<select value={fichaForm.status} onChange={(e) => setFichaForm(f => ({ ...f, status: e.target.value }))}><option value="pendente">Pendente</option><option value="em_analise">Em análise</option><option value="aprovado">Aprovado</option><option value="rejeitado">Rejeitado</option></select></label></div><div className="settings-row"><label className="settings-field">Vendas<input className="metric-input" type="number" min="0" value={fichaForm.vendas} onChange={(e) => setFichaForm(f => ({ ...f, vendas: e.target.value }))} /></label><label className="settings-field">Clientes angariados<input className="metric-input" type="number" min="0" value={fichaForm.clientes} onChange={(e) => setFichaForm(f => ({ ...f, clientes: e.target.value }))} /></label></div><label className="settings-field">Nota interna<textarea rows={2} maxLength={600} value={fichaForm.nota} onChange={(e) => setFichaForm(f => ({ ...f, nota: e.target.value }))} placeholder="Acordos de comissão, contactos feitos, observações..." /></label><div className="settings-actions"><Button size="sm" type="submit" disabled={savingFicha}>{savingFicha ? 'A guardar…' : <><Check size={14} /> Guardar ficha</>}</Button></div></form><div className="partner-licencas"><h3>Licenças vendidas via este parceiro <i>{licenses.filter(l => l.parceiro_id === fichaPartner.id).length}</i></h3>{licenses.filter(l => l.parceiro_id === fichaPartner.id).length === 0 ? <p className="settings-hint">Nenhuma licença atribuída ainda — atribua abaixo uma licença livre da carteira.</p> : <ul>{licenses.filter(l => l.parceiro_id === fichaPartner.id).map((lic) => <li key={lic.id}><code className="partner-key" data-tip="Clique para copiar a chave" onClick={() => { void navigator.clipboard?.writeText(lic.chave_licenca); notify('Chave copiada') }}>{lic.chave_licenca}</code><span className="partner-key-cliente">{lic.cliente_nome} · expira {lic.data_expiracao ? new Date(lic.data_expiracao).toLocaleDateString('pt-PT') : '—'}</span><span className={`contact-status contact-status--${lic.status === 'activa' ? 'aprovado' : lic.status === 'cancelada' ? 'rejeitado' : 'em_analise'}`}>{lic.status}</span><button className="icon-btn" title="Devolver à carteira livre" onClick={() => { void removerLicencaParceiro(lic.id) }}><Undo2 size={14} /></button></li>)}</ul>}<div className="partner-atribuir"><select value={licNovaId} onChange={(e) => setLicNovaId(e.target.value)}><option value="">Atribuir licença livre…</option>{licenses.filter(l => !l.parceiro_id).map((lic) => <option key={lic.id} value={lic.id}>{lic.chave_licenca} · {lic.cliente_nome} · {lic.status}</option>)}</select><Button size="sm" type="button" disabled={!licNovaId} onClick={() => { void atribuirLicenca() }}><Plus size={14} /> Atribuir</Button></div></div></div></div>}

          {novaParceiro && <div className="admin-modal-backdrop" onMouseDown={() => setNovaParceiro(false)}><div className="admin-modal" onMouseDown={(e) => e.stopPropagation()}><div className="admin-modal-head"><div><span className="admin-panel-kicker">INSCRIÇÃO MANUAL</span><h2>Inscrever sub-parceiro</h2></div><button onClick={() => setNovaParceiro(false)}><X size={18} /></button></div><form className="settings-form" onSubmit={(e) => { e.preventDefault(); void criarParceiroNovo() }}><label className="settings-field">Responsável<input value={novaParceiroForm.nome} onChange={(e) => setNovaParceiroForm(f => ({ ...f, nome: e.target.value }))} required maxLength={150} /></label><div className="settings-row"><label className="settings-field">WhatsApp<input value={novaParceiroForm.telefone} onChange={(e) => setNovaParceiroForm(f => ({ ...f, telefone: e.target.value }))} required maxLength={20} placeholder="+244 9…" /></label><label className="settings-field">Empresa / NIF<input value={novaParceiroForm.nif} onChange={(e) => setNovaParceiroForm(f => ({ ...f, nif: e.target.value }))} maxLength={40} placeholder="Opcional" /></label></div><div className="settings-row"><label className="settings-field">Província<input value={novaParceiroForm.provincia} onChange={(e) => setNovaParceiroForm(f => ({ ...f, provincia: e.target.value }))} maxLength={60} placeholder="Opcional" /></label><label className="settings-field">Modalidade<select value={novaParceiroForm.modalidade} onChange={(e) => setNovaParceiroForm(f => ({ ...f, modalidade: e.target.value }))}><option>Individual</option><option>Profissional</option><option>Empresa</option></select></label></div><label className="settings-field">Nota<input value={novaParceiroForm.nota} onChange={(e) => setNovaParceiroForm(f => ({ ...f, nota: e.target.value }))} maxLength={600} placeholder="Como foi encontrado, acordos..." /></label><div className="settings-actions"><Button variant="outline" type="button" onClick={() => setNovaParceiro(false)}>Cancelar</Button><Button type="submit" disabled={savingNovaParceiro}>{savingNovaParceiro ? 'A inscrever…' : <><Plus size={14} /> Inscrever parceiro</>}</Button></div></form></div></div>}
          </>
        })()}

        {activeSection === 'contactos' && <Card className="admin-panel admin-section-panel"><div className="admin-panel-head"><div><span className="admin-panel-kicker">PEDIDOS DE CONTACTO</span><h2>Contactos recebidos</h2></div><span className="admin-muted">{contacts.length} contacto(s) · últimos 30</span></div>{visibleContacts.length === 0 ? <div className="admin-empty-state"><UsersRound size={48} /><h3>{contacts.length ? 'Sem correspondências' : 'Sem contactos ainda'}</h3><p>{contacts.length ? `Nenhum contacto corresponde a "${search}".` : 'Quando alguém submeter o formulário do site, o pedido aparece aqui.'}</p></div> : <div className="contact-list">{visibleContacts.map((contact) => <div key={contact.id} className={`contact-item ${selectedContactId === contact.id ? 'contact-item--open' : ''}`}><button type="button" className="contact-item-head" onClick={() => setSelectedContactId(selectedContactId === contact.id ? null : contact.id)} aria-expanded={selectedContactId === contact.id}><span className="contact-initials">{contact.name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()}</span><span className="contact-main"><strong>{contact.name}</strong><small>{contact.email}{contact.phone ? ` · ${contact.phone}` : ''}</small></span><span className="contact-interest">{contact.service_interest}</span><span className={`contact-status contact-status--${contactStatusTone(contact.status)}`} data-tip={contact.status === 'unread' || contact.status === 'new' ? 'Aguarda a primeira resposta da equipa' : contact.status === 'em_contacto' ? 'Em conversa com o cliente' : contact.status === 'proposta' ? 'Proposta enviada — aguarda confirmação' : contact.status === 'fechado' ? 'Negócio concluído' : 'Tratado ou arquivado'}>{contactStatusLabel(contact.status)}</span><time>{formatDate(contact.created_at)}</time><ChevronRight size={16} className="contact-chevron" /></button>{selectedContactId === contact.id && <div className="contact-detail"><p>{contact.message || '(Sem mensagem.)'}</p><div className="contact-detail-actions">{contact.status !== 'read' && <Button size="sm" variant="outline" onClick={() => handleContactStatus(contact, 'read')}><Check size={14} /> Marcar como lido</Button>}{contact.status !== 'unread' && <Button size="sm" variant="outline" onClick={() => handleContactStatus(contact, 'unread')}><Bell size={14} /> Marcar como novo</Button>}{contact.status !== 'em_contacto' && <Button size="sm" variant="outline" onClick={() => handleContactStatus(contact, 'em_contacto')}><Headphones size={14} /> Em contacto</Button>}{contact.status !== 'proposta' && <Button size="sm" variant="outline" onClick={() => handleContactStatus(contact, 'proposta')}><FilePlus2 size={14} /> Proposta enviada</Button>}{contact.status !== 'fechado' && <Button size="sm" variant="outline" onClick={() => handleContactStatus(contact, 'fechado')}><Check size={14} /> Fechar</Button>}<Button size="sm" variant="outline" onClick={() => handleContactStatus(contact, 'archived')}><Archive size={14} /> Arquivar</Button><Button size="sm" variant="dark" className="btn-danger" onClick={() => setDeletingContactId(contact.id)}><Trash2 size={14} /> Eliminar</Button></div></div>}</div>)}</div>}</Card>}

        {activeSection === 'pedidos' && !modBloqueado('pedidos') && (() => {
          const filtered = licenseOrders.filter(o => orderFilter === 'Todos' ? true : o.status === orderFilter)
          // Pipeline visual: arraste um cartão para a coluna do novo estado
          const colunasKanban = [
            { estado: 'Pendente', cor: 'kn--pendente' },
            { estado: 'Em Verificação', cor: 'kn--verificacao' },
            { estado: 'Aprovado', cor: 'kn--aprovado' },
            { estado: 'Pago', cor: 'kn--pago' },
            { estado: 'Rejeitado', cor: 'kn--rejeitado' },
          ]
          const kanban = (
            <div className="kanban-board">
              {colunasKanban.map((col) => {
                const deCol = filtered.filter(o => o.status === col.estado)
                return (
                  <div key={col.estado} className={`kanban-col ${col.cor}`} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); const id = e.dataTransfer.getData('text/plain'); const alvo = licenseOrders.find(o => o.id === id); if (alvo && alvo.status !== col.estado) updateOrderStatus(alvo, col.estado) }}>
                    <div className="kanban-col-head"><b>{col.estado}</b><i>{deCol.length}</i></div>
                    {deCol.length === 0 && <span className="kanban-col-hint">Vazio — arrasta cartões para cá</span>}
                    {deCol.map((o) => (
                      <div key={o.id} className="kanban-card" draggable onDragStart={(e) => e.dataTransfer.setData('text/plain', o.id)}>
                        <strong>{o.nome_empresa}</strong>
                        <span>{o.software_nome}</span>
                        <small>{new Date(o.created_at).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' })} · #{o.id.slice(0, 8).toUpperCase()}</small>
                        {o.telefone_whatsapp && <a className="kanban-wa" data-tip="Falar no WhatsApp" href={waLinkAdmin(o.telefone_whatsapp, o)} target="_blank" rel="noreferrer noopener"><MessageCircle size={12} /> WhatsApp</a>}{o.status === 'Pago' && <a className="kanban-wa" data-tip="Fatura interna PDF" href={'/api/admin/license-orders/' + o.id + '/fatura'} target="_blank" rel="noreferrer noopener"><Banknote size={12} /> Fatura</a>}
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          )
          return <Card className="admin-panel admin-section-panel"><div className="admin-panel-head"><div><span className="admin-panel-kicker">CHECKOUT B2B</span><h2>Pedidos de licença</h2></div><div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}><span className="order-live-note" data-tip="O painel busca novos pedidos automaticamente a cada 20 segundos"><i /> tempo real · 20 s</span><button className="icon-btn" title="Actualizar pedidos" onClick={() => loadLicenseOrders()}><RefreshCw size={15} /></button><div className="order-filter-tabs">{(['Todos', 'Pendente', 'Em Verificação', 'Aprovado', 'Pago', 'Rejeitado'] as const).map(f => <button key={f} className={orderFilter === f ? 'order-filter-tab is-active' : 'order-filter-tab'} onClick={() => setOrderFilter(f)}>{f === 'Todos' ? `Todos (${licenseOrders.length})` : f === 'Pendente' ? `Pendentes (${licenseOrders.filter(o => o.status === 'Pendente').length})` : f === 'Em Verificação' ? `Verificação (${licenseOrders.filter(o => o.status === 'Em Verificação').length})` : f === 'Aprovado' ? `Aprovados (${licenseOrders.filter(o => o.status === 'Aprovado').length})` : f === 'Pago' ? `Pagos (${licenseOrders.filter(o => o.status === 'Pago').length})` : `Rejeitados (${licenseOrders.filter(o => o.status === 'Rejeitado').length})`}</button>)}</div><div className="order-filter-tabs" data-tip="Quadro arrastável ou tabela detalhada">{(['tabela', 'kanban'] as const).map(v => <button key={v} className={`order-filter-tab ${orderView === v ? 'is-active' : ''}`} onClick={() => setOrderView(v)}>{v === 'tabela' ? 'Tabela' : 'Kanban'}</button>)}</div></div></div>{filtered.length === 0 ? <div className="admin-empty-state"><ShoppingCart size={48} /><h3>Sem pedidos {orderFilter !== 'Todos' ? `— ${orderFilter === 'Pendente' ? 'pendentes' : orderFilter === 'Aprovado' ? 'aprovados' : orderFilter === 'Pago' ? 'pagos — fatura interna disponível na linha' : orderFilter === 'Em Verificação' ? 'em verificação' : 'rejeitados'}` : 'nesta vista'}</h3><p>Assim que clientes registarem pedidos pelo checkout do site, aparecem aqui em tempo real.</p></div> : orderView === 'kanban' ? kanban : <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Data</th><th>Empresa / NIF</th><th>Software</th><th>Responsável / WhatsApp</th><th>Província</th><th>Pagamento</th><th>Status</th><th /></tr></thead><tbody>{filtered.map((order) => <tr key={order.id}><td>{new Date(order.created_at).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' })}<small className="order-time">{new Date(order.created_at).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}</small></td><td><strong>{order.nome_empresa}</strong><small className="order-sub">{order.nif}</small></td><td>{order.software_nome}</td><td>{order.nome_responsavel}<small className="order-sub">{order.telefone_whatsapp}</small>{order.email && <small className="order-sub">{order.email}</small>}</td><td>{order.provincia}</td><td>{order.forma_pagamento === 'Multicaixa Express' ? 'Multicaixa Express' : 'Transferência / IBAN'}</td><td><span className={`order-status-pill order-status--${order.status.replace(/\s/g, '')}`} data-tip={order.status === 'Pendente' ? 'Aguarda 1.ª verificação da equipa' : order.status === 'Em Verificação' ? 'A equipa está a validar o pedido' : order.status === 'Aprovado' ? 'Cliente notificado por e-mail com o IBAN' : order.status === 'Pago' ? 'Pagamento confirmado — fatura interna disponível' : 'Pedido recusado — cliente recebeu e-mail com motivo'}>{orderLabelStatus(order.status)}</span></td><td className="row-actions"><a className="icon-btn" title="Proforma PDF · 2.ª via" data-tip="Gerar proforma em PDF com nº sequencial" href={'/api/admin/license-orders/' + order.id + '/proforma'} target="_blank" rel="noreferrer noopener"><FileText size={15} /></a>{order.status === 'Pago' ? <a className="icon-btn order-btn--ok" title="Fatura interna PDF" data-tip="Fatura interna nº FT — documento de conferência" href={'/api/admin/license-orders/' + order.id + '/fatura'} target="_blank" rel="noreferrer noopener"><Banknote size={15} /></a> : (order.status === 'Aprovado' ? <button className="icon-btn order-btn--ok" title="Confirmar pagamento" data-tip="Pagamento recebido — destrava a fatura interna" onClick={() => updateOrderStatus(order, 'Pago')}><Banknote size={15} /></button> : (order.status === 'Pendente' || order.status === 'Em Verificação' || order.status === 'Rejeitado') && <button className="icon-btn order-btn--ok" title="Confirmar & Aprovar" onClick={() => updateOrderStatus(order, 'Aprovado')}><Check size={15} /></button>)}{order.status === 'Pendente' && <button className="icon-btn" title="Marcar Em Verificação" onClick={() => updateOrderStatus(order, 'Em Verificação')}><Loader2 size={15} /></button>}{(order.status === 'Pendente' || order.status === 'Em Verificação') && <button className="icon-btn" title="Rejeitar" onClick={() => updateOrderStatus(order, 'Rejeitado')}><X size={15} /></button>}<a className="icon-btn" title="Falar no WhatsApp" href={waLinkAdmin(order.telefone_whatsapp, order)} target="_blank" rel="noreferrer noopener"><MessageCircle size={15} /></a><button className="icon-btn danger" title="Eliminar pedido" onClick={() => setDeletingOrderId(order.id)}><Trash2 size={15} /></button></td></tr>)}</tbody></table></div>}</Card>
        })()}

        {activeSection === 'relatorios' && !modBloqueado('relatorios') && (() => {
          // vendidos = entregues (Aprovado) + pagos (Pago) — é a receita que entra na meta
          const vendidos = licenseOrders.filter(o => o.status === 'Aprovado' || o.status === 'Pago')
          const emAberto = licenseOrders.filter(o => o.status === 'Pendente' || o.status === 'Em Verificação')
          const rejeitados = licenseOrders.filter(o => o.status === 'Rejeitado')
          const total = licenseOrders.length
          const conversao = total > 0 ? Math.round((vendidos.length / total) * 100) : 0
          const precoDe = (nome: string) => { const alvo = String(nome || '').toLowerCase().trim(); const ache = software.find(s => s.price && (s.name.toLowerCase() === alvo || s.name.toLowerCase().includes(alvo) || alvo.includes(s.name.toLowerCase().split(' ')[0]))); return ache?.price ?? null }
          const receita = vendidos.reduce((soma, o) => soma + (precoDe(o.software_nome) || 0), 0)
          const fmt = new Intl.NumberFormat('pt-PT')
          // meta mensal (Kz) definida pelo super admin — receita aprovada do mês em curso vs. meta
          const meta = Number(summary.metaMensal || 0)
          const chaveMes = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
          const receitaMes = vendidos.filter(o => o.created_at.slice(0, 7) === chaveMes).reduce((soma, o) => soma + (precoDe(o.software_nome) || 0), 0)
          const pctMeta = meta > 0 ? Math.min(100, Math.round((receitaMes / meta) * 100)) : 0
          const porSoftware = Object.entries(vendidos.reduce((acc: Record<string, number>, o) => { const k = o.software_nome || '—'; acc[k] = (acc[k] || 0) + 1; return acc }, {})).sort((a, b) => b[1] - a[1])
          const maxTop = Math.max(1, ...porSoftware.map(p => p[1]))
          const meses = [5, 4, 3, 2, 1, 0].map(retro => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - retro); const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; const n = vendidos.filter(o => o.created_at.slice(0, 7) === key).length; return { key, label: d.toLocaleDateString('pt-PT', { month: 'short' }), n } })
          const maxMes = Math.max(1, ...meses.map(m => m.n))
          return <Card className="admin-panel admin-section-panel"><div className="admin-panel-head"><div><span className="admin-panel-kicker">COMERCIAL — MÉTRICAS</span><h2>Relatórios de vendas</h2></div><span className="order-live-note" data-tip="Baseado nos pedidos do checkout B2B e no preço de catálogo registado"><i /> actualizado ao carregar</span></div><div className="report-kpis"><div className="report-kpi"><span>Pedidos totais</span><strong>{total}</strong></div><div className="report-kpi"><span>Vendidos</span><strong>{vendidos.length}</strong></div><div className="report-kpi"><span>Taxa de conversão</span><strong>{conversao}%</strong><small>{emAberto.length} em aberto{rejeitados.length ? ` · ${rejeitados.length} rejeitado(s)` : ''}</small></div><div className="report-kpi report-kpi--kz"><span>Receita aprovada (estimada)</span><strong>{fmt.format(receita)} Kz</strong><small>preço de catálogo dos softwares</small></div></div>{meta > 0 ? <div className="meta-strip"><div className="meta-info"><strong>🎯 Meta mensal</strong><span>{fmt.format(receitaMes)} Kz de {fmt.format(meta)} Kz · {new Date().toLocaleDateString('pt-PT', { month: 'long' })}</span></div><span className="mini-table-bar meta-bar"><i style={{ width: `${pctMeta}%`, background: pctMeta >= 100 ? 'linear-gradient(90deg,#16a34a,#22c55e)' : undefined }} /></span><b className={pctMeta >= 100 ? 'meta-bateu' : 'meta-falta'} data-tip={pctMeta >= 100 ? 'Meta do mês atingida — continuação!' : `Faltam ${fmt.format(Math.max(0, meta - receitaMes))} Kz para a meta`}>{pctMeta}%</b></div> : <div className="meta-strip meta-strip--off" data-tip="O super admin escreve o valor em Kz nas Definições → Site público"><span>🎯 Meta mensal não definida — PEDE ao super admin para a escrever nas Definições (Kz).</span></div>}<div className="report-grid"><div className="report-block"><h3>Pedidos aprovados · últimos 6 meses</h3>{meses.every(m => m.n === 0) ? <p className="admin-muted" style={{ fontSize: '.68rem' }}>Ainda sem pedidos aprovados no período — o gráfico arranca com o primeiro pedido aprovado.</p> : <div className="report-bars">{meses.map(m => <div key={m.key} className="report-bar" data-tip={`${m.key}: ${m.n} pedido(s) aprovado(s)`}><i style={{ height: `${Math.max(5, Math.round((m.n / maxMes) * 100))}%` }} /><span>{m.label}</span></div>)}</div>}</div><div className="report-block"><h3>Softwares mais vendidos</h3>{porSoftware.length === 0 ? <p className="admin-muted" style={{ fontSize: '.68rem' }}>Sem vendas aprovadas ainda — os pedidos aprovados entram aqui por ordem de sucesso.</p> : <div className="report-top-list">{porSoftware.map(([nome, n]) => <div key={nome}><strong>{nome}</strong><b>{n} pedido(s)</b><span className="mini-table-bar"><i style={{ width: `${Math.round((n / maxTop) * 100)}%` }} /></span></div>)}</div>}</div></div><p className="admin-muted" style={{ margin: '14px 0 0', fontSize: '.66rem' }}>Proformas emitidas: contador automático no endpoint de proforma (settings · proforma_seq). Valores marcam estimativa com preço de catálogo — softwares sob consulta não contam receita.</p></Card>
        })()}

        {activeSection === 'developer' && <>
          <Card className="admin-panel admin-section-panel"><div className="admin-panel-head"><div><span className="admin-panel-kicker">ÁREA EXCLUSIVA · DEVELOPER (NEXORA SYSTEMS)</span><h2>Licença & módulos da plataforma</h2></div><span className="developer-lock" data-tip="Só a sua conta developer vê e altera estas definições — o super admin da CFTEC não pode">🔒 só o developer</span></div><p style={{ margin: '0 0 18px', color: '#64748b', fontSize: '.72rem', lineHeight: 1.6 }}>Estes interruptores controlam o que a CFTEC tem direito a usar conforme o contrato Setup/manutenção. Alterações aplicam-se a todos os painéis em até <b>20 segundos</b> (ou imediatamente ao recarregar). As chaves de licença nunca aparecem nas Definições do super admin.</p>{!sysLic.licencaAtiva && <div className="licenca-aviso licenca-aviso--off"><AlertTriangle size={15} /> A plataforma está SUSPENSA — a equipa CFTEC vê um ecrã de bloqueio e os formulários públicos (checkout/suporte) estão fechados.</div>}
          <div className="dev-lic-status"><strong>{sysLic.expirada ? 'LICENÇA EXPIRADA (suspensão automática)' : sysLic.licencaAtiva ? 'Licença ACTIVA' : 'Licença SUSPENSA'}</strong><span>{sysLic.expiraEm ? `Validade até ${new Date(sysLic.expiraEm).toLocaleDateString('pt-PT')}${typeof sysLic.diasParaVencer === 'number' && sysLic.diasParaVencer >= 0 ? ` · ${sysLic.diasParaVencer === 0 ? 'vence hoje' : `vence em ${sysLic.diasParaVencer} dia(s)`} (aviso ${sysLic.diasAviso || 5} dias antes)` : ''}` : 'Sem prazo de validade definido'}</span>{sysLic.expirada && <span className="dev-lic-urgente">⏰ Venceu-se a {new Date(sysLic.expiraEm).toLocaleDateString('pt-PT')} — a equipa CFTEC está bloqueada (ou em bypass de emergência).</span>}</div>
          <div className="dev-toggles">
            <div className={`dev-toggle-row ${!sysLic.licencaAtiva ? 'dev-toggle-row--off' : ''}`}><div><strong>Licença da plataforma</strong><small>Off = painel bloqueia para toda a equipa CFTEC excepto developers · formulários públicos fechados</small></div><button type="button" className={`dev-switch ${sysLic.licencaAtiva ? 'is-on' : ''}`} aria-label="Licença da plataforma" onClick={() => guardarLicenca({ licencaAtiva: !sysLic.licencaAtiva })} /></div>
            <div className={`dev-toggle-row ${!sysLic.moduloComercial ? 'dev-toggle-row--off' : ''}`}><div><strong>Módulo Comercial</strong><small>Pedidos B2B, proformas, faturas internas, relatórios e revenda Negomil (+ checkout público)</small></div><button type="button" className={`dev-switch ${sysLic.moduloComercial ? 'is-on' : ''}`} aria-label="Módulo Comercial" onClick={() => guardarLicenca({ moduloComercial: !sysLic.moduloComercial })} /></div>
            <div className={`dev-toggle-row ${!sysLic.moduloTecnico ? 'dev-toggle-row--off' : ''}`}><div><strong>Módulo de Suporte Técnico</strong><small>Chamados de suporte + wiki técnica (+ formulário público de suporte)</small></div><button type="button" className={`dev-switch ${sysLic.moduloTecnico ? 'is-on' : ''}`} aria-label="Módulo Técnico" onClick={() => guardarLicenca({ moduloTecnico: !sysLic.moduloTecnico })} /></div>
            <div className={`dev-toggle-row ${!sysLic.moduloNovidades ? 'dev-toggle-row--off' : ''}`}><div><strong>Módulo de Novidades</strong><small>Blog/CMS e destaques do site (slider da página inicial)</small></div><button type="button" className={`dev-switch ${sysLic.moduloNovidades ? 'is-on' : ''}`} aria-label="Módulo de Novidades" onClick={() => guardarLicenca({ moduloNovidades: !sysLic.moduloNovidades })} /></div>
          </div>
          <form className="settings-form dev-lic-form" onSubmit={(e) => { e.preventDefault(); guardarLicenca({ expiraEm: sysLic.expiraEm, mensagem: sysLic.mensagem }) }}>
            <div className="settings-row">
              <label className="settings-field">Licença expira em (opcional)<input type="date" value={sysLic.expiraEm} onChange={(e) => setSysLic(s => ({ ...s, expiraEm: e.target.value }))} /><small className="settings-hint">Vazio = sem prazo. A equipa vê “⚠️ licença de manutenção expira a …” no painel.</small></label>
            </div>
            <label className="settings-field">Mensagem de bloqueio<textarea rows={2} maxLength={300} value={sysLic.mensagem} onChange={(e) => setSysLic(s => ({ ...s, mensagem: e.target.value }))} placeholder="Módulo indisponível no vosso plano actual. Contacte o suporte técnico." /></label>
            <div className="settings-actions"><Button type="submit" size="sm"><Check size={14} /> Guardar prazo & mensagem</Button></div>
          </form>
        </Card>
          <Card className="admin-panel admin-section-panel"><div className="admin-panel-head"><div><span className="admin-panel-kicker">CONTRATO SAAS · REGRAS AUTOMÁTICAS</span><h2>Regras de contrato & quotas</h2></div><span className="developer-lock" data-tip="O sistema aplica sozinho: aviso por data, quotas e modo só-leitura — sem precisar de 'dar a cara' para bloquear manualmente">⚙️ automático</span></div><p style={{ margin: '0 0 18px', color: '#64748b', fontSize: '.72rem', lineHeight: 1.6 }}>O sistema vigia as regras por si: <b>avisos amarelos</b> X dias antes do vencimento e <b>suspensão automática</b> no dia seguinte; <b>quota de utilizadores</b> bloqueia a criação de contas acima do plano; <b>quota de storage</b> trava uploads de instaladores/mídia; e o <b>modo somente leitura</b> congela a escrita mantendo a consulta (período de graça).</p>
          <form className="settings-form dev-lic-form" onSubmit={(e) => { e.preventDefault(); guardarRegras() }}>
            <div className="settings-row dev-regras-grid">
              <label className="settings-field">Aviso prévio (dias)<input type="number" min={0} max={30} value={regrasForm.diasAviso} onChange={(e) => setRegrasForm(r => ({ ...r, diasAviso: e.target.value }))} /><small className="settings-hint">Banner amarelo “vence em N dias” começa a aparecer este número de dias antes da validade.</small></label>
              <label className="settings-field">Máx. utilizadores do painel<input type="number" min={0} max={999} value={regrasForm.maxUsuarios} onChange={(e) => setRegrasForm(r => ({ ...r, maxUsuarios: e.target.value }))} /><small className="settings-hint">0 = ilimitado. Ao atingir, a criação de contas devolve “upgrade do plano”.</small></label>
              <label className="settings-field">Máx. storage (MB)<input type="number" min={0} max={999999} value={regrasForm.maxStorageMb} onChange={(e) => setRegrasForm(r => ({ ...r, maxStorageMb: e.target.value }))} /><small className="settings-hint">0 = ilimitado. Soma real dos buckets (instaladores + mídia): {typeof sysLic.storageUsadoMb === 'number' ? `${sysLic.storageUsadoMb} MB em uso` : '…'}</small></label>
            </div>
            <div className="settings-actions"><Button type="submit" size="sm"><Check size={14} /> Guardar regras de contrato</Button></div>
          </form>
          <div className="dev-toggle-row dev-toggle-row--regras">
            <div><strong>Modo somente leitura (período de graça)</strong><small>Consulta livre de clientes, faturas e chamados; botões de escrita devolvem 403 ao painel da CFTEC. O código de emergência de 48h desbloqueia.</small></div>
            <button type="button" className={`dev-switch ${sysLic.somenteLeitura ? 'is-on' : ''}`} aria-label="Modo somente leitura" onClick={() => guardarRegras({ somenteLeitura: !sysLic.somenteLeitura })} />
          </div>
          <div className="dev-bypass-box">
            <div className="dev-bypass-head"><strong>Código de emergência mestre (48h)</strong><small>Se o Supabase/internet falhar ou suspender por engano: gere o código, passe-o por telefone/WhatsApp — o diretor da CFTEC insere no ecrã de bloqueio e ganha 48h de acesso sem depender da base de dados (assinado petid HMAC da plataforma, impossível de adivinhar).</small></div>
            <div className="settings-actions" style={{ marginBottom: codigoMaster ? 10 : 0 }}>
              <Button size="sm" onClick={gerarCodigoMaster} disabled={gerandoCodigo}>{gerandoCodigo ? <><Loader2 size={14} className="spin" /> A gerar…</> : <><KeyRound size={14} /> Gerar código de emergência</>}</Button>
            </div>
            {codigoMaster && <div className="dev-bypass-codigo"><code>{codigoMaster}</code><button className="icon-btn" title="Copiar código" onClick={() => { navigator.clipboard?.writeText(codigoMaster); notify('Código copiado — passe-o ao cliente por telefone/WhatsApp') }}><Copy size={14} /></button><small>válido 48h · cada utilização fica no Registo de actividades</small></div>}
          </div>
        </Card>
          {adminUser?.level === 'developer' && <Card className="admin-panel admin-section-panel settings-card--upg-dev"><div className="admin-panel-head"><div><span className="admin-panel-kicker">CONTRATO SAAS · PEDIDOS DO CLIENTE</span><h2>Pedidos de pagamento (manutenção)</h2></div><span className="order-live-note"><i /> {upgradePedidos.filter(p => p.estado === 'pendente').length} pendente(s)</span></div><p style={{ margin: '0 0 16px', color: '#64748b', fontSize: '.72rem', lineHeight: 1.6 }}>A CFTEC abre <b>Definições → Pagamento para a Manutenção</b>, escolhe o plano/add-ons e envia. O pedido chega aqui: veja o que querem pagar, <b>autorize</b> ou <b>recuse</b> (e-mail automático ao cliente). Ao <b>autorizar</b>, o contrato actualiza-se sozinho: licença activa, modo somente leitura desligado, validade +30 dias e os módulos <b>exactamente como a escolha do pedido</b> — o que não foi escolhido desliga (o Módulo Comercial fica sempre ligado, vem no plano base). Quotas só somam se já existir limite definido.</p>
            {upgradePedidos.length === 0 ? <div className="admin-empty-state" style={{ padding: '22px 0' }}><Wallet size={40} /><h3>Sem pedidos de pagamento</h3><p>Quando a CFTEC submeter um pedido no pop-up de planos, aparece aqui para decidir.</p></div> : <div className="upg-lista">{upgradePedidos.map(p => (
              <div className="upg-row" key={p.id}>
                <div className="upg-row-main">
                  <span className="upg-total">{p.total}</span>
                  <span className="upg-data">{p.empresa} · {p.email} · {formatDate(p.created_at)}</span>
                  <span className={`upg-chip upg-chip--${p.estado}`}>{p.estado === 'pendente' ? 'Pendente' : p.estado === 'autorizado' ? 'Autorizado' : 'Recusado'}</span>
                </div>
                <div className="upg-itens">{p.itens.split('\n').filter(Boolean).join(' · ')}</div>
                {p.nota_dev && <div className="upg-nota">Nota: {p.nota_dev}{p.resolvido_por ? ` — por ${p.resolvido_por}` : ''}</div>}
                {p.estado === 'pendente' && <div className="upg-acoes">
                  <Button type="button" size="sm" onClick={() => resolverUpgrade(p.id, 'autorizado')}><Check size={13} /> Autorizar</Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => resolverUpgrade(p.id, 'recusado')}><X size={13} /> Recusar</Button>
                </div>}
              </div>
            ))}</div>}
          </Card>}
          <Card className="admin-panel admin-section-panel"><div className="admin-panel-head"><div><span className="admin-panel-kicker">SEGURANÇA · NEXORA SYSTEMS</span><h2>Cópias de segurança</h2></div><span className="developer-lock" data-tip="Exportação exclusiva da conta developer — nem o super admin consegue descarregar">🔒 só o developer</span></div><p style={{ margin: '0 0 14px', color: '#64748b', fontSize: '.72rem', lineHeight: 1.6 }}>Gera um ficheiro <b>.json</b> com todos os dados da plataforma (abaixo). O ficheiro sai <b>directo para o seu computador</b> — nada fica guardado no servidor, zero risco de fuga. Cada exportação fica registada no Registo de actividades. Recomendação: exportar no fim de cada semana e guardar num disco externo ou nuvem privado.</p><ul className="dev-backup-lista">{[['pedidos_licencas', 'pedidos de licença'], ['licencas_palancasoft', 'licenças activas'], ['chamados_suporte', 'chamados'], ['wiki_tecnica', 'wiki técnica'], ['admin_users', 'utilizadores (sem passwords)'], ['settings', 'definições do portal'], ['parceiros_candidaturas', 'parceiros Negomil'], ['contacts', 'contactos do site'], ['blog_posts', 'blog'], ['novidades_destaques', 'destaques'], ['media', 'galeria de mídia'], ['softwares', 'softwares'], ['services', 'serviços'], ['audit_log', 'auditoria (últimos 20 000)']].map(([t, l]) => <li key={t} data-tip={t}><Database size={12} /> {l}</li>)}</ul><div className="settings-actions"><Button size="sm" onClick={exportarBackup} disabled={baixandoBackup}>{baixandoBackup ? <><Loader2 size={14} className="spin" /> A gerar cópia…</> : <><ArrowDownToLine size={14} /> Exportar cópia completa (.json)</>}</Button></div></Card>
        </>}

        {activeSection === 'auditoria' && (() => {
          const q = auditSearch.trim().toLowerCase()
          const visiveis = q ? audit.filter(r => `${r.actor_email} ${r.acao} ${r.entidade} ${r.detalhe || ''}`.toLowerCase().includes(q)) : audit
          return <Card className="admin-panel admin-section-panel"><div className="admin-panel-head"><div><span className="admin-panel-kicker">HISTÓRICO · QUEM FEZ O QUÊ</span><h2>Registo de actividades</h2></div><div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}><span className="order-live-note" data-tip="Cada mutação do painel e cada formulário submetido no site deixa rasto aqui — últimos 300 registos"><i /> últimos registos</span><div className="license-search"><Search size={15} /><input value={auditSearch} onChange={(e) => setAuditSearch(e.target.value)} placeholder="Pesquisar quem, acção, entidade..." /></div><button className="icon-btn" title="Actualizar registo" onClick={() => loadAudit()}><RefreshCw size={15} /></button></div></div><p style={{ margin: '0 0 16px', color: '#64748b', fontSize: '.72rem', lineHeight: 1.6 }}>Trilha de auditoria interna: <b>logins</b> (incl. falhados), <b>mudanças de estado</b> de pedidos e chamados, artigos, licenças emitidas, utilizadores criados/apagados e <b>alterações da licença da plataforma</b> — com o autor e a hora exacta.</p>{visiveis.length === 0 ? <div className="admin-empty-state"><ScrollText size={48} /><h3>{q ? 'Nada corresponde à pesquisa' : 'Sem registos ainda'}</h3><p>{q ? `Nenhum registo corresponde a "${q}".` : 'Assim que alguém actuar no painel (ou um cliente submeter um formulário) o registo aparece aqui.'}</p></div> : <div className="admin-table-wrap"><table className="admin-table audit-table"><thead><tr><th>Data</th><th>Quem</th><th>Acção</th><th>Alvo</th><th>Detalhe</th></tr></thead><tbody>{visiveis.map((row) => <tr key={row.id}><td>{new Date(row.created_at).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' })}<small className="order-time">{new Date(row.created_at).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}</small></td><td><strong>{row.actor_email}</strong><small className="order-sub">{row.actor_level || (row.acao === 'login_falhado' ? 'sem sessão' : 'site público')}</small></td><td><span className={`audit-pill audit-pill--${ACAO_TOM(row.acao)}`} data-tip={`acção: ${row.acao}`}>{ACAO_LABEL[row.acao] || row.acao}</span></td><td>{row.entidade}{row.entidade_id && <small className="audit-eid"> #{String(row.entidade_id).slice(0, 8).toUpperCase()}</small>}</td><td><small className="audit-detalhe">{fmtAuditDetalhe(row.detalhe) || '—'}</small></td></tr>)}</tbody></table></div>}</Card>
        })()}

        {activeSection === 'settings' && <div className="settings-grid">
          {adminUser?.level === 'super_admin' && <Card className="admin-panel settings-card settings-card--upg">
            <div className="admin-panel-head"><div><span className="admin-panel-kicker">PAGAMENTO · MANUTENÇÃO</span><h2>Pagamento para a Manutenção</h2></div>
              <Button type="button" size="sm" onClick={() => setShowUpgrade(true)}><Sparkles size={14} /> Ver planos & solicitar</Button>
            </div>
            <p>Escolha os módulos, utilizadores ou armazenamento extra de que precisa e envie o pedido — a Nexora Systems (Developer) autoriza e activa por cá.</p>
            {upgradePedidos.length > 0 && <div className="upg-lista">
              {upgradePedidos.map(p => (
                <div className="upg-row" key={p.id}>
                  <div className="upg-row-main">
                    <span className="upg-total">{p.total}</span>
                    <span className="upg-data">{formatDate(p.created_at)}</span>
                    <span className={`upg-chip upg-chip--${p.estado}`}>{p.estado === 'pendente' ? 'Pendente' : p.estado === 'autorizado' ? 'Autorizado' : 'Recusado'}</span>
                  </div>
                  <div className="upg-itens">{p.itens.split('\n').filter(Boolean).join(' · ')}</div>
                  {p.nota_dev && <div className="upg-nota">Nota da Nexora: {p.nota_dev}</div>}
                </div>
              ))}
            </div>}
          </Card>}
          {['super_admin', 'developer'].includes(adminUser?.level || 'super_admin') && <Card className="admin-panel settings-card settings-card--portal"><div className="admin-panel-head"><div><span className="admin-panel-kicker">SITE PÚBLICO</span><h2>Contactos, pagamento & banner</h2></div><a className="settings-site-link" href="/" target="_blank" rel="noreferrer noopener">Abrir site <ChevronRight size={14} /></a></div><p>Estes valores alimentam o rodapé, a secção de contactos, o checkout B2B (IBAN + WhatsApp) e o banner superior do site. Guardar aplica ao site no próximo carregamento dos visitantes.</p><form className="settings-form" onSubmit={handlePortalSave}><div className="settings-grid-2">
          <label className="settings-field">WhatsApp comercial<small>Exemplo: 244933609090 (link wa.me nos cards e botões)</small><input value={portalSettings.whatsapp_comercial || ''} onChange={(e) => setPortalSettings(p => ({ ...p, whatsapp_comercial: e.target.value }))} placeholder="244933609090" maxLength={40} /></label>
          <label className="settings-field">WhatsApp de apoio técnico<small>Apoio Técnico a Clientes no site — chamados e suporte. Vazio = usa o comercial.</small><input value={portalSettings.whatsapp_tecnico || ''} onChange={(e) => setPortalSettings(p => ({ ...p, whatsapp_tecnico: e.target.value }))} placeholder="244933609091 (opcional)" maxLength={40} /></label>
          <label className="settings-field">E-mail de contacto<small>Rodapé e «Escreva-nos»</small><input type="email" value={portalSettings.email_contacto || ''} onChange={(e) => setPortalSettings(p => ({ ...p, email_contacto: e.target.value }))} placeholder="hello@cftec.co" maxLength={160} /></label>
          <label className="settings-field">Telefone de directório<small>Link «tel:» no rodapé</small><input value={portalSettings.telefone_directorio || ''} onChange={(e) => setPortalSettings(p => ({ ...p, telefone_directorio: e.target.value }))} placeholder="+244 923 000 000" maxLength={40} /></label>
          <label className="settings-field">IBAN de pagamento<small>Mostrado na confirmação dos pedidos de licença</small><input value={portalSettings.iban_cftec || ''} onChange={(e) => setPortalSettings(p => ({ ...p, iban_cftec: e.target.value }))} placeholder="AO06 ..." maxLength={40} className="iban-input" /></label>
          <label className="settings-field">Meta mensal de receita (Kz)<small>Interno — barra de progresso nos Relatórios & Metas do comercial. 0 = sem meta.</small><input type="number" min="0" value={portalSettings.meta_mensal_kz || ''} onChange={(e) => setPortalSettings(p => ({ ...p, meta_mensal_kz: e.target.value }))} placeholder="Ex.: 2500000" maxLength={12} /></label>
          <label className="settings-field">LinkedIn (URL)<input value={portalSettings.linkedin_url || ''} onChange={(e) => setPortalSettings(p => ({ ...p, linkedin_url: e.target.value }))} placeholder="https://www.linkedin.com/company/cftec" maxLength={200} /></label>
          <label className="settings-field">X / Twitter (URL)<input value={portalSettings.x_url || ''} onChange={(e) => setPortalSettings(p => ({ ...p, x_url: e.target.value }))} placeholder="https://x.com/cftec" maxLength={200} /></label>
          <label className="settings-checkbox settings-banner-checkbox"><input type="checkbox" checked={portalSettings.banner_activo === 'true'} onChange={(e) => setPortalSettings(p => ({ ...p, banner_activo: e.target.checked ? 'true' : 'false' }))} /><span>Banner superior activo no site</span></label>
          <label className="settings-field settings-field--full">Mensagem do banner<input value={portalSettings.banner_mensagem || ''} onChange={(e) => setPortalSettings(p => ({ ...p, banner_mensagem: e.target.value }))} placeholder="Ex.: Novo PalancaSoft ERP 2026 já disponível — fale connosco!" maxLength={160} disabled={portalSettings.banner_activo !== 'true'} /></label>
          <label className="settings-field settings-field--full">E-mail de notificações<small>Aviso automático a este destino com cada contacto novo e pedido de licença (Resend). Vazio = desactivado.</small><input type="email" value={portalSettings.notify_email || ''} onChange={(e) => setPortalSettings(p => ({ ...p, notify_email: e.target.value }))} placeholder="ex.: vigilante@cftec.co" maxLength={160} /></label>
          </div><div className="settings-actions"><Button type="submit" size="sm" disabled={savingPortal}>{savingPortal ? 'A guardar…' : <><Check size={14} /> Guardar e aplicar ao site</>}</Button></div></form></Card>}
          <Card className="admin-panel settings-card"><div className="admin-panel-head"><div><span className="admin-panel-kicker">CONTA</span><h2>Perfil do administrador</h2></div></div><p>Actualize o nome exibido no painel. O e-mail de acesso é fixo.</p><div className="settings-profile"><Avatar className="admin-avatar-large"><AvatarFallback>{(profileName.trim()[0] || adminUser?.name?.[0] || 'A').toUpperCase()}</AvatarFallback></Avatar><form className="settings-form" onSubmit={handleProfileSave}><label className="settings-field">Nome de exibição<input value={profileName} onChange={(e) => setProfileName(e.target.value)} required maxLength={120} /></label><label className="settings-field">E-mail de acesso<input value={adminUser?.email || ''} disabled /><small className="settings-hint">Não é alterável nesta versão.</small></label><div className="settings-actions"><Button type="submit" size="sm" disabled={savingProfile}>{savingProfile ? 'A guardar…' : <><Check size={14} /> Guardar perfil</>}</Button></div></form></div></Card><Card className="admin-panel settings-card"><div className="admin-panel-head"><div><span className="admin-panel-kicker">SEGURANÇA</span><h2>Mudar password</h2></div></div><p>A password actual é verificada (bcrypt) antes de qualquer alteração. Mínimo 8 caracteres.</p><form className="settings-form" onSubmit={handlePasswordChange}><label className="settings-field">Password actual<input type="password" value={pwCurrent} onChange={(e) => setPwCurrent(e.target.value)} required autoComplete="current-password" /></label><div className="settings-row"><label className="settings-field">Nova password<input type="password" value={pwNew} onChange={(e) => setPwNew(e.target.value)} required minLength={8} autoComplete="new-password" /></label><label className="settings-field">Confirmar nova<input type="password" value={pwConfirm} onChange={(e) => setPwConfirm(e.target.value)} required minLength={8} autoComplete="new-password" /></label></div>{pwNew && pwConfirm && pwNew !== pwConfirm && <p className="settings-warn">As passwords não coincidem.</p>}{pwNew && pwNew.length < 8 && <p className="settings-warn">A nova password precisa de pelo menos 8 caracteres.</p>}<div className="settings-actions"><Button type="submit" size="sm" disabled={savingPassword || (pwNew.length > 0 && pwNew !== pwConfirm)}>{savingPassword ? 'A alterar…' : <><Check size={14} /> Alterar password</>}</Button></div></form><div className="security-list"><div className="security-item"><ShieldCheck size={18} /><div><span>Autenticação de administrador</span><small>Protegida por JWT + cookie HttpOnly</small></div><span className="security-badge security-badge--ok">Activa</span></div><div className="security-item"><Database size={18} /><div><span>Base de dados gerida</span><small>Conexão activa e monitorizada</small></div><span className="security-badge security-badge--ok">Ligada</span></div></div></Card>{(adminUser?.level || 'super_admin') === 'super_admin' && <Card className="admin-panel settings-card"><div className="admin-panel-head"><div><span className="admin-panel-kicker">PORTAL PÚBLICO</span><h2>Configuração do site</h2></div></div><p>Directório telefónico, WhatsApp comercial e o banner de avisos exibido no topo do site.</p><form className="settings-form" onSubmit={handlePortalSave}><div className="settings-row"><label className="settings-field">Telefone do directório<input value={portalSettings['telefone_directorio'] || ''} onChange={(e) => setPortalSettings(f => ({ ...f, telefone_directorio: e.target.value }))} placeholder="+244 900 000 000" maxLength={40} /></label><label className="settings-field">WhatsApp comercial (só dígitos)<input value={portalSettings['whatsapp_comercial'] || ''} onChange={(e) => setPortalSettings(f => ({ ...f, whatsapp_comercial: e.target.value }))} placeholder="244900000000" maxLength={25} /></label></div><label className="settings-field">Mensagem do banner<input value={portalSettings['banner_mensagem'] || ''} onChange={(e) => setPortalSettings(f => ({ ...f, banner_mensagem: e.target.value }))} placeholder="Ex.: Nova versão do PalancaSoft disponível!" maxLength={140} /></label><label className="settings-field">Banner no site<select value={portalSettings['banner_activo'] || 'false'} onChange={(e) => setPortalSettings(f => ({ ...f, banner_activo: e.target.value }))}><option value="false">Desactivado</option><option value="true">Activado</option></select></label><div className="settings-actions"><Button type="submit" size="sm" disabled={savingPortal}>{savingPortal ? 'A guardar…' : <><Check size={14} /> Guardar configuração</>}</Button></div></form></Card>}{(adminUser?.level || 'super_admin') === 'super_admin' && <Card className="admin-panel settings-card"><div className="admin-panel-head"><div><span className="admin-panel-kicker">GESTÃO DE ACESSOS</span><h2>Utilizadores do painel</h2></div><Button size="sm" onClick={() => setShowUserForm(true)}><Plus size={15} /> Novo utilizador</Button></div><p>Níveis: <strong>Super Admin</strong> (tudo), <strong>Gestor Comercial</strong> (contactos, licenças, parceiros, catálogo) e <strong>Técnico de Suporte</strong> (contactos, catálogo e mídias).</p><div className="user-admin-list">{users.map((user) => { const isSelf = adminUser?.email?.toLowerCase() === user.email.toLowerCase(); const protegido = user.role === 'developer' && !ehDev; return <div key={user.id} className={`user-admin-row ${protegido ? 'user-admin-row--dev' : ''}`}><div className="user-main"><strong>{user.name}{isSelf && <small> (você)</small>}{protegido && <small> · conta Developer 🔒</small>}</strong><span>{user.email}</span></div><select className="user-role-select" value={user.role} disabled={isSelf || protegido} title={protegido ? 'A conta Developer (Master Admin) só é gerida por outra conta Developer' : undefined} onChange={(e) => updateUser(user, { role: e.target.value })}>{ROLES.map(r => <option key={r} value={r}>{labelRole(r)}</option>)}</select><span className={`active-pill ${user.is_active && user.role !== 'developer' ? '' : 'inactive'}`}>{user.role === 'developer' ? '🔒 Master' : user.is_active ? 'Activo' : 'Desactivado'}</span><div className="service-admin-actions">{!isSelf && !protegido && <button className="icon-btn" title={user.is_active ? 'Desactivar' : 'Activar'} onClick={() => updateUser(user, { is_active: !user.is_active })}><Power size={16} /></button>}{!protegido && <button className="icon-btn" title="Redefinir password" onClick={() => { setPwResetUser(user); setPwResetForm({ pw: '', pw2: '' }) }}><KeyRound size={16} /></button>}{!isSelf && !protegido && <button className="icon-btn danger" title="Eliminar" onClick={() => setDeletingUserId(user.id)}><Trash2 size={16} /></button>}</div></div> })}</div></Card>}
          <Card className="admin-panel settings-card"><div className="admin-panel-head"><div><span className="admin-panel-kicker">SEGURANÇA · 2º PASSO</span><h2>Autenticação em dois passos (2FA)</h2></div></div><p>Com o 2FA activo, depois da password o painel pede um código de 6 dígitos de um app autenticador (Google Authenticator, Authy, …). Cada conta activa o seu — aqui.</p>
            {twofaEstado === 'loading' && <small className="settings-hint">A verificar…</small>}
            {twofaEstado === 'activado' ? <form className="settings-form" onSubmit={desactivar2fa}><div className="settings-field settings-field--full">Estado: <strong style={{ color: 'var(--success, #16a34a)' }}>activo</strong> — este login exige o código TOTP.</div><label className="settings-field">Password actual<small>Prove que é o dono da conta para desligar</small><input type="password" value={pw2fa} onChange={(e) => setPw2fa(e.target.value)} required autoComplete="current-password" /></label><div className="settings-actions"><Button variant="outline" type="submit" size="sm" disabled={busy2fa || !pw2fa || savingPassword}>{busy2fa ? 'A desactivar…' : 'Desactivar 2FA'}</Button></div></form>
            : setup2fa ? <form className="settings-form" onSubmit={activar2fa}><div className="settings-field settings-field--full">1. No app autenticador, escolha «+» → «Introduzir chave de configuração» e cole este segreto:<code className="settings-2fa-secret" style={{ display: 'block', margin: '8px 0', padding: '10px 12px', font: '600 15px/1.3 ui-monospace, monospace', letterSpacing: '2px', borderRadius: 10, background: 'rgba(0,0,0,.35)' }}>{setup2fa.secret.slice(0, 4)} {setup2fa.secret.slice(4, 12)} {setup2fa.secret.slice(12, 20)} {setup2fa.secret.slice(20)}</code><small>Conta: CFTEC:{adminUser?.email || ''}</small></div><label className="settings-field">2. Código de 6 dígitos que o app mostra<input inputMode="numeric" pattern="[0-9]*" maxLength={6} value={codigo2fa} onChange={(e) => setCodigo2fa(e.target.value.replace(/\D/g, ''))} placeholder="000000" autoComplete="one-time-code" required /></label><div className="settings-actions"><Button type="submit" size="sm" disabled={busy2fa || codigo2fa.length !== 6}>{busy2fa ? 'A verificar…' : <><Check size={14} /> Activar 2FA</>}</Button><Button variant="outline" type="button" size="sm" onClick={() => setSetup2fa(null)}>Cancelar</Button></div></form>
            : <Button type="button" size="sm" onClick={iniciar2fa} disabled={busy2fa}>{busy2fa ? 'A gerar segredo…' : <>Configurar 2FA <ShieldCheck size={14} /></>}</Button>}
          </Card>
          <Card className="admin-panel settings-card"><div className="admin-panel-head"><div><span className="admin-panel-kicker">SEGURANÇA</span><h2>Sessões activas</h2></div><Button variant="outline" type="button" size="sm" onClick={revogarOutras} disabled={revogando || !sessoes?.some(s => !s.actual)}>{revogando ? 'A fechar…' : 'Fechar as outras'}</Button></div><p>Navegadores onde esta conta entrou nos últimos 30 dias. «Fechar as outras» revoga-os — quem estiver noutro dispositivo precisará de iniciar sessão de novo.</p>
            <div className="upg-lista">{sessoes === null ? <small className="settings-hint">A carregar…</small> : sessoes.length === 0 ? <small className="settings-hint">Nenhuma sessão registada (entrar de novo para registar).</small> : sessoes.map((s) => (
              <div className="upg-row" key={s.jti}>
                <div className="upg-row-main">
                  <span className="upg-data">{formatDate(s.emitida)}</span>
                  {s.actual && <span className="upg-chip upg-chip--autorizado">Sessão actual</span>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span title={s.dispositivo} style={{ opacity: .65, fontSize: 12.5, maxWidth: 340, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.dispositivo.slice(0, 64)}{s.dispositivo.length > 64 ? '…' : ''}</span>
                  {!s.actual && <button className="icon-btn danger" title="Revogar esta sessão" onClick={() => void revogarSessao(s.jti)}><X size={15} /></button>}
                </div>
              </div>
            ))}</div>
          </Card></div>}
      </main>
    </div>

    {/* SoftwareModal é INVOCADO como função (não <SoftwareModal/>): assim o JSX fica
        inlined na árvore do AdminDashboard e o React não remonta o form a cada tecla
        (o bug fazia o modal "sair e voltar" enquanto o utilizador escrevia). */}
    {showSoftwareForm && SoftwareModal({
      isOpen: true,
      onClose: () => setShowSoftwareForm(false),
      onSubmit: handleSoftwareSubmit,
    })}

    {showBlogForm && <div className="admin-modal-backdrop" onMouseDown={() => setShowBlogForm(false)}><div className="admin-modal admin-modal--lg" id="modal-blog" onMouseDown={(event) => event.stopPropagation()}><div className="admin-modal-head"><div><span className="admin-panel-kicker">{editingBlog ? 'EDITAR ARTIGO' : 'NOVO ARTIGO'}</span><h2>{editingBlog ? `Editar "${editingBlog.title.slice(0, 24)}${editingBlog.title.length > 24 ? '…' : ''}"` : 'Novo artigo para o blog'}</h2></div><button onClick={() => setShowBlogForm(false)} className="admin-modal-close" aria-label="Fechar"><X size={18} /></button></div><form className="admin-modal-body" onSubmit={(e) => { e.preventDefault(); saveBlogPost() }}>
              <fieldset className="admin-form-section"><legend>Conteúdo</legend><div className="admin-form-grid" style={{ gridTemplateColumns: '1fr' }}>
              <label>Título<input value={blogForm.title} onChange={(e) => setBlogForm(f => ({ ...f, title: e.target.value }))} placeholder="Ex.: Negomil — como cumprir as novas regras do ficheiro SAO" required maxLength={200} autoFocus /></label>
              <label>Resumo (excerto)<textarea value={blogForm.excerpt} onChange={(e) => setBlogForm(f => ({ ...f, excerpt: e.target.value }))} placeholder="1–2 frases resumindo o artigo, aparece nos cards do site..." required maxLength={300} rows={2} /></label>
              {!editingBlog && <label>Conteúdo<textarea name="blog-content" placeholder={'## Subtítulo\nParágrafo introdutório...\n\n## Segunda secção\nCom **negrito**, *itálico*, listas:\n- passo 1\n- passo 2\n\nE links [como este](https://agt.gov.ao).'} rows={10} required maxLength={40000} /></label>}
              </div></fieldset>
              <fieldset className="admin-form-section"><legend>Capa & metadados</legend><div className="admin-form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <label className="full-width destaque-upload">{blogForm.coverNome ? blogForm.coverNome : editingBlog ? (editingBlog.cover_url ? `Actual: ${editingBlog.cover_url.split('/').pop()?.slice(0, 36) || 'imagem'} — escolha outra para trocar` : 'Sem capa — escolher imagem') : 'Escolher capa (JPEG/PNG/WebP até 10 MB)'}<input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => selectBlogCover(e.target.files?.[0] || null)} /></label>
              <label>Categoria<input value={blogForm.category} onChange={(e) => setBlogForm(f => ({ ...f, category: e.target.value }))} placeholder="Ex.: Faturação AGE" maxLength={60} /></label>
              <label>Autor<input value={blogForm.author} onChange={(e) => setBlogForm(f => ({ ...f, author: e.target.value }))} placeholder="Equipa CFTEC" maxLength={80} /></label>
              <label className="checkbox-label full-width"><input type="checkbox" checked={blogForm.isPublished} onChange={(e) => setBlogForm(f => ({ ...f, isPublished: e.target.checked }))} /> {editingBlog ? 'Publicar alterações no site' : 'Publicar de imediato (desmarcado = guardar rascunho)'}</label>
              </div></fieldset>
              <div className="admin-modal-actions"><Button variant="outline" type="button" onClick={() => setShowBlogForm(false)}>Cancelar</Button><Button type="submit" disabled={savingBlog}><Check size={15} /> {savingBlog ? 'A guardar…' : editingBlog ? 'Guardar alterações' : blogForm.isPublished ? 'Publicar artigo' : 'Guardar rascunho'}</Button></div></form></div></div>}

    {deletingBlogId && <div className="admin-modal-backdrop" onMouseDown={() => setDeletingBlogId(null)}><div className="admin-modal admin-modal--confirm" onMouseDown={(event) => event.stopPropagation()}><div className="admin-modal-head"><span className="admin-modal-warn"><AlertTriangle size={20} /></span><div><span className="admin-panel-kicker">CONFIRMAÇÃO</span><h2>Eliminar artigo</h2></div><button onClick={() => setDeletingBlogId(null)}><X size={18} /></button></div><p>Tem a certeza que quer eliminar este artigo? Ele desaparece do blog do site imediatamente. Esta acção não pode ser desfeita.</p><div className="admin-modal-actions"><Button variant="outline" onClick={() => setDeletingBlogId(null)}>Cancelar</Button><Button variant="dark" onClick={handleBlogDelete}><Trash2 size={15} /> Eliminar artigo</Button></div></div></div>}

    {showDestaqueForm && <div className="admin-modal-backdrop" onMouseDown={() => setShowDestaqueForm(false)}><div className="admin-modal admin-modal--lg" onMouseDown={(event) => event.stopPropagation()}><div className="admin-modal-head"><div><span className="admin-panel-kicker">{editingDestaque ? 'EDITAR ANÚNCIO' : 'NOVO ANÚNCIO'}</span><h2>{editingDestaque ? `Editar "${editingDestaque.titulo.slice(0, 24)}${editingDestaque.titulo.length > 24 ? '…' : ''}"` : 'Novo destaque para o site'}</h2></div><button onClick={() => setShowDestaqueForm(false)} className="admin-modal-close" aria-label="Fechar"><X size={18} /></button></div><form className="admin-modal-body" onSubmit={(e) => { e.preventDefault(); saveDestaque() }}>
              <fieldset className="admin-form-section"><legend>Conteúdo</legend><div className="admin-form-grid" style={{ gridTemplateColumns: '1fr' }}><label>Título<input value={destaqueForm.titulo} onChange={(e) => setDestaqueForm(f => ({ ...f, titulo: e.target.value }))} placeholder="Ex.: Lançada a versão 2.5 do PalancaSoft!" required maxLength={120} autoFocus /></label>
              <label>Descrição<textarea value={destaqueForm.descricao} onChange={(e) => setDestaqueForm(f => ({ ...f, descricao: e.target.value }))} placeholder="Ex.: novo módulo de inventário, integração AGT e relatórios em tempo real." required maxLength={400} rows={2} /></label></div></fieldset>
              <fieldset className="admin-form-section"><legend>Imagem & chamada</legend><div className="admin-form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <label className="full-width destaque-upload">{destaqueForm.imagemNome ? destaqueForm.imagemNome : editingDestaque ? `Actual: ${editingDestaque.imagem_url.split('/').pop()?.slice(0, 40) || 'imagem'}` : 'Escolher imagem (JPEG/PNG/WebP até 10 MB)'}<input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => selectDestaqueImage(e.target.files?.[0] || null)} /></label>
              <label>Ordem de exibição<input type="number" min={1} max={99} value={destaqueForm.ordem} onChange={(e) => setDestaqueForm(f => ({ ...f, ordem: e.target.value }))} /></label>
              <label className="checkbox-label"><input type="checkbox" checked={destaqueForm.ativo} onChange={(e) => setDestaqueForm(f => ({ ...f, ativo: e.target.checked }))} /> Activo no site</label>
              <label>Texto do botão<input value={destaqueForm.textoBotao} onChange={(e) => setDestaqueForm(f => ({ ...f, textoBotao: e.target.value }))} placeholder="Saber Mais" maxLength={40} /></label>
              <label>Link do botão (opcional)<input value={destaqueForm.linkBotao} onChange={(e) => setDestaqueForm(f => ({ ...f, linkBotao: e.target.value }))} placeholder="https://wa.me/244933609090 ou /#softwares" maxLength={300} /></label>
              </div></fieldset>
              <p className="admin-field-hint" style={{ margin: 0 }}>Dica: para o WhatsApp use o formato https://wa.me/244933609090.</p>
              <div className="admin-modal-actions"><Button variant="outline" type="button" onClick={() => setShowDestaqueForm(false)}>Cancelar</Button><Button type="submit" disabled={savingDestaque}><Check size={15} /> {savingDestaque ? 'A guardar…' : editingDestaque ? 'Guardar alterações' : 'Publicar destaque'}</Button></div></form></div></div>}

    {deletingDestaqueId && <div className="admin-modal-backdrop" onMouseDown={() => setDeletingDestaqueId(null)}><div className="admin-modal admin-modal--confirm" onMouseDown={(event) => event.stopPropagation()}><div className="admin-modal-head"><span className="admin-modal-warn"><AlertTriangle size={20} /></span><div><span className="admin-panel-kicker">CONFIRMAÇÃO</span><h2>Eliminar destaque</h2></div><button onClick={() => setDeletingDestaqueId(null)}><X size={18} /></button></div><p>Tem a certeza que quer eliminar este destaque? Ele desaparece do carrossel do site imediatamente. Esta acção não pode ser desfeita.</p><div className="admin-modal-actions"><Button variant="outline" onClick={() => setDeletingDestaqueId(null)}>Cancelar</Button><Button variant="dark" onClick={handleDestaqueDelete}><Trash2 size={15} /> Eliminar destaque</Button></div></div></div>}

    {showServiceForm !== false && <div className="admin-modal-backdrop" onMouseDown={() => setShowServiceForm(false)}><div className="admin-modal" onMouseDown={(event) => event.stopPropagation()}><div className="admin-modal-head"><div><span className="admin-panel-kicker">NOVO REGISTO</span><h2>{showServiceForm ? 'Editar serviço' : 'Novo serviço'}</h2></div><button onClick={() => setShowServiceForm(false)}><X size={18} /></button></div><form onSubmit={(e) => handleServiceSubmit(e, showServiceForm)}><div className="admin-form-grid"><label>Título<input name="title" placeholder="Ex.: Desenvolvimento à medida" defaultValue={showServiceForm?.title || ''} required autoFocus /></label><label>Slug (URL)<input name="slug" placeholder="Gerado automaticamente" defaultValue={showServiceForm?.slug || ''} disabled /></label><label>Ícone<select name="icon" defaultValue={showServiceForm?.icon || 'Code2'}>{Object.keys(serviceIcons).map((key) => <option key={key} value={key}>{key}</option>)}</select></label><label className="checkbox-label"><input type="checkbox" name="is_active" defaultChecked={showServiceForm?.is_active !== false} /> Activo no site público</label></div><label>Descrição curta<input name="short_description" placeholder="Descrição breve para listagens" defaultValue={showServiceForm?.short_description || ''} required /></label><label>Descrição completa<textarea name="full_description" rows={4} placeholder="Descrição detalhada para a página do serviço" defaultValue={showServiceForm?.full_description || ''} /></label><div className="admin-modal-actions"><Button variant="outline" type="button" onClick={() => setShowServiceForm(false)}>Cancelar</Button><Button type="submit"><Check size={15} /> {showServiceForm ? 'Actualizar serviço' : 'Criar serviço'}</Button></div></form></div></div>}

    {deletingServiceId && <div className="admin-modal-backdrop" onMouseDown={() => setDeletingServiceId(null)}><div className="admin-modal admin-modal--confirm" onMouseDown={(event) => event.stopPropagation()}><div className="admin-modal-head"><span className="admin-modal-warn"><AlertTriangle size={20} /></span><div><span className="admin-panel-kicker">CONFIRMAÇÃO</span><h2>Eliminar serviço</h2></div><button onClick={() => setDeletingServiceId(null)}><X size={18} /></button></div><p>Tem a certeza que quer eliminar este serviço? Esta acção não pode ser desfeita.</p><div className="admin-modal-actions"><Button variant="outline" onClick={() => setDeletingServiceId(null)}>Cancelar</Button><Button variant="dark" onClick={handleServiceDelete}><Trash2 size={15} /> Eliminar permanentemente</Button></div></div></div>}

    {deletingOrderId && <div className="admin-modal-backdrop" onMouseDown={() => setDeletingOrderId(null)}><div className="admin-modal admin-modal--confirm" onMouseDown={(event) => event.stopPropagation()}><div className="admin-modal-head"><span className="admin-modal-warn"><AlertTriangle size={20} /></span><div><span className="admin-panel-kicker">CONFIRMAÇÃO</span><h2>Eliminar pedido</h2></div><button onClick={() => setDeletingOrderId(null)}><X size={18} /></button></div><p>Tem a certeza que quer eliminar este pedido de licença? Esta acção não pode ser desfeita.</p><div className="admin-modal-actions"><Button variant="outline" onClick={() => setDeletingOrderId(null)}>Cancelar</Button><Button variant="dark" onClick={handleOrderDelete}><Trash2 size={15} /> Eliminar pedido</Button></div></div></div>}

    {deletingContactId && <div className="admin-modal-backdrop" onMouseDown={() => setDeletingContactId(null)}><div className="admin-modal admin-modal--confirm" onMouseDown={(event) => event.stopPropagation()}><div className="admin-modal-head"><span className="admin-modal-warn"><AlertTriangle size={20} /></span><div><span className="admin-panel-kicker">CONFIRMAÇÃO</span><h2>Eliminar contacto</h2></div><button onClick={() => setDeletingContactId(null)}><X size={18} /></button></div><p>Tem a certeza que quer eliminar este contacto? Esta acção não pode ser desfeita.</p><div className="admin-modal-actions"><Button variant="outline" onClick={() => setDeletingContactId(null)}>Cancelar</Button><Button variant="dark" onClick={handleContactDelete}><Trash2 size={15} /> Eliminar permanentemente</Button></div></div></div>}

    {deletingSoftwareId && <div className="admin-modal-backdrop" onMouseDown={() => setDeletingSoftwareId(null)}><div className="admin-modal admin-modal--confirm" onMouseDown={(event) => event.stopPropagation()}><div className="admin-modal-head"><span className="admin-modal-warn"><AlertTriangle size={20} /></span><div><span className="admin-panel-kicker">CONFIRMAÇÃO</span><h2>Eliminar software</h2></div><button onClick={() => setDeletingSoftwareId(null)}><X size={18} /></button></div><p>Tem a certeza que quer eliminar este software e o respectivo instalador do storage? Esta acção não pode ser desfeita.</p><div className="admin-modal-actions"><Button variant="outline" onClick={() => setDeletingSoftwareId(null)}>Cancelar</Button><Button variant="dark" onClick={handleSoftwareDelete}><Trash2 size={15} /> Eliminar permanentemente</Button></div></div></div>}

    {deletingLicenseId && <div className="admin-modal-backdrop" onMouseDown={() => setDeletingLicenseId(null)}><div className="admin-modal admin-modal--confirm" onMouseDown={(event) => event.stopPropagation()}><div className="admin-modal-head"><span className="admin-modal-warn"><AlertTriangle size={20} /></span><div><span className="admin-panel-kicker">CONFIRMAÇÃO</span><h2>Eliminar licença</h2></div><button onClick={() => setDeletingLicenseId(null)}><X size={18} /></button></div><p>Tem a certeza que quer eliminar esta licença? O cliente deixará de a poder usar. Esta acção não pode ser desfeita.</p><div className="admin-modal-actions"><Button variant="outline" onClick={() => setDeletingLicenseId(null)}>Cancelar</Button><Button variant="dark" onClick={handleLicenseDelete}><Trash2 size={15} /> Eliminar licença</Button></div></div></div>}
        {showChamadoForm && <div className="admin-modal-backdrop" onMouseDown={() => setShowChamadoForm(false)}><div className="admin-modal" onMouseDown={(event) => event.stopPropagation()}><div className="admin-modal-head"><div><span className="admin-panel-kicker">HELPDESK</span><h2>Novo chamado de suporte</h2></div><button onClick={() => setShowChamadoForm(false)}><X size={18} /></button></div><form onSubmit={createChamado}><div className="admin-form-grid"><label>Cliente / empresa<input value={chamadoForm.cliente} onChange={(e) => setChamadoForm(f => ({ ...f, cliente: e.target.value }))} placeholder="Ex.: Padaria Central" required maxLength={150} autoFocus /></label><label>NIF (opcional)<input value={chamadoForm.nif} onChange={(e) => setChamadoForm(f => ({ ...f, nif: e.target.value }))} placeholder="Ex.: 5417234561" maxLength={30} /></label><label>Telefone / WhatsApp (opcional)<input value={chamadoForm.telefone} onChange={(e) => setChamadoForm(f => ({ ...f, telefone: e.target.value }))} placeholder="Ex.: 923 000 000" maxLength={20} /></label><label>Software (opcional)<input value={chamadoForm.software} onChange={(e) => setChamadoForm(f => ({ ...f, software: e.target.value }))} placeholder="Ex.: PalancaSoft ERP" maxLength={120} /></label><label>Prioridade<select className="admin-select" value={chamadoForm.prioridade} onChange={(e) => setChamadoForm(f => ({ ...f, prioridade: e.target.value }))}>{CHAMADO_PRIOS.map(p => <option key={p} value={p}>{p}</option>)}</select></label></div><label>Problema reportado<textarea rows={4} value={chamadoForm.problema} onChange={(e) => setChamadoForm(f => ({ ...f, problema: e.target.value }))} placeholder="Ex.: Impressora térmica de recibos não comunica via USB" required maxLength={1200} style={{ marginTop: 8 }} /></label><p className="admin-field-hint">Reabres ou resolves o chamado depois, na lista — usa os botões ⚡ e ✔ de cada linha.</p><div className="admin-modal-actions"><Button variant="outline" type="button" onClick={() => setShowChamadoForm(false)}>Cancelar</Button><Button type="submit" disabled={chamadoSaving}><Check size={15} /> {chamadoSaving ? 'A registar…' : 'Registar chamado'}</Button></div></form></div></div>}
        {deletingChamadoId && <div className="admin-modal-backdrop" onMouseDown={() => setDeletingChamadoId(null)}><div className="admin-modal admin-modal--confirm" onMouseDown={(event) => event.stopPropagation()}><div className="admin-modal-head"><span className="admin-modal-warn"><AlertTriangle size={20} /></span><div><span className="admin-panel-kicker">CONFIRMAÇÃO</span><h2>Eliminar chamado</h2></div><button onClick={() => setDeletingChamadoId(null)}><X size={18} /></button></div><p>Tem a certeza que quer eliminar este chamado? O registo deixará de aparecer no helpdesk. Esta acção não pode ser desfeita.</p><div className="admin-modal-actions"><Button variant="outline" onClick={() => setDeletingChamadoId(null)}>Cancelar</Button><Button variant="dark" onClick={handleChamadoDelete}><Trash2 size={15} /> Eliminar chamado</Button></div></div></div>}

    {deletingPartnerId && <div className="admin-modal-backdrop" onMouseDown={() => setDeletingPartnerId(null)}><div className="admin-modal admin-modal--confirm" onMouseDown={(event) => event.stopPropagation()}><div className="admin-modal-head"><span className="admin-modal-warn"><AlertTriangle size={20} /></span><div><span className="admin-panel-kicker">CONFIRMAÇÃO</span><h2>Eliminar candidatura</h2></div><button onClick={() => setDeletingPartnerId(null)}><X size={18} /></button></div><p>Tem a certeza que quer eliminar esta candidatura de sub-parceiro? Esta acção não pode ser desfeita.</p><div className="admin-modal-actions"><Button variant="outline" onClick={() => setDeletingPartnerId(null)}>Cancelar</Button><Button variant="dark" onClick={handlePartnerDelete}><Trash2 size={15} /> Eliminar candidatura</Button></div></div></div>}

    {showUserForm && <div className="admin-modal-backdrop" onMouseDown={() => setShowUserForm(false)}><div className="admin-modal" onMouseDown={(event) => event.stopPropagation()}><div className="admin-modal-head"><div><span className="admin-panel-kicker">GESTÃO DE ACESSOS</span><h2>Novo utilizador</h2></div><button onClick={() => setShowUserForm(false)}><X size={18} /></button></div><form onSubmit={createUser}><div className="admin-form-grid"><label>Nome<input value={userForm.name} onChange={(e) => setUserForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex.: Ana Silvestre" required maxLength={120} autoFocus /></label><label>E-mail de acesso<input type="email" value={userForm.email} onChange={(e) => setUserForm(f => ({ ...f, email: e.target.value }))} placeholder="nome@cftec.co" required maxLength={160} /></label><label>Password inicial<input type="password" value={userForm.password} onChange={(e) => setUserForm(f => ({ ...f, password: e.target.value }))} placeholder="Mínimo 8 caracteres" required minLength={8} autoComplete="new-password" /></label><label>Nível de permissão<select value={userForm.role} onChange={(e) => setUserForm(f => ({ ...f, role: e.target.value }))}>{ROLES.map(r => <option key={r} value={r}>{labelRole(r)}</option>)}</select></label></div><div className="admin-modal-actions"><Button variant="outline" type="button" onClick={() => setShowUserForm(false)}>Cancelar</Button><Button type="submit" disabled={savingUser}><Check size={15} /> {savingUser ? 'A criar…' : 'Criar utilizador'}</Button></div></form></div></div>}

    {pwResetUser && <div className="admin-modal-backdrop" onMouseDown={() => setPwResetUser(null)}><div className="admin-modal" onMouseDown={(event) => event.stopPropagation()}><div className="admin-modal-head"><div><span className="admin-panel-kicker">SEGURANÇA</span><h2>Redefinir password</h2></div><button onClick={() => setPwResetUser(null)}><X size={18} /></button></div><form onSubmit={(e) => { e.preventDefault(); handlePwReset() }}><p className="admin-modal-intro">Define uma nova password para <strong>{pwResetUser.name}</strong> ({pwResetUser.email}). A password actual deixa de funcionar imediatamente.</p><div className="admin-form-grid"><label>Nova password<input type="password" value={pwResetForm.pw} onChange={(e) => setPwResetForm(f => ({ ...f, pw: e.target.value }))} required minLength={8} autoComplete="new-password" autoFocus /></label><label>Confirmar<input type="password" value={pwResetForm.pw2} onChange={(e) => setPwResetForm(f => ({ ...f, pw2: e.target.value }))} required minLength={8} autoComplete="new-password" /></label></div><div className="admin-modal-actions"><Button variant="outline" type="button" onClick={() => setPwResetUser(null)}>Cancelar</Button><Button type="submit"><Check size={15} /> Redefinir</Button></div></form></div></div>}

    {deletingUserId && <div className="admin-modal-backdrop" onMouseDown={() => setDeletingUserId(null)}><div className="admin-modal admin-modal--confirm" onMouseDown={(event) => event.stopPropagation()}><div className="admin-modal-head"><span className="admin-modal-warn"><AlertTriangle size={20} /></span><div><span className="admin-panel-kicker">CONFIRMAÇÃO</span><h2>Eliminar utilizador</h2></div><button onClick={() => setDeletingUserId(null)}><X size={18} /></button></div><p>Tem a certeza que quer eliminar este utilizador? Ele deixará de conseguir entrar no painel. Esta acção não pode ser desfeita.</p><div className="admin-modal-actions"><Button variant="outline" onClick={() => setDeletingUserId(null)}>Cancelar</Button><Button variant="dark" onClick={handleUserDelete}><Trash2 size={15} /> Eliminar utilizador</Button></div></div></div>}

    {showLicenseForm && <div className="admin-modal-backdrop" onMouseDown={() => setShowLicenseForm(false)}><div className="admin-modal" onMouseDown={(event) => event.stopPropagation()}><div className="admin-modal-head"><div><span className="admin-panel-kicker">PALANCASOFT</span><h2>Nova licença</h2></div><button onClick={() => setShowLicenseForm(false)}><X size={18} /></button></div><form onSubmit={createLicense}><div className="admin-form-grid"><label>Nome do cliente / empresa<input value={licenseForm.clienteNome} onChange={(e) => setLicenseForm(f => ({ ...f, clienteNome: e.target.value }))} placeholder="Ex.: Loja Kwanza" required maxLength={150} autoFocus /></label><label>NIF (opcional)<input value={licenseForm.nif} onChange={(e) => setLicenseForm(f => ({ ...f, nif: e.target.value }))} placeholder="Ex.: 5417234561" maxLength={30} /></label><label>Data de expiração (opcional)<input type="date" value={licenseForm.expiracao} onChange={(e) => setLicenseForm(f => ({ ...f, expiracao: e.target.value }))} /></label></div><p className="admin-field-hint">A chave de activação (PS-XXXX-XXXX-XXXX) é gerada automaticamente e copiada para a área de transferência.</p><div className="admin-modal-actions"><Button variant="outline" type="button" onClick={() => setShowLicenseForm(false)}>Cancelar</Button><Button type="submit" disabled={licenseSaving}><Check size={15} /> {licenseSaving ? 'A gerar…' : 'Criar licença'}</Button></div></form></div></div>}
  </div>
}
