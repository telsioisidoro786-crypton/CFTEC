-- ============================================================
-- PUSH SUBSCRIPTIONS — Notificações Web Push (Correr no SQL Editor do Supabase)
-- Guarda as subscrições dos dispositivos da equipa admin (uma por browser).
-- Sem políticas RLS: o middleware usa service-role; o browser nunca
-- acede a esta tabela directamente (decisão de segurança do projecto).
-- ============================================================
create table if not exists public.push_subscriptions (
  endpoint     text primary key not null,
  p256dh       text not null,
  auth_key     text not null,
  user_email   text,
  user_level   text not null default 'super_admin',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
