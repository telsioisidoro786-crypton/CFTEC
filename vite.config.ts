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
  // HMR: sem override — Vite infere ws/wss pelo protocolo da página
  // (http local: ws://localhost:3000; https através de proxy: wss na porta da página).
  // O override antigo { protocol: 'wss', clientPort: 443 } era para um preview
  // por proxy e partia o WebSocket em dev local (connection failed).
  server: { port: 3000, host: '0.0.0.0' },
  build: {
    chunkSizeWarningLimit: 700,
    // three.module (689kb) sai do bundle do site por dyn import e só carrega
    // depois do first paint para quem vê a cena 3D do hero — não é regressão.
  },
})
