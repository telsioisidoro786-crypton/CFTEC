import type { IncomingMessage, ServerResponse } from 'node:http'
import { cftecApi } from '../server/api.js'

/**
 * CFTEC — função única do backend em produção (Vercel).
 * Todas as rotas /api/* (login do painel, licenciamento, pedidos, contactos,
 * chamados, upgrade/manutenção, etc.) correm no mesmo código que o dev server
 * (server/api.ts) — dev e produção nunca divergem.
 */
export default function handler(req: IncomingMessage, res: ServerResponse): void {
  void cftecApi(req, res, () => {
    res.statusCode = 404
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.end(JSON.stringify({ ok: false, error: 'Rota não encontrada.' }))
  })
}
