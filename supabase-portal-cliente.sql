-- ============================================================================
-- CFTEC — PARTE 2: PORTAL DO CLIENTE (self-service) + SESSÕES
-- Idempotente: pode ser corrido várias vezes sem estragar nada.
--  1) clientes_portal — contas B2B (registo público → aprovação do admin)
--  2) RLS activo sem políticas: NINGUÉM lê/escreve por anon key;
--     o servidor usa a SERVICE ROLE (ignora RLS) para tudo.
-- ============================================================================

-- 1) CONTA DE CLIENTE: uma linha por empresa (NIF único)
create table if not exists clientes_portal (
  id                uuid primary key default gen_random_uuid(),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  nome_empresa      text not null,
  nif               text not null unique,
  nome_responsavel  text,
  telefone_whatsapp text not null,
  email             text not null unique,
  password_hash     text not null,
  estado            text not null default 'Pendente'
                    check (estado in ('Pendente', 'Activo', 'Rejeitado', 'Suspenso')),
  aprovado_em       timestamptz,
  observacoes_admin text
);

-- 2) SEGURANÇA: sem a role de serviço, ninguém toca nestas tabelas
alter table clientes_portal enable row level security;
alter table clientes_portal replica identity full;

-- índices de consulta rápida (procurar por estado / email)
create index if not exists clientes_portal_estado_idx on clientes_portal (estado);
