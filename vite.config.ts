import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import type { IncomingMessage, ServerResponse } from 'node:http'
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

export default defineConfig({
  plugins: [react(), adminApi()],
  server: { port: 3000, host: '0.0.0.0', hmr: { protocol: 'wss', clientPort: 443 } },
})
