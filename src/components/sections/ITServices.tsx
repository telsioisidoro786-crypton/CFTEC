import {
  Shield,
  HardDrive,
  Monitor,
  Wifi,
  Globe,
  Settings,
  Cpu,
  MousePointer,
  Network,
  Server,
  Smartphone,
  Layers,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Zap,
  ShieldCheck,
  Database,
} from 'lucide-react'
import { Card, CardContent } from '../ui/card'
import { Button } from '../ui/button'

type LucideIcon = React.ComponentType<{ size?: number; className?: string; 'aria-hidden'?: string }>

interface ITService {
  id: string
  title: string
  shortDescription: string
  longDescription: string
  icon: LucideIcon
  features: string[]
  subServices: { name: string; description: string }[]
  certifications: string[]
  accentColor: 'cyan' | 'blue' | 'violet' | 'emerald' | 'amber'
  ctaText: string
  ctaHref: string
}

const itServices: Array<ITService & { icon: typeof import('lucide-react').Shield }> = [
  {
    id: 'electronic-security',
    title: 'Segurança Eletrónica',
    shortDescription: 'Instalação e configuração de sistemas CCTV, controle de acesso e porteiros eletrónicos com monitoramento remoto.',
    longDescription: 'Proteja o seu património com soluções de videovigilância IP/Analógica, controle de acesso biométrico/cartão, porteiros de vídeo IP e alarmes inteligentes. Projetamos, instalamos, configuramos e damos suporte contínuo.',
    icon: Shield as any,
    features: [
      'Câmeras IP 4K/8MP com IA (detecção de pessoas, veículos, perímetro)',
      'NVRs/DVRs com armazenamento redundante (RAID) e cloud backup',
      'Controle de acesso: biometria, RFID, facial, QR code',
      'Porteiros eletrónicos IP com app móvel (abertura remota)',
      'Alarmes monitorados 24/7 com central de alarme própria',
      'Integração com automação predial e IoT',
      'Projetos conforme normas ABNT/ONVIF/GDPR',
      'Manutenção preventiva trimestral e corretiva 4h SLA',
    ],
    subServices: [
      { name: 'CFTV IP & Analógico', description: 'Design, cablagem, configuração de VMS, analytics de vídeo' },
      { name: 'Controle de Acesso', description: 'Catracas, controladoras, leitores, integração com RH/folha' },
      { name: 'Porteiro Eletrónico/Vídeo', description: 'Módulos internos/externos, app iOS/Android, logs de acesso' },
      { name: 'Alarme & Monitoramento', description: 'Sensores, sirenes, central receptora, app de gestão' },
      { name: 'Manutenção & Suporte', description: 'Contratos SLA, limpeza de lentes, firmware, troca de HDDs' },
    ],
    certifications: ['Instalador Certificado Hikvision', 'Parceiro Dahua', 'Normas ONVIF', 'LGPD Ready'],
    accentColor: 'cyan',
    ctaText: 'Solicitar Orçamento',
    ctaHref: '#contacto?interest=Segurança+Eletrónica',
  },
  {
    id: 'technical-support-hardware',
    title: 'Assistência Técnica & Hardware',
    shortDescription: 'Manutenção preventiva/corretiva, gestão de ativos, venda e locação de equipamentos com garantia estendida.',
    longDescription: 'Mantemos a sua operação a rodar. Suporte remoto e presencial para estações de trabalho, servidores, impressoras, rede e periféricos. Fornecimento de hardware corporativo (Dell, HP, Lenovo, ASUS) com imagem corporativa pré-carregada.',
    icon: HardDrive as any,
    features: [
      'Helpdesk N1/N2/N3 com SLA contratual (remoto + presencial)',
      'Manutenção preventiva: limpeza, thermal paste, SMART, firmware',
      'Gestão de ciclo de vida: inventário, depreciação, refresh plan',
      'Venda de workstations, notebooks, servidores, thin clients',
      'Locação operacional (Haas) com troca garantida em 24h',
      'Imagem corporativa (Golden Image) + automação MDM/Intune',
      'Recuperação de dados (lógico/físico) em laboratório próprio',
      'Descarte ecológico certificado (certificado de destruição)',
    ],
    subServices: [
      { name: 'Helpdesk & Service Desk', description: 'Central de atendimento, portal de chamados, base de conhecimento' },
      { name: 'Field Services', description: 'Técnicos no local, SLA 4h/8h/NBD, cobertura nacional' },
      { name: 'Venda & Locação Hardware', description: 'Workstations, notebooks, servidores, monitores, acessórios' },
      { name: 'Gestão de Ativos (ITAM)', description: 'CMDB, ciclo de vida, compliance de software, auditoria' },
      { name: 'Recuperação de Dados', description: 'HDD, SSD, RAID, ransomware, laboratório classe 100' },
    ],
    certifications: ['Dell Partner', 'HP Partner', 'Lenovo Partner', 'ISO 9001', 'ISO 27001'],
    accentColor: 'blue',
    ctaText: 'Contratar Suporte',
    ctaHref: '#contacto?interest=Assistência+Técnica',
  },
  {
    id: 'os-networks',
    title: 'Sistemas Operativos & Redes',
    shortDescription: 'Instalação, hardening, migração e suporte avançado para Windows Server, Linux, Active Directory, Azure AD, redes LAN/WAN/SD-WAN.',
    longDescription: 'A espinha dorsal da sua infraestrutura. Da configuração de domínio à migração para cloud híbrida, passando por hardening de segurança, PKI, VPN, firewall, balanceamento de carga e monitoramento proativo.',
    icon: Network as any,
    features: [
      'Active Directory / Entra ID: design, migração, hardening, Tier 0',
      'Windows Server: clustering, Hyper-V, failover, patch management',
      'Linux (Ubuntu/RHEL/Debian): hardening CIS, SELinux, automação Ansible',
      'Redes: VLAN, routing, switching, Wi-Fi 6/6E, SD-WAN (FortiGate, MikroTik, Ubiquiti)',
      'Firewall UTM/Next-Gen: políticas, IPS/IDS, SSL inspection, relatórios',
      'VPN: Site-to-Site, Client (WireGuard, OpenVPN, FortiClient), MFA',
      'Monitoramento: Zabbix/Prometheus/Grafana, alertas, capacity planning',
      'Disaster Recovery: backup Veeam, replicação, testes de restore trimestrais',
    ],
    subServices: [
      { name: 'Active Directory & Identidade', description: 'AD on-prem, Azure AD Connect, Conditional Access, PIM' },
      { name: 'Infraestrutura Server', description: 'Windows/Linux, virtualização, containers, Kubernetes' },
      { name: 'Networking & Segurança', description: 'LAN/WAN, Wi-Fi corporativo, firewall, VPN, SD-WAN' },
      { name: 'Cloud Híbrido & Migração', description: 'Azure, AWS, on-prem → cloud, lift-and-shift, refactor' },
      { name: 'Monitoramento & Backup', description: 'Observabilidade, DR, testes de continuidade' },
    ],
    certifications: ['Microsoft Solutions Partner', 'Fortinet NSE', 'MikroTik MTCNA/MTCTCE', 'Linux LPI', 'AWS/Azure Certs'],
    accentColor: 'violet',
    ctaText: 'Avaliar Infraestrutura',
    ctaHref: '#contacto?interest=Infraestrutura+Redes',
  },
  {
    id: 'digital-presence',
    title: 'Presença Digital & Web',
    shortDescription: 'Criação de sites institucionais, e-commerce, portais, landing pages de alta conversão — performance, SEO técnico e acessibilidade.',
    longDescription: 'A sua vitrina digital. Desenvolvemos experiências web modernas, rápidas (Core Web Vitals), acessíveis (WCAG 2.1 AA) e preparadas para conversão. Do site institucional ao e-commerce complexo, com CMS headless, PWA e integração ERP/CRM.',
    icon: Globe as any,
    features: [
      'Sites institucionais: Next.js, Astro, WordPress Headless, Strapi',
      'E-commerce: Shopify Plus, WooCommerce, Medusa, custom (React/Node)',
      'Portais & Áreas de cliente: React/Next.js, autenticação, dashboards',
      'Landing Pages de conversão: A/B testing, heatmaps, CRO',
      'SEO Técnico: Core Web Vitals, schema.org, sitemaps, hreflang',
      'Acessibilidade: WCAG 2.1 AA, auditoria, VPAT, conformidade legal',
      'Performance: CDN global, edge functions, image optimization, ISR/SSG',
      'Integrações: ERP (PalancaSoft/Negomil), CRM, WhatsApp API, pagamentos',
    ],
    subServices: [
      { name: 'Desenvolvimento Web Custom', description: 'Next.js, React, TypeScript, Tailwind, testes, CI/CD' },
      { name: 'E-commerce & Marketplaces', description: 'B2B/B2C, multi-moeda, integração logística/pagamentos' },
      { name: 'Portais & Extranets', description: 'Área cliente, fornecedor, colaborador, SSO, RBAC' },
      { name: 'SEO & Performance', description: 'Auditoria técnica, Core Web Vitals, migração SEO-safe' },
      { name: 'Manutenção & Evolução', description: 'SLA de atualizações, segurança, conteúdo, features' },
    ],
    certifications: ['Google Partners', 'Next.js Vercel Certified', 'WCAG 2.1 AA', 'Core Web Vitals Expert'],
    accentColor: 'emerald',
    ctaText: 'Criar Presença Digital',
    ctaHref: '#contacto?interest=Presença+Digital',
  },
]

function ServiceCard({ service }: { service: ITService }) {
  const Icon = service.icon
  const accentColors = {
    cyan: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', text: 'text-cyan-400', badge: 'bg-cyan-500/20 text-cyan-300', hover: 'hover:border-cyan-500/40 hover:shadow-cyan-500/10', button: 'cyan' as const, outline: 'outline' as const },
    blue: { bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-400', badge: 'bg-blue-500/20 text-blue-300', hover: 'hover:border-blue-500/40 hover:shadow-blue-500/10', button: 'default' as const, outline: 'outline' as const },
    violet: { bg: 'bg-violet-500/10', border: 'border-violet-500/20', text: 'text-violet-400', badge: 'bg-violet-500/20 text-violet-300', hover: 'hover:border-violet-500/40 hover:shadow-violet-500/10', button: 'default' as const, outline: 'outline' as const },
    emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400', badge: 'bg-emerald-500/20 text-emerald-300', hover: 'hover:border-emerald-500/40 hover:shadow-emerald-500/10', button: 'default' as const, outline: 'outline' as const },
    amber: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400', badge: 'bg-amber-500/20 text-amber-300', hover: 'hover:border-amber-500/40 hover:shadow-amber-500/10', button: 'default' as const, outline: 'outline' as const },
  }
  const colors = accentColors[service.accentColor]

  return (
    <Card className={`relative overflow-hidden ${colors.bg} ${colors.border} ${colors.hover} transition-all duration-300 h-full flex flex-col`}>
      <CardContent className="p-6 lg:p-7 space-y-5 flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${colors.badge}`}>
            <Icon size={24} className={colors.text} aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-xl lg:text-2xl font-heading font-bold tracking-tight text-foreground">
              {service.title}
            </h3>
            <p className="text-muted-foreground mt-1.5 text-base leading-relaxed line-clamp-2">
              {service.shortDescription}
            </p>
          </div>
        </div>

        {/* Features Preview */}
        <ul className="space-y-2.5 flex-1">
          {service.features.slice(0, 4).map((feature, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground">
              <CheckCircle2 size={14} className={`${colors.text} flex-shrink-0 mt-0.5`} />
              <span className="leading-relaxed">{feature}</span>
            </li>
          ))}
          {service.features.length > 4 && (
            <li className="flex items-center gap-2.5 text-sm">
              <span className={`${colors.text}`}>+</span>
              <span className="text-muted-foreground">Mais {service.features.length - 4} funcionalidades</span>
            </li>
          )}
        </ul>

        {/* Sub-services accordion */}
        <details className="group border-t border-border/50 pt-4">
          <summary className="flex items-center justify-between cursor-pointer list-none text-sm font-medium text-foreground">
            <span className="flex items-center gap-2">
              <Layers size={16} className={colors.text} />
              Sub-serviços ({service.subServices.length})
            </span>
            <ChevronDown size={16} className="text-muted-foreground transition-transform group-open:rotate-180" />
          </summary>
          <div className="mt-3 space-y-2">
            {service.subServices.map((sub, i) => (
              <div key={i} className="text-sm">
                <span className="font-medium text-foreground">{sub.name}</span>
                <span className="text-muted-foreground ml-2">— {sub.description}</span>
              </div>
            ))}
          </div>
        </details>

        {/* Certifications */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-border/50">
          {service.certifications.slice(0, 3).map((cert, i) => (
            <span key={i} className={`px-2.5 py-1 text-xs font-medium rounded-full border ${colors.badge} border-current`}>
              {cert}
            </span>
          ))}
          {service.certifications.length > 3 && (
            <span className="px-2.5 py-1 text-xs font-medium rounded-full border border-border text-muted-foreground">
              +{service.certifications.length - 3} mais
            </span>
          )}
        </div>

        {/* CTA */}
        <Button variant={colors.button} className="w-full mt-auto" asChild>
          <a href={service.ctaHref}>{service.ctaText} <ArrowRight size={14} /></a>
        </Button>
      </CardContent>
    </Card>
  )
}

// ChevronDown component
function ChevronDown({ size = 16, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

export function ITServicesSection() {
  return (
    <section id="servicos-ti-infraestrutura" className="section py-24 lg:py-32 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 lg:mb-20 reveal">
          <span className="section-kicker inline-block mb-4">04 / Infraestrutura & Suporte</span>
          <h2 className="text-3xl lg:text-4xl xl:text-5xl font-heading font-bold tracking-tight text-foreground mb-6">
            Serviços de TI que <span className="text-cyan-400">sustentam</span> a sua operação
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Da segurança física à cloud, do helpdesk ao hardware — uma equipa única 
            responsável por manter a sua tecnologia disponível, segura e atualizada.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 reveal">
          {itServices.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>

        {/* Differentials Strip */}
        <div className="mt-20 lg:mt-24 reveal">
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: ShieldCheck as any,
                title: 'SLA Contratual',
                desc: 'Tempos de resposta e resolução definidos por escrito, com penalidades e relatórios mensais.',
                color: 'cyan',
              },
              {
                icon: Zap as any,
                title: 'Proativo, não Reativo',
                desc: 'Monitoramento 24/7, patch management automático, capacity planning — evitamos incidentes antes que aconteçam.',
                color: 'blue',
              },
              {
                icon: Database as any,
                title: 'Documentação Viva',
                desc: 'CMDB atualizada, runbooks, diagramas de rede, inventário de ativos — tudo versionado e acessível ao cliente.',
                color: 'emerald',
              },
            ].map((diff, i) => (
              <Card key={i} className="p-6 border-border/50 hover:border-cyan-500/30 transition-colors">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 bg-${diff.color}-500/10 text-${diff.color}-400`}>
                  <diff.icon size={22} />
                </div>
                <h4 className="text-lg font-heading font-semibold text-foreground mb-2">{diff.title}</h4>
                <p className="text-muted-foreground text-sm leading-relaxed">{diff.desc}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA Banner */}
        <div className="mt-16 p-8 lg:p-12 rounded-2xl bg-gradient-to-br from-cyan-500/10 via-background to-blue-500/10 border border-cyan-500/20">
          <div className="max-w-4xl mx-auto text-center">
            <h4 className="text-2xl lg:text-3xl font-heading font-bold text-foreground mb-4">
              Precisa de uma auditoria à sua infraestrutura atual?
            </h4>
            <p className="text-muted-foreground mb-6 text-lg max-w-2xl mx-auto">
              Realizamos assessment completo (rede, servidores, segurança, backup, licenciamento) 
              com relatório executivo, matriz de riscos e roadmap de melhorias priorizado.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button variant="cyan" size="lg" asChild>
                <a href="#contacto?interest=Auditoria+TI">Solicitar Assessment Gratuito <ArrowRight size={16} /></a>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <a href="#contacto?interest=Suporte+Gerido">Contratar Suporte Gerido</a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}