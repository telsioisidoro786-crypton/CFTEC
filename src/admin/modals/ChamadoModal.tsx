import type { Dispatch, FormEvent, SetStateAction } from 'react'
import { Check, X } from 'lucide-react'
import { IconClock } from '../../components/animIcons'
import { Button } from '../../components/ui/button'

// Fase 1 — ficha de atendimento do Helpdesk extraída do AdminDashboard
export const CHAMADO_PRIOS = ['Baixa', 'Média', 'Crítica'] as const
export type ChamadoFormShape = { cliente: string; nif: string; telefone: string; software: string; problema: string; prioridade: string }

type ChamadoModalProps = {
  chamadoForm: ChamadoFormShape
  setChamadoForm: Dispatch<SetStateAction<ChamadoFormShape>>
  software: ReadonlyArray<{ name: string }>
  chamadoSaving: boolean
  createChamado: (event: FormEvent) => Promise<void> | void
  onClose: () => void
}

export function ChamadoModal({ chamadoForm, setChamadoForm, software, chamadoSaving, createChamado, onClose }: ChamadoModalProps) {
  return (
    <div className="admin-modal-backdrop" onMouseDown={() => onClose()}><div className="admin-modal admin-modal--lg cham-modal" onMouseDown={(event) => event.stopPropagation()}><div className="admin-modal-head cham-modal-head"><div><span className="admin-panel-kicker">HELPDESK · NOVO CHAMADO</span><h2>Registar chamado de suporte</h2><small className="cham-modal-meta"><IconClock size={11} /> Ficha de atendimento — depois usa ⚡ (reabrir) ou ✔ (resolver) na linha do chamado</small></div><button onClick={() => onClose()} className="admin-modal-close" aria-label="Fechar"><X size={18} /></button></div><form className="cham-modal-body" onSubmit={createChamado}>
          <fieldset className="cham-fs"><legend><span className="cham-fs-num">01</span>Cliente<small className="cham-fs-req">obrigatório</small></legend><div className="cham-fs-grid">
          <label className="cham-fs-main">Empresa / cliente<input value={chamadoForm.cliente} onChange={(e) => setChamadoForm(f => ({ ...f, cliente: e.target.value }))} placeholder="Ex.: Padaria Central" required maxLength={150} autoFocus /></label>
          <label>NIF (opcional)<input value={chamadoForm.nif} onChange={(e) => setChamadoForm(f => ({ ...f, nif: e.target.value }))} placeholder="Ex.: 5417234561" maxLength={30} /></label>
          <label>Telefone / WhatsApp (opcional)<input value={chamadoForm.telefone} onChange={(e) => setChamadoForm(f => ({ ...f, telefone: e.target.value }))} placeholder="Ex.: 923 000 000" maxLength={20} /></label>
          </div></fieldset>
          <fieldset className="cham-fs"><legend><span className="cham-fs-num cham-fs-num--soft">02</span>Software &amp; prioridade</legend><div className="cham-fs-grid cham-fs-grid--dois">
          <label>Software (opcional)<input value={chamadoForm.software} onChange={(e) => setChamadoForm(f => ({ ...f, software: e.target.value }))} placeholder="Ex.: PalancaSoft ERP" maxLength={120} list="cham-soft-sugestoes" /><datalist id="cham-soft-sugestoes">{software.map(s => <option key={s.name} value={s.name} />)}</datalist></label>
          <label>Prioridade do ticket<select className={`cham-prio ${chamadoForm.prioridade === 'Crítica' ? 'cham-prio--critica' : chamadoForm.prioridade === 'Média' ? 'cham-prio--media' : 'cham-prio--baixa'}`} value={chamadoForm.prioridade} onChange={(e) => setChamadoForm(f => ({ ...f, prioridade: e.target.value }))}>{CHAMADO_PRIOS.map(p => <option key={p} value={p}>{p}</option>)}</select></label>
          </div></fieldset>
          <fieldset className="cham-fs"><legend><span className="cham-fs-num cham-fs-num--prob">03</span>Problema reportado<small className={`cham-count ${chamadoForm.problema.length > 960 ? 'cham-count--warn' : ''}`}>{chamadoForm.problema.length} / 1200</small></legend><textarea className="cham-problema" rows={4} value={chamadoForm.problema} onChange={(e) => setChamadoForm(f => ({ ...f, problema: e.target.value }))} placeholder="Ex.: Impressora térmica de recibos não comunica via USB" required maxLength={1200} /></fieldset>
          <div className="admin-modal-actions"><Button variant="outline" type="button" onClick={() => onClose()}>Cancelar</Button><Button type="submit" disabled={chamadoSaving}><Check size={15} /> {chamadoSaving ? 'A registar…' : 'Registar chamado'}</Button></div></form></div></div>
  )
}
