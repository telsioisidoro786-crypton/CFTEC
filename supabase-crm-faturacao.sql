-- ============================================================
-- CFTEC — Parte 5: Faturação e CRM Leve
-- 1) Pipeline comercial (funil de vendas) sobre a tabela contacts
-- 2) Recibos/Fatura Definitiva: tabela + nº FT sequencial stable
-- 3) Oportunidades automáticas (renovação/upgrade) — dedupe por chave
-- Executar no Supabase SQL Editor (idempotente).
-- ============================================================

-- 1) PIPELINE COMERCIAL nos contactos (site → funil)
alter table public.contacts
  add column if not exists pipeline_stage text not null default 'novo';
alter table public.contacts
  add column if not exists valor_estimado numeric(14, 2);
alter table public.contacts
  add column if not exists moeda text not null default 'AOA';
alter table public.contacts
  add column if not exists proximo_passo text;
alter table public.contacts
  add column if not exists responsavel text;
alter table public.contacts
  add column if not exists origem_auto text;         -- 'licenca_expira' quando criada pelo job automático
alter table public.contacts
  add column if not exists chave_auto text;          -- dedupe (uma oportunidade por licença)
alter table public.contacts
  add column if not exists pipeline_at timestamptz not null default now();

-- estágios válidos (sem constraint dura para não partir históricos futuros)
do $$ begin
  if not exists (
    select 1 from pg_constraint where conname = 'contacts_pipeline_stage_check'
  ) then
    alter table public.contacts
      add constraint contacts_pipeline_stage_check
      check (pipeline_stage in ('novo', 'negociacao', 'proposta', 'ganho', 'perdido'));
  end if;
end $$;

-- oportunidades automáticas (renovação) não têm e-mail — a coluna passa a aceitar nulo
alter table public.contacts alter column email drop not null;

create index if not exists idx_contacts_pipeline
  on public.contacts (pipeline_stage, pipeline_at desc);

-- índice único SIMPLES (NULLS são distintos por defeito no Postgres, mesmo efeito que o filtro parcial
-- — e o ON CONFLICT/PostgREST não aceita índices parciais)
drop index if exists idx_contacts_chave_auto;
create unique index if not exists idx_contacts_chave_auto
  on public.contacts (chave_auto);

-- 2) RECIBOS / FATURA DEFINITIVA (FT)
--    O nº FT nasce quando o pagamento é confirmado no painel e fica fixo
--    (reimpressões não gastam sequência —Audit ável).
create table if not exists public.recibos_faturacao (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references public.pedidos_licencas (id) on delete cascade,
  numero text not null unique,                      -- FT-2026/001
  iban text,                                        -- IBAN usado para a liquidação
  cliente_empresa text,
  cliente_nif text,
  software text,
  valor numeric(14, 2),
  moeda text not null default 'AOA',
  comprovativo_nome text,                           -- nome de ficheiro do comprovativo bancário
  comprovativo_b64 text,                            -- conteúdo base64 (máx. ~2 MB)
  notas text,
  emitido_por text,                                 -- admin que confirmou
  criado_em timestamptz not null default now()
);

create index if not exists idx_recibos_pedido
  on public.recibos_faturacao (pedido_id);

-- nº proforma fixo por pedido (1ª emissão grava; reimpressão reusa — sem contador a subir)
alter table public.pedidos_licencas
  add column if not exists pf_numero text;

-- 3) contador da FT (continua a série do sistema antigo, se existir)
insert into public.settings (key, value, description)
values ('ft_seq', '1', 'Contador de Faturas Definitivas FT do CRM (Ponto 5)')
on conflict (key) do nothing;

-- recalcular o contador com base no que já existir (segurança)
update public.settings s
set value = coalesce((select max(right(numero, 3)::int) + 1
                      from public.recibos_faturacao
                      where numero like 'FT-%'), '1')
where s.key = 'ft_seq';
