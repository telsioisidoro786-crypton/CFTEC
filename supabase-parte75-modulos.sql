-- ═══ PARTE 7.5 · MÓDULOS NOVOS DA LICENÇA DE PLATAFORMA ════════════════════
-- Dois módulos que faltavam ao contrato SaaS (até aqui: comercial, tecnico, novidades):
--   · modulo_faturacao  → Auto-serviço de Faturação no portal do cliente
--                         (renovação 1-clique, comprovativos, FT/recibos PDF, +utilizadores)
--   · modulo_relatorios → Relatórios avançados & Metas
--                         (secção Relatórios do painel: vendas, SLA, analytics de subscrições)
-- Ambos nascem ACTIVOS (true) para não cortar nada em contrato existente;
-- o Developer da Nexora pode desligar a qualquer momento no painel.
-- Idempotente: se a chave já existir, não toca (preserva a escolha do Developer).

insert into settings (key, value, description)
values
  ('modulo_faturacao', 'true', 'Módulo de Faturação: auto-serviço no portal do cliente — renovação 1-clique, comprovativos, faturas/recibos PDF e pedidos de utilizadores extra'),
  ('modulo_relatorios', 'true', 'Módulo de Relatórios avançados & Metas: secção Relatórios do painel — vendas, SLA/CSAT e analytics de subscrições (MRR/ARR/churn/engajamento)')
on conflict (key) do nothing;
