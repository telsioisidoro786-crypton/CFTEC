import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from './components/ui/toaster'
import './styles.css'
import './admin.css'
import './index.css'

// Code-splitting: site e painel admin são bundles independentes.
// O AdminDashboard não arrasta three/gsap/animejs (estão no chunk anim-3d do site)
// e quem entra no site não descarrega todo o painel.
const App = lazy(() => import('./App'))
const AdminDashboard = lazy(() => import('./AdminDashboard'))
const ClientePortal = lazy(() => import('./ClientePortal'))

function Antecamara() {
  return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0e1726' }}>
      <span
        aria-label="A carregar"
        style={{ width: 34, height: 34, borderRadius: '50%', border: '3px solid rgba(226,232,240,.18)', borderTopColor: '#00e5ff', animation: 'cftec-boot-spin .8s linear infinite' }}
      />
      <style>{'@keyframes cftec-boot-spin{to{transform:rotate(360deg)}}'}</style>
    </div>
  )
}

// Monitorização: erros JS (crash de render e rejeições soltas) vão ao backend →
// tabela logs_erros → painel (Monitorização). Fire-and-forget absoluto: nunca
// interrompe a app e, sem back-end, mantém silêncio.
let cftecLogUltimo = ''
let cftecLogEnviados = 0
function cftecReportErro(mensagem: string, detalhe?: string) {
  try {
    // dedupe: o mesmo erro repetido (5.ª vez, MaxListeners, loop de animação)
    // não cria dezenas de linhas na tabela
    if (mensagem === cftecLogUltimo && cftecLogEnviados >= 5) return
    if (mensagem !== cftecLogUltimo) { cftecLogUltimo = mensagem; cftecLogEnviados = 0 }
    cftecLogEnviados++
    void fetch('/api/log-erro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mensagem: mensagem.slice(0, 500), detalhe: detalhe?.slice(0, 4000), pagina: window.location.href }),
      keepalive: true,
      credentials: 'omit',
    }).catch(() => {})
  } catch { /* fire-and-forget absoluto */ }
}
window.addEventListener('error', (e) => {
  cftecReportErro(e.message || 'Erro no window', e.error && (e.error.stack || e.error.message))
})
window.addEventListener('unhandledrejection', (e) => {
  const r = e.reason
  cftecReportErro(r instanceof Error ? r.message : String(r ?? 'Promise rejeitada'), r instanceof Error ? `${r.message}\n${r.stack}` : undefined)
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Toaster />
    <Suspense fallback={<Antecamara />}>
      {window.location.pathname.startsWith('/admin') ? <AdminDashboard /> : window.location.pathname.startsWith('/cliente') ? <ClientePortal /> : <App />}
    </Suspense>
  </StrictMode>,
)

// PWA: registra o service worker uma única vez (push + instalável + cache
// conservador — nada é cacheado em dev, APIs nunca, páginas network-first).
if ('serviceWorker' in navigator && window.isSecureContext) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => { /* sem SW: site continua 100% funcional */ })
  })
}
