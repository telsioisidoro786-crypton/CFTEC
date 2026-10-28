import { Loader2, MessageSquare, Star, X } from 'lucide-react'
import { IconGear } from '../../components/animIcons'
import { Button } from '../../components/ui/button'

// Fase 1 — conversa do chamado extraída do AdminDashboard
type ConversaResumo = { cliente: string; estado: string; software: string | null; telefone?: string | null; csat?: number | null }
type MensagemThread = { id: string; created_at: string; autor: 'cliente' | 'tecnico' | 'sistema'; autor_nome: string | null; corpo: string }

type ConversaModalProps = {
  conversaChamado: ConversaResumo
  conversaCarregada: boolean
  conversaMsgs: ReadonlyArray<MensagemThread>
  respostaTecnico: string
  setRespostaTecnico: (valor: string) => void
  enviarRespostaTecnico: () => Promise<void> | void
  enviandoResposta: boolean
  threadFim: { current: HTMLDivElement | null }
  onClose: () => void
}

export function ConversaModal({ conversaChamado, conversaCarregada, conversaMsgs, respostaTecnico, setRespostaTecnico, enviarRespostaTecnico, enviandoResposta, threadFim, onClose }: ConversaModalProps) {
  return (
    <div className="admin-modal-backdrop" onMouseDown={() => onClose()}><div className="admin-modal admin-modal--conversa cham-chat" onMouseDown={(e) => e.stopPropagation()}><div className="admin-modal-head cham-chat-head"><div className="cham-chat-id"><span className="cham-chat-avi">{(conversaChamado.cliente || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}</span><div><span className="admin-panel-kicker">CONVERSA DO CHAMADO</span><h2>{conversaChamado.cliente} <i className={`cham-estado cham-estado--${conversaChamado.estado === 'Resolvido' ? 'resolvido' : conversaChamado.estado === 'Pendente' ? 'pendente' : 'andamento'}`}>{conversaChamado.estado}</i></h2><small className="cham-chat-sub">{conversaChamado.software || 'suporte'}{conversaChamado.telefone ? ' · ' + conversaChamado.telefone : ''}</small></div></div><button onClick={() => onClose()} className="admin-modal-close" aria-label="Fechar"><X size={18} /></button></div><div className="thread-msgs">{!conversaCarregada ? <div className="admin-empty-state" style={{ padding: 24 }}><Loader2 size={28} className="spin" /><p>A abrir conversa…</p></div> : conversaMsgs.length === 0 ? <div className="admin-empty-state" style={{ padding: 24 }}><MessageSquare size={32} /><h3>Nenhuma mensagem ainda</h3><p>Envie a primeira resposta — o cliente recebe e-mail + WhatsApp automáticos.</p></div> : conversaMsgs.map(m => <div key={m.id} className={`thread-msg thread-msg--${m.autor}`}><div className="thread-meta"><strong>{m.autor === 'sistema' ? <IconGear size={12} className="thread-gear" /> : ''}{m.autor_nome || (m.autor === 'cliente' ? 'Cliente' : 'Equipa CFTEC')}</strong><small>{new Date(m.created_at).toLocaleString('pt-PT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</small></div><div className="thread-corpo">{m.corpo}</div></div>)}<div ref={threadFim} /></div>{conversaChamado.estado !== 'Resolvido' ? <form className="thread-resposta" onSubmit={(e) => { e.preventDefault(); void enviarRespostaTecnico() }}><textarea value={respostaTecnico} onChange={(e) => setRespostaTecnico(e.target.value)} placeholder="Escreva a resposta ao cliente (recebe por e-mail + WhatsApp)…" maxLength={1500} rows={3} /><Button size="sm" type="submit" disabled={enviandoResposta || !respostaTecnico.trim()}>{enviandoResposta ? 'A enviar…' : 'Enviar ao cliente'}</Button></form> : typeof conversaChamado.csat === 'number' ? <div className="thread-csat-nota" data-tip={conversaChamado.csat >= 4 ? 'Cliente satisfeito 🎉' : 'Cliente insatisfeito 🚨'}><Star size={15} /> O cliente avaliou: {conversaChamado.csat}/5</div> : <div className="thread-csat-nota">Chamado resolvido — o cliente pode avaliar no portal (1-5).</div>}</div></div>
  )
}
