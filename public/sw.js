/* ============================================================
 * CFTEC — Service Worker de Notificações Web Push (gratuito, via VAPID)
 * Escuta o evento "push" (serviço de push do próprio browser: FCM/Mozilla
 * autopush — zero custo, sem Firebase SDK) e mostra uma notificação
 * nativa do sistema com ícone da CFTEC e acção directa para o painel.
 * ============================================================ */

const ICONE = '/cftec-icon.svg'
const URL_PADRAO = '/admin'

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))

/* ---- push recebido do servidor (middleware CFTEC via web-push) ---- */
self.addEventListener('push', (event) => {
  let dados = {}
  try {
    dados = event.data ? event.data.json() : {}
  } catch {
    dados = { title: 'CFTEC', body: event.data ? event.data.text() : 'Novidade no painel admin.' }
  }
  const titulo = dados.title || (dados.type === 'chamado' ? '🛠️ Novo chamado de suporte' : '📋 Novo pedido de licença')
  const opcoes = {
    body: dados.body || 'Toque para abrir o painel administrativo.',
    icon: ICONE,
    badge: ICONE,
    tag: dados.tag || dados.type || 'cftec',
    data: { url: dados.url || URL_PADRAO },
    vibrate: [110, 60, 110],
    requireInteraction: false,
  }
  event.waitUntil(self.registration.showNotification(titulo, opcoes))
})

/* ---- clique na notificação → abre/foca o painel admin ---- */
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = (event.notification.data && event.notification.data.url) || URL_PADRAO
  const destino = new URL(url, self.location.origin).href

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((lista) => {
      // já existe uma janela do site aberta? foca-a e navega para o painel
      for (const cliente of lista) {
        if (cliente.url.startsWith(self.location.origin)) {
          cliente.navigate(destino)
          return cliente.focus()
        }
      }
      return self.clients.openWindow(destino)
    })
  )
})
