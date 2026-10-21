-- CFTEC · Sessões de administrador persistentes (server-less)
-- O middleware valida o jti de cada sessão; em production a memória de
-- cada instância é volátil, por isso os jti ficam nesta tabela (Supabase).
-- Executar UMA vez no SQL Editor.

create table if not exists admin_sessions (
  id         uuid primary key default gen_random_uuid(),
  user_id    text not null,
  jti        text not null unique,
  issued_at  bigint not null,
  created_at timestamptz not null default now()
);

create index if not exists admin_sessions_user_id_idx  on admin_sessions (user_id);
create index if not exists admin_sessions_issued_at_idx on admin_sessions (issued_at);

-- O middleware usa SERVICE ROLE (contorna RLS); a tabela não é acessível
-- pelas public API keys. Higiene: linhas > 30 dias são apagadas no login.
alter table admin_sessions enable row level security;
