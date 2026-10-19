-- ============================================================
-- CFTEC — Destaques & Novidades (carrossel/banner do site)
-- Executar no Supabase SQL Editor. Idempotente.
-- Nota de segurança: o site lê via middleware (service-role),
-- portanto RLS activo sem políticas públicas é o mais seguro.
-- ============================================================

CREATE TABLE IF NOT EXISTS novidades_destaques (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  titulo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  imagem_url TEXT NOT NULL,
  link_botao TEXT,
  texto_botao TEXT DEFAULT 'Saber Mais',
  ativo BOOLEAN NOT NULL DEFAULT true,
  ordem INT NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_novidades_ordem ON novidades_destaques (ativo, ordem);

ALTER TABLE novidades_destaques ENABLE ROW LEVEL SECURITY;
