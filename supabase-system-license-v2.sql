-- ============================================================
-- CFTEC · Central de Gestão de Licenças SaaS (v2)
-- Regras de contrato avançadas geridas pelo Developer (Nexora Systems)
--
-- Chaves novas em `settings` (INSERT ... ON CONFLICT DO NOTHING =
-- idempotente: nunca sobrescreve valores já definidos no painel).
-- Correr no SQL Editor do Supabase. Pode ser corrido várias vezes.
-- ============================================================

insert into settings (key, value, description) values
  ('dias_aviso_previo', '5',      'Dias de aviso prévio antes do vencimento da licença — banner amarelo no painel (0-30)'),
  ('max_usuarios',      '0',      'Limite de utilizadores do painel pelo contrato (0 = ilimitado)'),
  ('max_storage_mb',    '0',      'Limite de storage em MB — instaladores + mídia (0 = ilimitado)'),
  ('modo_somente_leitura', 'false','Modo somente leitura: bloqueia criar/alterar/apagar no painel, mantendo a consulta (true/false)')
on conflict (key) do nothing;

-- Verificar (opcional):
-- select key, value, description from settings
--  where key in ('dias_aviso_previo','max_usuarios','max_storage_mb','modo_somente_leitura')
--  order by key;
