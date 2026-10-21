-- ============================================================
-- CFTEC · Revenda Negomil — ligar licenças vendidas ao parceiro
-- Idempotente: pode ser corrido várias vezes sem efeitos colaterais.
-- Se um parceiro for apagado, as licenças dele mantêm-se
-- despojadas (parceiro_id passa a NULL — FK "on delete set null").
-- ============================================================

alter table public.licencas_palancasoft
  add column if not exists parceiro_id uuid references public.parceiros_candidaturas (id) on delete set null;

create index if not exists idx_licencas_parceiro
  on public.licencas_palancasoft (parceiro_id);
