# CFTEC — Análise do sistema (Out/2026)

> Documento de revisão global do que já foi construído — as Partes 1–5 da roadmap mais
> a fundação de engenharia (monitorização + smoke tests + limpeza). Serve como mapa de
> referência para qualquer manutenção futura.

---

## 1. O que é o sistema

Plataforma **B2B da CFTEC** (Angola) com três apps num só repositório/Vite:

| App | Rota | Ficheiro | Papel |
|---|---|---|---|
| **Site institucional** | `/` | `src/App.tsx` (39KB) | Marketing, serviços, download PalancaSoft, contactos, blog, wiki |
| **Painel Admin** | `/admin` | `src/AdminDashboard.tsx` (304KB) | Operação toda da equipa (comercial, técnico, gestor, developer) |
| **Portal do Cliente** | `/cliente` | `src/ClientePortal.tsx` (38KB) | Empresas: chamados, licenças, faturas, downloads |

**Backend:** um único middleware Node — `server/api.ts` (282KB, ~95 rotas) colado ao dev
server pelo plugin `cftecApi` em `vite.config.ts`. **Sem** servidor separado: no deploy o
Vercel serve o SPA e a API corre no mesmo processo do preview/dev; em produção o
middleware é invocado igualmente pelo plugin do Vite.

**Base de dados:** Supabase (Postgres), escrita com `SUPABASE_SERVICE_ROLE` no server;
o client nunca fala directamente com o Postgres para mutações sensíveis.

---

## 2. Inventário de dados — 24 tabelas em uso

| Domínio | Tabelas |
|---|---|
| **Auth/contas** | `admin_users`, `admins`, `admin_sessions`, `clientes_portal`, `login_rate` |
| **Comercial** | `contacts` (funil `pipeline_stage`), `pedidos_licencas` (+`pf_numero`), `recibos_faturacao`, `licencas_palancasoft`, `pedidos_upgrade`, `parceiros_candidaturas` |
| **Suporte** | `chamados_suporte` (SLA + CSAT), `chamados_mensagens` (thread) |
| **Conteúdo** | `services`, `softwares`, `blog_posts`, `novidades_destaques`, `media`, `wiki_tecnica` |
| **Config/infra** | `settings` (mapa chave→valor), `audit_log`, `logs_erros` (novo), `push_subscriptions`, `download_events` |

---

## 3. O que ficou entregue (Partes 1–5)

### Parte 1 — Segurança
- Sessão admin por **JWT HttpOnly** (cookie `cftec_admin_session`, 8h), bcrypt nas passwords.
- **2FA TOTP** opcional por conta (Google Authenticator/Authy).
- **Rate limiting** no login (`login_rate`), auditoria (`audit_log`) de todas as mutações.
- **Código de emergência MESTRO** (bypass assinado por HMAC, 48h) — recuperação sem BD.
- Guardas por nível: `super_admin`, `gestor`, `tecnico`, `developer` (`nivelPleno`), licença Produto (`CHAVES_LICENCA`) fechando módulos não contratados.

### Parte 2 — Portal do cliente + notificações
- Registo/aprovação de empresas (`clientes_portal`) com ligação a licenças.
- Notificações: **Web Push** (VAPID, grátis) por papel comercial/técnico e **e-mail formal** via Resend.
- **CallMeBot** para alertas no telemóvel do admin — WhatsApp (aguarda vagas do serviço) com **fallback Telegram** activo (`telegram_alert_user`).

### Parte 3 — Chamados
- Criar/acompanhar chamados no portal, resposta da equipa com **thread** (`chamados_mensagens`).
- **SLA** com estados/temporariedade (`statsSla`) e **CSAT** (satisfação após resolução).

### Parte 4 — Qualidade de vida do painel
- **Topbar** unificada, **tema dark/light** persistente, **skeletons** de carregamento.
- Sidebar adormecida durante refactors (regra: não mexer).

### Parte 5 — Faturação e CRM leve
- **Funil Kanban** de contactos: 5 estágios, drag & drop real, totais por coluna, modal "Editar oportunidade" (valor/moeda/próximo passo/responsável).
- **Liquidação → Fatura**: modal confirma pagamento (IBAN pré-preenchido de `settings.iban_cftec`, comprovativo base64 ≤2MB) → cria **recibo FT-YYYY/NNN**, emite PDF, avisa o cliente por e-mail e audita.
- **Proforma estável**: 1º pedido grava `pf_numero`; reimpressões reutilizam (não queima sequência).
- **Cross-sell automático**: `GET /api/admin/upgrades-sugeridos` — licenças a expirar em ≤15 dias viram oportunidades no funil (dedupe por `chave_auto`, campo ✨ de auto-origem, `falhas[]` de diagnóstico).
- **PDFs no portal**: `/api/portal/pedidos/:id/proforma.pdf` e `/ft.pdf` com verificação de propriedade (nif/email da sessão).

### Parte 6 — Sustentabilidade (esta)
- **Limpeza de dependências**: removidas `mysql2` e `react-loader-spinner` (0 referências). Confirmado: `bcryptjs`, `jsonwebtoken`, `web-push`, `dotenv` **são usados pelo server** (auth/hash/push/.env) e `three/gsap/animejs` por *dynamic imports* (code-splitting) — permanecem deliberadamente.
- **Monitorização de erros**: tabela `logs_erros` (RLS 100% fechada; só service_role) + endpoint público `POST /api/log-erro` + hook global no `main.tsx` (`window.onerror`/`unhandledrejection` com dedupe ≤5 por erro) + falhas do node (`uncaughtException`/`unhandledRejection`) → cartão **"Monitorização · Erros"** nas Definições (activos/resolvidos, resolver em bloco, audita).
- **Smoke tests**: `tests/smoke.cjs` (`npm run smoke`) — 14 verificações de segurança/validação contra o server (rotas admin a fechar 401/403, portal 401, públicas 400/200, reporter de erros).

---

## 4. Arquitectura em 60 segundos

```
Browser (site/painel/portal)
   │  fetch same-origin
   ▼
Vite plugin (cftecApi) → server/api.ts   ⟵ 95 rotas em if-chain, auth por cookie JWT
   │  supabase-js (service_role)
   ▼
Postgres (Supabase) — RLS activa; o backend passa fora dela
   │  fire-and-forget
   ├→ audit_log      (cada mutação)
   ├→ logs_erros     (erros client+server)
   ├→ Resend (email shell) · Web Push (VAPID) · CallMeBot (WhatsApp→Telegram)
```

- Autenticação: `currentAdmin(req)` → claims JWT (nível). Portal: `currentCliente(req)` → cookie próprio.
- PDFs escritos à mão em PDF 1.4 (sem pdfkit — nenhuma dependência extra).
- `settings` é um KV (`key`/`value`) — do `iban_cftec` ao `telegram_alert_user`.
- E-mails via Resend com shell HTML único (`emailShell`) e envio bruto `sendEmailRaw(to, subject, html)`.

---

## 5. Débitas técnicas conhecidas

| Débita | Impacto | Ação possível |
|---|---|---|
| `server/api.ts` 282KB / 95 rotas em if-chain | Manutenção custosa; há lógica duplicada em 2 pontos | Tabela de rotas + validação zod (adiado pelo user) |
| `AdminDashboard.tsx` 304KB num ficheiro | Mais do mesmo, no client | Modularização adiada pelo user |
| `PF-2026-0000` (sequência legada em "0") | Um pedido de teste ficou com número informático feio | Apagar linha de teste em `recibos_faturacao` + redefinir `settings.proforma_seq` |
| `settings` sem validação de schema | Um typo numa key silencia a feature | Enum das keys conhecidas no handler |
| Login de teste do portal falha | Sem E2E portal logado | Repor credenciais ou criar conta de teste nova |

**Decisões tomadas conscientemente** (não contam como débita): npm único no repo, deps de server no mesmo `package.json` (o bundle do site não as importa), `three/gsap/animejs` por demanda, sidebar intocada por regra, frontend "quase-serverless" no Vercel.

---

## 6. Segurança como está

- Cookies HttpOnly/SameSite; JWT secret do .env (fall-back de dev com assinatura conhecida — **trocar em produção**).
- Rate limit login + threshold do login_rate; 2FA TOTP; bcrypt custo moderno.
- Uploads comprovativos: base64 ≤2MB, guardados na row do pedido (não bucket público).
- `logs_erros` e `audit_log` com RLS fechada (anon não lê nem escreve; só o service_role).
- Locks: `CHAVES_LICENCA` só developer; bypass MESTRO assinado por HMAC com expiração.

*(Recomendação do momento: correr `npm run smoke` depois de cada deploy para confirmar
que os guardas ficam verdes; qualquer 200 inesperado é alarme.)*

---

## 7. O próximo passo (por escolha do user)

1. **Sistema de rotas + validação zod** no `server/api.ts` — proposto e **adiado** (o if-chain funciona; troca de risco médio e ganho a longo prazo).
2. Credenciais/restauro de contas de teste no portal para E2E de PDFs com sessão.
3. Limpeza dos dados de demonstração (_pedido_ Pago com FT-2026/001, licença TESTE PARTE 5, contacto "Teste").
4. WhatsApp CallMeBot quando reabrirem vagas; Telegram já activo.

---

## 8. Comandos do dia a dia

```bash
npm run dev        # dev com API colada (http://localhost:3000)
npm run build      # tsc -b + vite build (o que corre antes de commit)
npm run smoke      # 14 smoke tests contra http://localhost:3000 (BASE_URL no env)
node tests/smoke.cjs  # directo
# Deploy padrão: build verde → commit → push master → branch main -f → push main
```

---

*Gerado na Parte 6 — engenharia de sustentabilidade (out/2026). Actualizar quando
entrar a Parte nova.*
