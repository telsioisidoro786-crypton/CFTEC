// ── Registo partilhado de ícones de serviços ─────────────────────────
// Fonte única para o site (App.tsx) e o painel (AdminDashboard.tsx).
// A BD guarda a chave textual (ex.: 'Cloud'), aqui fica o desenho + rótulo.
// A ordem de inserção é a ordem de apresentação no grid do painel —
// os ícones mais usados em serviços primeiro.
import {
  BarChart3,
  Cloud,
  Code2,
  Cpu,
  Database,
  DollarSign,
  Globe2,
  HardDrive,
  Headphones,
  Layers3,
  LockKeyhole,
  Monitor,
  Network,
  Package,
  Printer,
  Rocket,
  Server,
  Settings,
  ShieldCheck,
  Smartphone,
  Sparkles,
  TrendingUp,
  UsersRound,
  Wifi,
  Wrench,
  Zap,
} from 'lucide-react'

export type LucideIconComponent = typeof Code2

export type ServiceIconDef = { icon: LucideIconComponent; label: string }

export const serviceIconDefs: Record<string, ServiceIconDef> = {
  Code2: { icon: Code2, label: 'Software à medida' },
  Network: { icon: Network, label: 'Redes & infra' },
  Cloud: { icon: Cloud, label: 'Nuvem' },
  Server: { icon: Server, label: 'Servidores' },
  Database: { icon: Database, label: 'Bases de dados' },
  ShieldCheck: { icon: ShieldCheck, label: 'Segurança' },
  LockKeyhole: { icon: LockKeyhole, label: 'Protecção de dados' },
  Wifi: { icon: Wifi, label: 'Conectividade' },
  Monitor: { icon: Monitor, label: 'TI no escritório' },
  Smartphone: { icon: Smartphone, label: 'Mobile' },
  Headphones: { icon: Headphones, label: 'Suporte' },
  Wrench: { icon: Wrench, label: 'Manutenção' },
  Cpu: { icon: Cpu, label: 'Hardware' },
  HardDrive: { icon: HardDrive, label: 'Armazenamento' },
  Printer: { icon: Printer, label: 'Impressão' },
  Globe2: { icon: Globe2, label: 'Web' },
  Rocket: { icon: Rocket, label: 'Lançamento' },
  TrendingUp: { icon: TrendingUp, label: 'Crescimento' },
  BarChart3: { icon: BarChart3, label: 'Analytics' },
  Layers3: { icon: Layers3, label: 'Integrações' },
  Zap: { icon: Zap, label: 'Automação' },
  Sparkles: { icon: Sparkles, label: 'Criativo' },
  UsersRound: { icon: UsersRound, label: 'Formação / equipas' },
  Package: { icon: Package, label: 'Pacotes' },
  Settings: { icon: Settings, label: 'Configuração' },
  DollarSign: { icon: DollarSign, label: 'Facturação' },
}

// Mapa simples (chave → componente) para desenho, igual às versões antigas
export const serviceIcons: Record<string, ServiceIconDef['icon']> = Object.fromEntries(
  Object.entries(serviceIconDefs).map(([key, def]) => [key, def.icon])
)
