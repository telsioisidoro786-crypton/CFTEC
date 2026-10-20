import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import AdminDashboard from './AdminDashboard'
import { Toaster } from './components/ui/toaster'
import './styles.css'
import './admin.css'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Toaster />
    {window.location.pathname.startsWith('/admin') ? <AdminDashboard /> : <App />}
  </StrictMode>,
)

// PWA: registra o service worker uma única vez (push + instalável + cache
// conservador — nada é cacheado em dev, APIs nunca, páginas network-first).
if ('serviceWorker' in navigator && window.isSecureContext) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => { /* sem SW: site continua 100% funcional */ })
  })
}
