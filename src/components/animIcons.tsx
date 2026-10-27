import type { CSSProperties, ReactNode } from 'react'

/**
 * PARTE 8.6 — Ícones animados estilo Flaticon / line-md para o painel.
 * Tudo SVG inline com stroke (sem dependências, sem pedidos de rede):
 *  · o traço de cada forma é "desenhado" ao montar (stroke-dashoffset → 0, pathLength normalizado)
 *  · cada ícone tem um micro-gesto próprio (pop, wiggle, swing, pulse, spin, ping)
 * As animações vivem em admin.css (bloco «Ícones animados») e respeitam prefers-reduced-motion.
 * Uso: <IconBell size={13} /> — herda a cor do texto via currentColor.
 */

export type AnimIconProps = { size?: number; className?: string; style?: CSSProperties; strokeWidth?: number }

function Svg({ size = 14, className = '', style, strokeWidth = 2, children }: AnimIconProps & { children: ReactNode }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
      className={`anim-icon ${className}`} style={style} aria-hidden="true" focusable="false"
    >
      {children}
    </svg>
  )
}

/** Cadeado aberto — para o bypass de emergência da licença. */
export function IconUnlock(p: AnimIconProps) {
  return (
    <Svg {...p} className={`ai-tada ${p.className || ''}`}>
      <rect pathLength={100} x="4.5" y="11" width="15" height="9.5" rx="2.2" />
      <path pathLength={100} d="M9.5 11V7.5a4.4 4.4 0 0 1 8.6-1.4" />
      <path pathLength={100} d="M12 15v2.3" />
    </Svg>
  )
}

/** Cadeado fechado — «só o developer». */
export function IconLock(p: AnimIconProps) {
  return (
    <Svg {...p} className={`ai-pop ${p.className || ''}`}>
      <rect pathLength={100} x="5" y="11" width="14" height="9" rx="2.2" />
      <path pathLength={100} d="M8.5 11V7.5a3.5 3.5 0 0 1 7 0V11" />
      <path pathLength={100} d="M12 14.6v2.2" />
    </Svg>
  )
}

/** Ampulheta — renovação/tarefa em curso (areia a cair). */
export function IconHourglass(p: AnimIconProps) {
  return (
    <Svg {...p} className={p.className || ''}>
      <path pathLength={100} d="M7 3.5h10M7 20.5h10" />
      <path pathLength={100} d="M8.5 3.5v3.2L12 11l3.5-4.3V3.5" />
      <path pathLength={100} d="M8.5 20.5v-3.2L12 13l3.5 4.3v3.2" />
      <path pathLength={100} className="ai-sand" d="M12 13.6v3.1" />
    </Svg>
  )
}

/** Relógio — prazos («hoje», «Expira em»). */
export function IconClock(p: AnimIconProps) {
  return (
    <Svg {...p} className={p.className || ''}>
      <circle pathLength={100} cx="12" cy="12" r="8.5" />
      <path pathLength={100} d="M12 7.5V12l3 1.7" />
    </Svg>
  )
}

/** Aviso triangular pulsante — vencida / pendente / crítico. */
export function IconAlert(p: AnimIconProps) {
  return (
    <Svg {...p} className={`ai-pulse ${p.className || ''}`}>
      <path pathLength={100} d="M12 4 20.6 19.2H3.4L12 4z" />
      <path pathLength={100} d="M12 10.2v3.6" />
      <path pathLength={100} d="M12 16.6v.01" />
    </Svg>
  )
}

/** Sino a balançar — central de renovações / alertas. */
export function IconBell(p: AnimIconProps) {
  return (
    <Svg {...p} className={`ai-swing ${p.className || ''}`}>
      <path pathLength={100} d="M18 9.8a6 6 0 1 0-12 0c0 6.2-2.2 7.8-2.2 7.8h16.4S18 16 18 9.8" />
      <path pathLength={100} d="M13.7 20.6a2 2 0 0 1-3.4 0" />
    </Svg>
  )
}

/** Polegar a aparecer — chamados sem ocorrências / «ajudou». */
export function IconThumb(p: AnimIconProps) {
  return (
    <Svg {...p} className={`ai-pop ${p.className || ''}`}>
      <path pathLength={100} d="M7 11H4.6a.6.6 0 0 0-.6.6v8.8a.6.6 0 0 0 .6.6H7" />
      <path pathLength={100} d="M7 21a.2.2 0 0 0 .2-.2V11.2a.2.2 0 0 0-.2-.2M7 21h8.8a2.3 2.3 0 0 0 2.24-1.83l1.6-6.37A2.3 2.3 0 0 0 17.4 10H12l1.06-4.24A1.9 1.9 0 0 0 9.6 4.1L7 10" />
    </Svg>
  )
}

/** Chave — password provisória. */
export function IconKey(p: AnimIconProps) {
  return (
    <Svg {...p} className={`ai-tada ${p.className || ''}`}>
      <circle pathLength={100} cx="7.5" cy="14.5" r="3.2" />
      <path pathLength={100} d="M10.1 12.4 20.5 4" />
      <path pathLength={100} d="M17.3 6.4l2.7 2.2" />
      <path pathLength={100} d="M14.7 8.8l2.3 1.9" />
    </Svg>
  )
}

/** Lápis — observações. */
export function IconPen(p: AnimIconProps) {
  return (
    <Svg {...p} className={p.className || ''}>
      <path pathLength={100} d="M17.1 3.2a2.85 2.85 0 1 1 4 4L7.6 20.7 2.4 22l1.3-5.2L17.1 3.2z" />
    </Svg>
  )
}

/** Balão de fala — conversa WhatsApp (pontos piscam). */
export function IconChat(p: AnimIconProps) {
  return (
    <Svg {...p} className={p.className || ''}>
      <path pathLength={100} d="M20.5 11.6a8.4 8.4 0 0 1-8.5 8.3 8.7 8.7 0 0 1-3.8-.86L3.5 20.5l1.45-4.6a8.3 8.3 0 0 1-.85-3.7A8.4 8.4 0 0 1 12.6 3.5h.4a8.4 8.4 0 0 1 7.5 8.1z" />
      <circle pathLength={100} className="ai-d1" cx="8.6" cy="12" r=".8" fill="currentColor" strokeWidth="1" />
      <circle pathLength={100} className="ai-d2" cx="12.3" cy="12" r=".8" fill="currentColor" strokeWidth="1" />
      <circle pathLength={100} className="ai-d3" cx="16" cy="12" r=".8" fill="currentColor" strokeWidth="1" />
    </Svg>
  )
}

/** Alvo — meta mensal (eco de dardo). */
export function IconTarget(p: AnimIconProps) {
  return (
    <Svg {...p} className={p.className || ''}>
      <circle pathLength={100} cx="12" cy="12" r="8" />
      <circle pathLength={100} cx="12" cy="12" r="4.4" />
      <circle pathLength={100} cx="12" cy="12" r="1.3" fill="currentColor" strokeWidth="1" />
      <circle pathLength={100} className="ai-ping" cx="12" cy="12" r="1.3" strokeWidth="1.4" />
    </Svg>
  )
}

/** Descarregar — colunas/analytics (seta quica). */
export function IconDownload(p: AnimIconProps) {
  return (
    <Svg {...p} className={p.className || ''}>
      <path pathLength={100} className="ai-bob" d="M12 3.8v10.2" />
      <path pathLength={100} className="ai-bob" d="M7.8 10.4 12 14.6l4.2-4.2" />
      <path pathLength={100} d="M4.5 15.5v2.7a1.8 1.8 0 0 0 1.8 1.8h11.4a1.8 1.8 0 0 0 1.8-1.8v-2.7" />
    </Svg>
  )
}

/** Telefone — colunas de chamados. */
export function IconPhone(p: AnimIconProps) {
  return (
    <Svg {...p} className={`ai-ring ${p.className || ''}`}>
      <path pathLength={100} d="M21.5 16.6v2.8a2 2 0 0 1-2.18 2 19.4 19.4 0 0 1-8.46-3.02 19.1 19.1 0 0 1-5.88-5.88A19.4 19.4 0 0 1 1.96 4a2 2 0 0 1 2-2.18h2.8a2 2 0 0 1 2 1.7c.12.95.34 1.87.66 2.75a2 2 0 0 1-.44 2.06L7.9 9.4a15.7 15.7 0 0 0 5.88 5.88l1.07-1.08a2 2 0 0 1 2.06-.44c.88.32 1.8.54 2.75.66a2 2 0 0 1 1.7 2z" />
    </Svg>
  )
}

/** Repetição — renovações. */
export function IconRepeat(p: AnimIconProps) {
  return (
    <Svg {...p} className={`ai-spin ${p.className || ''}`}>
      <path pathLength={100} d="m17 2.5 4 4-4 4" />
      <path pathLength={100} d="M3 11.5v-1a4 4 0 0 1 4-4h14" />
      <path pathLength={100} d="m7 21.5-4-4 4-4" />
      <path pathLength={100} d="M21 12.5v1a4 4 0 0 1-4 4H3" />
    </Svg>
  )
}

/** Utilizadores — upgrades de licença (2.ª pessoa entra a deslizar). */
export function IconUsers(p: AnimIconProps) {
  return (
    <Svg {...p} className={p.className || ''}>
      <path pathLength={100} d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle pathLength={100} cx="9" cy="7" r="3.6" />
      <path pathLength={100} className="ai-late" d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path pathLength={100} className="ai-late" d="M16 3.13a4 4 0 0 1 0 7.75" />
    </Svg>
  )
}

/** Engrenagem — mensagens do sistema. */
export function IconGear(p: AnimIconProps) {
  return (
    <Svg {...p} className={`ai-spin ${p.className || ''}`}>
      <path pathLength={100} d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle pathLength={100} cx="12" cy="12" r="3" />
    </Svg>
  )
}

/* ---- Extras do tour do sistema ---- */

/** Bússola — navegação/menu. */
export function IconCompass(p: AnimIconProps) {
  return (
    <Svg {...p} className={p.className || ''}>
      <circle pathLength={100} cx="12" cy="12" r="8.5" />
      <path pathLength={100} className="ai-sand" d="m15.2 8.8-1.8 4.6-4.6 1.8 1.8-4.6 4.6-1.8z" />
    </Svg>
  )
}

/** Maleta — funil comercial. */
export function IconBriefcase(p: AnimIconProps) {
  return (
    <Svg {...p} className={p.className || ''}>
      <rect pathLength={100} x="4" y="8" width="16" height="12.5" rx="2" />
      <path pathLength={100} d="M9.5 8V5.8A1.8 1.8 0 0 1 11.3 4h1.4a1.8 1.8 0 0 1 1.8 1.8V8" />
      <path pathLength={100} d="M4 12.6h16" />
    </Svg>
  )
}

/** Barras — indicadores. */
export function IconChart(p: AnimIconProps) {
  return (
    <Svg {...p} className={p.className || ''}>
      <path pathLength={100} d="M4.5 4.5v15h15" />
      <path pathLength={100} className="ai-bob" d="M9 15.5v-4" />
      <path pathLength={100} className="ai-bob" d="M13.5 15.5V8.5" />
      <path pathLength={100} className="ai-bob" d="M18 15.5V11" />
    </Svg>
  )
}

/** Pasta — kanban/ficheiros. */
export function IconFolder(p: AnimIconProps) {
  return (
    <Svg {...p} className={p.className || ''}>
      <path pathLength={100} d="M3.5 6.8a1.8 1.8 0 0 1 1.8-1.8h4.2l2 2.4h7.2a1.8 1.8 0 0 1 1.8 1.8v8.5a1.8 1.8 0 0 1-1.8 1.8H5.3a1.8 1.8 0 0 1-1.8-1.8V6.8z" />
    </Svg>
  )
}

/** Livro — wiki. */
export function IconBook(p: AnimIconProps) {
  return (
    <Svg {...p} className={p.className || ''}>
      <path pathLength={100} d="M4.5 19.2A2.2 2.2 0 0 1 6.7 17H19.5V3.8H6.7a2.2 2.2 0 0 0-2.2 2.2v13.2z" />
      <path pathLength={100} d="M4.5 19.3A1.7 1.7 0 0 0 6.2 21h13.3v-4H6.2a1.7 1.7 0 0 0-1.7 1.7z" />
    </Svg>
  )
}

/** Foguete — lançamento. */
export function IconRocket(p: AnimIconProps) {
  return (
    <Svg {...p} className={`ai-tada ${p.className || ''}`}>
      <path pathLength={100} d="M12.6 3.4c3.4.7 6.3 3.6 7 7l-4.8 4.8-4.9-4.9 4.8-4.8z" transform="" />
      <path pathLength={100} d="M9.9 10.3 5.3 12l-1.6 8.3L12 18.7l1.6-4.7" />
      <path pathLength={100} d="m3.7 20.3 3.1-3.1" />
      <circle pathLength={100} cx="14.8" cy="9.2" r="1.3" />
    </Svg>
  )
}

/** Cofre/pagamento. */
export function IconWallet(p: AnimIconProps) {
  return (
    <Svg {...p} className={p.className || ''}>
      <path pathLength={100} d="M19.5 8.5V6.6a1.6 1.6 0 0 0-1.6-1.6H5.1a1.6 1.6 0 0 0-1.6 1.6v10.8a1.6 1.6 0 0 0 1.6 1.6h13a1.6 1.6 0 0 0 1.4-1.6v-1.9" />
      <path pathLength={100} d="M21 9.5h-5.2a2.5 2.5 0 0 0 0 5H21v-5z" />
    </Svg>
  )
}
