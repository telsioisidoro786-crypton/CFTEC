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

-- 5) ORIGEM 'portal' — a migração v2 do chamado só aceitava (painel|site|whatsapp);
--    os chamados abertos pelo portal do cliente (Parte 2) usam origem='portal'
--    e falham com "violates check constraint chamados_suporte_origem_check".
do $$ begin
  alter table public.chamados_suporte drop constraint chamados_suporte_origem_check;
exception when others then null; -- constraint inexiste/renomeada: entra logo no re-create abaixo
end $$;
do $$ begin
  alter table public.chamados_suporte
    drop constraint if exists chamados_suporte_origem_check,
    add constraint chamados_suporte_origem_check
      check (origem in ('painel', 'site', 'whatsapp', 'portal'));
exception when others then null; -- já criada com a lista nova (corrida duas vezes)
end $$;

