// Tipos partilhados do painel admin (Fase 2 — movidos de AdminDashboard.tsx)

export type Chamado = { id: string; created_at: string; updated_at: string; cliente: string; nif: string | null; software: string | null; problema: string; resolucao: string | null; estado: string; prioridade: string; telefone?: string | null; origem?: string | null; sla_horas?: number | null; prazo_sla?: string | null; resolvido_em?: string | null; escalonado?: boolean | null; csat?: number | null }

export type ChamadoMensagem = { id: string; created_at: string; autor: 'cliente' | 'tecnico' | 'sistema'; autor_nome: string | null; corpo: string }

export type Software = { id: string; name: string; version: string; description?: string | null; price?: number | null; category?: string | null; changelog?: string | null; file_url?: string; file_size: string; downloads_count: number; is_active?: boolean; created_at: string }

export type WikiArtigo = { id: string; created_at: string; updated_at: string; titulo: string; software: string | null; problema: string; solucao: string; tags: string | null; autor: string | null; visivel_cliente?: boolean | null; ajudou?: number | null }

// Developer — sysLic, backups e alertas (Fase Developer — movidos de AdminDashboard.tsx)

export type SysLic = {
  licencaAtiva: boolean; moduloComercial: boolean; moduloTecnico: boolean; moduloNovidades: boolean
  moduloFaturacao: boolean; moduloRelatorios: boolean
  expiraEm: string; mensagem: string
  diasAviso: number; maxUsuarios: number; maxStorageMb: number; somenteLeitura: boolean
  expirada: boolean; licencaEfetiva: boolean
  estado?: 'activa' | 'aviso' | 'expirada' | 'suspensa' | 'leitura'
  diasParaVencer: number | null
  storageUsadoMb?: number | null
  bypassActivo?: boolean
}

export type BackupFicheiro = { nome: string; gerado_em: string | null; tamanho: number }

export type BackupPrever = { ficheiro: string; gerado_em: string | null; por: string | null; tabelas: { tabela: string; noFicheiro: number; naBase: number; faltam: number }[] }

export type AlertaRow = { id: string; criado_em: string; canal: 'callmebot' | 'email' | 'push'; texto: string; estado: 'enviado' | 'falhou' | 'saltou'; detalhe: string | null }

export type RepoEmpresa = { nif: string; nome: string; downloads: number; chamados: number; ultimo: string | null; activas: number; expira: string | null; anualKz: number | null }

export type AnalyticsState = { ok?: boolean; mrrKz: number; arrKz: number; receita12: number; meses12: { mes: string; label: string; total: number; ft: number }[]; licencas: { activas: number; expirando30d: number; churn30d: number; churnRate: number }; empresas: RepoEmpresa[] } | null


export type AuditRow = { id: string; created_at: string; actor_email: string; actor_level: string | null; acao: string; entidade: string; entidade_id: string | null; detalhe: string | null }

// Settings — utilizadores, sessões e log de erros (Fase Settings — movidos de AdminDashboard.tsx)

export type AdminUserRow = { id: string; name: string; email: string; role: string; is_active: boolean; created_at: string }

export type SessaoActiva = { jti: string; actual: boolean; emitida: string; dispositivo: string }

export type LogErroRow = { id: string; criado_em: string; origem: 'client' | 'server'; nivel: string; mensagem: string; detalhe: string | null; pagina: string | null; user_agent: string | null; resolvido: boolean }
