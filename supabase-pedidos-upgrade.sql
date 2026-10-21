-- ============================================================
-- CFTEC · Pedidos de Pagamento / Upgrade da Manutenção
-- O painel da CFTEC (Definições → Pagamento para a Manutenção)
-- submete o plano escolhido; o Developer (Nexora Systems) vê e
-- autoriza/recusa no Painel do Developer.
--
-- Idempotente — pode ser corrido várias vezes no SQL Editor.
-- ============================================================

create table if not exists pedidos_upgrade (
  id            uuid primary key default gen_random_uuid(),
  empresa       text not null,
  email         text not null,
  itens         text not null,          -- add-ons escolhidos (texto multi-linha)
  total         text not null,          -- valor estimado, ex.: "Kz 77 000/mês"
  estado        text not null default 'pendente',  -- pendente | autorizado | recusado
  nota_dev      text,                   -- nota opcional do developer na decisão
  criado_por    text,                   -- e-mail do admin que submeteu
  created_at    timestamptz not null default now(),
  resolvido_em  timestamptz,
  resolvido_por text
);

alter table pedidos_upgrade enable row level security;
-- (RLS sem políticas: acesso só via service-role do middleware — como o audit_log)

create index if not exists idx_pedidos_upgrade_estado on pedidos_upgrade (estado, created_at desc);

-- Verificar (opcional):
-- select column_name, data_type from information_schema.columns
--  where table_name = 'pedidos_upgrade' order by ordinal_position;
