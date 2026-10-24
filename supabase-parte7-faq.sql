-- ============================================================
-- CFTEC · Parte 7.2 — FAQ no portal do cliente (auto-deflection)
-- A wiki técnica interna ganha duas competências:
--   · visivel_cliente — o técnico marca os artigos que o cliente
--     pode ver no portal (deflection: cliente resolve o próprio
--     problema antes de abrir chamado)
--   · ajudou — contador de feedback "resolveu" (mede deflection)
-- Inclui 6 artigos de partida. Idempotente — pode correr-se de novo.
-- ============================================================

alter table public.wiki_tecnica add column if not exists visivel_cliente boolean not null default false;
alter table public.wiki_tecnica add column if not exists ajudou int not null default 0;

-- índice para a leitura do portal (só artigos visíveis)
create index if not exists wiki_visivel_cliente_idx on public.wiki_tecnica (visivel_cliente);

-- ── artigos de partida (insere só o que ainda não existe, por título) ──
insert into public.wiki_tecnica (titulo, software, problema, solucao, tags, autor, visivel_cliente)
select t.titulo, t.software, t.problema, t.solucao, t.tags, 'Equipa CFTEC', true
from (values
  (
    'Como renovar a minha licença pelo portal',
    'PalancaSoft',
    'A minha licença está a expirar (ou expirou) e quero renová-la sem sair do portal.',
    E'1. No portal entre na aba «Licenças».\n2. No cartão da licença, use «Renovar licença» — o valor da proforma aparece de imediato (preço automático do catálogo).\n3. Confirme: nasce um pedido real no funil da equipa com a proforma PDF já disponível.\n4. Depois de pagar por transferência, abra o pedido e use «Anexar comprovativo» — a equipa confirma na liquidação e emite o recibo/FT.\n\nDica: enquanto a renovação estiver em curso, não é possível pedir outra (evita duplicados).',
    'licenca, renovacao, proforma, comprovativo'
  ),
  (
    'Impressora térmica de talões não imprime',
    'Nexora POS',
    'A impressora dá sinal de alimentação, mas os talões não saem — nem do caixa nem da consola do Nexora POS. O papel sai branco ou nada acontece.',
    E'1. Verifique que a fita térmica está do lado certo (sai papel branco = fita invertida).\n2. Confirme o cabo USB/alimentação ligado à impressora e ao caixa.\n3. No Windows: Painel de controlo → Dispositivos e impressoras → clique a impressora térmica → «Ver o que está a imprimir» e limpe toda a fila de documentos pendentes.\n4. defina a impressora térmica como Padrão e teste com «Imprimir página de teste».\n5. Se o teste local imprime mas o talão do Nexora POS não, entre no Nexora POS → Definições → Impressoras e re-seleccione a porta da impressora.\n\nSe após estes passos continuar sem imprimir, abra um chamado e indique o modelo da impressora.',
    'impressora, taloes, pos, nexora'
  ),
  (
    'Esqueceu-me da password do portal do cliente',
    'Geral',
    'Tento entrar no portal (cftec.co/cliente) e a password não é aceite.',
    E'1. Através da página de entrada do portal, use «Recuperar password» e siga o e-mail de recuperação.\n2. Se já não tem acesso a esse e-mail, contacte a equipa por WhatsApp +244 923 000 000 para reporem o acesso.\n\nPor segurança, NÃO envie passwords por WhatsApp ou e-mail — a reposição é sempre por sistemas.',
    'password, acesso, portal'
  ),
  (
    'Descarregar e instalar o software oficial',
    'CFTEC Desk',
    'Onde descarrego o instalador oficial da versão mais recente?',
    E'1. No portal do cliente, entre na aba «Downloads».\n2. Escolha o produto (CFTEC Desk, CFTEC Flow, CFTEC Insight, Nexora POS) e clique «Descarregar» — cada descarga fica registada na sua empresa.\n3. Instale seguindo o assistente e reabre no software.\n\nUse sempre os instaladores publicados no portal — versões de terceiros não são garantidas pela CFTEC.',
    'downloads, instalador, versao'
  ),
  (
    'Abrir um chamado de suporte: o que incluir para resolver rapidamente',
    'Geral',
    'Abri um chamado e a resposta demorou mais porque faltavam dados — o que devo escrever?',
    E'Um bom chamado chega ao técnico de primeira. Inclua sempre:\n\n1. O software e a versão (ex.: Nexora POS) — está na aba Downloads do portal.\n2. O que fazia quando o problema apareceu (o passo exacto antes de rebentar).\n3. A mensagem de erro completa (código e texto, ou a fotografia da tela).\n4. Quantos postos/estabelecimentos são afectados (só um? Todos?).\n\nChamados com estes 4 elementos resolvem-se tipicamente ao primeiro contacto.',
    'chamado, suporte, sla'
  ),
  (
    'Nexora POS: relatório de vendas aparece em branco ou não abre',
    'Nexora POS',
    'Ao abrir o relatório diário/mensal de vendas, a tabela aparece vazia sem motivo aparente.',
    E'1. Verifique o período seleccionado — o relatório filtra pela data do referencial, não pela data do dia.\n2. Se tem vários estabelecimentos activos, confirme que está a olhar para o estabelecimento certo no selector superior.\n3. Atualize a página com «Ctrl+F5» (limpa a cache da aplicação).\n4. Confirme que o operador tem permissão de relatórios (o acesso também filtra por perfil de utilizador).\n\nSe mesmo assim está em branco, abra um chamado com um exemplo de dados (data + nº de venda).',
    'relatorios, vendas, pos, nexora'
  )
) as t(titulo, software, problema, solucao, tags)
where not exists (select 1 from public.wiki_tecnica w where w.titulo = t.titulo);

NOTIFY pgrst, 'reload schema';
