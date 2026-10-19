# Relatório — Site React & Painel Admin (`cftec-site`)
_Data: 18 de Outubro de 2026_ · **Actualização (19 Out)**: CRUDs de softwares e contactos completos — ver §5.

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
| "Área do Cliente" (botão) | ✗ placeholder — só toast "em preparação" |

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
3. **Ligar `settings`/`audit_logs`** *(→ Feito 19 Out (Fases 1-2): `settings` ligado — config do portal editável na Definições (directório/WhatsApp/banner) + `GET /api/settings` público consumido pelo site; `audit_logs` ainda sem uso.)*
4. **Estrutura PalancaSoft / Negomil / CRM** *(→ Feito 19 Out, Fases 1-2, ver §7)*
5. **Produção**: o backend continua no dev-server do Vite (decidir servidor Node próprio ou serverless); criar um executável/serviço de production.
6. **Performance React**: lazy-chunk + fallback para o hero 3D, code-splitting do admin.
7. **Produção duramente testada**: segredo real, rate limiting no login e cookies `Secure` em HTTPS.
8. **Notificações por e-mail (opcional)**: e-mail automático (ex.: Resend/SMTP) para novos contactos e para o administrador.

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

## 6. Estado do repo Git
- Modificações não commitadas na parte React: `App.tsx`, `AdminDashboard.tsx`, `components/sections/ITServices.tsx`, `components/sections/SystemsSoftware.tsx`, `components/ui/MediaTile.tsx`, `supabase-schema.sql`, `vite.config.ts`; não seguidos: `src/lucide-fix.d.ts` + lixo (`server.log`, `cookies.txt`, `test-*`).
- **Importante**: `.env` existe na raiz — confirmar que está listado no `.gitignore` antes de commitar nada.
