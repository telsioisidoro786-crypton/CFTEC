import { useEffect, useMemo, useState } from 'react'
import {
  Bell,
  BookOpen,
  ChevronsRight,
  LayoutDashboard,
  LifeBuoy,
  Menu,
  Package,
  ShoppingCart,
  Sparkles,
  Wallet,
  X,
} from 'lucide-react'

/**
 * Tour guiado do Sistema CFTEC (onboarding) — abre no primeiro login e pode
 * ser reaberto sempre pelo botão "Guia de Uso" (❓) da barra superior.
 * Cada passo pode apontar para uma secção real do painel ("Ir agora").
 */

type Level = 'super_admin' | 'gestor' | 'tecnico' | 'developer'
type Section =
  | 'dashboard' | 'services' | 'media' | 'software' | 'licencas' | 'pedidos'
  | 'destaques' | 'blog' | 'parceiros' | 'contactos' | 'chamados' | 'wiki'
  | 'relatorios' | 'settings' | 'developer' | 'auditoria'

export const TOUR_KEY = 'cftec_tour_completed'

export function tourFeito(email: string): boolean {
  try { return localStorage.getItem(TOUR_KEY) === email } catch { return true }
}
export function marcarTour(email: string): void {
  try { localStorage.setItem(TOUR_KEY, email) } catch { /* armazenamento indisponível — ignora */ }
}

type Focus = 'comercial' | 'tecnico' | 'geral'
type Step = { icon: typeof LayoutDashboard; emoji: string; title: string; text: string; section?: Section }

// secções visíveis por nível (espelha navItems do AdminDashboard — "Ir agora" nunca cai em área bloqueada)
const SEC_POR_NIVEL: Partial<Record<Section, Level[]>> = {
  pedidos: ['super_admin', 'gestor', 'developer'],
  relatorios: ['super_admin', 'gestor', 'developer'],
  licencas: ['super_admin', 'gestor', 'tecnico', 'developer'],
  chamados: ['super_admin', 'gestor', 'tecnico', 'developer'],
  wiki: ['super_admin', 'tecnico', 'developer'],
  software: ['super_admin', 'gestor', 'tecnico', 'developer'],
  settings: ['super_admin', 'developer'],
  auditoria: ['super_admin', 'developer'],
  developer: ['developer'],
}
const podeVer = (level: Level | undefined, sec: Section): boolean => {
  const list = SEC_POR_NIVEL[sec]
  if (!list) return true
  return !!level && list.includes(level)
}

const PASSOS: Record<Focus, Step[]> = {
  geral: [
    { icon: LayoutDashboard, emoji: '👋', title: 'Bem-vindo ao Portal CFTEC!', text: 'Este é o teu painel de trabalho. Os indicadores no topo (pedidos, licenças, chamados) actualizam-se em tempo real — é o teu primeiro ponto de atenção a cada manhã.' },
    { icon: Menu, emoji: '🧭', title: 'Menu lateral — o teu workspace', text: 'Cada pessoa vê apenas o que lhe compete: o Comercial vê pedidos e licenças; o técnico vê chamados e wiki; a administração vê tudo. O sino (🔔) conta os pedidos novos por ler.' },
    { icon: ShoppingCart, emoji: '💼', title: 'Funil comercial', text: 'Os pedidos correm no Kanban até gerarem Fatura Proforma e Fatura Interna (FT) — cada cartão é um cliente com o seu estado.' },
    { icon: BookOpen, emoji: '🛠️', title: 'Suporte técnico', text: 'Novos softwares vão para o catálogo de downloads; os casos vivem em "Chamados de Suporte"; a memória da equipa fica na "Wiki Técnica".' },
    { icon: Bell, emoji: '🔔', title: 'Alertas no telemóvel', text: 'No topo do painel, usa o cartão "Ativar Alertas" para receber Web Push no ecrã de bloqueio — cada novo pedido ou chamado aviso na hora, mesmo com o painel fechado.' },
  ],
  comercial: [
    { icon: LayoutDashboard, emoji: '📊', title: 'Indicadores & Visão Geral', text: 'KPIs no topo: pedidos, licenças activas, contactos por ler e progresso de metas. Tudo em tempo real.' },
    { icon: Menu, emoji: '🧭', title: 'Menu lateral — área comercial', text: 'Como comercial, as tuas áreas são: Pedidos de Licença, Licenças PalancaSoft, Revenda Negomil e Relatórios & Metas. O sino (🔔) na barra superior conta os pedidos novos.' },
    { icon: ShoppingCart, emoji: '🗂️', title: 'Kanban de Pedidos', text: 'Cada cartão representa um cliente. Arrasta o cartão da coluna "Pendente" para "Aprovado" → a Fatura Proforma em PDF é gerada automaticamente e fica pronta a enviar.', section: 'pedidos' },
    { icon: Wallet, emoji: '💰', title: 'Confirmar Pagamento → FT + Meta', text: 'No cartão aprovado, clica "Confirmar Pagamento" para emitir a Fatura Interna (FT) em PDF e fechar a venda. A tua meta mensal de vendas actualiza-se em "Relatórios & Metas".' },
    { icon: Bell, emoji: '🔔', title: 'Alertas no ecrã de bloqueio', text: 'Clica no cartão "Ativar Alertas" no topo do painel para receberes notificação push no telemóvel sempre que um cliente fizer um pedido — nunca perdes um cliente por demora.' },
  ],
  tecnico: [
    { icon: LayoutDashboard, emoji: '📈', title: 'O teu painel técnico', text: 'Os KPIs mostram o que corre no parque da CFTEC: softwares publicados, serviços, mídias e chamados abertos.' },
    { icon: Menu, emoji: '🧭', title: 'Menu lateral — área técnica', text: 'As tuas áreas: Softwares & Downloads, Blog/CMS, Novidades, Contactos, Chamados de Suporte e Wiki Técnica.' },
    { icon: LifeBuoy, emoji: '🎧', title: 'Atender chamados', text: 'Cada chamado de suporte tem estado (Aberto → Em análise → Resolvido). Responde ao cliente, actualiza o estado e fecha o caso em "Chamados de Suporte".', section: 'chamados' },
    { icon: BookOpen, emoji: '📚', title: 'Wiki técnica', text: 'Antes de resolver do zero, pesquisa a Wiki Técnica: procedimentos, falhas conhecidas e soluções ficam documentados para toda a equipa.', section: 'wiki' },
    { icon: Package, emoji: '📤', title: 'Novas versões de software', text: 'Em "Softwares & Downloads" publica a nova versão (upload do pacote + changelog) — os clientes descarregam sempre a versão certa.', section: 'software' },
    { icon: Bell, emoji: '🔔', title: 'Alertas no ecrã de bloqueio', text: 'Ativa o cartão "Ativar Alertas" no topo do painel para receberes push no telemóvel: novo chamado de suporte = aviso imediato no teu ecrã.' },
  ],
}

const FOCOS: { id: Focus; nome: string; desc: string; emoji: string; recomendado: Level[] }[] = [
  { id: 'comercial', nome: 'Comercial', desc: 'Aprovar pedidos, mover o Kanban, emitir Proforma/FT em PDF e bater metas.', emoji: '💼', recomendado: ['gestor'] },
  { id: 'tecnico', nome: 'Técnico', desc: 'Atender chamados, usar a Wiki interna e publicar novas versões de software.', emoji: '🛠️', recomendado: ['tecnico'] },
  { id: 'geral', nome: 'Geral', desc: 'Tour completo: painel, funil comercial, suporte técnico e alertas no telemóvel.', emoji: '🚀', recomendado: ['super_admin', 'developer'] },
]

export type SystemTourProps = {
  open: boolean
  level: Level | undefined
  userName?: string
  onClose: () => void
  onNavigate?: (section: Section) => void
}

export default function SystemTour({ open, level, userName, onClose, onNavigate }: SystemTourProps) {
  const focoInicial = useMemo<Focus>(() => {
    if (level === 'gestor') return 'comercial'
    if (level === 'tecnico') return 'tecnico'
    return 'geral'
  }, [level])
  const [foco, setFoco] = useState<Focus>(focoInicial)
  const [escolheu, setEscolheu] = useState(false)
  const [i, setI] = useState(0)

  useEffect(() => {
    if (open) { setFoco(focoInicial); setEscolheu(false); setI(0) }
  }, [open, focoInicial])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') return onClose()
      if (!escolheu) return
      const total = PASSOS[foco].length
      if (e.key === 'ArrowRight' && i < total - 1) setI(v => v + 1)
      if (e.key === 'ArrowLeft' && i > 0) setI(v => v - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, foco, escolheu, i, onClose])

  if (!open) return null

  const passos = PASSOS[foco].map(s => (s.section && !podeVer(level, s.section) ? { ...s, section: undefined } : s))
  const passo = passos[i]
  const ultimo = escolheu && i >= passos.length - 1

  return (
    <div
      className="admin-modal-backdrop tour-backdrop"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      role="dialog" aria-modal="true" aria-label="Tour guiado do sistema"
    >
      <div className="tour">
        <div className="tour-head">
          <div className="tour-brand"><Sparkles size={16} /> Guia do Sistema CFTEC</div>
          <button className="tour-close" onClick={onClose} aria-label="Fechar guia"><X size={17} /></button>
        </div>

        {!escolheu ? (
          <>
            <div className="tour-welcome">
              <span className="tour-welcome-emoji">🎉</span>
              <h2>Bem-vindo ao Portal CFTEC{userName ? `, ${userName}` : ''}!</h2>
              <p>Leva 2 minutos. Escolhe o teu foco e vê o mais importante — podes rever este guia sempre que quiseres pelo botão <b>Guia de Uso</b> da barra superior.</p>
            </div>
            <div className="tour-choice">
              {FOCOS.map((f) => {
                const rec = !!level && f.recomendado.includes(level)
                return (
                  <button
                    key={f.id}
                    className={`tour-choice-card${rec ? ' is-recommended' : ''}`}
                    onClick={() => { setFoco(f.id); setEscolheu(true); setI(0) }}
                  >
                    <span className="tour-choice-emoji">{f.emoji}</span>
                    <strong>{f.nome}{rec ? <em className="tour-flag">Recomendado</em> : null}</strong>
                    <span>{f.desc}</span>
                    <span className="tour-choice-go"><ChevronsRight size={14} /> Começar</span>
                  </button>
                )
              })}
            </div>
            <div className="tour-footer">
              <button className="tour-skip" onClick={onClose}>Mais tarde</button>
            </div>
          </>
        ) : (
          <>
            <div className="tour-step">
              <div className="tour-art"><span>{passo.emoji}</span></div>
              <div className="tour-body">
                <span className="tour-kicker">Passo {i + 1} de {passos.length}</span>
                <h3>{passo.title}</h3>
                <p>{passo.text}</p>
                {passo.section && onNavigate && (
                  <button className="tour-go" onClick={() => { onNavigate(passo.section as Section); onClose() }}>
                    Ir agora para esta secção <ChevronsRight size={14} />
                  </button>
                )}
              </div>
            </div>
            <div className="tour-dots">{passos.map((_, d) => <i key={d} className={d <= i ? 'on' : ''} />)}</div>
            <div className="tour-footer">
              <button className="tour-skip" onClick={() => { setEscolheu(false); setI(0) }}>Escolher outro foco</button>
              <div className="tour-actions">
                <button className="tour-nav-btn" disabled={i === 0} onClick={() => setI(v => Math.max(0, v - 1))}>← Anterior</button>
                {ultimo
                  ? <button className="tour-nav-btn tour-primary" onClick={onClose}>✓ Concluir tour</button>
                  : <button className="tour-nav-btn tour-primary" onClick={() => setI(v => v + 1)}>Seguinte →</button>}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
