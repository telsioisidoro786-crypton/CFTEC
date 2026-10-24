-- ============================================================
-- CFTEC · Parte 7.1 — Auto-serviço de faturação no portal
-- Renovação 1-clique, mais utilizadores, comprovativo anexado
-- pelo cliente e downloads rastreados com contexto da empresa.
-- Idempotente — pode correr-se repetidamente.
-- ============================================================

-- ── pedidos_licencas: tipo + comprovativo + utilizadores extra ──
alter table public.pedidos_licencas add column if not exists tipo text null;
alter table public.pedidos_licencas add column if not exists comprovativo_b64 text null;
alter table public.pedidos_licencas add column if not exists comprovativo_nome text null;
alter table public.pedidos_licencas add column if not exists utilizadores_extra int null;

do $$ begin
  if exists (
    select 1 from pg_constraint where conname = 'pedidos_licencas_tipo_check'
  ) then
    alter table public.pedidos_licencas drop constraint pedidos_licencas_tipo_check;
  end if;
  -- 'nova' = contacto site/comercial (histórico); 'renovacao' = auto-serviço;
  -- 'usuarios' = mais utilizadores (orçamento do comercial, sem proforma automática)
  alter table public.pedidos_licencas
    add constraint pedidos_licencas_tipo_check check (tipo in ('nova', 'renovacao', 'usuarios'));
end $$;

-- ── download_events: contexto do download do portal (métricas por empresa) ──
alter table public.download_events add column if not exists portal_nif text null;
alter table public.download_events add column if not exists portal_email text null;

NOTIFY pgrst, 'reload schema';
