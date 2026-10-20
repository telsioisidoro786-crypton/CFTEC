# CFTEC — Colocação em Produção (Domínio + HTTPS + Resend)

Guia passo-a-passo para as duas pendências que **não são código**: apontar o
domínio `cftec.co` com HTTPS e verificar o domínio no Resend (e-mails externos).
Ambas bloqueiam funcionalidades já implementadas: **Web Push** (exige HTTPS)
e notificações/pedidos por e-mail (exige domínio verificado no Resend).

---

## 1. Domínio + HTTPS

O painel e o site funcionam em dev (`localhost:3000`) via middleware do Vite.
Em produção é preciso servir o **dist/ + definições env** atrás de HTTPS.

### Opção A — Vercel (recomendada: gratuita, HTTPS e CDN automáticos)

1. `npm run build` → a pasta `dist/` é o site + assets.
2. ⚠️ **Middleware**: as APIs (`/api/*`) correm como plugin do Vite em dev.
   Para o Vercel há **duas alternativas**:
   - **A. Manter um servidor Node** (VPS/Railway/Fly.io) que sirva `dist/`
     estático + as rotas `/api/*` do `vite.config.ts` em produção (plugin
     `configureServer` → extrair para `server/` e correr com Node/Express).
   - **B. Vercel Serverless Functions + Netlify Functions**: portar cada
     handler `/api/*` do middleware para `api/*.ts` (formato Vercel).
     É o mesmo HTTP handler (`readBody`, `json`, Supabase, Resend) — os ficheiros
     existem aqui no `vite.config.ts` para portar 1:1.
3. **DNS do domínio**: no gestor do domínio (registrar onde foi comprado):
   - `cftec.co` → `ALIAS`/`A` para `76.76.21.61` (Vercel) ou CNAME do host
   - `www.cftec.co` → CNAME `cname.vercel-dns.com`
4. No painel do host (ex.: Vercel → Project → Domains) adicionar
   `cftec.co` e `www.cftec.co`. O certificado Let's Encrypt é emitido
   automaticamente (nada a fazer).
5. Checklist depois: `https://cftec.co` abre o site; `/admin` abre o painel;
   o cadeado amarelo aparece; Web Push funciona no telemóvel.

### Opção B — VPS (Nginx + certbot)

```bash
# requisito de segurança: trocar todos os segredos .env antes de publicar
scp -r dist/ user@vps:/var/www/cftec
# Nginx serve /var/www/cftec + proxy /api/ → node server.js
sudo certbot --nginx -d cftec.co -d www.cftec.co   # HTTPS grátis, renovação automática
```

> **Requisito de segredos para produção** (cópia do `.env` para o servidor,
> nunca em texto no repo): `CFTEC_JWT_SECRET` (mín. 32 caracteres fortes),
> `CFTEC_ADMIN_EMAIL/PASSWORD`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE`,
> `RESEND_API_KEY`, `RESEND_FROM`, `NOTIFY_EMAIL_TO`,
> `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`.

## 2. Verificar domínio no Resend (chave para e-mails)

Hoje o envio funciona só de **telsioisidoro786@gmail.com** (endereço
`from` privado do Resend). Para `suporte@cftec.co`/`pedidos@cftec.co`:

1. Entra em [resend.com/domains](https://resend.com/domains) → **Add domain**
   → `cftec.co` (só o raiz, não www).
2. O Resend mostra os **registos DNS** a criar no gestor do domínio:
   | Tipo | Nome | Aponta a |
   |---|---|---|
   | TXT | `cftec.co` (raiz) | `v=spf1 include:resend.com ~all` — SPF |
   | TXT | `resend._domainkey` | DKIM (chave longa que o painel dá, copiar) |
   | TXT | `cftec.co` (opcional) | `v=DMARC1; p=none; rua=mailto:postmaster@cftec.co` |
   | MX  | `send` ou equivalente se o painel Resend indicar | conforme guia do Resend |
3. Espera verificar propagação (5 min – 4 h); o estado vira **Verified**.
4. No `.env` de produção muda `RESEND_FROM` para um endereço do domínio:
   `RESEND_FROM="CFTEC <pedidos@cftec.co>"` e reinicia o servidor.
5. Teste de fumo: faz um pedido real e confere se o e-mail chega ao
   `NOTIFY_EMAIL_TO` e (após aprovação) ao e-mail do cliente.

## 3. Checklist final de entrega

- [ ] `https://cftec.co` abre o site e `/admin` abre o painel
- [ ] Login admin no telemóvel → banner "Alertas activos" + notificação de teste
- [ ] Novo pedido pelo site → push aplicado no dispositivo da equipa + e-mail
- [ ] Novo chamado do site → chama ao técnico com pill "site"
- [ ] Proforma PDF gerada com NIF/empresa reais
- [ ] E-mails a `@cftec.co` (Resend verified) sem 403
- [ ] `supabase-chamados-suporte.sql`, `-v2`, `push_subscriptions`, `wiki_tecnica`
      já corridos no SQL Editor (todos idempotentes)
