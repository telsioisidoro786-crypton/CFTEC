import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { cpSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { cftecApi } from './server/api'

// O backend inteiro vive em server/api.ts — aqui só o ligamos ao dev server.
const adminApi = (): Plugin => ({
  name: 'cftec-admin-api',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      void cftecApi(req as IncomingMessage, res as ServerResponse, next as unknown as () => void)
    })
  },
})

// PARTE 8.0 — o portal institucional estático (portal/) acompanha o build para
// ficar em produção em /portal/ (o Vercel serve a dist; o SPA-fallback não toca nestas rotas).
const copiaPortal = (): Plugin => ({
  name: 'cftec-portal-estatico',
  closeBundle() {
    cpSync(fileURLToPath(new URL('./portal', import.meta.url)), fileURLToPath(new URL('./dist/portal', import.meta.url)), { recursive: true })
  },
})

export default defineConfig({
  plugins: [react(), adminApi(), copiaPortal()],
  server: { port: 3000, host: '0.0.0.0', hmr: { protocol: 'wss', clientPort: 443 } },
})
