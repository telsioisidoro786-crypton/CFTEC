-- ============================================================
-- CFTEC Admin — Utilizadores & Níveis de permissão (Fase 3)
-- Níveis: super_admin | gestor (Gestor Comercial) | tecnico (Técnico de Suporte)
-- Executar no Supabase SQL Editor. Idempotente.
-- ============================================================

CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'gestor'
    CHECK (role IN ('super_admin', 'gestor', 'tecnico')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Migrar o admin existente (tabela admins) para super_admin
INSERT INTO admin_users (name, email, password_hash, role)
SELECT a.name, lower(a.email), a.password_hash, 'super_admin'
FROM admins a
ON CONFLICT (email) DO NOTHING;

-- Trigger de updated_at (se existir a função update_updated_at_column)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
    EXECUTE 'DROP TRIGGER IF EXISTS trg_admin_users_updated ON admin_users';
    EXECUTE 'CREATE TRIGGER trg_admin_users_updated BEFORE UPDATE ON admin_users
             FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()';
  END IF;
END $$;

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users (role, is_active);
