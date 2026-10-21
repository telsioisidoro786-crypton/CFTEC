# Relatório — Site React & Painel Admin (`cftec-site`)
_Data: 18 de Outubro de 2026_ · **Actualização (21 Out)**: blog/CMS, helpdesk por níveis, Web Push + PWA, licenciamento da plataforma (developer Master Admin), code-splitting, audit log e cópias de segurança — ver §10–§19.

---

## 1. Arquitetura atual

```
index.html (+ <div id="root">)
  └─ main.tsx
       ├─ pathname == "/admin"  →  <AdminDashboard/>   (painel CMS)
       └─ caso contrário        →  <App/>             (site público)
  └─ vite.config.ts   →  plugin "cftec-admin-api" (backend! middleware HTTP no dev-server)
  └─ Supabase         →  Postgres (tabelas) + Storage (buckets 'media' e 'software')
```

- **Um único HomeComponent React (SPA de 1 página)** — sem router. Navegação do site público é por âncoras (`#sobre`, `#servicos`…).
- **O "backend" vive dentro do `vite.config.ts`** (middleware Node a correr no dev-server do Vite): endpoints `/api/*` com autenticação JWT (bcrypt + cookie HttpOnly de 8h) e cliente Supabase com **service role**.
- `.env` tem: `CFTEC_JWT_SECRET`, `CFTEC_ADMIN_EMAIL`, `CFTEC_ADMIN_PASSWORD`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE`.

---

## 2. O que já temos — Site público (`App.tsx`, 25 KB)

| Secção | Estado |
|---|---|
| Hero 3D (three.js: icosaedro wireframe + anéis orbitais + partículas, com GSAP para parallax do rato) | ✓ funcional, **pesado** (~600 KB three + gsap + animejs) |
| Trust strip (logos fictícios) | ✓ estático |
| Sobre + estatísticas animadas (animejs) | ✓ estático ("manifesto" + 3 pilares) |
| Serviços | ✓ vem da BD via `GET /api/services`; fallback local se a API falhar |
| Softwares | ✓ da BD via `GET /api/software` (produtos fictícios: CFTEC Flow/Insight/Desk) |
| Contacto | ✓ `POST /api/contact` grava em Supabase; fallback para localStorage se a API cair; opções de interesse vêm de `/api/contact-options` (dinâmicas: serviços + softwares activos) |
| Destaques & Novidades | ✓ carrossel/banner do site alimentado por `novidades_destaques` (gestão no painel admin, upload p/ bucket `media`) |
| "Área do Cliente" | removido a pedido do cliente (era só placeholder "em preparação") |

---

## 3. O que já temos — Painel Admin (`/admin`, 47 KB)

**Autenticação**
- Login com e-mail + password → bcrypt compare na BD (`admins`) → JWT assinado (HS256, 8h) → cookie `cftec_admin_session` HttpOnly.
- Sessão restabelecida via `GET /api/admin/session`; logout limpa o cookie.
- Fallback em memória (`admin@cftec.co` / `admin123456`) quando não há Supabase configurado.

**Secções**
| Secção | Estado |
|---|---|
| Visão Geral | ✓ contagens (serviços/mídias/softwares/contactos), contactos recentes (8), **health check real** (latência BD + Storage), acções rápidas |
| Gerir Serviços | ✓ CRUD completo: criar (com slug gerado e deduplicado), editar (modal), activar/desactivar, eliminar |
| Gestão de Mídias | ✓ upload por drag-and-drop (até 10 MB, JPEG/PNG/WebP/GIF) para o bucket `media` do Supabase Storage; eliminar (storage + BD); `alt_text` editável via API |
| Softwares & Downloads | parcial — **listar** (tabela) e **criar** (upload do instalador para bucket `software`) |
| Definições | ✗ só estático (cartões de perfil/segurança sem lógica) |

**Esquema de dados (Supabase)**
- `supabase-schema.sql` — base: `admins`, `services`, `media`, `softwares`, `contacts`.
- `supabase-migration.sql` — versão melhorada: colunas extra (`role` no admin, `icon_color`, `sort_order`, `is_featured`, `category`), tabelas **`settings`** e **`audit_logs`**, RLS activado em tudo, seeds iniciais.

**UI kit** — componentes shadcn na pasta `components/ui` (button, card, dialog, select, table, toast…), `admin.css` (31 KB), `styles.css` (25 KB do site), `MediaTile` (grid de pré-visualização com teste de acesso público à imagem).

---

## 4. O que falta melhorar

### 4.1 Backend / API (prioridade alta)
1. **A API vive no dev-server do Vite** — em produção (build estático) os endpoints `/api/*` não existem. É preciso extrair o middleware para um servidor Node próprio (Express ou equivalente) para poder publicar.
2. **Falta CRUD de softwares**: editar versão/descrição/preço, desactivar (`is_active`), eliminar (storage + BD). O botão "Acções" na tabela só mostra um toast.
3. **Falta CRUD de contactos**: os `GET` lista apenas 8, **sem o texto da mensagem**, sem "marcar como lido/responder/arquivar" (a coluna `status` existe mas nunca é atualizada — nenhum endpoint PATCH para contacts).
4. **Tabelas `settings` e `audit_logs` criadas mas não usadas** em nenhum endpoint.
5. Depuração: dezenas de `console.log` de debug no middleware (`[READBODY]`, `[COOKIES]`, `[DEBUG]`…) — poluem a consola e podem vazar informação; `server.log` (116 KB) está no repo.
6. Segurança: fallback do JWT secret escrito no código, sem rate-limiting no login, cookie `SameSite=Lax` apenas em desenvolvimento, e a anon key do Supabase fica no `.env` local (confirmar que nunca é exposta ao cliente).

### 4.2 Admin (UX)
1. Sem **paginação/pesquisa real** para contactos e softwares (limites fixos 8/20).
2. Header "Bom dia, Admin." hard-coded; sem mostrar o utilizador real só Admin CFTEC; sem avatar dinâmico só Admin CFTEC; sem avatar dinâmico.
3. Acções de linha não têm menus reais (botões placeholder com `notify()`).
4. Definições: perfil editável, mudança de password, controlo de tentativas — não existem.
5. Quando a API falha, o painel cai silenciosamente nos dados fictícios de fallback, sem erro visível ao utilizador.

### 4.3 Site público
1. **Hero 3D (three.js + gsap + animejs)** é o maior peso da app (~600 KB de JS); sem lazy-load nem fallback 2D — desfavorável em mobile.
2. Sem blog/FAQ/casos de sucesso/central de downloads (só softwares) — o portal estático `portal/` tem tudo isto, o React não.
3. Falta conteúdo real: produtos CFTEC Flow/Insight/Desk são fictícios; o site oficial fala de **PalancaSoft e Negomil ERP**.

### 4.4 Coerência com o portal estático (decisão pendente)
O que a CFTEC vende no portal (`portal/`) e no React (App.tsx) **não coincide**:
- Portal: PalancaSoft ERP, Negomil ERP, CCTV, redes, cablagem, sites, parcerias.
- React: "Desenvolvimento à medida / Cloud / Dados / Suporte" + CFTEC Flow/Insight/Desk.

Necessário decidir: (a) **React passa a ser o site oficial** (porting do conteúdo e das 6 páginas + router) ; (b) **portal estático mantém-se** e o React fica para o painel admin + área de cliente.

---

## 5. Roadmap sugerido (ordem recomendado)

1. **Limpeza** — remover os console.log de debug e `vite.config.js/../.d.ts` gerados, `server.log`, `cookies.txt`, scripts de teste ad-hoc; garantir que `.env` nunca vai para git. *(✓ Feito 19 Out: 36 `console.log` removidos do middleware; `tsconfig.node.json` com `noEmit` e artefactos `vite.config.js`/`.d.ts` apagados — o Vite carregava o `.js` velho em vez do `.ts`!)*
2. **Completar os CRUD em falta** *(✓ Feito 19 Out, testado por API e no browser:)*
   - *Softwares: `PATCH /api/admin/software/:id` (JSON: nome/versão/descrição/preço), `POST .../:id/toggle`, `DELETE` (remove instalador do Storage + linha); UI: coluna Estado (pill Activo/Inactivo), botões Editar/Desactivar/Eliminar por linha, modal de edição com pré-preenchimento e sem campo de ficheiro.*
   - *Contactos: `GET` agora com `phone` + `message` e limite 30; `PATCH /:id` (estado `unread`/`read`/`archived`, validado), `DELETE /:id`; nova secção "Contactos" no painel com lista expansível, mensagem completa, acções (marcar lido/novo, arquivar, eliminar com confirmação).*
   - *Extras: estado `new` da BD mostrado como "Novo"; datas formatadas em pt-PT; saudação por hora do dia com o nome real do admin; 401 sem sessão confirmado no DELETE.*
3. **Ligar `settings`/`audit_logs`** *(✓ Feito 19 Out (settings) + 21 Out (auditoria): `settings` alimenta o site e as Definições; o audit log propre **`audit_log`** (nova tabela, §18) regista ~24 mutações.)*
4. **Estrutura PalancaSoft / Negomil / CRM** *(✓ Feito 19 Out, ver §7)*
5. **Produção**: o backend continua no dev-server do Vite (decidir servidor Node próprio ou serverless); criar um executável/serviço de production. Guia HTTPD/HTTPS/Resend já escrito no painel (§14). **Pendente.**
6. **Performance React** *(✓ Feito 21 Out, ver §17: code-splitting por rota + libs 3D a pedido; bundle inicial ~350 KB.)*
7. **Produção duradamente testada**: segredo real *(✓ em `.env`)*; rate limiting no login e cookies `Secure` em HTTPS **pendentes**.
8. **Notificações por e-mail** *(✓ Feito 19 Out, Resend: contacto/pedido → admin, aprovação/rejeição → cliente, destino editável em settings `notify_email`; e-mails de teste limitados à conta do dono até o domínio ser verificado na Resend.)*
9. **Secções para a equipa (20–21 Out, todas concluídas e commitadas)**: blog/CMS (§11), sessões revogáveis (§12), proforma/relatórios/helpdesk (§13), kanban/meta/wiki interna + guia de produção (§14), suporte público (§15), Web Push (§16), PWA (§17), fatura interna (§18), licenciamento pelo developer (§19), code-splitting (§20), audit log (§22), cópias de segurança (§23).
10. **Pendências para o dono**: Web Push/beep nas Definições ainda sem configurar scripts de teste no browser de teste; permissão de notificações Chrome por conceder; software instalado → testar Web Push/pushes reais no telemóvel; verificar domínio na Resend para e-mails externos; backups semanais manuais (download .json) a partir do painel do developer.

---

## 7. Fase 1-2 — PalancaSoft, Negomil, CRM e site dinâmico (19 Out 2026)

### Novas tabelas (`supabase-admin-ext.sql`, exec. no SQL Editor)
- `parceiros_candidaturas`, `licencas_palancasoft`, `download_events`, `settings` (config portal) + `changelog`/`category` em `softwares` + RLS.
- ⚠️ Re-correr o ficheiro para ganhar a coluna `category` (adicionada depois); endpoints têm fallback enquanto ela não existir.

### API nova
- Público: `POST /api/partners-apply` (valida modalidade), `POST /api/software/:id/download` (incrementa + evento), `GET /api/settings`.
- Admin: `GET/PATCH/DELETE /api/admin/partners` (estados pendente/em_analise/aprovado/rejeitado + métricas), `GET/POST/PATCH/DELETE /api/admin/licenses` (gerador de chave `PS-XXXX-XXXX-XXXX` anti-colisão), `GET/PATCH /api/admin/settings` (upsert com `onConflict: 'key'` — a tabela antiga tem PK id + UNIQUE key), `GET /api/admin/downloads` (30 dias agregado), `GET /api/admin/software/:id/events`.
- `PATCH /api/admin/contacts` com estados CRM (new/unread/read/em_contacto/proposta/fechado/archived); `PATCH /api/admin/software` aceita `changelog` + `category`.

### Painel
- Secções novas: **Licenças PalancaSoft** (chave copiável, cancelar/reactivar, eliminar confirmado) e **Revenda Negomil** (candidaturas com pills de estado, aprovar/em análise/rejeitar, métricas editáveis em linha).
- Catálogo: painel de **métricas de downloads (30 dias, gráfico de barras 14 dias)** + etiqueta de categoria por software; modal com **Categoria** (PalancaSoft/Oficial AGT/Utilitário AGT/Demo/Estável) e **Changelog** da versão.
- Definições: cartão **Configuração do site** (directório, WhatsApp comercial, mensagem e banner activo). Fix: perfil do admin agora preenchido também após login pela UI (antes só na sessão retomada).

### Site público
- **Banner de avisos** lido de `/api/settings` (banner fixo no topo, header empurrado via `.site-shell--banner`; `no-store` na fetch para refrescar).
- Secção **Parcerias** (04/Revenda Negomil) com formulário completo → `/api/partners-apply`; contacto renumerado para 05.
- Cards de software: **etiqueta real de categoria**, changelog e **botão Download real** (`POST download` → abre `file_url`; sem instalador mantém "Solicitar demonstração").
- Removido useEffect GSAP duplicado.

---

## 8. Fase 3 — Utilizadores & Níveis de Permissão (19 Out 2026)

- Nova tabela **`admin_users`** (`supabase-admin-users.sql`): name, email (único), password_hash (bcrypt 12), **role** (`super_admin` | `gestor` | `tecnico`), is_active; **migra o admin actual para Super Admin** automaticamente.
- **Login** consulta `admin_users` primeiro (com `is_active=false` → conta desactivada 403); fallback para tabela `admins` antiga (vira Super Admin). Token JWT passa a incluir `level`.
- **Perfil / Mudar password** funcionam em `admin_users` (fallback `admins`) com re-emissão do token incluindo nível.
- Permissões (guardas no middleware):
  - **Super Admin** — tudo, incluindo Definições do portal e Gestão de Acessos;
  - **Gestor Comercial** — Visão Geral, Serviços, Mídias, Catálogo, **Licenças, Revenda Negomil**, Contactos (403 em settings PATCH e users);
  - **Técnico de Suporte** — Visão Geral, Serviços, Mídias, Catálogo, Contactos (403 em licenças/parceiros/settings/users).
- Endpoints `GET/POST/PATCH/DELETE /api/admin/users` (só Super Admin; proíbido alterar nível/desactivar/eliminar a própria conta).
- UI: sidebar filtrada por nível; badge de nível junto ao perfil no topo; secção Definições mostra **"Utilizadores do painel"** (só Super Admin): criar utilizador, mudar nível (select em linha), activar/desactivar, **redefinir password** (modal) e eliminar (confirmação).
- Token sem `level` (sessões antigas) = tratado como Super Admin para transição suave.
- **Dashboard** — cartão "CATÁLOGO" ganhou o gráfico de barras da actividade de downloads dos últimos 30 dias (`dl-metrics--panel`, 14 dias) e o **health** passa a avisar sobre candidaturas de sub-parceiros pendentes e licenças a expirar em 30 dias.
- **Fix** — modal "Adicionar Software" remontava o `<form>` a cada tecla (`SoftwareModal` definido dentro do componente; React re-criava o tipo a cada render). Agora é invocado como função no ponto de uso, o JSX fica inlined e o foco/ficheiro seleccionados sobrevivem à escrita. Verificado no browser (nó do input identidade estável + foco mantido) e E2E: criação com upload → 201 → listagem.
- **Fix uploads binários (software & mídias)** — o parser multipart convertia o corpo inteiro para string UTF-8 e depois re-convertia para Buffer (`Buffer.from(content,'binary')`), corrompendo qualquer .exe/.zip real. Novo `parseMultipart()` no middleware trabalha sempre com Buffer (delimitadores localizados por bytes, conteúdo via `subarray`), suporta boundary entre aspas e nomes com caracteres especiais. **Prova**: ficheiro de 200 KB com os 256 valores de byte, SHA-256 idêntico antes/depois (upload → storage → download), em software e mídias.
- **Fix "processa e não carrega" em ficheiros grandes** — a cadeia browser → dev-server → Supabase calculada a ~125 KB/s de uplink: 5 MB = 41 s; 40 MB = timeout (`UND_ERR_HEADERS_TIMEOUT` aos 300 s). Nova arquitectura: `POST /api/admin/software/upload-url` emite um **URL de upload assinado** e o browser faz **PUT directo ao bucket via XHR com barra de progresso** (% real), confinando o dev-server aos metadados JSON. `POST /api/admin/software` aceita agora JSON (modo metadados, `storage_path`) além do multipart legado (com o corte de 413 em >50 MB).
- **Limites Supabase (Free)** — máx. **50 MB por ficheiro** e 1 GB de storage; a UI e o middleware passam a aplicar 50 MB (antes 100 MB), `media` mantém 10 MB.
- **Fix downloads públicos** — o bucket `software` estava **privado** (`public:false`); URLs públicos devolviam "Bucket not found" (os botões Download do site não abriam os ficheiros). Bucket tornado **público** via `updateBucket` (o `media` já era público, com limite de 10 MB definido).

## 6. Estado do repo Git
_(histórico de 19 Out — estado actual na §24.)_

---

## 9. Fase 4 — Checkout B2B & Pedidos de Licença (19 Out 2026)

- Nova tabela **pedidos_licencas** (supabase-pedidos-licencas.sql): software, empresa, NIF, responsável, WhatsApp, província, forma de pagamento e **status** (Pendente/Em Verificação/Aprovado/Rejeitado) + settings iban_cftec (IBAN da CFTEC), whtasapp_comercial público.
- **Site**: cartões com preço > 0 passam a ter botão **Adquirir Licença** → OrderModal (3 secções: Empresa / Responsável / Licença) → POST /api/license-orders (público, validado) → ecrã de confirmação com **número do pedido**, IBAN da CFTEC (copiável) e botão WhatsApp com mensagem pré-formatada.
- **Admin**: nova secção **Pedidos de Licença** (Super Admin + Gestor) com filtros Todos/Pendentes/Aprovados, acções **Confirmar & Aprovar**, **Em Verificação**, **Rejeitar**, **Falar no WhatsApp** (wa.me do responsável) e eliminação com confirmação.
- Nota de arquitectura: sem chaves do Supabase no browser — o modal fala com a API do middleware (service role), mesmo fluxo e segurança.
- Health passa a avisar quando existem pedidos B2B pendentes de confirmação.
- **Onboarding falta**: correr supabase-pedidos-licencas.sql e definir preços > 0 nos softwares PaginaSoft/Negomil para o checkout aparecer nos cards.

---

## 10. Continuação 19 Out — Destaques, e-mail (Resend) e polimento

- **Destaques & Novidades**: tabela `novidades_destaques` (SQL), CRUD no painel com upload para `media`, carrossel `NewsSlider` no site.
- **Notificações por e-mail (Resend)**: contacto/pedido → admin; aprovação/rejeição → cliente; destino editável no painel (settings `notify_email` à via de `PATCH /api/admin/settings`). ⚠️ Conta sandbox da Resend só deixa enviar para `telsioisidoro786@gmail.com` — verificar domínio para e-mails a clientes reais.
- **Polimento global de modais**: ESC fecha, scroll-lock, animação pop, footer pegajoso, aviso nas confirmações, bottom-sheet em telemóvel, autofoco.
- **Visão geral**: reduzida a 4 KPIs animados (count-up + barra de crescimento) + linha do tempo de actividade de todos os módulos.

---

## 11. Blog / CMS (20 Out)

- Tabela `blog_posts` (`supabase-blog-posts.sql`), APIs público + admin (rascunho/publicar), gestão com editor no painel.
- Secção **#blog** no site com modal de leitura; cabeçalho com chip luminoso + título gradiente para fundo claro.

---

## 12. Sessões revogáveis no servidor (20 Out)

- Token JWT passa a ter **`jti` registado em memória**: logout mata o token de verdade; mudar password, desactivar ou eliminar utilizador **revoga todas as sessões dele**.
- Interceptor 401 no cliente (devolve ao login sem toast repetido); logout também no topo do painel.
- ⚠️ Caso especial: apagar uma conta directamente no Supabase (fora do painel) **não** revoga os JWT emitidos — só o registo em memória (restart) ou a eliminação pela UI garantem a revogação.

---

## 13. Painel por níveis: Proforma, Relatórios & Metas, Helpdesk (20 Out)

- **Dashboard adaptado por papel**: gestor vê pedidos/contactos/licenças/revenda; técnico vê softwares/serviços/mídias/blog — linhas do tempo e cartões filtrados por nível; API: guard comercial movido para antes dos handlers (o técnico levava `200` em licenças por engano), settings GET só super_admin.
- **Gestor Comercial**: **Fatura Proforma PDF** (2.ª via, nº sequencial **PF-AAAA-####** com auditoria de contador, sem dependências externas), botão Proforma, tabs Em Verificação/Rejeitados no pipeline, secção **Relatórios & Metas** (KPIs, receita estimada pelo preço de catálogo, conversão, vendas/mês, top softwares), alerta de renovações ≤15 dias.
- **Técnico**: módulo **Helpdesk** — chamados com CRUD + prioridades (Baixa/Média/Crítica) + estados (Pendente → Em Resolução → Resolvido), consulta **read-only** de licenças & chaves (pesquisa por cliente/NIF/chave) para suporte, badge no nav. API `/api/admin/chamados` + `supabase-chamados-suporte.sql` (v2).
- **Tooltips estilizados** (`data-tip`) em estados/chaves/versões/ordem + dashboard compactado (gráfico junto à mini-tabela, timeline 330px).

---

## 14. Kanban 5 colunas, meta mensal e Wiki interna (20 Out)

- **Pipeline arrastável** com kanban completo (Pendente → Em Verificação → Aprovado → Rejeitado → Pagos) + **meta mensal editável** com barra de progresso.
- **Wiki técnica interna** (`supabase-wiki-tecnica.sql`) com consulta a partir dos chamados (artigos por software/problema).
- **Guia de produção no painel**: checklist HTTPS, Resend e deployment.

---

## 15. Canal público de suporte (20 Out)

- Formulário de chamados no site (`POST /api/chamados` público, validado — NIF, WhatsApp, software), **WhatsApp técnico** com mensagem pré-formatada e página por papel (FAQ + dados de contacto).
- Cada chamado cria Web Push ao técnico (§16) e e-mail ao admin.

---

## 16. Web Push VAPID — alertas gratuitos (20 Out)

- **Tabela `push_subscriptions`** (`supabase-push-subscriptions.sql`); VAPID keys no `.env` — **sem Firebase**.
- Service worker (`public/sw.js`) com `push`/`notificationclick`; **banner de activação** no painel (`PushNotificationBanner`); subscrição por admin.
- **Push automático**: novo pedido (→ comercial) e novo chamado (→ técnico), fire-and-forget pela service-role.
- **Alerta local** com som (beep) quando há novos chamados detectados no polling de 20 s (ids conhecidos → toast + carrilhão).

---

## 17. PWA instalável conservador (20 Out)

- `manifest.webmanifest` + ícones PNG 192/512 + apple-touch 180.
- Service worker em **cache de produção apenas** (`/assets`, network-first; **APIs nunca** são cacheadas); cache desligado em dev (localhost no bypass, linha 28 do `sw.js`).

---

## 18. Fatura interna FT (20 Out)

- Fluxo **Aprovado → Pago**: botão *Confirmar pagamento* no pedido aprovado; `supabase-status-pago.sql` adiciona `Pago` à constraint de `status`.
- **PDF de fatura interna** com nº sequencial **FT-AAAA-####**; kanban ganha 5.ª coluna/tab *Pagos*; receita e meta passam a somar apenas pedidos pagos.

---

## 19. Licenciamento da plataforma — Developer (Master Admin) (21 Out)

- Bootstrap da **conta developer**: primeira developer criada pelo super (guard no middleware: depois disso, só developers criam developers). Conta real: `telsioisidoro786@gmail.com`.
- Secção exclusiva **Painel do Developer** (4.º nível): **licença da plataforma** (activa/suspensa) + módulos **comercial / técnico / novidades** em switches, validade opcional (aviso "expira a …" em todos os painéis) e **mensagem de bloqueio** editável.
- Efectos da suspensão: painel bloqueado para toda a equipa CFTEC (excepto developers, que veem sempre tudo); formulários públicos (checkout/suporte) fechados; APIs dos módulos com 403 e mensagem contextual.
- Chaves de licença PalancaSoft: **o developer vê e altera; nas Definições do super aparecem ocultas** e qualquer PATCH de chaves → 403. Guarda movida para antes de `/api/admin/profile`.
- `supabase-system-license.sql` (settings `licenca_ativa`, `modulo_comercial`, `modulo_tecnico`, `modulo_novidades`, `licenca_expira_em`, `msg_licenca`); leitura via `/api/admin/system-license` com **polling de 20 s** (efeito em ≤20 s sem F5).

---

## 20. Code-splitting — performance (21 Out)

- `main.tsx` carrega `<App/>` e `<AdminDashboard/>` por **rota com lazy + Suspense** (antecâmara de carregamento).
- `App.tsx`: **three.js, GSAP, ScrollTrigger e animejs passam a `import()` dinâmico** com fallback — se as libs falharem, o conteúdo fica visível e os contadores ficam estáticos (site nunca quebra).
- Antes: 1 chunk de 1 110 KB. Depois: core **~212 KB**, AdminDashboard ~264 KB, App ~56 KB, `three.module` ~690 KB (**lazy**, ~176 KB gzip), ScrollTrigger 44 KB, anime 18 KB — o bundle inicial por entrada fica ~350 KB (o warning >500 KB é só o chunk lazy do three, esperado).

---

## 21. Modal da Wiki Técnica melhorado (21 Out)

- Modal largo (`admin-modal--lg`) com fieldsets **Identificação / Diagnóstico**; datalists de sugestões (softwares do catálogo + artigos da wiki; tags só preenchidas com as existentes).
- **Contadores de caracteres** com avisos (amarelo ~70%, vermelho ~90%); estado a guardar + **guard anti duplo-submit**; kicker EDITAR/NOVA SOLUÇÃO; modal fecha com ESC e classe.

---

## 22. Audit log — Registo de actividades (21 Out)

- Tabela **`audit_log`** (`supabase-audit-log.sql`, idempotente): actor (e-mail + nível; **"site público"** nos formulários anónimos), acção, entidade, id do alvo e `detalhe` JSON truncado (2 000 chars); índice por `created_at desc`; **RLS activado sem políticas** — a anon key não lê nem escreve; escrita/leitura **só pela service-role no middleware**.
- Helper `logAuditoria()` **fire-and-forget** em **~24 mutações**: logins (incl. `login_falhado` com o e-mail tentado), formulários públicos (contacto, candidatura, chamado, pedido), contactos/parceiros, **mudança de estado dos pedidos (com de → para)**, licenças emitidas/alteradas, definições gravadas, **licença da plataforma alterada** (com resultado), utilizadores criados/actualizados/apagados, chamados, wiki, serviços, destaques, blog, mídias e softwares.
- Leitura: `GET /api/admin/auditoria` (300 mais recentes) — **só super_admin + developer** (técnico/gestor → 403).
- Secção **"Registo de actividades"** no painel (ScrollText): tabela Data · Quem · Acção · Alvo · Detalhe, **selos coloridos por tipo** (criar=verde, apagar=vermelho, estado=azul, licença=roxo, login falhado=âmbar), pesquisa instantânea, refresh manual, carregamento ao abrir e refresh no polling de 20 s enquanto visível.

---

## 23. Cópias de segurança — exclusivas do Developer (21 Out)

- `GET /api/admin/backup`: exporta **14 tabelas** num único `.json` — pedidos, licenças, chamados, wiki, utilizadores (**sem `password_hash`**, verificado por E2E), definições, parceiros, contactos, blog, destaques, mídia, softwares, serviços e auditoria (cap 20 000 linhas).
- Cabeçalho `_backup` com app, instante, autor, estado da licença e hint de restauro (cada chave de topo = uma tabela, pronta para bulk insert).
- **O ficheiro nunca fica no servidor** — sai por download directo no browser (`cftec-backup-AAAA-MM-DD HHhMM.json`), zero risco de fuga; **só o developer consegue** (super admin → 403).
- Painel do Developer: cartão "Cópias de segurança" com lista das 14 tabelas + botão **Exportar cópia completa** (guard anti duplo clique, ~8 s a gerar, toast de sucesso). Cada exportação fica no audit log (`backup_exportado`).
- Restauro: manual, no SQL Editor (bulk insert das tabelas do `.json`).

---

## 24. Estado do repo Git (21 Out)

- Branch `master` publicada em `github.com/telsioisidoro786-crypton/CFTEC.git`; commits de referência das últimas fases: `730a20c` licenciamento, `7f99b53` code-splitting, `5f63569` wiki modal, `8c39e40` audit log, `04aa764` backups.
- `.env` no `.gitignore` (nunca no repo); worktree limpo; migrations SQL da raiz (idempotentes, executadas **pelo dono** no SQL Editor): `admin-ext`, `admin-users`, `chamados-suporte` (+v2), `blog-posts`, `novidades-destaques`, `pedidos-licencas`, `push-subscriptions`, `wiki-tecnica`, `status-pago`, `system-license`, `audit-log`.
- Ficheiros de preferência **fora do repo**: `server.log`, `cookies.txt`, scripts de teste ad-hoc (mantidos só em local).
