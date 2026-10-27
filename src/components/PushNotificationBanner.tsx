import { useEffect, useState } from 'react'
import { Bell, BellOff, CheckCircle2 } from 'lucide-react'
import { Button } from './ui/button'
import { IconBell, IconLock } from './animIcons'

/**
 * PushNotificationBanner — activação discreta das notificações Web Push
 * no painel admin (alertas chegam mesmo com o painel fechado, via
 * service worker + serviço de push do browser; gratuito, sem Firebase).
 *
 * Estados: permission 'default' → botão de activação;
 *          'granted' → pill "Alertas activos" + envio de teste;
 *          'denied' → aviso de desbloqueio nas definições do browser.
 */

type Estado = 'verificando' | 'default' | 'granted' | 'denied' | 'sem-suporte' | 'desligado'

// Converte a chave VAPID (URL-safe base64) para Uint8Array exigido pelo pushManager
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = window.atob(base64)
  const output = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; ++i) output[i] = raw.charCodeAt(i)
  return output
}

export default function PushNotificationBanner() {
  const [estado, setEstado] = useState<Estado>('verificando')
  const [aEnviar, setAEnviar] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    let morto = false
    if (!('serviceWorker' in navigator) || !('Notification' in window) || !('PushManager' in window)) {
      setEstado('sem-suporte')
      return
    }
    navigator.serviceWorker.register('/sw.js').catch(() => {})
    fetch('/api/admin/push-key', { credentials: 'include' })
      .then(async (r) => {
        if (morto) return
        if (r.status === 501) return setEstado('desligado')
        if (!r.ok) return setEstado('sem-suporte')
        if (Notification.permission === 'denied') return setEstado('denied')
        if (Notification.permission !== 'granted') return setEstado('default')
        // permissão concedida conta só se o dispositivo está mesmo subscrito
        let subscrito = false
        try {
          const reg = await navigator.serviceWorker.ready
          subscrito = !!(await reg.pushManager.getSubscription())
        } catch { /* sem SW activo ainda */ }
        setEstado(subscrito ? 'granted' : 'default')
      })
      .catch(() => { if (!morto) setEstado('sem-suporte') })
    return () => { morto = true }
  }, [])

  const activar = async () => {
    setMsg('')
    try {
      setEstado((await Notification.requestPermission()) as NotificationPermission as Estado)
      if (Notification.permission !== 'granted') return
      // 1. chave VAPID → 2. subscrição no serviço de push do browser → 3. grava no servidor
      const rKey = await fetch('/api/admin/push-key', { credentials: 'include' })
      const { publicKey } = await rKey.json() as { publicKey?: string }
      if (!publicKey) throw new Error('Chave VAPID indisponível.')
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(publicKey) })
      const json = sub.toJSON() as { endpoint?: string; keys?: { p256dh?: string; auth?: string } }
      const resposta = await fetch('/api/admin/push-subscribe', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
      })
      if (!resposta.ok) throw new Error('Falha ao registar o dispositivo no servidor.')
      setMsg('Alertas activos neste dispositivo!')
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Não foi possível activar os alertas.')
    }
  }

  const enviarTeste = async () => {
    setMsg('')
    setAEnviar(true)
    try {
      const r = await fetch('/api/admin/push-test', { method: 'POST', credentials: 'include' })
      const body = await r.json().catch(() => ({}))
      setMsg(r.ok ? 'Teste enviado — confira a notificação do sistema.' : body.error || 'Sem subscrição activa.')
    } finally {
      setAEnviar(false)
    }
  }

  if (estado === 'verificando' || estado === 'desligado' || estado === 'sem-suporte') return null

  if (estado === 'granted') {
    return (
      <div className="push-banner push-banner--on" role="status">
        <CheckCircle2 size={14} />
        <span><strong><IconBell size={13} /> Alertas activos</strong> — novos pedidos e chamados chegam ao seu dispositivo, mesmo com o painel fechado.</span>
        <Button size="sm" variant="outline" onClick={enviarTeste} disabled={aEnviar}>{aEnviar ? 'A enviar…' : 'Enviar teste'}</Button>
        {msg && <small>{msg}</small>}
      </div>
    )
  }

  return (
    <div className="push-banner" role="status">
      {estado === 'denied' ? <BellOff size={14} /> : <Bell size={14} />}
      {estado === 'denied'
        ? <span><strong>Alertas bloqueados</strong> — permitir o CFTEC nas definições do browser (ícone <IconLock size={11} /> na barra de endereço).</span>
        : <span><strong>Novos pedidos e chamados para si</strong> — active os alertas e seja avisado no ecrã, sem abrir o painel.</span>}
      {estado !== 'denied' && <Button size="sm" onClick={activar}><IconBell size={13} /> Ativar Alertas de Novos Pedidos</Button>}
      {msg && <small>{msg}</small>}
    </div>
  )
}
