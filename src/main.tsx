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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Toaster />
    <Suspense fallback={<Antecamara />}>
      {window.location.pathname.startsWith('/admin') ? <AdminDashboard /> : <App />}
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
