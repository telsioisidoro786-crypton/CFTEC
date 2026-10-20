-- ============================================================
-- CHAMADOS DE SUPORTE — MIGRAÇÃO v2 (Correr no SQL Editor do Supabase)
-- Adiciona origem (painel/site/whatsapp) e telefone ao chamado
-- Já correu supabase-chamados-suporte.sql ? então basta este.
-- ============================================================
alter table public.chamados_suporte add column if not exists telefone text;
alter table public.chamados_suporte add column if not exists origem text not null default 'painel'
  check (origem in ('painel', 'site', 'whatsapp'));
