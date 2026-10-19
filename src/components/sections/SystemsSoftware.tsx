import { useState } from 'react'
import {
  Database,
  Server,
  Code2,
  Globe2,
  Smartphone,
  Gamepad2,
  ArrowRight,
  CheckCircle2,
  Shield,
  FileText,
  Zap,
  Building2,
  Users,
  Download,
  ExternalLink,
  Star,
  Award,
} from 'lucide-react'
import { Button } from '../ui/button'
import { Card, CardContent } from '../ui/card'

type LucideIcon = React.ComponentType<{ size?: number; className?: string; 'aria-hidden'?: string }>

interface FlagshipProduct {
  id: string
  name: string
  tagline: string
  description: string
  longDescription: string
  highlights: string[]
  modules: string[]
  certifications: string[]
  ctaPrimary: { label: string; href: string }
  ctaSecondary: { label: string; href: string }
  accentColor: 'cyan' | 'emerald'
  icon: any
  stats: { label: string; value: string }[]
}

interface CustomDevService {
  id: string
  name: string
  description: string
  icon: any
  features: string[]
  techStack: string[]
}

const flagshipProducts: FlagshipProduct[] = [
  {
    id: 'palancasoft',
    name: 'PalancaSoft',
    tagline: 'O ERP Próprio da CFTEC',
    description: 'Sistema de gestão empresarial completo, desenvolvido em Angola, com faturação certificada AGT e conformidade fiscal total.',
    longDescription: 'PalancaSoft é a resposta da CFTEC à necessidade de um ERP robusto, local e totalmente adaptado à realidade fiscal e operacional angolana. Desde a faturação certificada até à gestão integrada de stocks, compras, vendas, tesouraria e recursos humanos — tudo numa única plataforma.',
    highlights: [
      'Faturação certificada AGT (SIGEF/SEFAZ)',
      'Desenvolvido 100% em Angola pela equipa CFTEC',
      'Gestão integrada: Vendas, Compras, Stocks, Tesouraria, RH',
      'Multi-empresa, multi-moeda, multi-armazém',
      'API aberta para integrações com e-commerce, banca, POS',
      'Relatórios de gestão em tempo real (BI integrado)',
      'Suporte técnico local em português',
      'Atualizações legislativas automáticas',
    ],
    modules: [
      'Faturação & POS Certificado',
      'Gestão de Stocks & Armazéns',
      'Compras & Fornecedores',
      'Contas a Receber / Pagar',
      'Tesouraria & Fluxo de Caixa',
      'Recursos Humanos & Processamento Salarial',
      'Ativos & Imobilizado',
      'Business Intelligence (Dashboards)',
      'Portal do Cliente & Fornecedor',
    ],
    certifications: ['Certificado AGT', 'Conforme Lei 13/20', 'ISO 27001 (em processo)'],
    ctaPrimary: { label: 'Solicitar Demonstração', href: '#contacto?interest=PalancaSoft' },
    ctaSecondary: { label: 'Ver Módulos Completos', href: '#modulos-palancasoft' },
    accentColor: 'cyan',
    icon: Database as any,
    stats: [
      { label: 'Empresas ativas', value: '240+' },
      { label: 'Documentos/mês', value: '1.2M+' },
      { label: 'Uptime garantido', value: '99.9%' },
      { label: 'Anos no mercado', value: '8+' },
    ],
  },
  {
    id: 'negomil',
    name: 'Negomil',
    tagline: 'Gestão Comercial & Fiscal — Revenda Oficial CFTEC',
    description: 'Como revendedores e distribuidores autorizados, entregamos o Negomil com implementação, formação e suporte técnico certificado pela CFTEC.',
    longDescription: 'O Negomil é a solução de referência para faturação e gestão comercial em Angola. A CFTEC é parceiro oficial de revenda e implementação, garantindo que cada cliente recebe não só o software, mas a configuração correta, formação da equipa e suporte contínuo para total conformidade fiscal.',
    highlights: [
      'Revenda autorizada e implementação certificada CFTEC',
      'Faturação certificada AGT / SIGEF',
      'Gestão comercial completa (vendas, stocks, clientes)',
      'Conformidade fiscal automática (IVA, IRS, Selos)',
      'Integração com balanças, POS, terminais de pagamento',
      'Versões: Standard, Professional, Enterprise',
      'Atualizações legais incluídas na anuidade',
      'Suporte prioritário via canal CFTEC',
    ],
    modules: [
      'Frente de Caixa (POS) Certificado',
      'Gestão de Vendas & Clientes',
      'Controlo de Stocks & Inventários',
      'Documentos de Transporte (GT/GR)',
      'Mapas Fiscais (IVA, Retenções)',
      'Integração Bancária & Multicaixa',
      'App Móvel para Equipas Comerciais',
      'Dashboard de Gestão Executiva',
    ],
    certifications: ['Software Certificado AGT', 'Parceiro Oficial Negomil', 'Suporte Nível 1 Certificado'],
    ctaPrimary: { label: 'Solicitar Demonstração', href: '#contacto?interest=Negomil' },
    ctaSecondary: { label: 'Ver Planos e Preços', href: '#planos-negomil' },
    accentColor: 'emerald',
    icon: Building2 as any,
    stats: [
      { label: 'Clientes implementados', value: '380+' },
      { label: 'Setores atendidos', value: '15+' },
      { label: 'Formações realizadas', value: '120+' },
      { label: 'Anos de parceria', value: '5+' },
    ],
  },
]

const customDevServices: CustomDevService[] = [
  {
    id: 'web-systems',
    name: 'Sistemas Web à Medida',
    description: 'Plataformas web robustas, escaláveis e seguras — portais de clientes, áreas reservadas, marketplaces, ERPs leves, dashboards operacionais.',
    icon: Globe2 as any,
    features: [
      'Arquitetura limpa (Clean Architecture / DDD)',
      'Autenticação robusta (OAuth2, OIDC, MFA)',
      'APIs REST/GraphQL documentadas (OpenAPI)',
      'Testes automatizados (unit, integration, e2e)',
      'CI/CD com GitHub Actions / GitLab CI',
      'Observabilidade (logs, métricas, tracing)',
      'Conformidade LGPD / Lei de Dados (Angola)',
      'Hospedagem cloud (AWS, Azure, VPS própria)',
    ],
    techStack: ['React/Next.js', 'Node.js/NestJS', 'PostgreSQL', 'Redis', 'Docker', 'Kubernetes'],
  },
  {
    id: 'mobile-apps',
    name: 'Aplicações Móveis Nativas & Híbridas',
    description: 'Apps iOS e Android para equipas de campo, vendas, logística, inspeções, ponto de venda móvel — online/offline-first.',
    icon: Smartphone as any,
    features: [
      'React Native / Expo (código partilhado 90%+)',
      'Modo offline-first com sincronização inteligente',
      'Push notifications (FCM/APNs)',
      'Biometria, câmara, GPS, Bluetooth, NFC',
      'Publicação App Store / Play Store assistida',
      'Atualizações over-the-air (CodePush)',
      'MDM / Enterprise distribution ready',
      'Acessibilidade (WCAG 2.1 AA)',
    ],
    techStack: ['React Native', 'Expo', 'TypeScript', 'SQLite/Realm', 'Firebase', 'Fastlane'],
  },
  {
    id: 'corporate-games',
    name: 'Jogos & Simuladores Corporativos',
    description: 'Gamificação para onboarding, formação técnica, awareness de segurança, simulações de decisão — engagement real, métricas reais.',
    icon: Gamepad2 as any,
    features: [
      'Unity / Godot (2D, 3D, AR/VR leve)',
      'LMS integration (SCORM, xAPI)',
      'Multi-jogador, leaderboards, certificados',
      'Analytics de aprendizagem (completion, scores, heatmaps)',
      'White-label total (marca, cores, domínio)',
      'Deploy web (WebGL) ou nativo desktop/mobile',
      'Conteúdo editável via CMS sem reprogramar',
      'Suporte a idiomas (PT, EN, outros)',
    ],
    techStack: ['Unity (C#)', 'Godot (GDScript)', 'WebGL', 'Node.js Backend', 'PostgreSQL'],
  },
]

function FlagshipCard({ product }: { product: FlagshipProduct }) {
  const Icon = product.icon
  const isCyan = product.accentColor === 'cyan'
  const accentBg = isCyan ? 'bg-cyan-500/10 border-cyan-500/20' : 'bg-emerald-500/10 border-emerald-500/20'
  const accentText = isCyan ? 'text-cyan-400' : 'text-emerald-400'
  const accentBorder = isCyan ? 'border-cyan-500/30' : 'border-emerald-500/30'
  const badgeBg = isCyan ? 'bg-cyan-500/20 text-cyan-300' : 'bg-emerald-500/20 text-emerald-300'
  const buttonVariant = isCyan ? 'cyan' : 'default'
  const buttonOutline = isCyan ? 'outline' : 'outline'

  return (
    <Card className={`relative overflow-hidden border-l-4 ${accentBorder} ${accentBg} transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/5`}>
      {/* Accent top bar */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${isCyan ? 'bg-gradient-to-r from-cyan-500 to-blue-500' : 'bg-gradient-to-r from-emerald-500 to-teal-500'}`} />
      
      <CardContent className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className={`flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center ${badgeBg}`}>
            <Icon size={26} className={accentText} aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${badgeBg}`}>
                {product.id === 'palancasoft' ? 'ERP Próprio CFTEC' : 'Revenda Oficial'}
              </span>
              <Star size={14} className={`${accentText} fill-current`} aria-hidden="true" />
            </div>
            <h2 className="text-2xl lg:text-3xl font-heading font-bold tracking-tight text-foreground">
              {product.name}
            </h2>
            <p className="text-muted-foreground mt-1 text-lg">{product.tagline}</p>
          </div>
        </div>

        {/* Description */}
        <p className="text-base text-muted-foreground leading-relaxed border-l-2 pl-4 {accentBorder}">
          {product.description}
        </p>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
          {product.stats.map((stat) => (
            <div key={stat.label} className="text-center p-3 rounded-lg bg-background/50 border border-border/50">
              <div className={`text-2xl lg:text-3xl font-heading font-bold ${accentText}`}>{stat.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Highlights */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <CheckCircle2 size={16} className={accentText} />
            Principais Destaques
          </h3>
          <ul className="space-y-2">
            {product.highlights.slice(0, 5).map((highlight, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                <CheckCircle2 size={16} className={`${accentText} flex-shrink-0 mt-0.5`} />
                <span>{highlight}</span>
              </li>
            ))}
            {product.highlights.length > 5 && (
              <li className="flex items-start gap-3 text-sm">
                <span className={`${accentText} flex-shrink-0 mt-0.5`}>+</span>
                <span className="text-muted-foreground">Mais {product.highlights.length - 5} funcionalidades...</span>
              </li>
            )}
          </ul>
        </div>

        {/* Modules Accordion */}
        <details className="group border border-border/50 rounded-lg overflow-hidden bg-background/30">
          <summary className="flex items-center justify-between p-4 cursor-pointer list-none">
            <span className="font-medium text-foreground flex items-center gap-2">
              <FileText size={18} className={accentText} />
              Módulos Disponíveis ({product.modules.length})
            </span>
            <span className="text-muted-foreground transition-transform group-open:rotate-180">
              <ChevronDown size={18} />
            </span>
          </summary>
          <div className="px-4 pb-4 pt-0">
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-muted-foreground">
              {product.modules.map((module, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${isCyan ? 'bg-cyan-400' : 'bg-emerald-400'}`} />
                  {module}
                </li>
              ))}
            </ul>
          </div>
        </details>

        {/* Certifications */}
        <div className="flex flex-wrap gap-2 pt-2">
          {product.certifications.map((cert, i) => (
            <span key={i} className={`px-3 py-1 text-xs font-medium rounded-full border ${badgeBg} border-current`}>
              <Award size={10} className="inline-block align-middle mr-1" />
              {cert}
            </span>
          ))}
        </div>

        {/* CTAs */}
        <div className="flex flex-wrap gap-3 pt-4 border-t border-border/50">
          <Button variant={buttonVariant} size="lg" asChild className="w-full sm:w-auto">
            <a href={product.ctaPrimary.href}>{product.ctaPrimary.label} <ArrowRight size={16} /></a>
          </Button>
          <Button variant={buttonOutline} size="lg" asChild className="w-full sm:w-auto">
            <a href={product.ctaSecondary.href}>{product.ctaSecondary.label} <ExternalLink size={16} /></a>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function CustomDevCard({ service }: { service: CustomDevService }) {
  const Icon = service.icon
  return (
    <Card className="group relative overflow-hidden border-border/50 hover:border-cyan-500/30 hover:shadow-lg hover:shadow-cyan-500/5 transition-all duration-300 h-full">
      <CardContent className="p-6 space-y-5">
        <div className="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center group-hover:bg-cyan-500/20 group-hover:scale-105 transition-all duration-300">
          <Icon size={24} />
        </div>
        <div>
          <h3 className="text-xl font-heading font-semibold text-foreground">{service.name}</h3>
          <p className="text-muted-foreground mt-2 leading-relaxed">{service.description}</p>
        </div>
        
        <details className="group border-t border-border/50 pt-4">
          <summary className="flex items-center justify-between cursor-pointer list-none text-sm font-medium text-foreground">
            <span>Ver detalhes técnicos</span>
            <ChevronDown size={16} className="text-muted-foreground transition-transform group-open:rotate-180" />
          </summary>
          <div className="mt-4 space-y-4">
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Funcionalidades-chave</h4>
              <ul className="space-y-1.5">
                {service.features.map((feat, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-500/50" />
                    {feat}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Stack Tecnológico</h4>
              <div className="flex flex-wrap gap-2">
                {service.techStack.map((tech, i) => (
                  <span key={i} className="px-2.5 py-1 text-xs font-medium rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </details>
        
        <Button variant="outline" asChild className="w-full mt-2 group-hover:border-cyan-500/50 group-hover:text-cyan-400 transition-colors">
          <a href="#contacto?interest=Desenvolvimento+Customizado">Falar sobre o seu projeto <ArrowRight size={14} /></a>
        </Button>
      </CardContent>
    </Card>
  )
}

export function SystemsSoftwareSection() {
  return (
    <section id="sistemas-software" className="section py-24 lg:py-32 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 lg:mb-20 reveal">
          <span className="section-kicker inline-block mb-4">03 / Flagships CFTEC</span>
          <h2 className="text-3xl lg:text-4xl xl:text-5xl font-heading font-bold tracking-tight text-foreground mb-6">
            Produtos que <span className="text-cyan-400">definem</span> o nosso padrão
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Duas soluções bandeira — uma construída por nós, outra distribuída com excelência — 
            mais a capacidade de criar o que não existe no mercado.
          </p>
        </div>

        {/* Flagship Products - Two Column Layout */}
        <div className="grid lg:grid-cols-2 gap-6 lg:gap-8 mb-20 lg:mb-24 reveal">
          {flagshipProducts.map((product) => (
            <FlagshipCard key={product.id} product={product} />
          ))}
        </div>

        {/* Custom Development Section */}
        <div className="reveal">
          <div className="text-center mb-12">
            <span className="section-kicker inline-block mb-3">Desenvolvimento à Medida</span>
            <h3 className="text-2xl lg:text-3xl font-heading font-bold tracking-tight text-foreground mb-4">
              Quando o padrão não chega, <span className="text-emerald-400">criamos o específico</span>
            </h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Transformamos necessidades únicas em software dedicado. Da ideia ao deploy, 
              com arquitetura limpa, testes automatizados e suporte contínuo.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {customDevServices.map((service) => (
              <CustomDevCard key={service.id} service={service} />
            ))}
          </div>

          {/* CTA Banner */}
          <div className="mt-16 p-8 lg:p-12 rounded-2xl bg-gradient-to-br from-cyan-500/10 via-background to-emerald-500/10 border border-cyan-500/20 text-center">
            <div className="max-w-2xl mx-auto">
              <h4 className="text-2xl lg:text-3xl font-heading font-bold text-foreground mb-4">
                Tem um desafio técnico complexo?
              </h4>
              <p className="text-muted-foreground mb-6 text-lg">
                Agende uma sessão de descoberta sem compromisso. A nossa equipa de arquitetura 
                avalia viabilidade, stack e roadmap na primeira conversa.
              </p>
              <Button variant="cyan" size="xl" asChild>
                <a href="#contacto?interest=Desenvolvimento+Customizado">Agendar Sessão de Descoberta <ArrowRight size={18} /></a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ChevronDown icon (not in lucide imports above, adding inline)
function ChevronDown({ size = 16, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}