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
