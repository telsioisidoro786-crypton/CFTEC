import { FormEvent, useEffect, useMemo, useState } from 'react'
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
  X,
  Zap,
  Loader2,
  FileText,
  Hash,
  ShoppingCart,
  MessageCircle,
} from 'lucide-react'

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

type AdminSection = 'dashboard' | 'services' | 'media' | 'software' | 'licencas' | 'pedidos' | 'parceiros' | 'contactos' | 'settings'

type Summary = { softwares: number; media: number; services: number; contacts: number }
type Contact = { id: string; name: string; email: string; phone: string | null; service_interest: string; message: string; status: string; created_at: string }
type Software = { id: string; name: string; version: string; description?: string | null; price?: number | null; category?: string | null; changelog?: string | null; file_url?: string; file_size: string; downloads_count: number; is_active?: boolean; created_at: string }
type Service = { id: string; title: string; slug: string; short_description: string; full_description: string | null; icon: string; is_active: boolean; created_at: string }
export type Media = { id: string; filename: string; file_path: string; file_size: number; mime_type: string; alt_text: string | null; uploaded_at: string }
type AdminUser = { name: string; email: string; level?: 'super_admin' | 'gestor' | 'tecnico' }
type AdminUserRow = { id: string; name: string; email: string; role: string; is_active: boolean; created_at: string }
type LicenseOrder = { id: string; created_at: string; software_nome: string; nome_empresa: string; nif: string; nome_responsavel: string; telefone_whatsapp: string; email: string | null; provincia: string; forma_pagamento: string; status: string; observacoes: string | null }
const ORDER_STATUSES = ['Pendente', 'Em Verificação', 'Aprovado', 'Rejeitado'] as const
type Partner = { id: string; nome_responsavel: string; empresa_nif: string | null; telefone_whatsapp: string; provincia: string | null; modalidade: string; status: string; nota: string | null; volume_vendas: number; clientes_angariados: number; created_at: string }
type License = { id: string; cliente_nome: string; nif: string | null; chave_licenca: string; data_ativacao: string | null; data_expiracao: string | null; status: string; created_at: string }

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

const navItems: { id: AdminSection; label: string; icon: typeof LayoutDashboard; levels: AdminUser['level'][] }[] = [
  { id: 'dashboard', label: 'Visão Geral', icon: LayoutDashboard, levels: ['super_admin', 'gestor', 'tecnico'] },
  { id: 'services', label: 'Gerir Serviços', icon: Code2, levels: ['super_admin', 'gestor', 'tecnico'] },
  { id: 'media', label: 'Gestão de Mídias', icon: FileImage, levels: ['super_admin', 'gestor', 'tecnico'] },
  { id: 'software', label: 'Softwares & Downloads', icon: Package, levels: ['super_admin', 'gestor', 'tecnico'] },
  { id: 'licencas', label: 'Licenças PalancaSoft', icon: KeyRound, levels: ['super_admin', 'gestor'] },
  { id: 'pedidos', label: 'Pedidos de Licença', icon: ShoppingCart, levels: ['super_admin', 'gestor'] },
  { id: 'parceiros', label: 'Revenda Negomil', icon: Network, levels: ['super_admin', 'gestor'] },
  { id: 'contactos', label: 'Contactos', icon: UsersRound, levels: ['super_admin', 'gestor', 'tecnico'] },
  { id: 'settings', label: 'Definições', icon: Settings, levels: ['super_admin', 'gestor', 'tecnico'] },
]

function getServiceIcon(iconName: string) {
  const Icon = serviceIcons[iconName] || serviceIcons['Code2']
  return Icon
}

function AdminMark() {
  return <a href="/" className="admin-brand"><span className="admin-brand-mark"><span /><span /><span /></span><span><strong>CFTEC</strong><small>Painel Admin</small></span></a>
}

function StatCard({ label, value, change, icon: Icon, tone }: { label: string; value: number; change: string; icon: typeof Users; tone: string }) {
  return (
    <Card className="admin-stat">
      <div className="admin-stat-head">
        <span>{label}</span>
        <span className={`admin-stat-icon admin-stat-icon--${tone}`}><Icon size={17} /></span>
      </div>
      <div className="admin-stat-value">
        <strong>{value}</strong>
        <small><span className="stat-up">↗ {change}</span> vs. mês anterior</small>
      </div>
    </Card>
  )
}

function AdminLogin({ onAuthenticated }: { onAuthenticated: (user: AdminUser) => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const response = await fetch('/api/admin/login', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Não foi possível iniciar sessão.')
      onAuthenticated(result.user)
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Não foi possível iniciar sessão.')
    } finally {
      setSubmitting(false)
    }
  }

  return <div className="admin-auth-shell"><Card className="admin-auth-card"><AdminMark /><div className="admin-auth-heading"><span className="admin-kicker">ÁREA RESTRITA</span><h1>Entrar no painel.</h1><p>Use as credenciais de administrador da CFTEC para continuar.</p></div><form onSubmit={submit} className="admin-auth-form"><label>E-mail<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="admin@cftec.co" autoComplete="username" required /></label><label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="A sua password" autoComplete="current-password" required /></label>{error && <div className="admin-auth-error" role="alert">{error}</div>}<Button type="submit" size="lg" disabled={submitting}>{submitting ? 'A validar…' : 'Entrar no painel'} <ChevronRight size={16} /></Button></form><div className="admin-auth-note"><ShieldCheck size={15} /> Sessão protegida por JWT e cookie HttpOnly.</div><a href="/" className="admin-back-link">← Voltar ao website público</a></Card></div>
}

export default function AdminDashboard() {
  const [authStatus, setAuthStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading')
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null)
  const [activeSection, setActiveSection] = useState<AdminSection>('dashboard')
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
  const [showLicenseForm, setShowLicenseForm] = useState(false)
  const [licenseForm, setLicenseForm] = useState({ clienteNome: '', nif: '', expiracao: '' })
  const [licenseSaving, setLicenseSaving] = useState(false)
  const [deletingLicenseId, setDeletingLicenseId] = useState<string | null>(null)
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
  const [orderFilter, setOrderFilter] = useState<'Todos' | 'Pendente' | 'Aprovado'>('Todos')
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null)

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
      const [summaryRes, contactsRes, softwareRes, servicesRes, mediaRes, healthRes, licensesRes, partnersRes, downloadsRes, settingsRes, usersRes, ordersRes] = await Promise.all([
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
      ])

      const [summaryData, contactsData, softwareData, servicesData, mediaData, healthData, licensesData, partnersData, downloadsData, settingsData, usersData, ordersData] = await Promise.all([
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
  }, [authStatus])

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
      const entries = ['telefone_directorio', 'whatsapp_comercial', 'banner_mensagem', 'banner_activo'].map(k => ({ key: k, value: portalSettings[k] || '' }))
      const response = await fetch('/api/admin/settings', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries }),
      })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(body.error || 'Falha ao guardar a configuração')
      notify('Configuração do portal guardada')
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

  // Utilizadores do painel (Super Admin)
  const ROLES: AdminUserRow['role'][] = ['super_admin', 'gestor', 'tecnico']
  const labelRole = (role: string) => (role === 'super_admin' ? 'Super Admin' : role === 'gestor' ? 'Gestor Comercial' : 'Técnico de Suporte')

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
  const orderLabelStatus = (status: string) => ({ Pendente: 'Pendente', 'Em Verificação': 'Em verificação', Aprovado: 'Aprovado', Rejeitado: 'Rejeitado' } as Record<string, string>)[status] || status
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
      notify(`Pedido ${order.id.slice(0, 8).toUpperCase()} → ${status}`)
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
      notify('Pedido eliminado')
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Erro ao eliminar o pedido')
    } finally {
      setDeletingOrderId(null)
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
          body: JSON.stringify({ filename: softwareFormState.fileName || 'instalador.zip' }),
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

  if (authStatus === 'loading') return <div className="admin-auth-shell"><div className="admin-auth-loading"><span className="admin-loading-dot" /> A validar sessão…</div></div>
  if (authStatus === 'unauthenticated') return <AdminLogin onAuthenticated={(user) => { setAdminUser(user); setProfileName(p => p || user.name || ''); setAuthStatus('authenticated') }} />

  return <div className="admin-shell">
    {toast && <div className="admin-toast"><Check size={16} /> {toast}</div>}
    <aside className={`admin-sidebar ${sidebarOpen ? 'admin-sidebar--open' : ''}`}>
      <div className="admin-sidebar-top"><AdminMark /><button className="admin-close" onClick={() => setSidebarOpen(false)} aria-label="Fechar menu"><X size={20} /></button></div>
      <div className="admin-workspace"><span className="admin-avatar">CF</span><div><strong>CFTEC Workspace</strong><small>Plano empresarial <span /></small></div><ChevronRight size={15} /></div>
      <nav className="admin-nav"><span className="admin-nav-label">Workspace</span>{navItems.filter(n => !adminUser?.level || n.levels.includes(adminUser.level)).map(({ id, label, icon: Icon }) => <button className={activeSection === id ? 'is-active' : ''} key={id} onClick={() => { setActiveSection(id); setSidebarOpen(false) }}><Icon size={17} /><span>{label}</span>{id === 'dashboard' && <i className="admin-nav-pip" />}</button>)}</nav>
      <div className="admin-sidebar-bottom"><div className="admin-help"><CircleHelp size={17} /><div><strong>Precisa de ajuda?</strong><small>Fale com o suporte CFTEC</small></div></div><button className="admin-logout" onClick={handleLogout}><LogOut size={16} /> Sair do painel</button></div>
    </aside>

    <div className="admin-main">
      <header className="admin-topbar"><div className="admin-topbar-left"><button className="admin-menu" onClick={() => setSidebarOpen(true)} aria-label="Abrir menu"><Menu size={21} /></button><div className="admin-breadcrumb"><span>Painel Admin</span><ChevronRight size={13} /><strong>{sectionTitle}</strong></div></div><div className="admin-topbar-actions"><div className="admin-search"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Pesquisar no painel..." /></div><div className="admin-notif"><button className="admin-icon-btn" aria-label="Notificações" onClick={() => setNotifOpen(v => !v)}><Bell size={17} />{unreadContacts.length > 0 && <i />}</button>{notifOpen && <div className="admin-notif-popover"><div className="admin-notif-head"><strong>Novos pedidos</strong><button onClick={() => setNotifOpen(false)} aria-label="Fechar"><X size={15} /></button></div>{unreadContacts.length === 0 ? <p className="admin-notif-empty">Sem pedidos não lidos.</p> : unreadContacts.slice(0, 4).map((c) => <div className="admin-notif-item" key={c.id}><div className="contact-main"><strong>{c.name}</strong><span>{c.service_interest || 'Pedido geral'}</span></div><button className="icon-btn" title="Marcar como lido" onClick={() => handleContactStatus(c, 'read')}><Check size={15} /></button></div>)}<button className="admin-notif-all" onClick={() => { setNotifOpen(false); setActiveSection('contactos') }}>Ver todos os contactos <ChevronRight size={14} /></button></div>}</div><span className="admin-separator" /><div className="admin-profile"><span className="admin-avatar">AM</span><div><strong>{adminUser?.name || 'Admin CFTEC'}</strong><small>{adminUser?.email || 'Administrador'} · {labelRole(adminUser?.level || 'super_admin')}</small></div><ChevronRight size={14} /></div></div></header>
      <main className="admin-content">
        <div className="admin-page-heading"><div><span className="admin-kicker">{new Date().toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' })}</span><h1>{activeSection === 'dashboard' ? `${new Date().getHours() < 12 ? 'Bom dia' : new Date().getHours() < 19 ? 'Boa tarde' : 'Boa noite'}, ${(adminUser?.name || 'Admin').split(' ')[0]}.` : sectionTitle}</h1><p>{activeSection === 'dashboard' ? 'Aqui está o que está a acontecer no seu workspace hoje.' : 'Faça a gestão do conteúdo que alimenta a experiência CFTEC.'}</p></div><div className="admin-page-actions"><span className="admin-online"><i /> Sistema online</span>{activeSection === 'software' && <Button size="sm" onClick={() => { setEditingSoftware(null); resetSoftwareForm(); setShowSoftwareForm(true) }}><Plus size={15} /> Adicionar software</Button>}</div></div>

        {activeSection === 'dashboard' && <>
          <div className="admin-stats-grid"><StatCard label="Softwares cadastrados" value={summary.softwares} change="12.5%" icon={Package} tone="blue" /><StatCard label="Imagens na galeria" value={summary.media} change="8.2%" icon={FileImage} tone="cyan" /><StatCard label="Serviços activos" value={summary.services} change="4.1%" icon={Code2} tone="violet" /><StatCard label="Contactos recebidos" value={summary.contacts} change="18.4%" icon={Users} tone="lime" /></div>
          <div className="admin-dashboard-grid"><Card className="admin-panel admin-panel--activity"><div className="admin-panel-head"><div><span className="admin-panel-kicker">ACTIVIDADE</span><h2>Pedidos recentes</h2></div><button onClick={() => setActiveSection('contactos')}>Ver todos <ChevronRight size={14} /></button></div><div className="contact-list">{contacts.map((contact) => <div className="contact-row" key={contact.id}><span className="contact-initials">{contact.name.split(' ').map((name) => name[0]).join('').slice(0, 2)}</span><div className="contact-main"><strong>{contact.name}</strong><span>{contact.email}</span></div><span className="contact-interest">{contact.service_interest || 'Pedido geral'}</span><span className={`contact-status contact-status--${contactStatusTone(contact.status)}`}>{contactStatusLabel(contact.status)}</span><time>{formatDate(contact.created_at)}</time><MoreHorizontal size={17} className="row-more" /></div>)}</div></Card><Card className="admin-panel admin-panel--health"><div className="admin-panel-head"><div><span className="admin-panel-kicker">SISTEMA</span><h2>Saúde do workspace</h2></div><div className="health-actions"><button className="icon-btn" title="Verificar agora" onClick={refreshHealth}>{refreshingHealth ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={15} />}</button><Activity size={18} className="panel-accent" /></div></div>
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
          <div className="admin-dashboard-grid admin-dashboard-grid--bottom"><Card className="admin-panel"><div className="admin-panel-head"><div><span className="admin-panel-kicker">CATÁLOGO</span><h2>Softwares mais descarregados</h2></div><button onClick={() => setActiveSection('software')}>Gerir catálogo <ChevronRight size={14} /></button></div><div className="mini-table">{software.slice(0, 3).map((item, index) => <div key={item.id}><span className="software-rank">0{index + 1}</span><span className="software-symbol"><Package size={15} /></span><strong>{item.name}</strong><span>{item.version}</span><b>{item.downloads_count} downloads</b><span className="mini-table-bar"><i style={{ width: `${Math.min(100, 28 + item.downloads_count / 3)}%` }} /></span></div>)}</div>{downloadMetrics && <div className="dl-metrics dl-metrics--panel"><div className="dl-metrics-head"><div><span className="admin-panel-kicker">ACTIVIDADE · ÚLTIMOS 30 DIAS</span><strong>{downloadMetrics.total30} download(s)</strong></div></div><div className="dl-bars">{dlDays.map((day) => <div key={day.d} className="dl-bar" title={`${day.d}: ${day.n} download(s)`}><i style={{ height: `${Math.max(4, Math.round((day.n / dlMax) * 100))}%` }} /><span>{day.d.slice(8)}</span></div>)}</div></div>}</Card><Card className="admin-panel admin-panel--quick"><span className="admin-panel-kicker">ACÇÕES RÁPIDAS</span><h2>O que precisa de fazer?</h2><button onClick={() => setActiveSection('software')}><FilePlus2 size={17} /><span><strong>Novo software</strong><small>Adicionar ao catálogo</small></span><ChevronRight size={15} /></button><button onClick={() => setActiveSection('media')}><CloudUpload size={17} /><span><strong>Subir imagens</strong><small>Actualizar galeria</small></span><ChevronRight size={15} /></button><button onClick={() => setActiveSection('services')}><Code2 size={17} /><span><strong>Editar serviços</strong><small>Gerir oferta pública</small></span><ChevronRight size={15} /></button></Card></div>
        </>}

        {activeSection === 'services' && <Card className="admin-panel admin-section-panel"><div className="admin-panel-head"><div><span className="admin-panel-kicker">CONTEÚDO PÚBLICO</span><h2>Serviços prestados</h2></div><Button size="sm" onClick={() => setShowServiceForm(null)}><Plus size={15} /> Novo serviço</Button></div><div className="service-admin-list">{services.map((service) => { const Icon = getServiceIcon(service.icon); const displayId = String(service.id).slice(0, 8); return <div key={service.id} className="service-admin-row"><span className="admin-order">{displayId}</span><span className="admin-service-icon"><Icon size={17} /></span><div className="service-admin-info"><strong>{service.title}</strong><p>{service.short_description}</p><span className="service-slug">{service.slug}</span></div><span className={`active-pill ${service.is_active ? '' : 'inactive'}`}><span className={service.is_active ? 'status-ok' : 'status-error'} /> {service.is_active ? 'Activo' : 'Inativo'}</span><div className="service-admin-actions"><button className="icon-btn" onClick={() => setShowServiceForm(service)} title="Editar"><Pencil size={16} /></button><button className="icon-btn danger" onClick={() => setDeletingServiceId(service.id)} title="Eliminar"><Trash2 size={16} /></button></div></div>})}</div></Card>}

        {activeSection === 'media' && <Card className="admin-panel admin-section-panel"><div className="admin-panel-head"><div><span className="admin-panel-kicker">ASSETS DIGITAIS</span><h2>Gestão de mídias</h2></div><span className="admin-muted">{media.length} ficheiros no storage</span></div><label className={`upload-zone ${dragActive ? 'upload-zone--active' : ''}`} onDragOver={(event) => { event.preventDefault(); setDragActive(true) }} onDragLeave={() => setDragActive(false)} onDrop={(event) => { event.preventDefault(); handleFiles(event.dataTransfer.files) }}><input type="file" accept="image/*" multiple onChange={(event) => handleFiles(event.target.files)} /><span className="upload-cloud"><UploadCloud size={28} /></span><strong>Arraste imagens para aqui</strong><span>ou clique para seleccionar ficheiros · PNG, JPG, WebP até 10 MB</span><Button type="button" variant="outline" size="sm"><FolderOpen size={14} /> Seleccionar ficheiros</Button></label>{visibleMedia.length === 0 && <div className="admin-empty-state"><FileImage size={48} /><h3>{media.length ? 'Sem correspondências' : 'Nenhuma mídia ainda'}</h3><p>{media.length ? `Nenhum ficheiro corresponde a "${search}".` : 'Faça upload da primeira imagem para começar a galeria.'}</p></div>}<div className="media-preview-grid">{visibleMedia.map((item) => <MediaTile key={item.id} item={item} onDelete={handleMediaDelete} notify={notify} />)}</div></Card>}

        {activeSection === 'software' && <Card className="admin-panel admin-section-panel"><div className="admin-panel-head"><div><span className="admin-panel-kicker">CATÁLOGO DIGITAL</span><h2>Softwares & downloads</h2></div><Button size="sm" onClick={() => { setEditingSoftware(null); resetSoftwareForm(); setShowSoftwareForm(true) }}><Plus size={15} /> Adicionar software</Button></div>{downloadMetrics && <div className="dl-metrics"><div className="dl-metrics-head"><div><span className="admin-panel-kicker">MÉTRICAS · ÚLTIMOS 30 DIAS</span><strong>{downloadMetrics.total30} download(s) registados</strong></div><small>{downloadMetrics.topo.length ? downloadMetrics.topo.map(t => `${t.name}: ${t.count}`).join(' · ') : 'Sem downloads no período — os registos começam quando o site usa o link de download real.'}</small></div><div className="dl-bars">{dlDays.map((day) => <div key={day.d} className="dl-bar" title={`${day.d}: ${day.n} download(s)`}><i style={{ height: `${Math.max(4, Math.round((day.n / dlMax) * 100))}%` }} /><span>{day.d.slice(8)}</span></div>)}</div></div>}{visibleSoftware.length === 0 ? <div className="admin-empty-state"><Package size={48} /><h3>Nenhum software cadastrado</h3><p>Adicione o primeiro software ao catálogo para começar.</p><Button size="lg" onClick={() => { setEditingSoftware(null); resetSoftwareForm(); setShowSoftwareForm(true) }}><Plus size={16} /> Adicionar software</Button></div> : <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Software</th><th>Versão</th><th>Tamanho</th><th>Downloads</th><th>Estado</th><th>Actualizado</th><th /></tr></thead><tbody>{visibleSoftware.map((item) => <tr key={item.id}><td><span className="software-symbol"><Package size={15} /></span><strong>{item.name}</strong>{item.category && <span className="software-tag">{item.category}</span>}</td><td><span className="version-pill">{item.version}</span></td><td>{item.file_size}</td><td>{item.downloads_count}</td><td><span className={`active-pill ${item.is_active === false ? 'inactive' : ''}`}>{item.is_active === false ? 'Inactivo' : 'Activo'}</span></td><td>{formatDate(item.created_at)}</td><td className="row-actions"><button className="icon-btn" title="Editar" onClick={() => openEditSoftware(item)}><Pencil size={15} /></button><button className="icon-btn" title={item.is_active === false ? 'Activar' : 'Desactivar'} onClick={() => handleToggleSoftware(item)}><Power size={15} /></button><button className="icon-btn danger" title="Eliminar" onClick={() => setDeletingSoftwareId(item.id)}><Trash2 size={15} /></button></td></tr>)}</tbody></table></div>}</Card>}

        {activeSection === 'licencas' && <Card className="admin-panel admin-section-panel"><div className="admin-panel-head"><div><span className="admin-panel-kicker">PALANCASOFT</span><h2>Licenças & activações</h2></div><Button size="sm" onClick={() => setShowLicenseForm(true)}><Plus size={15} /> Nova licença</Button></div>{licenses.length === 0 ? <div className="admin-empty-state"><KeyRound size={48} /><h3>Sem licenças registadas</h3><p>Crie a primeira licença — a chave de activação é gerada automaticamente.</p><Button size="lg" onClick={() => setShowLicenseForm(true)}><Plus size={16} /> Nova licença</Button></div> : <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Chave de activação</th><th>Cliente</th><th>NIF</th><th>Activada</th><th>Expira</th><th>Estado</th><th /></tr></thead><tbody>{licenses.map((license) => <tr key={license.id}><td><code className="license-key">{license.chave_licenca}</code> <button className="icon-btn" title="Copiar chave" onClick={() => copyKey(license.chave_licenca)}><Copy size={13} /></button></td><td>{license.cliente_nome}</td><td>{license.nif || '—'}</td><td>{license.data_ativacao || '—'}</td><td>{license.data_expiracao || 'Sem prazo'}</td><td><span className={`active-pill ${license.status === 'activa' ? '' : 'inactive'}`}>{labelLicenca(license.status)}</span></td><td className="row-actions">{license.status === 'activa' ? <button className="icon-btn" title="Cancelar licença" onClick={() => updateLicenseStatus(license, 'cancelada')}><Power size={15} /></button> : <button className="icon-btn" title="Reactivar licença" onClick={() => updateLicenseStatus(license, 'activa')}><Check size={15} /></button>}<button className="icon-btn danger" title="Eliminar" onClick={() => setDeletingLicenseId(license.id)}><Trash2 size={15} /></button></td></tr>)}</tbody></table></div>}</Card>}

        {activeSection === 'parceiros' && <Card className="admin-panel admin-section-panel"><div className="admin-panel-head"><div><span className="admin-panel-kicker">REVENDA NEGOMIL — AGT</span><h2>Sub-parceiros & candidaturas</h2></div><span className="admin-muted">{partners.filter(p => p.status === 'aprovado').length} aprovado(s) de {partners.length}</span></div>{partners.length === 0 ? <div className="admin-empty-state"><Network size={48} /><h3>Sem candidaturas ainda</h3><p>Os pedidos do formulário de parcerias do site aparecem aqui.</p></div> : <div className="partner-list">{partners.map((partner) => <div className="partner-row" key={partner.id}><div className="partner-main"><strong>{partner.nome_responsavel}</strong><small>{partner.modalidade} · {partner.provincia || '—'} · {partner.telefone_whatsapp}{partner.empresa_nif ? ` · NIF ${partner.empresa_nif}` : ''}</small>{partner.nota && <p className="partner-note">"{partner.nota.slice(0, 110)}{partner.nota.length > 110 ? '…' : ''}"</p>}</div><span className={`contact-status contact-status--${partner.status}`}>{labelParceiro(partner.status)}</span><div className="partner-metrics"><label>Vendas<input className="metric-input" type="number" min="0" defaultValue={partner.volume_vendas} onBlur={(e) => updatePartnerMetric(partner, 'volume_vendas', e.target.value)} /></label><label>Clientes<input className="metric-input" type="number" min="0" defaultValue={partner.clientes_angariados} onBlur={(e) => updatePartnerMetric(partner, 'clientes_angariados', e.target.value)} /></label></div><div className="service-admin-actions">{partner.status !== 'aprovado' && <button className="icon-btn" title="Aprovar" onClick={() => updatePartnerStatus(partner, 'aprovado')}><Check size={16} /></button>}{partner.status !== 'em_analise' && <button className="icon-btn" title="Marcar em análise" onClick={() => updatePartnerStatus(partner, 'em_analise')}><Headphones size={16} /></button>}{partner.status !== 'rejeitado' && <button className="icon-btn" title="Rejeitar" onClick={() => updatePartnerStatus(partner, 'rejeitado')}><X size={16} /></button>}<button className="icon-btn danger" title="Eliminar" onClick={() => setDeletingPartnerId(partner.id)}><Trash2 size={16} /></button></div></div>)}</div>}</Card>}

        {activeSection === 'contactos' && <Card className="admin-panel admin-section-panel"><div className="admin-panel-head"><div><span className="admin-panel-kicker">PEDIDOS DE CONTACTO</span><h2>Contactos recebidos</h2></div><span className="admin-muted">{contacts.length} contacto(s) · últimos 30</span></div>{visibleContacts.length === 0 ? <div className="admin-empty-state"><UsersRound size={48} /><h3>{contacts.length ? 'Sem correspondências' : 'Sem contactos ainda'}</h3><p>{contacts.length ? `Nenhum contacto corresponde a "${search}".` : 'Quando alguém submeter o formulário do site, o pedido aparece aqui.'}</p></div> : <div className="contact-list">{visibleContacts.map((contact) => <div key={contact.id} className={`contact-item ${selectedContactId === contact.id ? 'contact-item--open' : ''}`}><button type="button" className="contact-item-head" onClick={() => setSelectedContactId(selectedContactId === contact.id ? null : contact.id)} aria-expanded={selectedContactId === contact.id}><span className="contact-initials">{contact.name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()}</span><span className="contact-main"><strong>{contact.name}</strong><small>{contact.email}{contact.phone ? ` · ${contact.phone}` : ''}</small></span><span className="contact-interest">{contact.service_interest}</span><span className={`contact-status contact-status--${contactStatusTone(contact.status)}`}>{contactStatusLabel(contact.status)}</span><time>{formatDate(contact.created_at)}</time><ChevronRight size={16} className="contact-chevron" /></button>{selectedContactId === contact.id && <div className="contact-detail"><p>{contact.message || '(Sem mensagem.)'}</p><div className="contact-detail-actions">{contact.status !== 'read' && <Button size="sm" variant="outline" onClick={() => handleContactStatus(contact, 'read')}><Check size={14} /> Marcar como lido</Button>}{contact.status !== 'unread' && <Button size="sm" variant="outline" onClick={() => handleContactStatus(contact, 'unread')}><Bell size={14} /> Marcar como novo</Button>}{contact.status !== 'em_contacto' && <Button size="sm" variant="outline" onClick={() => handleContactStatus(contact, 'em_contacto')}><Headphones size={14} /> Em contacto</Button>}{contact.status !== 'proposta' && <Button size="sm" variant="outline" onClick={() => handleContactStatus(contact, 'proposta')}><FilePlus2 size={14} /> Proposta enviada</Button>}{contact.status !== 'fechado' && <Button size="sm" variant="outline" onClick={() => handleContactStatus(contact, 'fechado')}><Check size={14} /> Fechar</Button>}<Button size="sm" variant="outline" onClick={() => handleContactStatus(contact, 'archived')}><Archive size={14} /> Arquivar</Button><Button size="sm" variant="dark" className="btn-danger" onClick={() => setDeletingContactId(contact.id)}><Trash2 size={14} /> Eliminar</Button></div></div>}</div>)}</div>}</Card>}

        {activeSection === 'pedidos' && (() => {
          const filtered = licenseOrders.filter(o => orderFilter === 'Todos' ? true : o.status === orderFilter)
          return <Card className="admin-panel admin-section-panel"><div className="admin-panel-head"><div><span className="admin-panel-kicker">CHECKOUT B2B</span><h2>Pedidos de licença</h2></div><div className="order-filter-tabs">{(['Todos', 'Pendente', 'Aprovado'] as const).map(f => <button key={f} className={orderFilter === f ? 'order-filter-tab is-active' : 'order-filter-tab'} onClick={() => setOrderFilter(f)}>{f === 'Pendente' ? `Pendentes (${licenseOrders.filter(o => o.status === 'Pendente').length})` : f === 'Aprovado' ? `Aprovados (${licenseOrders.filter(o => o.status === 'Aprovado').length})` : `Todos (${licenseOrders.length})`}</button>)}</div></div>{filtered.length === 0 ? <div className="admin-empty-state"><ShoppingCart size={48} /><h3>Sem pedidos {orderFilter !== 'Todos' ? `"${orderFilter === 'Pendente' ? 'Pendentes' : 'Aprovados'}"` : 'nesta vista'}</h3><p>Assim que clientes registarem pedidos pelo checkout do site, aparecem aqui em tempo real.</p></div> : <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Data</th><th>Empresa / NIF</th><th>Software</th><th>Responsável / WhatsApp</th><th>Província</th><th>Pagamento</th><th>Status</th><th /></tr></thead><tbody>{filtered.map((order) => <tr key={order.id}><td>{new Date(order.created_at).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' })}<small className="order-time">{new Date(order.created_at).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}</small></td><td><strong>{order.nome_empresa}</strong><small className="order-sub">{order.nif}</small></td><td>{order.software_nome}</td><td>{order.nome_responsavel}<small className="order-sub">{order.telefone_whatsapp}</small>{order.email && <small className="order-sub">{order.email}</small>}</td><td>{order.provincia}</td><td>{order.forma_pagamento === 'Multicaixa Express' ? 'Multicaixa Express' : 'Transferência / IBAN'}</td><td><span className={`order-status-pill order-status--${order.status.replace(/\s/g, '')}`}>{orderLabelStatus(order.status)}</span></td><td className="row-actions">{(order.status === 'Pendente' || order.status === 'Em Verificação' || order.status === 'Rejeitado') && <button className="icon-btn order-btn--ok" title="Confirmar & Aprovar" onClick={() => updateOrderStatus(order, 'Aprovado')}><Check size={15} /></button>}{order.status === 'Pendente' && <button className="icon-btn" title="Marcar Em Verificação" onClick={() => updateOrderStatus(order, 'Em Verificação')}><Loader2 size={15} /></button>}{(order.status === 'Pendente' || order.status === 'Em Verificação') && <button className="icon-btn" title="Rejeitar" onClick={() => updateOrderStatus(order, 'Rejeitado')}><X size={15} /></button>}<a className="icon-btn" title="Falar no WhatsApp" href={waLinkAdmin(order.telefone_whatsapp, order)} target="_blank" rel="noreferrer noopener"><MessageCircle size={15} /></a><button className="icon-btn danger" title="Eliminar pedido" onClick={() => setDeletingOrderId(order.id)}><Trash2 size={15} /></button></td></tr>)}</tbody></table></div>}</Card>
        })()}

        {activeSection === 'settings' && <div className="settings-grid"><Card className="admin-panel settings-card"><div className="admin-panel-head"><div><span className="admin-panel-kicker">CONTA</span><h2>Perfil do administrador</h2></div></div><p>Actualize o nome exibido no painel. O e-mail de acesso é fixo.</p><div className="settings-profile"><Avatar className="admin-avatar-large"><AvatarFallback>{(profileName.trim()[0] || adminUser?.name?.[0] || 'A').toUpperCase()}</AvatarFallback></Avatar><form className="settings-form" onSubmit={handleProfileSave}><label className="settings-field">Nome de exibição<input value={profileName} onChange={(e) => setProfileName(e.target.value)} required maxLength={120} /></label><label className="settings-field">E-mail de acesso<input value={adminUser?.email || ''} disabled /><small className="settings-hint">Não é alterável nesta versão.</small></label><div className="settings-actions"><Button type="submit" size="sm" disabled={savingProfile}>{savingProfile ? 'A guardar…' : <><Check size={14} /> Guardar perfil</>}</Button></div></form></div></Card><Card className="admin-panel settings-card"><div className="admin-panel-head"><div><span className="admin-panel-kicker">SEGURANÇA</span><h2>Mudar password</h2></div></div><p>A password actual é verificada (bcrypt) antes de qualquer alteração. Mínimo 8 caracteres.</p><form className="settings-form" onSubmit={handlePasswordChange}><label className="settings-field">Password actual<input type="password" value={pwCurrent} onChange={(e) => setPwCurrent(e.target.value)} required autoComplete="current-password" /></label><div className="settings-row"><label className="settings-field">Nova password<input type="password" value={pwNew} onChange={(e) => setPwNew(e.target.value)} required minLength={8} autoComplete="new-password" /></label><label className="settings-field">Confirmar nova<input type="password" value={pwConfirm} onChange={(e) => setPwConfirm(e.target.value)} required minLength={8} autoComplete="new-password" /></label></div>{pwNew && pwConfirm && pwNew !== pwConfirm && <p className="settings-warn">As passwords não coincidem.</p>}{pwNew && pwNew.length < 8 && <p className="settings-warn">A nova password precisa de pelo menos 8 caracteres.</p>}<div className="settings-actions"><Button type="submit" size="sm" disabled={savingPassword || (pwNew.length > 0 && pwNew !== pwConfirm)}>{savingPassword ? 'A alterar…' : <><Check size={14} /> Alterar password</>}</Button></div></form><div className="security-list"><div className="security-item"><ShieldCheck size={18} /><div><span>Autenticação de administrador</span><small>Protegida por JWT + cookie HttpOnly</small></div><span className="security-badge security-badge--ok">Activa</span></div><div className="security-item"><Database size={18} /><div><span>Base de dados gerida</span><small>Conexão activa e monitorizada</small></div><span className="security-badge security-badge--ok">Ligada</span></div></div></Card>{(adminUser?.level || 'super_admin') === 'super_admin' && <Card className="admin-panel settings-card"><div className="admin-panel-head"><div><span className="admin-panel-kicker">PORTAL PÚBLICO</span><h2>Configuração do site</h2></div></div><p>Directório telefónico, WhatsApp comercial e o banner de avisos exibido no topo do site.</p><form className="settings-form" onSubmit={handlePortalSave}><div className="settings-row"><label className="settings-field">Telefone do directório<input value={portalSettings['telefone_directorio'] || ''} onChange={(e) => setPortalSettings(f => ({ ...f, telefone_directorio: e.target.value }))} placeholder="+244 900 000 000" maxLength={40} /></label><label className="settings-field">WhatsApp comercial (só dígitos)<input value={portalSettings['whatsapp_comercial'] || ''} onChange={(e) => setPortalSettings(f => ({ ...f, whatsapp_comercial: e.target.value }))} placeholder="244900000000" maxLength={25} /></label></div><label className="settings-field">Mensagem do banner<input value={portalSettings['banner_mensagem'] || ''} onChange={(e) => setPortalSettings(f => ({ ...f, banner_mensagem: e.target.value }))} placeholder="Ex.: Nova versão do PalancaSoft disponível!" maxLength={140} /></label><label className="settings-field">Banner no site<select value={portalSettings['banner_activo'] || 'false'} onChange={(e) => setPortalSettings(f => ({ ...f, banner_activo: e.target.value }))}><option value="false">Desactivado</option><option value="true">Activado</option></select></label><div className="settings-actions"><Button type="submit" size="sm" disabled={savingPortal}>{savingPortal ? 'A guardar…' : <><Check size={14} /> Guardar configuração</>}</Button></div></form></Card>}{(adminUser?.level || 'super_admin') === 'super_admin' && <Card className="admin-panel settings-card"><div className="admin-panel-head"><div><span className="admin-panel-kicker">GESTÃO DE ACESSOS</span><h2>Utilizadores do painel</h2></div><Button size="sm" onClick={() => setShowUserForm(true)}><Plus size={15} /> Novo utilizador</Button></div><p>Níveis: <strong>Super Admin</strong> (tudo), <strong>Gestor Comercial</strong> (contactos, licenças, parceiros, catálogo) e <strong>Técnico de Suporte</strong> (contactos, catálogo e mídias).</p><div className="user-admin-list">{users.map((user) => { const isSelf = adminUser?.email?.toLowerCase() === user.email.toLowerCase(); return <div key={user.id} className="user-admin-row"><div className="user-main"><strong>{user.name}{isSelf && <small> (você)</small>}</strong><span>{user.email}</span></div><select className="user-role-select" value={user.role} disabled={isSelf} onChange={(e) => updateUser(user, { role: e.target.value })}>{ROLES.map(r => <option key={r} value={r}>{labelRole(r)}</option>)}</select><span className={`active-pill ${user.is_active ? '' : 'inactive'}`}>{user.is_active ? 'Activo' : 'Desactivado'}</span><div className="service-admin-actions">{!isSelf && <button className="icon-btn" title={user.is_active ? 'Desactivar' : 'Activar'} onClick={() => updateUser(user, { is_active: !user.is_active })}><Power size={16} /></button>}<button className="icon-btn" title="Redefinir password" onClick={() => { setPwResetUser(user); setPwResetForm({ pw: '', pw2: '' }) }}><KeyRound size={16} /></button>{!isSelf && <button className="icon-btn danger" title="Eliminar" onClick={() => setDeletingUserId(user.id)}><Trash2 size={16} /></button>}</div></div> })}</div></Card>}</div>}
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

    {showServiceForm !== false && <div className="admin-modal-backdrop" onMouseDown={() => setShowServiceForm(false)}><div className="admin-modal" onMouseDown={(event) => event.stopPropagation()}><div className="admin-modal-head"><div><span className="admin-panel-kicker">NOVO REGISTO</span><h2>{showServiceForm ? 'Editar serviço' : 'Novo serviço'}</h2></div><button onClick={() => setShowServiceForm(false)}><X size={18} /></button></div><form onSubmit={(e) => handleServiceSubmit(e, showServiceForm)}><div className="admin-form-grid"><label>Título<input name="title" placeholder="Ex.: Desenvolvimento à medida" defaultValue={showServiceForm?.title || ''} required /></label><label>Slug (URL)<input name="slug" placeholder="Gerado automaticamente" defaultValue={showServiceForm?.slug || ''} disabled /></label><label>Ícone<select name="icon" defaultValue={showServiceForm?.icon || 'Code2'}>{Object.keys(serviceIcons).map((key) => <option key={key} value={key}>{key}</option>)}</select></label><label className="checkbox-label"><input type="checkbox" name="is_active" defaultChecked={showServiceForm?.is_active !== false} /> Activo no site público</label></div><label>Descrição curta<input name="short_description" placeholder="Descrição breve para listagens" defaultValue={showServiceForm?.short_description || ''} required /></label><label>Descrição completa<textarea name="full_description" rows={4} placeholder="Descrição detalhada para a página do serviço" defaultValue={showServiceForm?.full_description || ''} /></label><div className="admin-modal-actions"><Button variant="outline" type="button" onClick={() => setShowServiceForm(false)}>Cancelar</Button><Button type="submit"><Check size={15} /> {showServiceForm ? 'Actualizar serviço' : 'Criar serviço'}</Button></div></form></div></div>}

    {deletingServiceId && <div className="admin-modal-backdrop" onMouseDown={() => setDeletingServiceId(null)}><div className="admin-modal admin-modal--confirm" onMouseDown={(event) => event.stopPropagation()}><div className="admin-modal-head"><div><span className="admin-panel-kicker">CONFIRMAÇÃO</span><h2>Eliminar serviço</h2></div><button onClick={() => setDeletingServiceId(null)}><X size={18} /></button></div><p>Tem a certeza que quer eliminar este serviço? Esta acção não pode ser desfeita.</p><div className="admin-modal-actions"><Button variant="outline" onClick={() => setDeletingServiceId(null)}>Cancelar</Button><Button variant="dark" onClick={handleServiceDelete}><Trash2 size={15} /> Eliminar permanentemente</Button></div></div></div>}

    {deletingOrderId && <div className="admin-modal-backdrop" onMouseDown={() => setDeletingOrderId(null)}><div className="admin-modal admin-modal--confirm" onMouseDown={(event) => event.stopPropagation()}><div className="admin-modal-head"><div><span className="admin-panel-kicker">CONFIRMAÇÃO</span><h2>Eliminar pedido</h2></div><button onClick={() => setDeletingOrderId(null)}><X size={18} /></button></div><p>Tem a certeza que quer eliminar este pedido de licença? Esta acção não pode ser desfeita.</p><div className="admin-modal-actions"><Button variant="outline" onClick={() => setDeletingOrderId(null)}>Cancelar</Button><Button variant="dark" onClick={handleOrderDelete}><Trash2 size={15} /> Eliminar pedido</Button></div></div></div>}

    {deletingContactId && <div className="admin-modal-backdrop" onMouseDown={() => setDeletingContactId(null)}><div className="admin-modal admin-modal--confirm" onMouseDown={(event) => event.stopPropagation()}><div className="admin-modal-head"><div><span className="admin-panel-kicker">CONFIRMAÇÃO</span><h2>Eliminar contacto</h2></div><button onClick={() => setDeletingContactId(null)}><X size={18} /></button></div><p>Tem a certeza que quer eliminar este contacto? Esta acção não pode ser desfeita.</p><div className="admin-modal-actions"><Button variant="outline" onClick={() => setDeletingContactId(null)}>Cancelar</Button><Button variant="dark" onClick={handleContactDelete}><Trash2 size={15} /> Eliminar permanentemente</Button></div></div></div>}

    {deletingSoftwareId && <div className="admin-modal-backdrop" onMouseDown={() => setDeletingSoftwareId(null)}><div className="admin-modal admin-modal--confirm" onMouseDown={(event) => event.stopPropagation()}><div className="admin-modal-head"><div><span className="admin-panel-kicker">CONFIRMAÇÃO</span><h2>Eliminar software</h2></div><button onClick={() => setDeletingSoftwareId(null)}><X size={18} /></button></div><p>Tem a certeza que quer eliminar este software e o respectivo instalador do storage? Esta acção não pode ser desfeita.</p><div className="admin-modal-actions"><Button variant="outline" onClick={() => setDeletingSoftwareId(null)}>Cancelar</Button><Button variant="dark" onClick={handleSoftwareDelete}><Trash2 size={15} /> Eliminar permanentemente</Button></div></div></div>}

    {deletingLicenseId && <div className="admin-modal-backdrop" onMouseDown={() => setDeletingLicenseId(null)}><div className="admin-modal admin-modal--confirm" onMouseDown={(event) => event.stopPropagation()}><div className="admin-modal-head"><div><span className="admin-panel-kicker">CONFIRMAÇÃO</span><h2>Eliminar licença</h2></div><button onClick={() => setDeletingLicenseId(null)}><X size={18} /></button></div><p>Tem a certeza que quer eliminar esta licença? O cliente deixará de a poder usar. Esta acção não pode ser desfeita.</p><div className="admin-modal-actions"><Button variant="outline" onClick={() => setDeletingLicenseId(null)}>Cancelar</Button><Button variant="dark" onClick={handleLicenseDelete}><Trash2 size={15} /> Eliminar licença</Button></div></div></div>}

    {deletingPartnerId && <div className="admin-modal-backdrop" onMouseDown={() => setDeletingPartnerId(null)}><div className="admin-modal admin-modal--confirm" onMouseDown={(event) => event.stopPropagation()}><div className="admin-modal-head"><div><span className="admin-panel-kicker">CONFIRMAÇÃO</span><h2>Eliminar candidatura</h2></div><button onClick={() => setDeletingPartnerId(null)}><X size={18} /></button></div><p>Tem a certeza que quer eliminar esta candidatura de sub-parceiro? Esta acção não pode ser desfeita.</p><div className="admin-modal-actions"><Button variant="outline" onClick={() => setDeletingPartnerId(null)}>Cancelar</Button><Button variant="dark" onClick={handlePartnerDelete}><Trash2 size={15} /> Eliminar candidatura</Button></div></div></div>}

    {showUserForm && <div className="admin-modal-backdrop" onMouseDown={() => setShowUserForm(false)}><div className="admin-modal" onMouseDown={(event) => event.stopPropagation()}><div className="admin-modal-head"><div><span className="admin-panel-kicker">GESTÃO DE ACESSOS</span><h2>Novo utilizador</h2></div><button onClick={() => setShowUserForm(false)}><X size={18} /></button></div><form onSubmit={createUser}><div className="admin-form-grid"><label>Nome<input value={userForm.name} onChange={(e) => setUserForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex.: Ana Silvestre" required maxLength={120} /></label><label>E-mail de acesso<input type="email" value={userForm.email} onChange={(e) => setUserForm(f => ({ ...f, email: e.target.value }))} placeholder="nome@cftec.co" required maxLength={160} /></label><label>Password inicial<input type="password" value={userForm.password} onChange={(e) => setUserForm(f => ({ ...f, password: e.target.value }))} placeholder="Mínimo 8 caracteres" required minLength={8} autoComplete="new-password" /></label><label>Nível de permissão<select value={userForm.role} onChange={(e) => setUserForm(f => ({ ...f, role: e.target.value }))}>{ROLES.map(r => <option key={r} value={r}>{labelRole(r)}</option>)}</select></label></div><div className="admin-modal-actions"><Button variant="outline" type="button" onClick={() => setShowUserForm(false)}>Cancelar</Button><Button type="submit" disabled={savingUser}><Check size={15} /> {savingUser ? 'A criar…' : 'Criar utilizador'}</Button></div></form></div></div>}

    {pwResetUser && <div className="admin-modal-backdrop" onMouseDown={() => setPwResetUser(null)}><div className="admin-modal" onMouseDown={(event) => event.stopPropagation()}><div className="admin-modal-head"><div><span className="admin-panel-kicker">SEGURANÇA</span><h2>Redefinir password</h2></div><button onClick={() => setPwResetUser(null)}><X size={18} /></button></div><form onSubmit={(e) => { e.preventDefault(); handlePwReset() }}><p className="admin-modal-intro">Define uma nova password para <strong>{pwResetUser.name}</strong> ({pwResetUser.email}). A password actual deixa de funcionar imediatamente.</p><div className="admin-form-grid"><label>Nova password<input type="password" value={pwResetForm.pw} onChange={(e) => setPwResetForm(f => ({ ...f, pw: e.target.value }))} required minLength={8} autoComplete="new-password" /></label><label>Confirmar<input type="password" value={pwResetForm.pw2} onChange={(e) => setPwResetForm(f => ({ ...f, pw2: e.target.value }))} required minLength={8} autoComplete="new-password" /></label></div><div className="admin-modal-actions"><Button variant="outline" type="button" onClick={() => setPwResetUser(null)}>Cancelar</Button><Button type="submit"><Check size={15} /> Redefinir</Button></div></form></div></div>}

    {deletingUserId && <div className="admin-modal-backdrop" onMouseDown={() => setDeletingUserId(null)}><div className="admin-modal admin-modal--confirm" onMouseDown={(event) => event.stopPropagation()}><div className="admin-modal-head"><div><span className="admin-panel-kicker">CONFIRMAÇÃO</span><h2>Eliminar utilizador</h2></div><button onClick={() => setDeletingUserId(null)}><X size={18} /></button></div><p>Tem a certeza que quer eliminar este utilizador? Ele deixará de conseguir entrar no painel. Esta acção não pode ser desfeita.</p><div className="admin-modal-actions"><Button variant="outline" onClick={() => setDeletingUserId(null)}>Cancelar</Button><Button variant="dark" onClick={handleUserDelete}><Trash2 size={15} /> Eliminar utilizador</Button></div></div></div>}

    {showLicenseForm && <div className="admin-modal-backdrop" onMouseDown={() => setShowLicenseForm(false)}><div className="admin-modal" onMouseDown={(event) => event.stopPropagation()}><div className="admin-modal-head"><div><span className="admin-panel-kicker">PALANCASOFT</span><h2>Nova licença</h2></div><button onClick={() => setShowLicenseForm(false)}><X size={18} /></button></div><form onSubmit={createLicense}><div className="admin-form-grid"><label>Nome do cliente / empresa<input value={licenseForm.clienteNome} onChange={(e) => setLicenseForm(f => ({ ...f, clienteNome: e.target.value }))} placeholder="Ex.: Loja Kwanza" required maxLength={150} /></label><label>NIF (opcional)<input value={licenseForm.nif} onChange={(e) => setLicenseForm(f => ({ ...f, nif: e.target.value }))} placeholder="Ex.: 5417234561" maxLength={30} /></label><label>Data de expiração (opcional)<input type="date" value={licenseForm.expiracao} onChange={(e) => setLicenseForm(f => ({ ...f, expiracao: e.target.value }))} /></label></div><p className="admin-field-hint">A chave de activação (PS-XXXX-XXXX-XXXX) é gerada automaticamente e copiada para a área de transferência.</p><div className="admin-modal-actions"><Button variant="outline" type="button" onClick={() => setShowLicenseForm(false)}>Cancelar</Button><Button type="submit" disabled={licenseSaving}><Check size={15} /> {licenseSaving ? 'A gerar…' : 'Criar licença'}</Button></div></form></div></div>}
  </div>
}
