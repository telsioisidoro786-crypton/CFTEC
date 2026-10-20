-- ============================================================
-- CFTEC — Blog / CMS (artigos do site)
-- Executar no Supabase SQL Editor. Idempotente.
-- Segurança: o site lê via middleware (service-role), RLS activo
-- sem políticas públicas — escrita anónima impossível.
-- ============================================================

CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  slug TEXT UNIQUE,
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL,
  content TEXT NOT NULL,
  cover_url TEXT,
  category TEXT,
  author TEXT DEFAULT 'Equipa CFTEC',
  is_published BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_blog_published ON blog_posts (is_published, published_at DESC);

ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
