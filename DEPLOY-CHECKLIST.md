# CFTEC · CHECKLIST DE DEPLOY — do estado actual (dev) para produção

> Estado em que este checklist se baseia: master `762e2c1` · smoke 30/30 ·
> BD Supabase já limpa (só Admin + Developer) · buckets criados ·
> site React + API única (server/api.ts via `api/[...path].ts`) prontos para a Vercel.

---

## 0 · Pendências que veem ANTES de tudo (5 minutos)

- [ ] **Correr o SQL pendente**: abrir o **Supabase SQL Editor** e correr
      `supabase-parte82-alertas.sql` (a central de alertas grava a partir daí —
      sem este passo funciona, mas sem fila nem contadores).
- [ ] **Mudar a password da conta developer** (tela em Definições → Mudar password)
      se a actual já tenha saído do teu controlo/notebook.
- [ ] Confirmar que **não há** ficheiros `.env` commitados (`git status` limpo —
      `.env` está no .gitignore; as chaves ficam só no teu PC e na Vercel).

---

## 1 · Deploy do código na Vercel

- [ ] Vercel → **Add New Project** → importar o repositório `CFTEC`
      (branch `main` ou `master` — este repo tem as duas sincronizadas).
- [ ] Framework preset: **Vite** (build: `vercel-build` — já definido no package.json).
      O `vercel.json` já resolve: funções `/api/*` + ficheiros estáticos + SPA fallback.
- [ ] Primeiro deploy vale 2 minutos e sai num `*.vercel.app` — testar antes do domínio.

### Variáveis de ambiente da Vercel (Settings → Environment Variables)

| Variável | Valor | De onde |
|---|---|---|
| `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE` | deste projecto Supabase (Settings → API) | **obrigatórias** — sem elas a API não arranca |
| `CFTEC_JWT_SECRET` | o do `.env` (gerar nova strong p/ prod se preferir: `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`) | **obrigatória** |
| `RESEND_API_KEY` | a actual (funciona) | e-mails transaccionais |
| `RESEND_FROM` | `CFTEC <no-reply@cftec.co>` — só depois do passo 4 (domínio verificado); antes: o remetente sandbox actual | e-mails |
| `NOTIFY_EMAIL_TO` | e-mail do admin que recebe alertas (pode ser depois gravado no painel, Definições → `notify_email`) | alertas |
| `VAPID_PUBLIC_KEY` + `VAPID_PRIVATE_KEY` | as do `.env` (Web Push activa) | push |
| `CALLMEBOT_PHONE` / `CALLMEBOT_API_KEY` | *(opcionais)* WhatsApp do admin via CallMeBot — hoje NOT set → canal fica "saltou" na central, tudo auditável | alertas |
| `TELEGRAM_ALERT_USER` | *opcional* Telegram do admin (quem gere o bot dá o chat_id) | alertas |
| `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_WHATSAPP_FROM` | *opcionais* — WhatsApp para clientes; sem elas a plataforma cai em links wa.me (já funcional) | clientes |

**Não pôr na Vercel**: `CFTEC_ADMIN_EMAIL`/`CFTEC_ADMIN_PASSWORD` — os logins usam a
tabela `admin_users` do Supabase (nada de bootstrap em produção).

- [ ] Redeploy depois de gravar as variáveis (ou gravou antes do 1.º deploy — sem redeploy).
- [ ] Abrir `https://<projecto>.vercel.app` → correr o smoke contra ele (passo 5).

---

## 2 · Supabase em produção

- [ ] Tabelas: **já todas criadas** neste projecto (o mesmo Supabase serve dev e prod).
      Se um dia criar projeto Supabase novo, os SQls na raiz correm nesta ordem:
      `supabase-schema.sql` → `supabase-admin-ext.sql` → `supabase-migration.sql` →
      restantes por data de nome (admin-sessions, audit-log, portal-cliente, crm-faturacao,
      sla, autoservico, faq, faturacao/modulos …) → **`supabase-parte82-alertas.sql` no fim**.
- [ ] **Buckets verificados** (já existem neste projecto):
      `media` (público) · `software` (público) · `backups` (privado — o backup automático
      diário grava aqui; sem o bucket o backup automático silenciosamente não grava).

---

## 3 · Domínio cftec.co na Vercel

- [ ] Vercel → Projecto → **Settings → Domains** → Add → `cftec.co` (+ `www.cftec.co`).
- [ ] Na hospedagem actual do domínio (registrar do domínio), criar conforme Vercel indicar:
      | Tipo | Nome | Valor |
      |---|---|---|
      | A | `@` | `76.76.21.21` |
      | CNAME | `www` | `cname.vercel-dns.com` |
- [ ] SSL: a Vercel emite automático após a propagação (até ~1h). Confirmar o cadeado em
      `https://cftec.co`.
- [ ] Até o DNS propagar, o `*.vercel.app` serve o site — os clientes não esperam.
- [ ] Depois da propagação: confirmar que o **sitemap/robots + og:image** respondem em
      `https://cftec.co/robots.txt` e `https://cftec.co/sitemap.xml`.

---

## 4 · Resend — domínio verificado (e-mails a clientes de verdade)

- [ ] Resend → **Domains** → Add Domain → `cftec.co`.
- [ ] Criar no DNS os registos que a Resend mostra (SPF TXT + DKIM TXT×3 + `send` CNAME é opcional). Cada registrar tem o seu sítio (`DNS management`).
- [ ] Clicar **Verify** (após propagação, até ~24h; geralmente minutos).
- [ ] Trocar `RESEND_FROM` na Vercel para `CFTEC <no-reply@cftec.co>` + redeploy.
- [ ] Teste real: painel → renovações/mensagem → verificar caixa do destinatário.

## 5 · Validação pós-deploy (smoke + humano)

```bash
# do seu PC:
BASE_URL=https://cftec.co npm run smoke     # esperado: 30/30
```

Checklist humano (10 minutos):

- [ ] Site: hero, serviços do site, blog/destaques aparecem; checkout envia; chamado cria.
- [ ] Login admin em `https://cftec.co/admin` (cookie seguro); 2FA opcional activável.
- [ ] Definições → **Central de alertas**: 3 botões de teste (o teste e-mail deve
      entregar a sério agora, com o domínio verificado).
- [ ] Developer → **Cópias de segurança**: «Gerar cópia agora (nuvem)» → ficheiro entra
      no bucket `backups` e aparece na lista (prova o backup automático diário em prod).
- [ ] Painel → Softwares: registrar os primeiros produtos reais → o site publica-os no segundo.
- [ ] Enviar uma mensagem por um chamado → notificação push no browser da equipa.

## 6 · Notas de robustez (já resolvido no código — só para saber)

- **Sessões** persistem na BD (`admin_sessions`) — restart/serverless não desloga ninguém.
- **Rate-limit de login** (5 falhas/15 min por IP+email) já está activo.
- **Backup automático** diário corre lazy ao 1.º pedido admin do dia (serve server-less).
- **Licenciamento por módulos + suspensão** funciona em prod tal como em dev.
- Se algo correr mal: reverter é outro `git revert HEAD` + push (as duas branches).

---
*Última actualização: 27/10/2026 · Parte 8.5 — gerado a partir do estado real do repositório.*
