-- ============================================================
-- CFTEC Admin — extensão (Fase 1)
-- Tabelas: parceiros_candidaturas, licencas_palancasoft,
--          download_events, settings (config do portal)
-- Executar no Supabase SQL Editor.
-- ============================================================

-- 1) Candidaturas e carteira de sub-parceiros (revenda Negomil)
CREATE TABLE IF NOT EXISTS parceiros_candidaturas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_responsavel TEXT NOT NULL,
  empresa_nif TEXT,
  telefone_whatsapp TEXT NOT NULL,
  provincia TEXT,
  modalidade TEXT NOT NULL DEFAULT 'Individual', -- Individual | Profissional | Empresa
  status TEXT NOT NULL DEFAULT 'pendente',       -- pendente | em_analise | aprovado | rejeitado
  nota TEXT,
  volume_vendas INTEGER NOT NULL DEFAULT 0,
  clientes_angariados INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2) Licenças do PalancaSoft (software próprio)
CREATE TABLE IF NOT EXISTS licencas_palancasoft (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_nome TEXT NOT NULL,
  nif TEXT,
  chave_licenca TEXT NOT NULL UNIQUE,
  data_ativacao DATE NOT NULL DEFAULT CURRENT_DATE,
  data_expiracao DATE,
  status TEXT NOT NULL DEFAULT 'activa', -- activa | expirada | cancelada
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3) Histórico de downloads (métricas por período)
CREATE TABLE IF NOT EXISTS download_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  software_id UUID REFERENCES softwares(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_download_events_software ON download_events (software_id, created_at);

-- 4) Configurações do portal (directório telefónico, WhatsApp, banner)
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT '',
  description TEXT,
  is_public BOOLEAN NOT NULL DEFAULT TRUE
);

-- Se a coluna `value` já existir como JSONB (de uma migração antiga), converte para texto
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'settings'
      AND column_name = 'value'
      AND data_type = 'jsonb'
  ) THEN
    ALTER TABLE settings ALTER COLUMN value TYPE text USING (value #>> '{}');
  END IF;
END $$;

INSERT INTO settings (key, value, description, is_public) VALUES
  ('telefone_directorio', '+244 923 000 000', 'Telefone do directório do portal', TRUE),
  ('whatsapp_comercial', '244923000000', 'WhatsApp comercial (apenas dígitos, sem +)', TRUE),
  ('banner_activo', 'false', 'Aviso em banner no site (true/false)', FALSE),
  ('banner_mensagem', 'Nova versão do PalancaSoft disponível!', 'Texto do banner de aviso', TRUE)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, description = EXCLUDED.description, is_public = EXCLUDED.is_public;

-- 5) Changelog e categoria do software (colunas extra na tabela existente)
ALTER TABLE softwares ADD COLUMN IF NOT EXISTS changelog TEXT;
ALTER TABLE softwares ADD COLUMN IF NOT EXISTS category TEXT;
CREATE INDEX IF NOT EXISTS idx_softwares_category ON softwares (category);

-- 6) RLS: acesso só entre pelo backend (service role)
ALTER TABLE parceiros_candidaturas ENABLE ROW LEVEL SECURITY;
ALTER TABLE licencas_palancasoft ENABLE ROW LEVEL SECURITY;
ALTER TABLE download_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- 7) Índices úteis
CREATE INDEX IF NOT EXISTS idx_candidaturas_status ON parceiros_candidaturas (status, created_at);
CREATE INDEX IF NOT EXISTS idx_licencas_status ON licencas_palancasoft (status, data_expiracao);
