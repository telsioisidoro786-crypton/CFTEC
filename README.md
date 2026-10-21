# RELATÓRIO FINAL — Plataforma Web CFTEC (site React + painel Admin)
_Desde a criação (15 Out 2026) até à finalização (21 Out 2026) · repo `telsioisidoro786-crypton/CFTEC` · branch `master`_

---

## 1. Síntese executiva

Em **7 dias de trabalho** (de 15/10 a 21/10/2026, **38 commits**) passou de um site React com painel admin embrionário (CRUD de serviços/mídias + Supabase sync) para uma **plataforma comercial completa**:

| Área | Início (15 Out) | Fim (21 Out) |
|---|---|---|
| Site público | SPA estática com hero 3D | Site dinâmico (serviços, softwares, destaques, blog, banners) + checkout B2B + suporte público + PWA |
| Painel | 4 secções, 1 nível | **17 secções**, 4 níveis (super_admin/gestor/tecnico/**developer**), dashboard por papel |
| Comercial | — | Pedidos de licença (kanban 5 colunas), proforma PF, fatura interna FT, relatórios & metas, licenças PalancaSoft com chaves |
| Revenda | Form. de candidatura | Carteira de sub-parceiros com ficha completa, filtros, métricas e **licenças ligadas ao parceiro** |
| Suporte | — | Helpdesk (chamados + prioridades + wiki interna) e canal público |
| Plataforma | — | Licenciamento por módulos (só o developer Master admin), audit log completo, backups .json exclusivos |
| Informação | — | ~24 mutações auditadas, e-mails automáticos (Resend), Web Push grátis (VAPID) |
| Performance | bundle único **1 110 KB** | entrada **~350 KB** (code-splitting; three.js lazy) |

---

## 2. Cronologia completa

### 2.1. Criação — 15 Out
- **`950c9bb`** — baseline: site React completo com painel admin e sync Supabase (**49 ficheiros, 9 599 linhas**). Um único `main.tsx` roteava o site (`App`) ou o painel (`AdminDashboard`); o "backend" já vivia no plugin do `vite.config.ts` (middleware Node com JWT + bcrypt + service role), `db/schema.sql` inicial.

### 2.2. Consolidação do admin — 19 Out (maior dia: ~13 commits)
- **`c2e3aaa`** — *o salto central* (45 ficheiros, **6 185 linhas**): CRUDs completos (licenças, parceiros/CRM com estados, softwares, contactos), utilizadores com níveis (super/gestor/tecnico), tabela `settings` ligada ao painel e ao site. CRUD de contactos (lido/arquivar/eliminar), licenças `PS-XXXX-XXXX-XXXX` anti-colisão, candidaturas Negomil, downloads/30 dias.
- **`037903d`** — gráfico de downloads no dashboard + avisos de backlog no health.
- **`21f2b77`** — fix: modal de Software remontava a cada tecla (React re-criava o tipo a cada render; agora invocado como função — foco/ficheiro sobrevivem à escrita).
- **`c67a48b`** — fix crítico: parser **multipart corrompia binários** (.exe/.zip) — novo parser byte-a-byte (`Buffer` + `subarray`), provado com SHA-256 idêntico num ficheiro com os 256 valores de byte; bucket `software` tornado público para os downloads do site.
- **`b92ab71`** - upload directo do browser via **URL assinado** com barra de progresso real; limite de 50 MB (plano Free do Supabase); fim dos timeouts nos ficheiros grandes.
- **`2ecd087`/`2d7ef5f`/`542b2d8`/`c3eda23`** — **Checkout B2B**: tabela `pedidos_licencas`, `OrderModal` (Empresa/Responsável/Licença) no site com **IBAN copiável** + WhatsApp pré-formatado; gestão no painel; **polling 20 s** com indicador em tempo real; botão Adquirir Licença em todos os cards.
- **`e649b08`/`9fcd9e4`/`8b529b7`** — visão geral com dados reais + bolhas de notificação; depois **4 KPIs animados** (count-up + barra) e timeline multidisciplinares; polimento global de modais (ESC, scroll-lock, footer pegajoso, bottom-sheet no telemóvel, autofoco).
- **`1bc37aa`/`ee01d81`/`6a24fc9`/`bfe4fc1`** — **fluxo total admin↔site** (Definições do portal: WhatsApp, e-mail, IBAN, redes, banner → rodapé/contactos/checkout com `is_public` automático); **Destaques & Novidades** (tabela + CRUD + `NewsSlider`); **e-mails Resend** (contacto/pedido → admin, aprovação/rejeição → cliente, destino editável no painel).
- **`5fd4c49`/`fa05dd9`** — Área do Cliente removida (era placeholder) e relatório reflectindo.

### 2.3. Equipa por níveis & operação — 20 Out (12 commits)
- **`f988bb1`** - **sessões revogáveis (jti)**: logout mata o token de verdade; mudar a password, desactivar ou eliminar um utilizador mata as sessões dele; interceptor 401 client-side.
- **`7b51ba6`/`32bcb37`** — **Blog/CMS** (tabela, APIs público+admin, rascunho/publicar) + secção #blog no site com modal de leitura.
- **`f600987`/`c9e71b4`** — tooltips estilizados globais; **dashboard adapta-se ao papel** (gestor/técnico/super vêem conjuntos diferentes), limpeza de guias por nível (o técnico chegava a 200 em licenças!), settings GET não ve icing over super.
- **`a1aa967`** — **Helpdesk do técnico**: chamados com flow (Pendente → Em Resolução → Resolvido) e prioridades, consulta read-only de licenças/chaves (para suporte telefónico), badges + cards próprios.
- **`d9079ee`** — **área do gestor**: Fatura Proforma **PDF** (nº sequencial PF-AAAA-####, sem dependências), Relatórios & Metas (KPIs, receita estimada, conversão, top softwares), alerta de renovações ≤15 dias; uploads de software **bloqueados ao gestor** (UI + 403).
- **`b4e01c8`** — **canal público de suporte**: formulário de chamados, WhatsApp técnico, FAQ, landing por papel.
- **`aa178a8`** — **Web Push VAPID** (100% grátis, sem Firebase): service worker, banner de activação, push automático (pedido→comercial, chamado→técnico), alerta local com som.
- **`8e66ac3`** — **kanban arrastável** com meta mensal editável + barra de progresso; **wiki técnica interna** consultável a partir dos chamados; guia de produção no painel (HTTPS/Resend).
- **`adcad2f`** — **PWA instalável** conservador (manifest + ícones; cache só de produção, network-first em `/assets`, **APIs nunca** cacheadas).
- **`68ff590`** — **fatura interna FT** (Aprovado → Pago): botão Confirmar pagamento, PDF FT-AAAA-#### sequencial, 5.ª coluna *Pagos* no kanban; receita e meta passam a somar só pagos.

### 2.4. Plataforma, performance e governança — 21 Out (6 commits)
- **`730a20c`** — **licenciamento da plataforma**: 4.º papel **developer (Master Admin, Nexora Systems)** com painel exclusivo — licença activa/suspensa + módulos comercial/técnico/novidades em switches, validade + mensagem de bloqueio; suspensão fecha o painel (excepto developers) **e** os formulários públicos; chaves de licenciamento invisíveis ao super (PATCH → 403).
- **`7f99b53`** — **code-splitting**: `App` e `AdminDashboard` lazy por rota com Suspense/antecâmara; three/gsap/ScrollTrigger/animejs via `import()` dinâmico **com fallback** (site visível mesmo se as libs falharem) — entrada cai de 1.11 MB para ~350 KB.
- **`5f63569`** — modal da **Wiki Técnica** melhorado (dlg largo, fieldsets Identificação/Diagnóstico, datalists de sugestões, contadores de caracteres com avisos, guard anti duplo-submit).
- **`8c39e40`** — **audit log** («Registo de actividades»): tabela `audit_log` (RLS sem políticas — só service-role), helper fire-and-forget no middleware para **~24 mutações** (logins falhados incl.), endpooint de leitura restrito a super+developer, secção no painel com selos coloridos/pesquisa/polling.
- **`04aa764`** — **cópias de segurança**: `GET /api/admin/backup` exclusivo do developer — 14 tabelas num `.json` (sem `password_hash`), download directo (nada no servidor), cada exportação auditada.
- **`840f5e6`** — **revenda Negomil melhorada**: ficha completa do parceiro (8 campos + nota interna), filtros com contagem + pesquisa, **inscrição manual** no painel e **licenças ligadas ao parceiro** (`parceiro_id` FK on-delete-set-null, atribuição/devolução na ficha, auditoria `licenca_atribuida`).
- **`3be59de`** — documentação: relatório técnico actualizado (§10–§24).

---

## 3. Inventário funcional final

### 3.1. Site público (visitante B2B)
- Hero 3D (three.js lazy, com fallback estático), serviços da BD, catálogo de softwares com categoria/changelog/download real, **carrossel de destaques**, **blog** com modal de leitura, banner de avisos controlado nas Definições.
- **Checkout B2B**: modal de pedido (empresa/responsável/licença) → número de pedido + IBAN copiável + WhatsApp pré-formatado; e-mail automático na aprovação/rejeição.
- **Suporte**: formulário de chamados (NIF + WhatsApp + software) e FAQ/landing por papel com WhatsApp técnico.
- **Parcerias**: formulário de candidatura Negomil (Individual/Profissional/Empresa).
- Rodapé/contacto alimentados pelas Definições (publicação em ~20 s).

### 3.2. Painel Admin (por nível)
| Secção | super_admin | gestor | tecnico | developer |
|---|---|---|---|---|
| Visão geral (KPIs, timeline, health) | ✓ | ✓ (comercial) | ✓ (suporte) | ✓ (tudo) |
| Serviços / Mídias / Softwares / Blog / Destaques | ✓ | ✓ | ✓ (sempre uploads e softwares **não** — 403 ao gestor) | ✓ |
| Pedidos de licença (kanban 5, proforma/fatura) | ✓ | ✓ | — | ✓ |
| Licenças PalancaSoft (chaves) | ✓ | ✓ | **read-only** | ✓ |
| Revenda Negomil (ficha, licenças ligadas ao parceiro) | ✓ | ✓ | — | ✓ |
| Contactos / Partners | ✓ | ✓ | ✓ | ✓ |
| Chamados / Wiki | ✓ | — | ✓ | ✓ |
| Relatórios & Metas | ✓ | ✓ | — | ✓ |
| Definições (portal) / Utilizadores | ✓ | — | — | ✓ |
| **Registo de actividades (audit)** | ✓ | — | — | ✓ |
| **Painel do Developer** (licença/módulos/backups) | — | — | — | ✓ |

### 3.3. Plataforma (governança)
- **Licença activa + 3 módulos** em switches: efeitos em ≤20 s em todos os painéis e formulários públicos.
- **Audit log**: ~24 códigos de acção (criar/actualizar/apagar/licença/atribuição/login), 300 registos visíveis, pesquisa instantânea.
- **Backups .json** (14 tabelas, sem hashes) — download directo, registo auditado, restauro por bulk insert no SQL Editor.

---

## 4. Arquitectura técnica

```
Navegador (React 18 + Vite 6)
  ├─ main.tsx ─ frontend do / admin? → <AdminDashboard/> (lazy chunk 264 KB)
  │            └ caso contrário     → <App/> (lazy 56 KB)
  ├─ sw.js  (PWA cache-só-produção; Web Push VAPID)
  └─ fetch() → /api/*  (cookie HttpOnly JWT 8h)
        │
back-end no middleware do vite.config.ts (Node, dentro do dev-server)
  ├─ auth: bcrypt + JWT(jti, sessões revogáveis em memória)
  ├─ guardas por nível + guardas por módulo (licenciamento)
  ├─ PDF (Proforma PF / Fatura FT, sequenciais com contadores)
  ├─ e-mail Resend (fire-and-forget) · Web Push VAPID (fire-and-forget)
  ├─ audit log fire-and-forget
  └─ Supabase REST (**service role** — nunca no browser)
        │
Supabase (Postgres + Storage: media 10 MB · software 50 MB público)
```

- **RLS activo em todas as tabelas**; o browser nunca fala directamente com o Supabase (a anon key está apenas no `.env` do servidor).
- Novas secções do painel **sem Tailwind**: `AdminDashboard.tsx` + `admin.css` (partilham classes) — coerente com tudo o resto.
- Componentes shadcn em `components/ui`; modais globais com padrão comum (ESC, backdrop, footer de acções).

---

## 5. Segurança — ponto da situação
- ✅ JWT HS256 (8h) em cookie HttpOnly/SameSite=Lax; **jti revogável** (logout, mudança de password, eliminação de utilizador mata as sessões).
- ✅ bcrypt (10-12) para todas as contas; o backup nunca exporta o `password_hash` (filtrado no middleware).
- ✅ 4 níveis com guardas **antes** dos handlers (bug do técnico ler licenças corrigido); gestor sem uploads; chaves de licenciamento só developer.
- ✅ Service-role apenas no middleware; RLS sem políticas no `audit_log`.
- ✅ Auditoria de tudo o que escreve, incluindo logins falhados.
- ⚠️ Não incluído nesta fase (vai com a produção): **rate limiting no login** e cookies `Secure` em HTTPS.

---

## 6. Dados — migrations SQL (raiz, idempotentes, corridas pelo dono no SQL Editor)
`supabase-admin-ext.sql` (parceiros/licenças/downloads/settings) · `supabase-admin-users.sql` (4 níveis) · `supabase-chamados-suporte.sql` (+v2) · `supabase-blog-posts.sql` · `supabase-novidades-destaques.sql` · `supabase-pedidos-licencas.sql` (checkout) · `supabase-push-subscriptions.sql` (VAPID) · `supabase-wiki-tecnica.sql` · `supabase-status-pago.sql` (FT) · `supabase-system-license.sql` (licenciamento) · `supabase-audit-log.sql` (auditoria) · `supabase-parceiro-licencas.sql` (revenda com licenças) · base: `supabase-schema.sql`/`supabase-migration.sql` · `db/schema.sql` (histórica).

Tabelas activas: `services, media, softwares, contacts, settings, parceiros_candidaturas, licencas_palancasoft (+parceiro_id), download_events, admin_users, pedidos_licencas, chamados_suporte, push_subscriptions, wiki_tecnica, blog_posts, novidades_destaques, audit_log`.

---

## 7. Qualidade — o que foi validado (playbook E2E)
- **Builds verdes em cada commit** (`npm run build`, TypeScript estrito).
- **Navegador de verdade** em todas as features: login/ciclos de sessão, drag-and-drop do kanban, fichas/modais à mão, search/actualizar, upload com progresso, push/PWA, backup até ao toast.
- **Dados reais protegidos**: todas as provas com prefixo `e2e.*` e apagadas no fim (pedidos/chamados/parceiros/licenças/wiki/audit); a carteira real foi vigiada — `Nexora Systems` 2× Aprovado jamais tocada.
- **Provas de segurança** repetidas por fase: 401/403 por nível, 403 do super em backups/definições/chaves de developer, e nenhum `password_hash` no export.

---

## 8. Estado do repo
- 38 commits (`950c9bb` → `840f5e6`) publicados em `master`; worktree limpo; `.env` no `.gitignore`.
- Docs: `RELATORIO-REACT-ADMIN.md` (relatório técnico por fases, §10–§24), este `RELATORIO-FINAL.md`, `TODO.md`.
- Assets opcionais fora do repo: `server.log`, `cookies.txt` (lixo local).

---

## 9. Manual de operação resumido
- **Dev:** `npm run dev` (porto 3000); reiniciar ao editar `vite.config.ts`/`.env` (sessões revogam — re-login).
- **Build:** `npm run build` → `dist/`.
- **Produção (pendência):** extrair o middleware para um serviço Node próprio + HTTPS (cookies `Secure`, rate-limit) + domínio verificado na Resend.
- **Rotina semanal do developer (Nexora):**
  1. Painel do Developer → **Cópias de segurança** → Exportar (guardar `cftec-backup-*.json` em disco externo/nuvem privado — ~8 s).
  2. Registo de actividades → conferir acções (todos os transições de estado, logins, atribuições).
- **Módulo suspenso pelo dono:** licença off → painel fecha (excepto developer) e formulários públicos fecham, com mensagem editável.

---

## 10. Contas reais em produção de testes
| Papel | E-mail | Nota |
|---|---|---|
| Super Admin | `admin@cftec.co` | credenciais em `.env` (`CFTEC_ADMIN_*`) |
| Técnico | `isidorotelsio@gmail.com` | conta real do técnico |
| Gestor Comercial | `helder@gmail.com` | conta real |
| **Developer (Nexora)** | `telsioisidoro786@gmail.com` | Master Admin — licenças/módulos/backups |

---

## 11. Pendências (roadmap final)
1. **Produção** — servidor Node próprio (o middleware sai do dev-server), HTTPS + cookies Secure + rate-limit no login.
2. **Resend** — verificar domínio na resend.com (e-mails a clientes reais falam de texto sandbox hoje).
3. **Web Push** — configurar VAPID nas Definições e operar o push no telemóvel (feature pronta e auditada).
4. **Conteúdo** — substituir produtos fictícios (CFTEC Flow/Insight/Desk) pelo portfólio real (PalancaSoft/Negomil/AGT à medida do portal estático).
5. Comissão % por parceiro (campo fica pronto a uma coluna) — sugerido mas não seleccionado nesta fase.

### Nota de deploy (Vercel)
- `vercel.json` (builds + routes): a rota `{"src": "/api/(.*)", "dest": "/api/[...path].ts"}` é **obrigatória** — a conversão build→Build Output API não regista funções *catch-all* sozinha; sem esta entrada os pedidos `/api/*` caem no rewrite SPA (HTML/405).
- O servidor responde a **todos** os pedidos `/api/*` (fallback `return next()` interior): sem isso a function pendura até ao timeout de 300s. Corrigido em `server/api.ts`.
- Previews de git têm **Deployment Protection (SSO)** — erros CORS no F12 de um preview são esperados; o domínio de produção `cftec.vercel.app` não tem protection.

_Fim do relatório · gerado em 21 Out 2026 · CFTEC + Nexora Systems._
