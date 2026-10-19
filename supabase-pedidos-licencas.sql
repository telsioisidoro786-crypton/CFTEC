-- ============================================================
-- CFTEC — Pedidos de Licença B2B (checkout PalancaSoft / Negomil)
-- Executar no Supabase SQL Editor. Idempotente.
-- ============================================================

CREATE TABLE IF NOT EXISTS pedidos_licencas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  software_nome TEXT NOT NULL,
  nome_empresa TEXT NOT NULL,
  nif TEXT NOT NULL,
  nome_responsavel TEXT NOT NULL,
  telefone_whatsapp TEXT NOT NULL,
  email TEXT,
  provincia TEXT NOT NULL,
  forma_pagamento TEXT NOT NULL DEFAULT 'Transferência Bancária / IBAN',
  status TEXT NOT NULL DEFAULT 'Pendente'
    CHECK (status IN ('Pendente', 'Em Verificação', 'Aprovado', 'Rejeitado')),
  observacoes TEXT
);

CREATE INDEX IF NOT EXISTS idx_pedidos_licencas_status ON pedidos_licencas (status, created_at DESC);

ALTER TABLE pedidos_licencas ENABLE ROW LEVEL SECURITY;

-- IBAN comercial da CFTEC (mostrado na confirmação do pedido)
INSERT INTO settings (key, value, is_public)
VALUES ('iban_cftec', 'AO06.0040.0000.1111.2222.3333.4', false)
ON CONFLICT (key) DO NOTHING;

-- WhatsApp comercial já existe; garantir público (link directo nos cards)
UPDATE settings SET is_public = true WHERE key = 'whatsapp_comercial';
