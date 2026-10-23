-- ============================================================
-- CFTEC · Monitorização de erros (logs_erros)
-- Tabela única para erros do browser (client) e do middleware
-- (server). O server escreve com SERVICE_ROLE — RLS 100% fechada
-- garante que ninguém do anon insere ou lê por fora.
-- O painel (super_admin/developer) lê via /api/admin/log-erros.
-- Idempotente: pode correr-se repetidamente sem efeitos colaterais.
-- ============================================================

create table if not exists public.logs_erros (
  id         uuid primary key default gen_random_uuid(),
  criado_em  timestamptz not null default now(),
  origem     text not null check (origem in ('client', 'server')),
  nivel      text not null default 'erro' check (nivel in ('erro', 'aviso')),
  -- resumo curto valido (ex.: "TypeError: Cannot read properties of null")
  mensagem   text not null,
  -- stack trace (client) ou detalhe técnico (server) — truncado a 4k
  detalhe    text,
  pagina     text,             -- URL onde apanhou (client) ou rota API (server)
  user_agent text,
  contexto   jsonb,            -- extra: componente, action, chamada em causa…
  resolvido  boolean not null default false,
  resolvido_por text,
  resolvido_em  timestamptz
);

-- índices de leitura: duvidas do painel por data/estado
create index if not exists idx_logs_erros_criado_em on public.logs_erros (criado_em desc);
create index if not exists idx_logs_erros_resolvido on public.logs_erros (resolvido, criado_em desc);

-- RLS fechada: só o service_role (backend) toca na tabela
alter table public.logs_erros enable row level security;

-- dedupe por roda: limpar registos antigos automáticos manual é opcional.
-- (Painel → Monitorização "Limpar resolvidos antigos" usa DELETE na rota admin.)
