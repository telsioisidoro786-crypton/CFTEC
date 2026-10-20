-- ============================================================
-- CFTEC — Estado "Pago" no ciclo dos pedidos (fatura interna FT)
-- Permite a transição Aprovado → Pago ("Confirmar pagamento"),
-- que destrava a fatura interna PDF (nº FT-AAAA-####).
-- Executar no Supabase SQL Editor. Idempotente (pode correr 2×).
-- ============================================================

-- Remove a constraint antiga (sem "Pago") se existir
ALTER TABLE pedidos_licencas DROP CONSTRAINT IF EXISTS pedidos_licencas_status_check;

-- Volta a criar a constraint já com o estado "Pago"
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'pedidos_licencas_status_check'
  ) THEN
    ALTER TABLE pedidos_licencas
      ADD CONSTRAINT pedidos_licencas_status_check
      CHECK (status IN ('Pendente', 'Em Verificação', 'Aprovado', 'Pago', 'Rejeitado'));
  END IF;
END $$;
