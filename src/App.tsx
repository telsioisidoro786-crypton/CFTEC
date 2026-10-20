import { FormEvent, useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import anime from 'animejs'
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  Code2,
  Cpu,
  Database,
  DollarSign,
  Download,
  FileText,
  Globe2,
  Headphones,
  Layers3,
  Linkedin,
  LockKeyhole,
  Mail,
  MapPin,
  Menu,
  MessageCircle,
  Network,
  Package,
  PanelTop,
  Phone,
  Play,
  Quote,
  Send,
  Server,
  ShieldCheck,
  Sparkles,
  Twitter,
  User,
  UsersRound,
  Wrench,
  X,
  Zap,
} from 'lucide-react'
import { Button } from './components/ui/button'
import { Card } from './components/ui/card'
import OrderModal from './components/OrderModal'
import SupportModal from './components/SupportModal'
import BlogSection, { parseBlogContent, type BlogFull } from './components/BlogSection'
import NewsSlider from './components/NewsSlider'

// Fallback data for when API is unavailable
const fallbackServices = [
  { id: '1', title: 'Desenvolvimento à medida', slug: 'desenvolvimento-a-medida', short_description: 'Aplicações web robustas para a realidade da sua equipa.', full_description: 'Produtos digitais pensados para os processos e objectivos específicos do seu negócio.', icon: 'Code2', is_active: true, created_at: '2025-01-15' },
  { id: '2', title: 'Cloud & conectividade', slug: 'cloud-conectividade', short_description: 'Arquitecturas seguras, escaláveis e sob controlo.', full_description: 'Infraestrutura preparada para manter os seus dados disponíveis e a sua operação em movimento.', icon: 'Network', is_active: true, created_at: '2025-02-20' },
  { id: '3', title: 'Dados & automação', slug: 'dados-automacao', short_description: 'Informação accionável para decidir com confiança.', full_description: 'Dashboards, integrações e automações que reduzem ruído e desbloqueiam performance.', icon: 'BarChart3', is_active: true, created_at: '2025-03-10' },
  { id: '4', title: 'Suporte especializado', slug: 'suporte-especializado', short_description: 'Uma equipa técnica próxima para manter tudo a avançar.', full_description: 'Acompanhamento contínuo, resolução rápida e evolução sustentada da sua tecnologia.', icon: 'Headphones', is_active: true, created_at: '2025-04-05' },
]

const fallbackProducts: SiteProduct[] = [
  { id: '1', name: 'CFTEC Flow', version: 'v2.4', file_size: '45 MB', downloads_count: 183, created_at: '2025-10-12', description: 'O centro de comando para pedidos, equipas e tarefas que não podem ficar para trás.', price: 0 },
  { id: '2', name: 'CFTEC Insight', version: 'v1.8', file_size: '32 MB', downloads_count: 97, created_at: '2025-10-07', description: 'Dashboards que transformam a complexidade dos seus dados em próximos passos claros.', price: 0 },
  { id: '3', name: 'CFTEC Desk', version: 'v3.1', file_size: '58 MB', downloads_count: 246, created_at: '2025-09-27', description: 'Uma experiência simples para organizar suporte, pedidos e relações com clientes.', price: 0 },
]

// Icon mapping for services
type SiteProduct = { id: string; name: string; version: string; file_size: string; downloads_count: number; created_at: string; description?: string | null; price?: number | null; category?: string | null; file_url?: string | null; changelog?: string | null }

const serviceIcons: Record<string, typeof Code2> = {
  Code2,
  Network,
  Server,
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
  Package,
  DollarSign,
}

function getServiceIcon(iconName: string) {
  const Icon = serviceIcons[iconName] || serviceIcons['Code2']
  return Icon
}

const pillars = [
  { icon: Zap, title: 'Pragmáticos', text: 'Tecnologia que resolve primeiro, impressiona depois.' },
  { icon: UsersRound, title: 'Próximos', text: 'Falamos claro e trabalhamos lado a lado.' },
  { icon: ShieldCheck, title: 'Confiáveis', text: 'Segurança, transparência e consistência em cada entrega.' },
]

function BrandMark({ inverse = false }: { inverse?: boolean }) {
  return (
    <a href="#inicio" className={`brand ${inverse ? 'brand--inverse' : ''}`} aria-label="CFTEC — página inicial">
      <span className="brand-mark" aria-hidden="true"><span /><span /><span /></span>
      <span className="brand-word">CFTEC</span>
    </a>
  )
}

function HeroScene() {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    let cleanup: (() => void) | null = null
    try {
      cleanup = setupHeroScene(mount)
    } catch {
      // WebGL indisponível (ex.: GPU desactivada, RDP, sandbox) — fundo estático sem quebrar a app
      mount.classList.add('hero-scene--static')
    }
    return () => { if (cleanup) cleanup() }
  }, [])

  return <div className="hero-scene" ref={mountRef} aria-label="Visualização 3D de uma rede tecnológica em movimento" role="img" />
}

function setupHeroScene(mount: HTMLDivElement) {
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100)
  camera.position.set(0, 0.2, 7.5)

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(mount.clientWidth, mount.clientHeight)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  mount.appendChild(renderer.domElement)

  const group = new THREE.Group()
  scene.add(group)

  const core = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.25, 2),
    new THREE.MeshBasicMaterial({ color: 0x00e5ff, wireframe: true, transparent: true, opacity: 0.72 }),
  )
  const inner = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.82, 1),
    new THREE.MeshBasicMaterial({ color: 0x1e3a8a, transparent: true, opacity: 0.45, wireframe: true }),
  )
  group.add(core, inner)

  const rings = [1.7, 2.05, 2.42].map((radius, index) => {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(radius, index === 1 ? 0.012 : 0.018, 12, 120),
      new THREE.MeshBasicMaterial({ color: index === 1 ? 0x3b82f6 : 0x00e5ff, transparent: true, opacity: index === 1 ? 0.55 : 0.32 }),
    )
    ring.rotation.set(index * 0.62, index * 0.8, index * 0.3)
    group.add(ring)
    return ring
  })

  const points = new THREE.BufferGeometry()
  const pointPositions = new Float32Array(220 * 3)
  for (let i = 0; i < pointPositions.length; i += 3) {
    pointPositions[i] = (Math.random() - 0.5) * 7
    pointPositions[i + 1] = (Math.random() - 0.5) * 5
    pointPositions[i + 2] = (Math.random() - 0.5) * 4
  }
  points.setAttribute('position', new THREE.BufferAttribute(pointPositions, 3))
  const particleField = new THREE.Points(points, new THREE.PointsMaterial({ color: 0x7dd3fc, size: 0.018, transparent: true, opacity: 0.72 }))
  scene.add(particleField)

  const onPointerMove = (event: PointerEvent) => {
    const rect = mount.getBoundingClientRect()
    const x = (event.clientX - rect.left) / rect.width - 0.5
    const y = (event.clientY - rect.top) / rect.height - 0.5
    gsap.to(group.rotation, { x: y * 0.35, y: x * 0.45, duration: 1.2, ease: 'power3.out' })
  }
  mount.addEventListener('pointermove', onPointerMove)

  let frame = 0
  const animateScene = () => {
    frame = requestAnimationFrame(animateScene)
    core.rotation.x += 0.002
    core.rotation.y -= 0.003
    inner.rotation.x -= 0.001
    inner.rotation.y += 0.002
    rings.forEach((ring, index) => {
      ring.rotation.z += 0.0012 * (index + 1)
      ring.rotation.x += 0.0005 * (index + 1)
    })
    particleField.rotation.y += 0.0003
    renderer.render(scene, camera)
  }
  animateScene()

  const onResize = () => {
    camera.aspect = mount.clientWidth / mount.clientHeight
    camera.updateProjectionMatrix()
    renderer.setSize(mount.clientWidth, mount.clientHeight)
  }
  window.addEventListener('resize', onResize)

  return () => {
    cancelAnimationFrame(frame)
    window.removeEventListener('resize', onResize)
    mount.removeEventListener('pointermove', onPointerMove)
    renderer.dispose()
    mount.removeChild(renderer.domElement)
  }
}

function App() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [formSent, setFormSent] = useState(false)
  const [toast, setToast] = useState('')
  const [servicesData, setServicesData] = useState(fallbackServices)
  const [softwareData, setSoftwareData] = useState(fallbackProducts)
  const [contactOptions, setContactOptions] = useState<string[]>(['Pedido geral', 'Serviço à medida', 'CFTEC Flow', 'CFTEC Insight', 'CFTEC Desk'])
  const [loadingServices, setLoadingServices] = useState(true)
  const [loadingSoftware, setLoadingSoftware] = useState(true)
  const [banner, setBanner] = useState<{ active: boolean; message: string }>({ active: false, message: '' })
  // Configuração viva do painel admin → site (rodapé, contactos, redes)
  const SITE_DEFAULTS = { whatsapp: '+244 923 000 000', email: 'hello@cftec.co', linkedin: 'https://www.linkedin.com', x: 'https://x.com', whatsapp_tecnico: '' }
  const [siteCfg, setSiteCfg] = useState(SITE_DEFAULTS)
  const siteWhatsNumber = (siteCfg.whatsapp || SITE_DEFAULTS.whatsapp).replace(/[^\d]/g, '')
  const siteWhatsHREF = `https://wa.me/${siteWhatsNumber.startsWith('244') ? siteWhatsNumber : '244' + siteWhatsNumber}`
  // apoio técnico: número próprio (opcional) — cai no comercial quando vazio
  const tecnicoWhatsNumber = ((siteCfg as { whatsapp_tecnico?: string }).whatsapp_tecnico || '').replace(/[^\d]/g, '')
  const tecnicoWhatsHREF = `https://wa.me/${(tecnicoWhatsNumber || siteWhatsNumber).startsWith('244') ? (tecnicoWhatsNumber || siteWhatsNumber) : '244' + (tecnicoWhatsNumber || siteWhatsNumber)}?text=${encodeURIComponent('Olá equipa técnica CFTEC! Preciso de apoio com o software instalado (empresa N.º ___):')}`
  const siteTelHREF = `tel:${siteCfg.whatsapp.startsWith('+') ? siteCfg.whatsapp.replace(/\s/g, '') : '+244' + siteWhatsNumber}`
  const [partnerSent, setPartnerSent] = useState(false)
  const [showSupport, setShowSupport] = useState(false)
  const FAQ_TECNICA = [
    { q: 'A impressora térmica de recibos parou de imprimir talões — o que verifico primeiro?', a: 'Confirme o cabo USB e a alimentação; depois, no Windows (Painel de controlo → Dispositivos e impressoras), verifique se a térmica está definida como predefinida e sem trabalhos em fila. Reinicie o caixa. Se nada resolver, abra um chamado — enviemos o driver certo para o seu modelo.' },
    { q: 'Como configuro a impressora térmica de recibos no caixa?', a: 'Instale o driver do fabricante, defina o papel a 80 mm e active a impressão directa. O guia completo, passo a passo por modelo, está nos artigos do nosso blog da seção de softwares.' },
    { q: 'Aparece "porta COM ocupada" ao sincronizar dispositivos?', a: 'Significa que outro programa está a usar a porta serial. Feche as aplicações em fundo e reinicie o software; se o erro persistir, o suporte remapeia a porta do dispositivo em poucos minutos por acesso remoto.' },
    { q: 'Como sei qual é a versão do meu software instalado?', a: 'No ecrã inicial ou menu Ajuda do software aparece a versão (ex.: PalancaSoft ERP v2.5). Indique-a no chamado — acelera o diagnóstico e evita perguntas repetidas.' },
    { q: 'Perdi a proforma do pedido — consigo uma segunda via?', a: 'Sim. O comercial reemite a proforma em PDF com um número sequencial único, em segundos. Peça pelo WhatsApp de apoio técnico ou abra um chamado online indicando a empresa e (se souber) o número do pedido original.' },
    { q: 'Como guardo um backup antes de o suporte actuar?', a: 'Menu Ficheiro → Backup → Exportar cópia de segurança. Guarde o ficheiro num disco externo ou na sua nuvem. Nunca mova nem edite manualmente a pasta de dados do software.' },
  ]

  const fetchServices = async () => {
    try {
      const r = await fetch('/api/services')
      const data = await r.json()
      setServicesData(data.length ? data : fallbackServices)
    } catch {
      setServicesData(fallbackServices)
    } finally {
      setLoadingServices(false)
    }
  }

  const fetchSoftware = async () => {
    try {
      const r = await fetch('/api/software')
      const data = await r.json()
      setSoftwareData(data.length ? data : fallbackProducts)
    } catch {
      setSoftwareData(fallbackProducts)
    } finally {
      setLoadingSoftware(false)
    }
  }

  const refreshData = () => {
    fetchServices()
    fetchSoftware()
    fetch('/api/contact-options')
      .then(r => r.json())
      .then(data => { if (data.ok && data.options?.length) setContactOptions(data.options) })
      .catch(() => {})
    fetch('/api/settings', { cache: 'no-store' })
      .then(r => r.json())
      .then(data => {
        if (data.ok && data.settings) {
          setBanner({ active: String(data.settings.banner_activo) === 'true', message: data.settings.banner_mensagem || '' })
          const s = data.settings as Record<string, string>
          setSiteCfg({
            whatsapp: s.whatsapp_comercial || SITE_DEFAULTS.whatsapp,
            email: s.email_contacto || SITE_DEFAULTS.email,
            linkedin: s.linkedin_url || SITE_DEFAULTS.linkedin,
            x: s.x_url || SITE_DEFAULTS.x,
            whatsapp_tecnico: s.whatsapp_tecnico || '',
          })
        }
      })
      .catch(() => {})
  }

  useEffect(() => {
    refreshData()
  }, [])

  // Ouvir atualizações vindas do painel admin (ex: após criar/atualizar/deletar serviço)
  useEffect(() => {
    const handleRefresh = () => refreshData()
    window.addEventListener('cftec-refresh-data', handleRefresh)
    return () => window.removeEventListener('cftec-refresh-data', handleRefresh)
  }, [])

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)
    const reveals = document.querySelectorAll<HTMLElement>('.reveal')
    reveals.forEach((element) => {
      gsap.fromTo(element, { y: 34, opacity: 0 }, {
        y: 0,
        opacity: 1,
        duration: 0.85,
        ease: 'power3.out',
        scrollTrigger: { trigger: element, start: 'top 88%', once: true },
      })
    })

    const statObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return
        const el = entry.target as HTMLElement
        const target = Number(el.dataset.value || 0)
        const counter = { value: 0 }
        anime({
          targets: counter,
          value: target,
          duration: 1500,
          easing: 'easeOutExpo',
          update: () => { el.textContent = `${Math.floor(counter.value)}${el.dataset.suffix || ''}` },
        })
        observer.unobserve(el)
      })
    }, { threshold: 0.6 })
    document.querySelectorAll('.stat-number').forEach((el) => statObserver.observe(el))

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill())
      statObserver.disconnect()
    }
  }, [servicesData, softwareData])

  const closeMenu = () => setMenuOpen(false)
  const showToast = (message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 3600)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const currentForm = event.currentTarget
    const data = new FormData(currentForm)
    const lead = Object.fromEntries(data.entries())
    let persisted = false
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lead),
      })
      if (!response.ok) throw new Error('contact-api-unavailable')
      persisted = true
    } catch {
      localStorage.setItem('cftec-last-contact', JSON.stringify({ ...lead, createdAt: new Date().toISOString() }))
    }
    setFormSent(true)
    showToast(persisted ? 'Recebemos a sua mensagem. A equipa CFTEC entra em contacto em breve.' : 'Guardámos o seu pedido neste dispositivo. A equipa CFTEC entra em contacto em breve.')
    currentForm.reset()
  }

  const [orderProduct, setOrderProduct] = useState<SiteProduct | null>(null)
  const [blogPost, setBlogPost] = useState<BlogFull | null>(null)
  const [blogLoading, setBlogLoading] = useState(false)

  useEffect(() => {
    if (!blogPost) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setBlogPost(null) }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [blogPost])

  const openBlogPost = async (card: BlogFull) => {
    setBlogLoading(true)
    try {
      const response = await fetch(`/api/blog/${card.slug}`, { cache: 'no-store' })
      const body = await response.json().catch(() => ({}))
      setBlogPost(response.ok && body.post ? body.post : { ...card, content: '' })
    } catch {
      setBlogPost({ ...card, content: '' })
    } finally {
      setBlogLoading(false)
    }
  }

  const handleDownload = async (product: SiteProduct) => {
    try {
      const r = await fetch(`/api/software/${product.id}/download`, { method: 'POST' })
      if (!r.ok) throw new Error()
      const data = await r.json()
      if (data.download_url) window.open(data.download_url, '_blank', 'noopener')
      showToast(`Transferência de ${product.name} registada. Boa instalação!`)
    } catch {
      showToast('O download não está disponível neste momento. Fale connosco.')
    }
  }

  const handlePartnerSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const currentForm = event.currentTarget
    const payload = Object.fromEntries(new FormData(currentForm).entries())
    try {
      const response = await fetch('/api/partners-apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(body.error || 'falha')
      currentForm.reset()
      setPartnerSent(true)
      showToast('Candidatura recebida. A equipa CFTEC entrará em contacto.')
      window.dispatchEvent(new CustomEvent('cftec-refresh-data'))
    } catch (error) {
      showToast(error instanceof Error && error.message !== 'falha' ? error.message : 'Não foi possível enviar a candidatura. Tente novamente.')
    }
  }

  return (
    <div className={`site-shell ${banner.active && banner.message ? 'site-shell--banner' : ''}`}>
      {toast && <div className="toast" role="status"><BadgeCheck size={18} />{toast}</div>}
      {orderProduct && <OrderModal product={orderProduct} onClose={() => setOrderProduct(null)} />}

      {showSupport && <SupportModal onClose={() => setShowSupport(false)} />}

      {blogPost && <div className="blog-modal-backdrop" onMouseDown={() => setBlogPost(null)}><article className="blog-modal" onMouseDown={(e) => e.stopPropagation()}>
        <button className="blog-modal-close" onClick={() => setBlogPost(null)} aria-label="Fechar artigo"><X size={20} /></button>
        {blogPost.cover_url && <div className="blog-modal-cover"><img src={blogPost.cover_url} alt={blogPost.title} /></div>}
        <div className="blog-modal-body">
          <span className="section-kicker"><FileText size={12} /> {blogPost.category || 'ARTIGO'}{blogLoading ? ' · A carregar…' : ''}</span>
          <h2>{blogPost.title}</h2>
          <div className="blog-modal-meta"><span><User size={13} /> {blogPost.author || 'Equipa CFTEC'}</span><span><CalendarDays size={13} /> {blogPost.published_at ? new Date(blogPost.published_at).toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' }) : ''}</span></div>
          <div className="blog-modal-content" dangerouslySetInnerHTML={{ __html: parseBlogContent(blogPost.content || blogPost.excerpt) }} />
          <div className="blog-modal-cta">
            <p>Ficou com dúvidas sobre este tema?</p>
            <Button asChild><a href="#contacto" onClick={() => setBlogPost(null)}>Falar com a CFTEC <ArrowRight size={15} /></a></Button>
          </div>
        </div>
      </article></div>}
      {banner.active && banner.message && <div className="site-banner"><Sparkles size={14} /> {banner.message}</div>}

      <header className="site-header">
        <div className="container nav-wrap">
          <BrandMark />
          <nav className={`main-nav ${menuOpen ? 'main-nav--open' : ''}`} aria-label="Navegação principal">
            <a href="#inicio" onClick={closeMenu}>Início</a>
            <a href="#sobre" onClick={closeMenu}>Sobre nós</a>
            <a href="#servicos" onClick={closeMenu}>Serviços</a>
            <a href="#softwares" onClick={closeMenu}>Softwares</a>
            <a href="#blog" onClick={closeMenu}>Blog</a>
            <a href="#suporte" onClick={closeMenu}>Suporte</a>
            <a href="#parcerias" onClick={closeMenu}>Parcerias</a>
            <a href="#contacto" onClick={closeMenu}>Contacto</a>
          </nav>
          <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'} aria-expanded={menuOpen}>
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      <main>
        <section className="hero" id="inicio">
          <div className="hero-grid-lines" aria-hidden="true" />
          <div className="container hero-inner">
            <div className="hero-copy">
              <div className="eyebrow reveal"><span className="eyebrow-dot" /> Engenharia digital para negócios que avançam</div>
              <h1 className="hero-title reveal">Tecnologia que <span>simplifica.</span><br />Resultados que ficam.</h1>
              <p className="hero-lead reveal">A CFTEC aproxima estratégia, software e pessoas para transformar operações complexas em experiências simples e escaláveis.</p>
              <div className="hero-actions reveal">
                <Button size="lg" asChild><a href="#servicos">Conhecer serviços <ArrowRight size={17} /></a></Button>
                <Button variant="outline" size="lg" asChild><a href="#softwares"><Play size={15} fill="currentColor" /> Ver softwares</a></Button>
              </div>
              <div className="hero-meta reveal"><span><Check size={14} /> Feito para crescer consigo</span><span><Check size={14} /> Equipa técnica próxima</span></div>
            </div>
            <div className="hero-visual reveal">
              <div className="visual-orbit visual-orbit--one" />
              <div className="visual-orbit visual-orbit--two" />
              <HeroScene />
              <div className="signal-card signal-card--top"><span className="signal-pulse" /><div><small>SISTEMA ONLINE</small><strong>99.98%</strong></div></div>
              <div className="signal-card signal-card--bottom"><div className="mini-bars"><i /><i /><i /><i /><i /></div><div><small>PERFORMANCE</small><strong>+42.8%</strong></div><BarChart3 size={18} /></div>
              <div className="hero-chip"><Sparkles size={14} /> Inteligência aplicada</div>
            </div>
          </div>
          <div className="container hero-foot"><span>EXPERIÊNCIA DIGITAL / 2024—25</span><span className="scroll-cue"><span /> Deslize para explorar</span></div>
        </section>

        <section className="trust-strip">
          <div className="container trust-inner"><span className="trust-label">A tecnologia por detrás de equipas mais confiantes</span><div className="trust-logos"><span>norte<span className="logo-dot">.</span>lab</span><span>ORBITAL</span><span>atlas /</span><span>kairo</span><span>+ outros</span></div></div>
        </section>

        <NewsSlider />

        <section className="section section-about" id="sobre">
          <div className="container">
            <div className="section-heading split-heading reveal"><div><span className="section-kicker">01 / Sobre nós</span><h2>Menos ruído.<br /><em>Mais movimento.</em></h2></div><p>Somos uma equipa de produto e tecnologia que acredita que a melhor solução é aquela que as pessoas adoptam sem precisar de um manual.</p></div>
            <div className="about-layout">
              <div className="about-statement reveal"><Quote size={27} /><p>“Tecnologia não é o destino.<br /><strong>É o espaço que abre para o que vem a seguir.</strong>”</p><span>— Manifesto CFTEC</span></div>
              <div className="pillars-grid reveal">{pillars.map(({ icon: Icon, title, text }) => <div className="pillar" key={title}><div className="icon-box"><Icon size={19} /></div><h3>{title}</h3><p>{text}</p></div>)}</div>
            </div>
            <div className="stats-row reveal">
              <div className="stat"><strong className="stat-number" data-value="128" data-suffix="+">0</strong><span>Clientes atendidos</span></div>
              <div className="stat"><strong className="stat-number" data-value="246" data-suffix="+">0</strong><span>Projectos entregues</span></div>
              <div className="stat"><strong>24<span className="stat-accent">/</span>7</strong><span>Suporte que acompanha</span></div>
              <div className="stat stat--note"><ShieldCheck size={20} /><span>Segurança e proximidade<br />em cada decisão.</span></div>
            </div>
          </div>
        </section>

        <section className="section section-services" id="servicos">
          <div className="container">
            <div className="section-heading reveal"><span className="section-kicker">02 / O que fazemos</span><h2>Uma equipa.<br /><em>Várias formas de avançar.</em></h2></div>
            <div className="service-grid">
              {servicesData.map((service, index) => {
                const Icon = getServiceIcon(service.icon)
                const accents = ['blue', 'cyan', 'violet', 'lime']
                const accent = accents[index % accents.length]
                const eyebrow = `${String(index + 1).padStart(2, '0')} / ${['Produto', 'Infraestrutura', 'Performance', 'Continuidade'][index] || 'Serviço'}`
                return (
                  <Card className={`service-card reveal service-card--${accent}`} key={service.id}>
                    <div className="service-top">
                      <div className="service-icon"><Icon size={21} /></div>
                      <span>{eyebrow}</span>
                    </div>
                    <h3>{service.title}</h3>
                    <p>{service.short_description}</p>
                    <a href="#contacto" className="text-link">Saber mais <ChevronRight size={15} /></a>
                  </Card>
                )
              })}
            </div>
          </div>
        </section>

        <section className="section section-products" id="softwares">
          <div className="container">
            <div className="section-heading split-heading reveal"><div><span className="section-kicker">03 / Vitrine digital</span><h2>Software que<br /><em>já fala consigo.</em></h2></div><p>Produtos prontos para acelerar o dia-a-dia da sua operação. Simples de começar, poderosos para escalar.</p></div>
            <div className="products-grid">
              {softwareData.map((product, index) => {
                const tones = ['dark', 'light', 'mid']
                const tone = tones[index % tones.length]
                const statuses = ['Mais vendido', 'Novo', 'Estável']
                const status = statuses[index % statuses.length]
                const features = product.description ? [product.description] : []
                const category = product.category || 'Solução CFTEC'
                return (
                  <Card className={`product-card product-card--${tone} reveal`} key={product.id}>
                    <div className="product-head">
                      <span className="product-code">CF / {product.name.toUpperCase().replace('CFTEC ', '').replace(' ', '_')}</span>
                      <span className="product-status"><span /> {status}</span>
                    </div>
                    <div className="product-illustration">
                      <div className="product-window">
                        <div className="window-bar"><span /><span /><span /></div>
                        <div className="window-body">
                          <div className="window-sidebar"><i /><i /><i /><i /></div>
                          <div className="window-content">
                            <div className="window-line window-line--long" />
                            <div className="window-line" />
                            <div className="window-chart"><i /><i /><i /><i /><i /><i /></div>
                          </div>
                        </div>
                      </div>
                      <span className="product-version">{product.version}</span>
                    </div>
                    <span className="product-category">{category}</span>
                    <h3>{product.name}</h3>
                    <p>{product.description || 'Descrição em actualização.'}</p>
                    {product.changelog && <small className="product-changelog">{product.changelog}</small>}
                    <ul>{features.map((feature, i) => <li key={i}><Check size={14} /> {feature}</li>)}</ul>
                    <div className="product-actions">
                      <button type="button" className="product-link product-buy" onClick={() => setOrderProduct(product)}>Adquirir Licença <ArrowRight size={15} /></button>
                      {product.file_url && <button type="button" className="product-link product-download product-link--secondary" onClick={() => handleDownload(product)}>Download directo <Download size={14} /></button>}
                    </div>
                  </Card>
                )
              })}
            </div>
          </div>
        </section>

        <section className="section section-partners" id="parcerias">
          <div className="container contact-layout">
            <div className="contact-copy reveal">
              <span className="section-kicker">04 / Revenda Negomil</span>
              <h2>Torne-se<br /><em>sub-parceiro AGT.</em></h2>
              <p>A CFTEC é revenda autorizada Negomil de software fiscal AGT em Angola. Credencia-se como sub-parceiro para instalar, dar suporte e facturar na sua região, com acompanhamento técnico da nossa equipa.</p>
              <div className="contact-details">
                <div><Check size={17} /><span><small>Modalidades</small>Individual · Profissional · Empresa</span></div>
                <div><Check size={17} /><span><small>Áreas de actuação</small>Todas as províncias de Angola</span></div>
                <div><Check size={17} /><span><small>Inclui</small>Formação, updates AGT e licenças</span></div>
              </div>
            </div>
            <Card className="contact-card reveal">
              {partnerSent ? <div className="form-success"><div className="success-icon"><BadgeCheck size={28} /></div><h3>Candidatura recebida.</h3><p>Muito obrigado pelo interesse na revenda Negomil. Um gestor de parcerias da CFTEC analisa o seu perfil e responde em breve.</p><Button variant="outline" onClick={() => setPartnerSent(false)}>Enviar outra candidatura</Button></div> : <form onSubmit={handlePartnerSubmit}><div className="form-heading"><div><span className="form-step">CREDENCIAMENTO</span><h3>Candidatura a sub-parceiro</h3></div><Network size={20} /></div><div className="form-row"><label>Nome do responsável<input name="nome_responsavel" placeholder="O seu nome completo" required maxLength={150} /></label><label>Telefone / WhatsApp<input name="telefone_whatsapp" placeholder="+244 900 000 000" required maxLength={40} /></label></div><div className="form-row"><label>Empresa / NIF (opcional)<input name="empresa_nif" placeholder="Nome da empresa ou NIF" maxLength={80} /></label><label>Província<input name="provincia" placeholder="Ex.: Luanda" maxLength={60} /></label></div><label>Modalidade<select name="modalidade" defaultValue="Individual" required><option value="Individual">Individual</option><option value="Profissional">Profissional</option><option value="Empresa">Empresa</option></select></label><label>Apresentação (opcional)<textarea name="nota" rows={3} placeholder="Experiência com software fiscal, rede de clientes, região de actuação..." /></label><div className="form-footer"><span><LockKeyhole size={13} /> Os seus dados estão seguros.</span><Button type="submit">Enviar candidatura <ArrowRight size={16} /></Button></div></form>}
            </Card>
          </div>
        </section>

        <section className="section section-support" id="suporte">
          <div className="container support-layout">
            <div className="contact-copy reveal">
              <span className="section-kicker">05 / Apoio técnico</span>
              <h2>Cliente activo?<br /><em>Estamos a um chamado.</em></h2>
              <p>A equipa técnica da CFTEC dá suporte aos softwares instalados — impressoras de talões, sincronização AGT, actualizações de versão e dúvidas do dia-a-dia. Escolha o canal mais rápido:</p>
              <div className="support-actions">
                <a className="support-wa" href={tecnicoWhatsHREF} target="_blank" rel="noreferrer noopener"><MessageCircle size={18} /><span><small>Apoio Técnico a Clientes</small>Falar no WhatsApp</span></a>
                <Button size="lg" onClick={() => setShowSupport(true)}><Wrench size={16} /> Abrir chamado online</Button>
              </div>
              <div className="contact-details">
                <div><Check size={17} /><span><small>Resposta</small>Pedidos triados por prioridade — "loja parada" é Crítica</span></div>
                <div><Check size={17} /><span><small>Histórico</small>Todo o chamado fica registado com o NIF da sua empresa</span></div>
                <div><Check size={17} /><span><small>Cobertura</small>Suporte remoto para todo o país de Angola</span></div>
              </div>
            </div>
            <Card className="contact-card reveal">
              <div className="form-heading"><div><span className="form-step">BASE DE CONHECIMENTO</span><h3>Resolvem rápido?</h3></div><Wrench size={20} /></div>
              <p style={{ margin: '0 0 14px', color: '#64748b', fontSize: '.72rem', lineHeight: 1.6 }}>Antes de abrir chamado, veja se a sua dúvida já tem resposta — a maioria dos casos demora segundos em resolver.</p>
              <div className="faq-list">{FAQ_TECNICA.map((item, i) => <details key={i} className="faq-item"><summary>{item.q}</summary><p>{item.a}</p></details>)}</div>
              <div className="form-footer" style={{ marginTop: 14 }}><span>Manual completo vem nos artigos do blog</span><Button size="sm" variant="outline" onClick={() => setShowSupport(true)}>Não resolveu? Abrir chamado <ArrowRight size={14} /></Button></div>
            </Card>
          </div>
        </section>

        <section className="section section-contact" id="contacto">
          <div className="container contact-layout">
            <div className="contact-copy reveal"><span className="section-kicker">06 / Vamos conversar</span><h2>O próximo passo<br /><em>começa aqui.</em></h2><p>Tem um desafio em mente ou quer perceber por onde começar? Conte-nos o contexto. Nós tratamos de encontrar o caminho mais claro.</p><div className="contact-details"><a href={`mailto:${siteCfg.email}`}><Mail size={17} /><span><small>Escreva-nos</small>{siteCfg.email}</span></a><a href={siteWhatsHREF} target="_blank" rel="noreferrer noopener"><Phone size={17} /><span><small>WhatsApp / Ligue-nos</small>{siteCfg.whatsapp}</span></a><div><MapPin size={17} /><span><small>Visite-nos</small>Luanda, Angola</span></div><div><Clock3 size={17} /><span><small>Horário</small>Seg — Sex, 08:00 — 17:00</span></div></div></div>
            <Card className="contact-card reveal"><div className="form-heading"><div><span className="form-step">COMECE POR AQUI</span><h3>Fale com a CFTEC</h3></div><Send size={20} /></div>{formSent ? <div className="form-success"><div className="success-icon"><BadgeCheck size={28} /></div><h3>Mensagem recebida.</h3><p>Obrigado por confiar na CFTEC. Em breve um especialista da nossa equipa entra em contacto consigo.</p><Button variant="outline" onClick={() => setFormSent(false)}>Enviar outra mensagem</Button></div> : <form onSubmit={handleSubmit}><div className="form-row"><label>Nome<input name="name" placeholder="O seu nome" required /></label><label>E-mail<input name="email" type="email" placeholder="nome@empresa.com" required /></label></div><div className="form-row"><label>Telefone<input name="phone" placeholder="+244 900 000 000" /></label><label>Interesse<select name="interest" defaultValue=""><option value="" disabled>Seleccione uma opção</option>{contactOptions.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}</select></label></div><label>Mensagem<textarea name="message" rows={4} placeholder="Conte-nos brevemente o que precisa de resolver..." required /></label><div className="form-footer"><span><LockKeyhole size={13} /> Os seus dados estão seguros.</span><Button type="submit">Enviar pedido <ArrowRight size={16} /></Button></div></form>}</Card>
          </div>
        </section>

        <BlogSection onOpen={openBlogPost} />
      </main>

      <footer className="site-footer"><div className="container footer-top"><div><BrandMark inverse /><p>Tecnologia que simplifica.<br />Resultados que ficam.</p></div><div className="footer-links"><div><span>Navegar</span><a href="#sobre">Sobre nós</a><a href="#servicos">Serviços</a><a href="#softwares">Softwares</a><a href="#blog">Blog</a><a href="#suporte">Suporte</a></div><div><span>Fale connosco</span><a href={`mailto:${siteCfg.email}`}>{siteCfg.email}</a><a href={siteWhatsHREF} target="_blank" rel="noreferrer noopener">{siteCfg.whatsapp}</a><a href="#contacto">Pedir contacto</a><a href={tecnicoWhatsHREF} target="_blank" rel="noreferrer noopener">Apoio técnico a clientes</a></div><div><span>Social</span><a href={siteCfg.linkedin} target="_blank" rel="noreferrer noopener"><Linkedin size={14} /> LinkedIn</a><a href={siteCfg.x} target="_blank" rel="noreferrer noopener"><Twitter size={14} /> Twitter / X</a></div></div></div><div className="container footer-bottom"><span>© 2025 CFTEC. Todos os direitos reservados.</span><div><a href={`mailto:${siteCfg.email}?subject=Política%20de%20Privacidade`}>Privacidade</a><a href={`mailto:${siteCfg.email}?subject=Termos%20de%20Utilização`}>Termos</a><span>Feito com intenção <Sparkles size={12} /></span></div></div></footer>
    </div>
  )
}

export default App
