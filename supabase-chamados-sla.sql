-- ============================================================================
-- CFTEC — PARTE 3: CHAMADOS COM SLA, CONVERSA, CSAT E MÉTRICAS
-- Idempotente: pode ser corrido várias vezes.
--  1) chamados_suporte: prazo SLA, tempo resolvido, escalonamento, CSAT
--  2) chamados_mensagens: thread de conversa por chamado (cliente ↔ técnico)
-- ============================================================================

-- 1) SLA / CICLO DE VIDA no chamado
alter table chamados_suporte add column if not exists sla_horas    integer;
alter table chamados_suporte add column if not exists prazo_sla    timestamptz;
alter table chamados_suporte add column if not exists resolvido_em timestamptz;
alter table chamados_suporte add column if not exists escalonado   boolean not null default false;
alter table chamados_suporte add column if not exists csat         integer check (csat between 1 and 5);
alter table chamados_suporte add column if not exists csat_comentario text;

-- 2) THREAD DE CONVERSA — cada resposta do técnico/cliente é uma linha
create table if not exists chamados_mensagens (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  chamado_id uuid not null,                 -- chamados_suporte.id
  autor      text not null default 'sistema' check (autor in ('cliente', 'tecnico', 'sistema')),
  autor_nome text,
  corpo      text not null
);
create index if not exists chamados_mensagens_chamado_idx on chamados_mensagens (chamado_id, created_at);

-- 3) SEGURANÇA: só o servidor (service role) toca nestes dados
alter table chamados_mensagens enable row level security;
alter table chamados_mensagens replica identity full;

-- 4) Metadados do escalonamento automático (cron-lazy, 1×/hora no primeiro acesso admin)
do $$ begin
  insert into settings (key, value) values ('_sla_ultimo_cron', '');
exception when others then null; -- settings sem unique(key) ou já existente: ignora
end $$;
