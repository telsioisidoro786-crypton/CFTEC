-- CFTEC · Segurança do login: lockout por IP+e-mail, 2FA (TOTP) e sessões com dispositivo
-- Executar UMA vez no SQL Editor do Supabase.

-- 1) Contador de falhas de login (lockout). chave = ip '|' email.
create table if not exists login_rate (
  chave         text primary key,
  falhas        integer not null default 0,
  janela_inicio bigint not null default 0,
  bloqueado_ate bigint not null default 0,
  updated_at    bigint not null default 0
);

create index if not exists login_rate_updated_idx on login_rate (updated_at);

-- O middleware usa SERVICE ROLE (contorna RLS); as public keys nunca acedem.
alter table login_rate enable row level security;

-- 2) 2FA (TOTP) por utilizador admin.
alter table admin_users add column if not exists twofa_secret  text;
alter table admin_users add column if not exists twofa_enabled boolean not null default false;

-- 3) Sessões: registo do navegador/dispositivo (preenchido no início de sessão).
alter table admin_sessions add column if not exists user_agent text;

-- 4) Bucket privado dos backups automáticos (um ficheiro JSON por dia, manter 30).
insert into storage.buckets (id, name, public)
values ('backups', 'backups', false)
on conflict (id) do nothing;
