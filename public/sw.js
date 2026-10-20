/* ============================================================
 * CFTEC — Service Worker (Web Push + PWA de base conservadora)
 *
 * Regras anti-quebra:
 *  · API (/api/*), WebSocket (HMR/push) e requisicões não-GET NUNCA cacheiam
 *  · Em dev (localhost) o cache fica INACTIVO — Vite HMR nunca é interferido
 *  · Assets de produção (/assets/, nomes com hash) = cache-first renovável
 *  · Páginas/frames = network-first; cache só serve quando offline
 *  · Cache versionado (PWA_CACHE) — a activação remove versões antigas
 * ============================================================ */

const ICONE = '/cftec-icon.svg'
const URL_PADRAO = '/admin'
const PWA_CACHE = 'cftec-pwa-v1'

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((chaves) => Promise.all(chaves.filter((k) => k !== PWA_CACHE && k.startsWith('cftec-pwa')).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

const podePwaCache = (request, url) => {
  if (request.method !== 'GET') return false
  if (url.origin !== self.location.origin) return false
  if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') return false // dev: nunca cache
  if (url.pathname.startsWith('/api/')) return false // dados: sempre rede
  return true
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  let url
  try { url = new URL(request.url) } catch { return }
  if (!podePwaCache(request, url)) return

  // assets com hash de build → cache-first (Offline + velocidade, sem versões obsoletas)
  if (url.pathname.startsWith('/assets/') || url.pathname === '/manifest.webmanifest' || url.pathname.startsWith('/cftec-icon')) {
    event.respondWith(
      caches.open(PWA_CACHE).then(async (cache) => {
        const safer = await cache.match(request)
        if (safer) return safer
        const resposta = await fetch(request)
        if (resposta.ok) cache.put(request, resposta.clone())
        return resposta
      }).catch(() => fetch(request))
    )
    return
  }

  // páginas e imagens do site → network-first (o utilizador vê sempre o mais novo; offline cai no cache)
  event.respondWith(
    fetch(request)
      .then(async (resposta) => {
        if (resposta.ok && (request.mode === 'navigate' || url.pathname.startsWith('/cftec-'))) {
          const cache = await caches.open(PWA_CACHE)
          cache.put(request, resposta.clone())
        }
        return resposta
      })
      .catch(async () => {
        const cacheada = await caches.match(request)
        if (cacheada) return cacheada
        if (request.mode === 'navigate') {
          // offline sem cache → página offline simples (não quebra, avisa)
          return new Response('<meta charset="utf-8"><body style="font-family:Arial;padding:40px;background:#0e1726;color:#e2e8f0"><h2>CFTEC — está offline</h2><p>Reconecta o dispositivo para abrir o site e o painel. As notificações Push continuam a chegar quando retornes à rede.</p></body>', { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
        }
        throw new Error('offline e sem cache')
      })
  )
})

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
