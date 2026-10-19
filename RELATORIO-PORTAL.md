# Relatório Completo — Portal CFTEC (`portal/`)
_Data: 18 de Outubro de 2026_

---

## 1. Visão geral

Portal institucional **100% estático** (HTML + CSS + JS vanilla, sem backend) com estética do design system **shadcn/ui**, paleta própria da CFTEC, fotografias locais e navegação com mega-dropdowns. Funciona offline abrindo os ficheiros diretamente (exceto as bibliotecas de CDN e fontes — ver §5).

**Paleta atual (aplicada em Outubro 2026):**

| Papel | Hex | Uso |
|---|---|---|
| Azul-cemento escuro (navy) | `#031130` | heróis escuros, footer, barras de topo |
| Azul vivo (primary) | `#185DF1` | botões, links, chips ativos, badges, barra de progresso |
| Off-white (mist) | `#F3F7F5` | fundo de secções claras, campos de formulário |

O glassmorphism/mirror layer chegou a ser implementado a pedido e foi depois **removido por completo** por peso de renderização (`backdrop-filter`, `mix-blend-mode` — hoje 0 ocorrências no CSS).

---

## 2. Páginas e secções

### 2.1 `index.html` — Início
1. **Hero** fotográfico escuro (`hero-1.jpg`) com overlay azulado em gradiente + badges de confiança.
2. **Sobre** — foto da equipa (`team-1.jpg`) + pontos fortes + contadores animados.
3. **Sistemas** — PalancaSoft (foto `erp-dashboard.jpg`) e Negomil ERP (logo oficial em banda clara).
4. **Serviços de TI & Infraestrutura** — cabeçalho a 2 colunas + 5 photo-cards com checklists ✓ e links "Pedir orçamento" (pré-preenchem o assunto do formulário) + faixa "Precisa de algo diferente?" com CTA "Falar com Consultor".
5. **Casos de sucesso** — cards com foto (retalho/escola/logística) + pill de resultado.
6. **Downloads** — Central Unificada: cabeçalho a 2 colunas, **pesquisa em tempo real**, chips por categoria (PalancaSoft/Negomil/Utilitários), 9 ficheiros de exemplo renderizados por JS (modal de detalhe + pills de versão/categoria com cor por produto), contador de resultados.
7. **Parcerias & Revenda Negomil** — 3 planos com ícone/título/subtítulo/preço/lista de benefícios (Individual 75.000 Kz, Profissional 180.000 Kz com badge "Mais escolhido", Empresa 400.000 Kz) + faixa "Como funciona" com 3 passos numerados + formulário de inscrição com pré-seleção da modalidade via `pick-plan`.
8. **Contactos** — formulário com validação, toasts e chips de assunto (ligados aos `pick-subject` das outras secções).
9. **Footer** navy de 4 colunas + modais legais (Política de Privacidade / Termos de Utilização).

### 2.2 `blog.html` — Artigos
- Hero escuro fotográfico, **pesquisa de artigos**, filtro por 5 categorias, contador de resultados.
- **1 artigo em destaque** (card largo com badge "✦ Destaque") + 5 cards normais com foto, tempo de leitura e autor.
- **Newsletter** em banda navy com foto de fundo, formulário translúcido e **confirmação inline** à submissão.

### 2.3 `blog-post.html` — Artigo individual (abre por `?id=`)
- 6 artigos com **conteúdo completo** (subtítulos, listas, negritos, links internos), foto no topo (16:7).
- **Barra de progresso de leitura** no topo, breadcrumb `Notícias › Artigo`, pill de categoria colorida, meta em caixa (data/autor/tempo), **caixa do autor**.
- **Partilha funcional** (LinkedIn, X, WhatsApp com o URL real) + **botão copiar link** com feedback ✓.
- Sidebar sticky: "Leia também" (miniaturas `.art-thumb`) + CTA de suporte.

### 2.4 `faq.html` — Perguntas Frequentes
- 12 FAQ como **cards** com ícone por categoria (badge-check / layout-dashboard / network / life-buoy).
- **Pesquisa por palavra-chave + chips de filtro** + contador + estado vazio com ilustração.
- Acordeão animado por `scrollHeight` (um aberto de cada vez, acessível por teclado, chevron roda por estilo inline).
- CTA de contacto com fundo navy fotográfico.

### 2.5 `clientes.html` — Casos de sucesso
- 6 clientes renderizados por JS (`array CLIENTES` com foto) em photo-cards + indicadores de resultado.

### 2.6 `detalhes.html` — Detalhe de sistema (abre por `?id=`)
- Especificações, changelog, área de screenshots (placeholder estilizado), painel de download e FAQ lateral; todos os gradiente/cabeçalhos na nova paleta.

---

## 3. Estrutura e tamanho do site (`portal/` ≈ **4,0 MB**)

| Tipo | Ficheiros | Tamanho |
|---|---|---|
| HTML | 6 | 215,1 KB |
| JS (`main.js` + `menu.js`) | 2 | 17,9 KB |
| CSS (`style.css`) | 1 | 14,6 KB |
| Imagens | 17 jpg + 1 png | 3.832,2 KB |

**Inventário de imagens (`assets/img/`):**
hero-1 (262 KB), servers-1 (445 KB), team-1 (247 KB), cctv-1 (72 KB), retail (184 KB), school (124 KB), logistics (175 KB), clinic (119 KB), construction (298 KB), industry (199 KB), repair (187 KB), code (112 KB), cables (141 KB), web (283 KB), erp-dashboard (121 KB), tax (107 KB) + logo e selo oficiais Negomil: `negomil-logo.png` (308 KB), `negomil-agt-seal.jpg` (449 KB). Origem: Unsplash + sites oficiais da Negomil.

---

## 4. Stack e bibliotecas (por página)

| Recurso | Onde | Peso aproximado |
|---|---|---|
| Tailwind CDN (runtime dev) | 6 páginas | ~300 KB de JS |
| Lucide `@latest` (ícones) | 6 páginas | ~60 KB |
| GSAP + ScrollTrigger 3.12.5 | **só index** | ~90 KB |
| Google Fonts (Inter + Poppins) | 6 páginas | tipografia sob demanda |

**Contratos internos (não partir):**
- `data-dd-*` (dropdown desktop) e `data-md-*` (acordeão mobile) são usados pelo `menu.js`; a visibilidade dos painéis é controlada por CSS puro (`[data-dd-menu]`) porque o `.hidden` do Tailwind vive em `@layer utilities` e perde contra regras normais.
- `data-legal="X"` abre o modal legal correspondente (main.js).
- `pick-subject` / `pick-plan` pré-preenchem o formulário no index.

---

## 5. Funcionalidades interativas
- **menu.js** — dropdowns com mega-painéis (620px em "Serviços de TI"), rotação das setas por **estilo inline** (robusto contra classes do CDN), acordeão mobile, clique-fora/Esc para fechar.
- **main.js** — central de downloads (pesquisa, filtros, modal), render de casos de sucesso, contadores, validação de formulários + toasts, sombra do header ao rolar, `pick-subject`/`pick-plan`.
- **Por página** — blog (render + pesquisa), blog-post (progresso + partilha + copiar link), faq (acordeão + pesquisa + filtros), detalhes (leitura do `?id=` e renderização).

---

## 6. Estado do repositório Git
- Todas as alterações do portal **não estão commitadas**: `portal/` está por inteiro como ficheiros novos (untracked).
- Também há modificações antigas não commitadas na raiz do projeto React: `src/AdminDashboard.tsx`, `src/App.tsx`, `src/components/sections/ITServices.tsx`, `src/components/sections/SystemsSoftware.tsx`, `src/components/ui/MediaTile.tsx`, `supabase-schema.sql`, `vite.config.ts`.
- Ficheiros de suporte/testes sem valor permanente: `cookies.txt`, `server.log`, `test-curl.js`, `test-curl.mjs`, `test-delete-final.mjs`, `src/lucide-fix.d.ts` (podem ser limpos ao commitar).

---

## 7. Build
`npm run build` na **raiz** (projeto React/Vite paralelo `cftec-site`: `tsc -b && vite build`) — a passar (✓ built). O portal estático é independente do build e não precisa dele para funcionar em produção.

---

## 8. Pendências conhecidas
1. **Links por preencher**: downloads com `url: '#'` (ficheiros fictícios), WhatsApp `wa.me/244900000001`, redes sociais `#`.
2. **Peso**: o Tailwind via CDN é a maior despesa (~300 KB de runtime por página) — se necessário, pré-compilar o CSS numa folha estática e remover o script.
3. **Imagens**: as 17 fotos somam 3,5 MB — comprimir/convertar para WebP reduziria ~60–70%.
4. **SEO**: faltam Open Graph (og:title/og:image por página) e sitemap.
5. **Responsivo**: verificar em telemóvel real alguns pormenores de navegação e do hero.
