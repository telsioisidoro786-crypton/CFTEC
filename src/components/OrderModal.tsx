import { type FormEvent, useState } from 'react'
import { ArrowRight, BadgeCheck, Building2, Check, Copy, Landmark, LockKeyhole, UserRound, X } from 'lucide-react'
import { Button } from './ui/button'

type OrderProduct = { name: string; category?: string | null; price?: number | null }

type Confirmed = {
  id: string
  empresa: string
  nif: string
  forma: string
  iban: string
  whatsapp: string
}

const digits = (v: string) => v.replace(/[^\d]/g, '')

const waLink = (number: string, text: string) => {
  const num = digits(number || '')
  return `https://wa.me/${num.startsWith('244') ? num : num ? '244' + num : ''}?text=${encodeURIComponent(text)}`
}

export default function OrderModal({ product, onClose }: { product: OrderProduct | null; onClose: () => void }) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [confirmed, setConfirmed] = useState<Confirmed | null>(null)
  const [copied, setCopied] = useState(false)

  if (!product) return null

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    const data = Object.fromEntries(new FormData(event.currentTarget).entries()) as Record<string, string>
    try {
      const response = await fetch('/api/license-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, software_nome: product.name }),
      })
      const body = await response.json().catch(() => ({}))
      if (!response.ok || !body.ok) throw new Error(body.error || 'Não foi possível registar o pedido.')
      setConfirmed({
        id: String(body.pedido_id || ''),
        empresa: data.nome_empresa || '',
        nif: data.nif || '',
        forma: body.payment?.forma || 'Transferência Bancária / IBAN',
        iban: body.payment?.iban || '',
        whatsapp: body.payment?.whatsapp || '',
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  const copyIban = async () => {
    try {
      await navigator.clipboard.writeText(confirmed?.iban || '')
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2200)
    } catch {
      setCopied(false)
    }
  }

  const waMessage = confirmed
    ? `Olá CFTEC! Acabei de fazer o pedido de licença para a empresa ${confirmed.empresa} (NIF: ${confirmed.nif}). Segue o comprovativo para validação.`
    : ''

  return (
    <div className="order-backdrop" onMouseDown={onClose}>
      <div className="order-modal" onMouseDown={(e) => e.stopPropagation()}>
        <button className="order-close" onClick={onClose} aria-label="Fechar"><X size={18} /></button>

        {confirmed ? (
          <div className="order-success">
            <div className="order-success-icon"><BadgeCheck size={34} /></div>
            <span className="section-kicker">CHECKOUT B2B</span>
            <h3>Pedido de Licença Registado com Sucesso!</h3>
            <p>Guarde o número do pedido — indique-o sempre nas comunicações com a CFTEC.</p>
            <div className="order-ref"><span>Número do pedido</span><strong>{confirmed.id.slice(0, 8).toUpperCase()}</strong></div>

            {confirmed.forma.includes('IBAN') && (
              <div className="order-payment">
                <div className="order-payment-head"><Landmark size={16} /> Pagamento por transferência</div>
                <div className="order-iban">
                  <div><small>IBAN da CFTEC</small><strong>{confirmed.iban || '(a confirmar pelo WhatsApp)'}</strong></div>
                  <button onClick={copyIban} title="Copiar IBAN">{copied ? <Check size={15} /> : <Copy size={15} />}</button>
                </div>
                <p>Após a transferência, envie o comprovativo pelo WhatsApp para confirmarmos em minutos. Indique sempre o número do pedido.</p>
              </div>
            )}
            {confirmed.forma === 'Multicaixa Express' && (
              <div className="order-payment">
                <div className="order-payment-head"><Landmark size={16} /> Pagamento por Multicaixa Express</div>
                <p>A equipa comercial envia o número de e-mail da conta CFTEC pelo WhatsApp. Indique sempre o número do pedido no campo de perfil do pagamento.</p>
              </div>
            )}

            <a className="order-whatsapp-btn" href={waLink(confirmed.whatsapp, waMessage)} target="_blank" rel="noreferrer noopener">
              Enviar comprovativo no WhatsApp <ArrowRight size={16} />
            </a>
            <p className="order-success-note">O acesso de licença é emitido após confirmação do pagamento pela equipa CFTEC.</p>
          </div>
        ) : (
          <>
            <div className="order-head">
              <span className="section-kicker">CHECKOUT B2B · LICENÇA</span>
              <h3>{product.name}</h3>
              <p>Pedido de licença comercial — sem pagamento imediato. A equipa confirma a disponibilidade e envia os dados de facturação.</p>
            </div>
            <form className="order-form" onSubmit={handleSubmit}>
              <div className="order-section">
                <span className="order-section-title"><Building2 size={14} /> Informações da Empresa</span>
                <div className="order-grid">
                  <label>Nome da Empresa<input name="nome_empresa" placeholder="Ex.: Morena Comercial S.A." required maxLength={160} /></label>
                  <div className="order-grid-2">
                    <label>NIF<input name="nif" placeholder="Ex.: 5417xxxxxxx" required minLength={9} maxLength={20} inputMode="numeric" /></label>
                    <label>Província / Cidade<input name="provincia" placeholder="Ex.: Luanda" required maxLength={60} /></label>
                  </div>
                </div>
              </div>

              <div className="order-section">
                <span className="order-section-title"><UserRound size={14} /> Contacto do Responsável</span>
                <div className="order-grid">
                  <label>Nome completo<input name="nome_responsavel" placeholder="O seu nome" required maxLength={150} /></label>
                  <div className="order-grid-2">
                    <label>Telefone / WhatsApp<input name="telefone_whatsapp" placeholder="+244 900 000 000" required maxLength={20} inputMode="tel" /></label>
                    <label>E-mail (opcional)<input name="email" type="email" placeholder="financeiro@empresa.co.ao" maxLength={160} /></label>
                  </div>
                </div>
              </div>

              <div className="order-section">
                <span className="order-section-title"><Landmark size={14} /> Opções de Licença</span>
                <div className="order-grid">
                  <label>Software<output className="order-software-out">{product.name}</output></label>
                  <label>Forma de pagamento<select name="forma_pagamento" defaultValue="Transferência Bancária / IBAN" required>
                    <option value="Transferência Bancária / IBAN">Transferência Bancária / IBAN</option>
                    <option value="Multicaixa Express">Multicaixa Express</option>
                  </select></label>
                </div>
                <label className="order-notes">Observações (opcional)<textarea name="observacoes" rows={3} placeholder="Ex.: instalação nos 12 postos, formação presencial, facturas para AGT..." maxLength={1000} /></label>
              </div>

              {error && <p className="order-error">{error}</p>}
              <div className="order-actions">
                <Button variant="outline" type="button" onClick={onClose}>Cancelar</Button>
                <Button type="submit" disabled={submitting}>{submitting ? 'A registar…' : <>Registar pedido <ArrowRight size={15} /></>}</Button>
              </div>
              <span className="order-footer"><LockKeyhole size={12} /> Os seus dados ficam exclusivamente na base da CFTEC e são usados só para a licença.</span>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
