import { type FormEvent, useState } from 'react'
import { ArrowRight, BadgeCheck, Building2, LockKeyhole, Wrench, X } from 'lucide-react'
import { Button } from './ui/button'

const SofTEES = ['PalancaSoft ERP', 'Negomil (AGT)', 'CFTEC Desk', 'Outro']

type Enviado = { id: string; empresa: string }

export default function SupportModal({ onClose }: { onClose: () => void }) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [enviado, setEnviado] = useState<Enviado | null>(null)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    const data = Object.fromEntries(new FormData(event.currentTarget).entries()) as Record<string, string>
    try {
      const response = await fetch('/api/chamados', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome_empresa: data.nome_empresa,
          nif: data.nif,
          telefone_whatsapp: data.telefone_whatsapp,
          software: data.software,
          descricao_problema: data.descricao_problema,
        }),
      })
      const body = await response.json().catch(() => ({}))
      if (!response.ok || !body.ok) throw new Error(body.error || 'Não foi possível registar a solicitação.')
      setEnviado({ id: String(body.chamado_id || ''), empresa: data.nome_empresa || '' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="order-backdrop" onMouseDown={onClose}>
      <div className="order-modal" onMouseDown={(e) => e.stopPropagation()}>
        <button className="order-close" onClick={onClose} aria-label="Fechar"><X size={18} /></button>

        {enviado ? (
          <div className="order-success">
            <div className="order-success-icon"><BadgeCheck size={34} /></div>
            <span className="section-kicker">SUPORTE TÉCNICO</span>
            <h3>Solicitação recebida!</h3>
            <p>Solicitação recebida! Um técnico da CFTEC entrará em contacto em breve — responder-lhe-emos no WhatsApp indicado. Conserve o número do chamado.</p>
            <div className="order-ref"><span>Número do chamado</span><strong>{enviado.id ? enviado.id.slice(0, 8).toUpperCase() : '—'}</strong></div>
            <p className="order-success-note">Guarde o número do chamado: facilita o atendimento e o histórico da sua empresa.</p>
            <Button variant="outline" onClick={onClose}>Fechar</Button>
          </div>
        ) : (
          <>
            <div className="order-head">
              <span className="section-kicker">SUPORTE TÉCNICO · CHAMADO</span>
              <h3>Pedir apoio técnico</h3>
              <p>Descreva o problema com calma — chega directo ao Técnico de Suporte da CFTEC com prioridade.</p>
            </div>
            <form className="order-form" onSubmit={handleSubmit}>
              <div className="order-section">
                <span className="order-section-title"><Building2 size={14} /> Sua Empresa</span>
                <div className="order-grid">
                  <label>Nome da empresa<input name="nome_empresa" placeholder="Ex.: Morena Comercial S.A." required maxLength={150} /></label>
                  <div className="order-grid-2">
                    <label>NIF (opcional)<input name="nif" placeholder="Ex.: 5417xxxxxxx" maxLength={20} inputMode="numeric" /></label>
                    <label>Telefone / WhatsApp<input name="telefone_whatsapp" placeholder="+244 900 000 000" required maxLength={20} inputMode="tel" /></label>
                  </div>
                </div>
              </div>

              <div className="order-section">
                <span className="order-section-title"><Wrench size={14} /> Problema</span>
                <div className="order-grid">
                  <label>Software que está a usar<select name="software" defaultValue="PalancaSoft ERP" required>
                    {SofTEES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select></label>
                </div>
                <label className="order-notes">Descrição do problema / dúvida<textarea name="descricao_problema" rows={4} placeholder="Ex.: A impressora térmica de recibos deixou de comunicar via USB desde o encerramento de ontem — o caixa fica sem imprimir talões..." required minLength={10} maxLength={1200} /></label>
              </div>

              {error && <p className="order-error">{error}</p>}
              <div className="order-actions">
                <Button variant="outline" type="button" onClick={onClose}>Cancelar</Button>
                <Button type="submit" disabled={submitting}>{submitting ? 'A enviar…' : <>Enviar chamado <ArrowRight size={15} /></>}</Button>
              </div>
              <span className="order-footer"><LockKeyhole size={12} /> Entra directo na central de chamados da equipa técnica CFTEC.</span>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
