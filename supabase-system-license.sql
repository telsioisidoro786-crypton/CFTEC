-- ============================================================
-- CFTEC — Licenciamento da Plataforma (Painel do Desenvolvedor)
-- Papel "developer" (Master Admin) + flags de licença/módulos
-- Executar no Supabase SQL Editor. Idempotente (pode correr 2×).
-- ============================================================

-- 1) O papel "developer" passa a ser válido em admin_users:
--    super_admin | gestor | tecnico | developer (Master Admin)
ALTER TABLE admin_users DROP CONSTRAINT IF EXISTS admin_users_role_check;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'admin_users_role_check'
  ) THEN
    ALTER TABLE admin_users
      ADD CONSTRAINT admin_users_role_check
      CHECK (role IN ('super_admin', 'gestor', 'tecnico', 'developer'));
  END IF;
END $$;

-- 2) Flags de licença/módulos na tabela settings (chaves RESERVADAS ao
--    developer — nunca aparecem no painel de Definições do super admin).
INSERT INTO settings (key, value, description) VALUES
  ('licenca_ativa', 'true', 'Licença da plataforma — false suspende o painel para todos excepto developers'),
  ('modulo_comercial', 'true', 'Módulo Comercial: pedidos B2B, proformas, faturas internas, relatórios e revenda Negomil'),
  ('modulo_tecnico', 'true', 'Módulo Técnico: chamados de suporte e wiki técnica'),
  ('modulo_novidades', 'true', 'Módulo Novidades: blog/CMS e destaques (site + painel)'),
  ('licenca_expira_em', '', 'Data de validade da licença de manutenção (YYYY-MM-DD; vazio = sem prazo)'),
  ('msg_licenca', 'Módulo indisponível no vosso plano actual. Contacte o suporte técnico da Nexora Systems.', 'Mensagem exibida quando um módulo/licença está bloqueado')
ON CONFLICT (key) DO NOTHING;
