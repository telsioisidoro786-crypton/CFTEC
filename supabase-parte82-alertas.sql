-- ============================================================
-- CFTEC · Parte 8.2 — Central de alertas (alertas_fila)
-- Fila de todos os avisos ao admin (CallMeBot/WhatsApp, Telegram,
-- e-mail, Web Push) com estado de entrega + motivo da falha.
-- O server escreve com SERVICE_ROLE — RLS 100% fechada garante
-- que ninguém do anon lê/insere por fora. O painel (super_admin/
-- developer) lê via /api/admin/alertas.
-- Idempotente: pode correr-se repetidamente sem efeitos colaterais.
-- ============================================================

create table if not exists public.alertas_fila (
  id        uuid primary key default gen_random_uuid(),
  criado_em timestamptz not null default now(),
  -- canal: 'callmebot' (WhatsApp/Telegram admin) | 'email' | 'push'
  canal     text not null check (canal in ('callmebot', 'email', 'push')),
  -- resumo curto do alerta (ex.: "Novo pedido de aprovação — NIF …")
  texto     text not null,
  -- 'enviado' | 'falhou' | 'saltou' (sem chaves/sem subscrição configurada)
  estado    text not null check (estado in ('enviado', 'falhou', 'saltou')),
  -- motivo curto: ok / ausente·sem chaves / 4xx / timeout / sem subscrições…
  detalhe   text
);

-- índices de leitura: fila mais recente + resumo de 30 dias
create index if not exists idx_alertas_fila_criado_em on public.alertas_fila (criado_em desc);
create index if not exists idx_alertas_fila_canal on public.alertas_fila (canal, criado_em desc);

-- RLS fechada: só o service_role (backend) toca na tabela
alter table public.alertas_fila enable row level security;

-- retenção: nada automático por agora — a fila cresce ~poucas linhas/dia;
-- o painel publicando a fila de 40 e o resumo de 30 dias é suficiente;

comment on table public.alertas_fila is 'CFTEC Parte 8.2 — fila de alertas ao admin com estado de entrega (canal, estado, detalhe). Escrita só pelo backend; leitura via /api/admin/alertas.';
