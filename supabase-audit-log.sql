-- ============================================================
-- CFTEC · Audit Log — histórico de acções do painel e do site
-- Idempotente: pode ser corrido várias vezes sem efeitos colaterais.
-- Escrever/ler acontece DO LADO DO MIDDLEWARE (service role) —
-- RLS activado SEM políticas: ninguém fora do backend toca nos registos.
-- ============================================================

create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  actor_email text not null,            -- quem fez (e-mail do admin; 'site público' nos formulários anónimos)
  actor_level text,                     -- super_admin / gestor / tecnico / developer / null (= público)
  acao text not null,                   -- código da acção (ex.: pedido_estado, wiki_apagado, licenca_alterada)
  entidade text not null,               -- tipo de alvo (pedido, chamado, wiki, utilizador, ...)
  entidade_id text,                     -- id do alvo quando existe
  detalhe text                          -- JSON pequeno com campos relevantes (transição de estado, campos tocados)
);

create index if not exists audit_log_recente_idx on public.audit_log (created_at desc);

alter table public.audit_log enable row level security;

-- NOTA: sem CREATE POLICY nesta tabela de propósito. O middleware usa a service role
-- (que ignora RLS); o anon key nunca consegue ler nem escrever o histórico.
