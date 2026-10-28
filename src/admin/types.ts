// Tipos partilhados do painel admin (Fase 2 — movidos de AdminDashboard.tsx)

export type Chamado = { id: string; created_at: string; updated_at: string; cliente: string; nif: string | null; software: string | null; problema: string; resolucao: string | null; estado: string; prioridade: string; telefone?: string | null; origem?: string | null; sla_horas?: number | null; prazo_sla?: string | null; resolvido_em?: string | null; escalonado?: boolean | null; csat?: number | null }

export type ChamadoMensagem = { id: string; created_at: string; autor: 'cliente' | 'tecnico' | 'sistema'; autor_nome: string | null; corpo: string }

export type Software = { id: string; name: string; version: string; description?: string | null; price?: number | null; category?: string | null; changelog?: string | null; file_url?: string; file_size: string; downloads_count: number; is_active?: boolean; created_at: string }

export type WikiArtigo = { id: string; created_at: string; updated_at: string; titulo: string; software: string | null; problema: string; solucao: string; tags: string | null; autor: string | null; visivel_cliente?: boolean | null; ajudou?: number | null }
