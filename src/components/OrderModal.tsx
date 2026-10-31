import { type FormEvent, useState } from 'react'
import { ArrowRight, BadgeCheck, Building2, Check, CircleCheck, Copy, Landmark, Loader2, LockKeyhole, Paperclip, Smartphone, UserRound, X } from 'lucide-react'
import { Button } from './ui/button'

type OrderProduct = { name: string; category?: string | null; price?: number | null }

type Confirmed = {
  id: string
  ref: string
  empresa: string
  nif: string
  forma: string
  iban: string
  whatsapp: string
}

type UploadState = 'idle' | 'uploading' | 'ok' | 'erro'

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
  const [compEstado, setCompEstado] = useState<UploadState>('idle')
  const [compErro, setCompErro] = useState('')

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
        ref: String(body.ref || 'CF-' + String(body.pedido_id || '').replace(/-/g, '').slice(0, 6).toUpperCase()),
        empresa: data.nome_empresa || '',
        nif: data.nif || '',
        forma: body.payment?.forma || 'Transferência Bancária / IBAN',
        iban: body.payment?.iban || '',
        whatsapp: body.payment?.whatsapp || '',
      })
      setCompEstado('idle')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  // Anexo do comprovativo — print/PDF do pagamento vai directo ao painel (sem gateway)
  const handleComprovativo = async (file: File | null) => {
    if (!file || !confirmed) return
    setCompEstado('uploading')
    setCompErro('')
    try {
      const b64 = ((await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result || ''))
        reader.onerror = () => reject(new Error('ficheiro'))
        reader.readAsDataURL(file)
      })).split(',')[1] || '')
      if (!b64) throw new Error('Não foi possível ler o ficheiro.')
      if (b64.length > 2800000) throw new Error('O ficheiro passa de ~2 MB — comprima o print e tente de novo.')
      const response = await fetch(`/api/license-orders/${confirmed.id}/comprovativo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comprovativo_nome: file.name.slice(0, 200), comprovativo_b64: b64 }),
      })
      const body = await response.json().catch(() => ({}))
      if (!response.ok || !body.ok) throw new Error(body.error || 'O envio do comprovativo falhou.')
      setCompEstado('ok')
    } catch (err) {
      setCompEstado('erro')
      setCompErro(err instanceof Error ? err.message : 'O envio do comprovativo falhou.')
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
    ? `Olá CFTEC! Comprovativo do pedido de licença ${confirmed.ref} para a empresa ${confirmed.empresa} (NIF: ${confirmed.nif}). Segue o anexo para validação.`
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
            <p>Guarde a referência — indique-a sempre no comprovativo de transferência e nas comunicações com a CFTEC.</p>
            <div className="order-ref"><span>Referência do pedido</span><strong>{confirmed.ref}</strong></div>

            {confirmed.forma.includes('IBAN') && (
              <div className="order-payment">
                <div className="order-payment-head"><Landmark size={16} /> 1.º — Pagar por transferência</div>
                <div className="order-iban">
                  <div><small>IBAN da CFTEC</small><strong>{confirmed.iban || '(a confirmar pelo WhatsApp)'}</strong></div>
                  <button onClick={copyIban} title="Copiar IBAN">{copied ? <Check size={15} /> : <Copy size={15} />}</button>
                </div>
                <p>No descritivo da transferência escreva <b>{confirmed.ref}</b> — assim o extracto do banco valida-se contra o painel num relance.</p>
              </div>
            )}
            {confirmed.forma.includes('Multicaixa') && (
              <div className="order-payment">
                <div className="order-payment-head"><Smartphone size={16} /> 1.º — Pagar por Multicaixa Express</div>
                <p>A equipa CFTEC envia para o seu Multicaixa Express (número <b>{confirmed.whatsapp ? `+${digits(confirmed.whatsapp)}` : 'do contacto registado'}</b>) o pedido de pagamento <b>{confirmed.ref}</b>. Autorize no seu telemóvel — não precisa de ir ao banco nem de transferência.</p>
              </div>
            )}

            <label className="order-upload">
              <input type="file" accept="image/png,image/jpeg,image/webp,application/pdf" disabled={compEstado === 'uploading' || compEstado === 'ok'} onChange={(e) => { void handleComprovativo(e.target.files?.[0] || null) }} />
              <span className="order-upload-btn">
                {compEstado === 'uploading' ? <Loader2 size={15} className="animate-spin" /> : compEstado === 'ok' ? <CircleCheck size={15} /> : <Paperclip size={15} />}
                {compEstado === 'ok' ? 'Comprovativo recebido pela equipa ✓' : '2.º — Anexar o comprovativo (print/foto/PDF · máx. 2 MB)'}
              </span>
              {compEstado === 'ok' ? <small>O pedido passou automaticamente a «Em Verificação» no painel da CFTEC — aguarde a emissão da licença.</small>
                : compEstado === 'erro' ? <small className="order-upload-erro">{compErro || 'Tente novamente ou envie pelo WhatsApp.'}</small>
                : compEstado === 'uploading' ? <small>A enviar com segurança…</small>
                : <small>Directo ao painel da CFTEC — evita o WhatsApp e chega ao comercial em segundos.</small>}
            </label>

            <a className="order-whatsapp-btn" href={waLink(confirmed.whatsapp, waMessage)} target="_blank" rel="noreferrer noopener">
              Ou envie o comprovativo no WhatsApp <ArrowRight size={16} />
            </a>
            <p className="order-success-note">A licença é emitida após a confirmação do pagamento pela equipa CFTEC.</p>
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
