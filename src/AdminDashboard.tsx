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
  Cpu,
  Database,
  DollarSign,
  FileImage,
  FilePlus2,
  FolderOpen,
  Globe2,
  Headphones,
  LayoutDashboard,
  LogOut,
  Layers3,
  Menu,
  MoreHorizontal,
  Network,
  Package,
  PanelLeftClose,
  Plus,
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
} from 'lucide-react'

// Icon mapping for services
const serviceIcons: Record<string, typeof Code2> = {
  Code2,
  Network,
  BarChart3,
  Headphones,
  Cpu,
  Database,
  Globe2,
  Layers3,
  ShieldCheck,
  Zap,
  Sparkles,
  UsersRound,
}

type AdminSection = 'dashboard' | 'services' | 'media' | 'software' | 'settings'

type Summary = { softwares: number; media: number; services: number; contacts: number }
type Contact = { id: string; name: string; email: string; service_interest: string; status: string; created_at: string }
type Software = { id: string; name: string; version: string; file_size: string; downloads_count: number; created_at: string }
type Service = { id: string; title: string; slug: string; short_description: string; full_description: string | null; icon: string; is_active: boolean; created_at: string }
export type Media = { id: string; filename: string; file_path: string; file_size: number; mime_type: string; alt_text: string | null; uploaded_at: string }
type AdminUser = { name: string; email: string }

type HealthCheck = {
  score: number
  status: 'healthy' | 'degraded' | 'critical'
  checks: {
    database: { status: 'healthy' | 'unhealthy'; latency: number }
    storage: { status: 'healthy' | 'unhealthy'; latency: number }
    api: { status: 'healthy' | 'unhealthy'; latency: number }
  }
}

const fallbackSummary: Summary = { softwares: 3, media: 18, services: 4, contacts: 24 }
const fallbackContacts: Contact[] = [
  { id: '1', name: 'Marta Silva', email: 'marta@atlas.co', service_interest: 'CFTEC Flow', status: 'unread', created_at: 'Hoje, 09:42' },
  { id: '2', name: 'Paulo António', email: 'paulo@kairo.co', service_interest: 'Serviço à medida', status: 'unread', created_at: 'Ontem, 16:18' },
  { id: '3', name: 'Inês Gomes', email: 'ines@nortelab.co', service_interest: 'CFTEC Insight', status: 'read', created_at: '12 Out, 11:05' },
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

const navItems: { id: AdminSection; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Visão Geral', icon: LayoutDashboard },
  { id: 'services', label: 'Gerir Serviços', icon: Code2 },
  { id: 'media', label: 'Gestão de Mídias', icon: FileImage },
  { id: 'software', label: 'Softwares & Downloads', icon: Package },
  { id: 'settings', label: 'Definições', icon: Settings },
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

  useEffect(() => {
    fetch('/api/admin/session', { credentials: 'include' }).then((response) => {
      if (!response.ok) throw new Error('unauthenticated')
      return response.json()
    }).then((result) => {
      setAdminUser(result.user)
      setAuthStatus('authenticated')
    }).catch(() => setAuthStatus('unauthenticated'))
  }, [])

  const loadDashboardData = async () => {
    if (authStatus !== 'authenticated') return
    
    try {
      const [summaryRes, contactsRes, softwareRes, servicesRes, mediaRes, healthRes] = await Promise.all([
        fetch('/api/admin/summary', { credentials: 'include' }),
        fetch('/api/admin/contacts', { credentials: 'include' }),
        fetch('/api/admin/software', { credentials: 'include' }),
        fetch('/api/admin/services', { credentials: 'include' }),
        fetch('/api/admin/media', { credentials: 'include' }),
        fetch('/api/admin/health', { credentials: 'include' }),
      ])
      
      const [summaryData, contactsData, softwareData, servicesData, mediaData, healthData] = await Promise.all([
        summaryRes.ok ? summaryRes.json() : fallbackSummary,
        contactsRes.ok ? contactsRes.json() : fallbackContacts,
        softwareRes.ok ? softwareRes.json() : fallbackSoftware,
        servicesRes.ok ? servicesRes.json() : fallbackServices,
        mediaRes.ok ? mediaRes.json() : [],
        healthRes.ok ? healthRes.json() : null,
      ])
      
      console.log('[ADMIN] Services loaded:', servicesData)
      console.log('[ADMIN] Summary loaded:', summaryData)
      console.log('[ADMIN] Health loaded:', healthData)
      
      setSummary(summaryData.summary || summaryData)
      setContacts(contactsData)
      setSoftware(softwareData)
      setServices(servicesData)
      setMedia(mediaData)
      setHealth(healthData)
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

  const notify = (message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 3200)
  }
  const visibleSoftware = useMemo(() => software.filter((item) => item.name.toLowerCase().includes(search.toLowerCase())), [software, search])
  const sectionTitle = navItems.find((item) => item.id === activeSection)?.label || 'Visão Geral'

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
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Erro ao eliminar mídia')
    }
  }

  // Software Modal Handlers
  const [softwareFormState, setSoftwareFormState] = useState({
    name: '',
    version: '',
    price: '',
    description: '',
    file: null as File | null,
    fileName: '',
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
      const maxSize = 100 * 1024 * 1024 // 100MB
      
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
          errors: { ...prev.errors, file: 'Ficheiro excede 100MB' },
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
    if (!softwareFormState.file) errors.file = 'Ficheiro do instalador é obrigatório'
    
    setSoftwareFormState(prev => ({ ...prev, errors }))
    return Object.keys(errors).length === 0
  }

  const handleSoftwareSubmit = async (editingSoftware?: Software | null) => {
    if (!validateSoftwareForm()) return

    setSoftwareFormState(prev => ({ ...prev, isLoading: true }))

    // Optimistic update for new software
    let tempSoftware: Software | null = null
    if (!editingSoftware) {
      tempSoftware = {
        id: `temp-${Date.now()}`,
        name: softwareFormState.name.trim(),
        version: softwareFormState.version.trim(),
        file_size: softwareFormState.file ? `${(softwareFormState.file.size / 1024 / 1024).toFixed(2)} MB` : '0 MB',
        downloads_count: 0,
        created_at: new Date().toISOString()
      }
      setSoftware(prev => [tempSoftware!, ...prev])
      setSummary(prev => ({ ...prev, softwares: prev.softwares + 1 }))
    }

    try {
      const formData = new FormData()
      formData.append('name', softwareFormState.name.trim())
      formData.append('version', softwareFormState.version.trim())
      formData.append('price', softwareFormState.price.trim())
      formData.append('description', softwareFormState.description.trim())
      if (softwareFormState.file) {
        formData.append('file', softwareFormState.file)
      }

      const url = editingSoftware 
        ? `/api/admin/software/${editingSoftware.id}`
        : '/api/admin/software'
      const method = editingSoftware ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        credentials: 'include',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Falha ao guardar software')
      }

      notify(editingSoftware ? 'Software actualizado com sucesso' : 'Software criado com sucesso')
      
      // Full sync from server
      await loadDashboardData()
      
      setShowSoftwareForm(false)
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
      file: null,
      fileName: '',
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
              <span className="admin-panel-kicker">NOVO REGISTO</span>
              <h2>Adicionar Software</h2>
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
                        <span>ou clique para seleccionar · .zip, .exe até 100MB</span>
                      </>
                    )}
                  </label>
                  {softwareFormState.errors.file && (
                    <p className="admin-field-error">{softwareFormState.errors.file}</p>
                  )}
                </div>
              </fieldset>

              {/* Section 3: Description */}
              <fieldset className="admin-form-section">
                <legend><FileText size={16} /> Descrição</legend>
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
                    Guardar Software
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  if (authStatus === 'loading') return <div className="admin-auth-shell"><div className="admin-auth-loading"><span className="admin-loading-dot" /> A validar sessão…</div></div>
  if (authStatus === 'unauthenticated') return <AdminLogin onAuthenticated={(user) => { setAdminUser(user); setAuthStatus('authenticated') }} />

  return <div className="admin-shell">
    {toast && <div className="admin-toast"><Check size={16} /> {toast}</div>}
    <aside className={`admin-sidebar ${sidebarOpen ? 'admin-sidebar--open' : ''}`}>
      <div className="admin-sidebar-top"><AdminMark /><button className="admin-close" onClick={() => setSidebarOpen(false)} aria-label="Fechar menu"><X size={20} /></button></div>
      <div className="admin-workspace"><span className="admin-avatar">CF</span><div><strong>CFTEC Workspace</strong><small>Plano empresarial <span /></small></div><ChevronRight size={15} /></div>
      <nav className="admin-nav"><span className="admin-nav-label">Workspace</span>{navItems.map(({ id, label, icon: Icon }) => <button className={activeSection === id ? 'is-active' : ''} key={id} onClick={() => { setActiveSection(id); setSidebarOpen(false) }}><Icon size={17} /><span>{label}</span>{id === 'dashboard' && <i className="admin-nav-pip" />}</button>)}</nav>
      <div className="admin-sidebar-bottom"><div className="admin-help"><CircleHelp size={17} /><div><strong>Precisa de ajuda?</strong><small>Fale com o suporte CFTEC</small></div></div><button className="admin-logout" onClick={handleLogout}><LogOut size={16} /> Sair do painel</button></div>
    </aside>

    <div className="admin-main">
      <header className="admin-topbar"><div className="admin-topbar-left"><button className="admin-menu" onClick={() => setSidebarOpen(true)} aria-label="Abrir menu"><Menu size={21} /></button><div className="admin-breadcrumb"><span>Painel Admin</span><ChevronRight size={13} /><strong>{sectionTitle}</strong></div></div><div className="admin-topbar-actions"><div className="admin-search"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Pesquisar no painel..." /></div><button className="admin-icon-btn" aria-label="Notificações"><Bell size={17} /><i /></button><span className="admin-separator" /><div className="admin-profile"><span className="admin-avatar">AM</span><div><strong>{adminUser?.name || 'Admin CFTEC'}</strong><small>{adminUser?.email || 'Administrador'}</small></div><ChevronRight size={14} /></div></div></header>
      <main className="admin-content">
        <div className="admin-page-heading"><div><span className="admin-kicker">{new Date().toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' })}</span><h1>{activeSection === 'dashboard' ? 'Bom dia, Admin.' : sectionTitle}</h1><p>{activeSection === 'dashboard' ? 'Aqui está o que está a acontecer no seu workspace hoje.' : 'Faça a gestão do conteúdo que alimenta a experiência CFTEC.'}</p></div><div className="admin-page-actions"><span className="admin-online"><i /> Sistema online</span>{activeSection === 'software' && <Button size="sm" onClick={() => setShowSoftwareForm(true)}><Plus size={15} /> Adicionar software</Button>}</div></div>

        {activeSection === 'dashboard' && <>
          <div className="admin-stats-grid"><StatCard label="Softwares cadastrados" value={summary.softwares} change="12.5%" icon={Package} tone="blue" /><StatCard label="Imagens na galeria" value={summary.media} change="8.2%" icon={FileImage} tone="cyan" /><StatCard label="Serviços activos" value={summary.services} change="4.1%" icon={Code2} tone="violet" /><StatCard label="Contactos recebidos" value={summary.contacts} change="18.4%" icon={Users} tone="lime" /></div>
          <div className="admin-dashboard-grid"><Card className="admin-panel admin-panel--activity"><div className="admin-panel-head"><div><span className="admin-panel-kicker">ACTIVIDADE</span><h2>Pedidos recentes</h2></div><button onClick={() => setActiveSection('dashboard')}>Ver todos <ChevronRight size={14} /></button></div><div className="contact-list">{contacts.map((contact) => <div className="contact-row" key={contact.id}><span className="contact-initials">{contact.name.split(' ').map((name) => name[0]).join('').slice(0, 2)}</span><div className="contact-main"><strong>{contact.name}</strong><span>{contact.email}</span></div><span className="contact-interest">{contact.service_interest || 'Pedido geral'}</span><span className={`contact-status contact-status--${contact.status}`}>{contact.status === 'unread' ? 'Novo' : 'Lido'}</span><time>{contact.created_at}</time><MoreHorizontal size={17} className="row-more" /></div>)}</div></Card><Card className="admin-panel admin-panel--health"><div className="admin-panel-head"><div><span className="admin-panel-kicker">SISTEMA</span><h2>Saúde do workspace</h2></div><Activity size={18} className="panel-accent" /></div>
              <>
              {health ? (
                <>
                <div className="health-score">
                  <div className="health-ring">
                    <strong>{health.score}</strong>
                    <span>/100</span>
                  </div>
                  <div>
                    <strong>{health.status === 'healthy' ? 'Excelente' : health.status === 'degraded' ? 'Atenção' : 'Crítico'}</strong>
                    <p>{health.status === 'healthy' ? 'Todas as métricas estão dentro dos parâmetros.' : health.status === 'degraded' ? 'Alguns sistemas precisam de atenção.' : 'Sistemas críticos precisam de intervenção imediata.'}</p>
                  </div>
                </div>
                <div className="health-lines">
                  <div><span>Base de dados</span><strong><span className={health.checks.database.status === 'healthy' ? 'status-ok' : 'status-error'} /> {health.checks.database.status === 'healthy' ? 'Operacional' : 'Indisponível'}</strong></div>
                  <div><span>Storage</span><strong><span className={health.checks.storage.status === 'healthy' ? 'status-ok' : 'status-error'} /> {health.checks.storage.status === 'healthy' ? 'Operacional' : 'Indisponível'}</strong></div>
                  <div><span>API pública</span><strong><span className={health.checks.api.status === 'healthy' ? 'status-ok' : 'status-error'} /> {health.checks.api.status === 'healthy' ? 'Operacional' : 'Indisponível'}</strong></div>
                </div>
                </>
              ) : (
                <div className="health-score">
                  <div className="health-ring"><strong>--</strong><span>/100</span></div>
                  <div><strong>Carregando...</strong><p>A verificar estado dos sistemas.</p></div>
                </div>
              )}
              </>
              </Card></div>
          <div className="admin-dashboard-grid admin-dashboard-grid--bottom"><Card className="admin-panel"><div className="admin-panel-head"><div><span className="admin-panel-kicker">CATÁLOGO</span><h2>Softwares mais descarregados</h2></div><button onClick={() => setActiveSection('software')}>Gerir catálogo <ChevronRight size={14} /></button></div><div className="mini-table">{software.slice(0, 3).map((item, index) => <div key={item.id}><span className="software-rank">0{index + 1}</span><span className="software-symbol"><Package size={15} /></span><strong>{item.name}</strong><span>{item.version}</span><b>{item.downloads_count} downloads</b><span className="mini-table-bar"><i style={{ width: `${Math.min(100, 28 + item.downloads_count / 3)}%` }} /></span></div>)}</div></Card><Card className="admin-panel admin-panel--quick"><span className="admin-panel-kicker">ACÇÕES RÁPIDAS</span><h2>O que precisa de fazer?</h2><button onClick={() => setActiveSection('software')}><FilePlus2 size={17} /><span><strong>Novo software</strong><small>Adicionar ao catálogo</small></span><ChevronRight size={15} /></button><button onClick={() => setActiveSection('media')}><CloudUpload size={17} /><span><strong>Subir imagens</strong><small>Actualizar galeria</small></span><ChevronRight size={15} /></button><button onClick={() => setActiveSection('services')}><Code2 size={17} /><span><strong>Editar serviços</strong><small>Gerir oferta pública</small></span><ChevronRight size={15} /></button></Card></div>
        </>}

        {activeSection === 'services' && <Card className="admin-panel admin-section-panel"><div className="admin-panel-head"><div><span className="admin-panel-kicker">CONTEÚDO PÚBLICO</span><h2>Serviços prestados</h2></div><Button size="sm" onClick={() => setShowServiceForm(null)}><Plus size={15} /> Novo serviço</Button></div><div className="service-admin-list">{services.map((service) => { const Icon = getServiceIcon(service.icon); const displayId = String(service.id).slice(0, 8); return <div key={service.id} className="service-admin-row"><span className="admin-order">{displayId}</span><span className="admin-service-icon"><Icon size={17} /></span><div className="service-admin-info"><strong>{service.title}</strong><p>{service.short_description}</p><span className="service-slug">{service.slug}</span></div><span className={`active-pill ${service.is_active ? '' : 'inactive'}`}><span className={service.is_active ? 'status-ok' : 'status-error'} /> {service.is_active ? 'Activo' : 'Inativo'}</span><div className="service-admin-actions"><button className="icon-btn" onClick={() => setShowServiceForm(service)} title="Editar"><MoreHorizontal size={16} /></button><button className="icon-btn danger" onClick={() => setDeletingServiceId(service.id)} title="Eliminar"><Trash2 size={16} /></button></div></div>})}</div></Card>}

        {activeSection === 'media' && <Card className="admin-panel admin-section-panel"><div className="admin-panel-head"><div><span className="admin-panel-kicker">ASSETS DIGITAIS</span><h2>Gestão de mídias</h2></div><span className="admin-muted">{media.length} ficheiros no storage</span></div><label className={`upload-zone ${dragActive ? 'upload-zone--active' : ''}`} onDragOver={(event) => { event.preventDefault(); setDragActive(true) }} onDragLeave={() => setDragActive(false)} onDrop={(event) => { event.preventDefault(); handleFiles(event.dataTransfer.files) }}><input type="file" accept="image/*" multiple onChange={(event) => handleFiles(event.target.files)} /><span className="upload-cloud"><UploadCloud size={28} /></span><strong>Arraste imagens para aqui</strong><span>ou clique para seleccionar ficheiros · PNG, JPG, WebP até 10 MB</span><Button type="button" variant="outline" size="sm"><FolderOpen size={14} /> Seleccionar ficheiros</Button></label>{media.length === 0 && <div className="admin-empty-state"><FileImage size={48} /><h3>Nenhuma mídia ainda</h3><p>Faça upload da primeira imagem para começar a galeria.</p></div>}<div className="media-preview-grid">{media.map((item) => <MediaTile key={item.id} item={item} onDelete={handleMediaDelete} notify={notify} />)}</div></Card>}

        {activeSection === 'software' && <Card className="admin-panel admin-section-panel"><div className="admin-panel-head"><div><span className="admin-panel-kicker">CATÁLOGO DIGITAL</span><h2>Softwares & downloads</h2></div><Button size="sm" onClick={() => setShowSoftwareForm(true)}><Plus size={15} /> Adicionar software</Button></div>{visibleSoftware.length === 0 ? <div className="admin-empty-state"><Package size={48} /><h3>Nenhum software cadastrado</h3><p>Adicione o primeiro software ao catálogo para começar.</p><Button size="lg" onClick={() => setShowSoftwareForm(true)}><Plus size={16} /> Adicionar software</Button></div> : <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Software</th><th>Versão</th><th>Tamanho</th><th>Downloads</th><th>Actualizado</th><th /></tr></thead><tbody>{visibleSoftware.map((item) => <tr key={item.id}><td><span className="software-symbol"><Package size={15} /></span><strong>{item.name}</strong></td><td><span className="version-pill">{item.version}</span></td><td>{item.file_size}</td><td>{item.downloads_count}</td><td>{item.created_at}</td><td><button onClick={() => notify(`Acções de ${item.name}`)}><MoreHorizontal size={17} /></button></td></tr>)}</tbody></table></div>}</Card>}

        {activeSection === 'settings' && <div className="settings-grid"><Card className="admin-panel settings-card"><div className="admin-panel-head"><div><span className="admin-panel-kicker">CONTA</span><h2>Definições do administrador</h2></div></div><p>Configure os dados da equipa, notificações e permissões de acesso ao painel CFTEC.</p><div className="settings-profile"><Avatar className="admin-avatar-large"><AvatarFallback>AM</AvatarFallback></Avatar><div className="settings-profile-info"><strong>Admin CFTEC</strong><small>admin@cftec.co</small></div><Button variant="outline" size="sm" onClick={() => notify('Edição de perfil preparada.')}>Editar perfil</Button></div></Card><Card className="admin-panel settings-card"><div className="admin-panel-head"><div><span className="admin-panel-kicker">SEGURANÇA</span><h2>Protecção do workspace</h2></div></div><p>A base de dados e as credenciais ficam isoladas no ambiente de servidor.</p><div className="security-list"><div className="security-item"><ShieldCheck size={18} /><div><span>Autenticação de administrador</span><small>Protegida por JWT + HttpOnly cookie</small></div><Button variant="outline" size="sm">Configurar</Button></div><div className="security-item"><Database size={18} /><div><span>Base de dados gerida</span><small>Conexão activa e monitorizada</small></div><span className="security-badge security-badge--ok">Ligada</span></div></div></Card></div>}
      </main>
    </div>

    {showSoftwareForm && (
    <SoftwareModal
      isOpen={showSoftwareForm}
      onClose={() => setShowSoftwareForm(false)}
      onSubmit={handleSoftwareSubmit}
    />
  )}

    {showServiceForm !== false && <div className="admin-modal-backdrop" onMouseDown={() => setShowServiceForm(false)}><div className="admin-modal" onMouseDown={(event) => event.stopPropagation()}><div className="admin-modal-head"><div><span className="admin-panel-kicker">NOVO REGISTO</span><h2>{showServiceForm ? 'Editar serviço' : 'Novo serviço'}</h2></div><button onClick={() => setShowServiceForm(false)}><X size={18} /></button></div><form onSubmit={(e) => handleServiceSubmit(e, showServiceForm)}><div className="admin-form-grid"><label>Título<input name="title" placeholder="Ex.: Desenvolvimento à medida" defaultValue={showServiceForm?.title || ''} required /></label><label>Slug (URL)<input name="slug" placeholder="Gerado automaticamente" defaultValue={showServiceForm?.slug || ''} disabled /></label><label>Ícone<select name="icon" defaultValue={showServiceForm?.icon || 'Code2'}>{Object.keys(serviceIcons).map((key) => <option key={key} value={key}>{key}</option>)}</select></label><label className="checkbox-label"><input type="checkbox" name="is_active" defaultChecked={showServiceForm?.is_active !== false} /> Activo no site público</label></div><label>Descrição curta<input name="short_description" placeholder="Descrição breve para listagens" defaultValue={showServiceForm?.short_description || ''} required /></label><label>Descrição completa<textarea name="full_description" rows={4} placeholder="Descrição detalhada para a página do serviço" defaultValue={showServiceForm?.full_description || ''} /></label><div className="admin-modal-actions"><Button variant="outline" type="button" onClick={() => setShowServiceForm(false)}>Cancelar</Button><Button type="submit"><Check size={15} /> {showServiceForm ? 'Actualizar serviço' : 'Criar serviço'}</Button></div></form></div></div>}

    {deletingServiceId && <div className="admin-modal-backdrop" onMouseDown={() => setDeletingServiceId(null)}><div className="admin-modal admin-modal--confirm" onMouseDown={(event) => event.stopPropagation()}><div className="admin-modal-head"><div><span className="admin-panel-kicker">CONFIRMAÇÃO</span><h2>Eliminar serviço</h2></div><button onClick={() => setDeletingServiceId(null)}><X size={18} /></button></div><p>Tem a certeza que quer eliminar este serviço? Esta acção não pode ser desfeita.</p><div className="admin-modal-actions"><Button variant="outline" onClick={() => setDeletingServiceId(null)}>Cancelar</Button><Button variant="dark" onClick={handleServiceDelete}><Trash2 size={15} /> Eliminar permanentemente</Button></div></div></div>}
  </div>
}
