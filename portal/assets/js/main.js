(function () {
  'use strict';

  /* ---------- Utilidades ---------- */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (t) => String(t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => t.classList.remove('show'), 3800);
  }

  /* ---------- Ícones ---------- */
  function icons() { if (window.lucide) lucide.createIcons(); }
  icons();

  /* ---------- Modal de Detalhes do Software ---------- */
  const modal = $('#softwareModal');
  const modalOverlay = $('#modalOverlay');
  const modalContent = $('#modalContent');
  const modalClose = $('#modalClose');
  const modalNome = $('#modalNome');
  const modalCategoria = $('#modalCategoria');
  const modalVersao = $('#modalVersao');
  const modalTamanho = $('#modalTamanho');
  const modalTipo = $('#modalTipo');
  const modalNotas = $('#modalNotas');
  const modalTagAGT = $('#modalTagAGT');
  const modalDownloadsNum = $('#modalDownloadsNum');
  const modalBtnBaixar = $('#modalBtnBaixar');
  const modalBtnDemo = $('#modalBtnDemo');

  function abrirModal(item) {
    modalNome.textContent = item.nome;
    modalCategoria.textContent = item.cat;
    modalVersao.textContent = item.versao;
    modalTamanho.textContent = item.tamanho.toFixed(1).replace('.', ',') + ' MB';
    modalTipo.textContent = item.tipo;
    modalNotas.textContent = item.notas;
    modalDownloadsNum.textContent = fmt(item.downloads);
    modalBtnBaixar.href = item.url;
    modalBtnBaixar.toggleAttribute('download', item.url !== '#');
    if (item.agt) {
      modalTagAGT.classList.remove('hidden');
    } else {
      modalTagAGT.classList.add('hidden');
    }

    modal.classList.remove('opacity-0', 'pointer-events-none');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    // pequeno atraso para permitir a transição CSS
    requestAnimationFrame(() => {
      modalContent.classList.remove('scale-95');
      modalContent.classList.add('scale-100');
    });
  }

  function fecharModal() {
    modalContent.classList.remove('scale-100');
    modalContent.classList.add('scale-95');
    modal.classList.add('opacity-0', 'pointer-events-none');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  const modalOk = modal && modalOverlay && modalContent && modalClose;
  if (modalOk) {
    modalClose.addEventListener('click', fecharModal);
    modalOverlay.addEventListener('click', fecharModal);
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !modal.classList.contains('opacity-0')) {
        fecharModal();
      }
    });
  }

  /* ---------- Ano ---------- */
  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Header: sombra e link ativo ---------- */
  const header = $('#header');
  window.addEventListener('scroll', () => {
    header.classList.toggle('shadow-soft', window.scrollY > 8);
  }, { passive: true });

  const sections = ['inicio', 'sobre', 'sistemas', 'servicos', 'downloads', 'parcerias', 'contactos'];
  const navLinks = $$('.nav-link');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          navLinks.forEach(l => l.classList.toggle('on', l.getAttribute('href') === '#' + e.target.id));
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(id => { const el = document.getElementById(id); if (el) io.observe(el); });
  }

  /* ---------- Dados dos downloads (ficheiros de exemplo: substitua os links pelos reais) ---------- */
  const DOWNLOADS = [
    { id: 1, nome: 'PalancaSoft ERP — Instalador Completo', cat: 'PalancaSoft', versao: 'v7.1', tamanho: 148.6, agt: true, tipo: '.exe', notas: 'Faturação certificada AGT, novo módulo de relatórios e melhorias de desempenho.', downloads: 3248, url: 'https://wa.me/244933609090?text=' + encodeURIComponent("Olá CFTEC! Quero o download de PalancaSoft ERP — Instalador Completo") },
    { id: 2, nome: 'PalancaSoft — Atualização Fiscal', cat: 'PalancaSoft', versao: 'v7.1.2', tamanho: 22.3, agt: true, tipo: '.exe', notas: 'Ajustes de conformidade fiscal e correções de arredondamento em faturas.', downloads: 2109, url: 'https://wa.me/244933609090?text=' + encodeURIComponent("Olá CFTEC! Quero o download de PalancaSoft — Atualização Fiscal") },
    { id: 3, nome: 'PalancaSoft Servidor (Rede Local)', cat: 'PalancaSoft', versao: 'v7.1', tamanho: 96.4, agt: true, tipo: '.exe', notas: 'Instalação em servidor para ambientes multiutilizador em rede local.', downloads: 874, url: 'https://wa.me/244933609090?text=' + encodeURIComponent("Olá CFTEC! Quero o download de PalancaSoft Servidor (Rede Local)") },
    { id: 4, nome: 'Negomil ERP — Instalador Comercial', cat: 'Negomil', versao: 'v5.4', tamanho: 212.0, agt: true, tipo: '.exe', notas: 'Módulos comercial e tesouraria com melhorias na conciliação.', downloads: 1560, url: 'https://wa.me/244933609090?text=' + encodeURIComponent("Olá CFTEC! Quero o download de Negomil ERP — Instalador Comercial") },
    { id: 5, nome: 'Negomil ERP — Módulo Escolar', cat: 'Negomil', versao: 'v5.4', tamanho: 87.2, agt: false, tipo: '.exe', notas: 'Gestão de matrículas, propinas e pautas para instituições de ensino.', downloads: 642, url: 'https://wa.me/244933609090?text=' + encodeURIComponent("Olá CFTEC! Quero o download de Negomil ERP — Módulo Escolar") },
    { id: 6, nome: 'Negomil ERP — Módulo Fiscal', cat: 'Negomil', versao: 'v5.3.1', tamanho: 41.8, agt: true, tipo: '.exe', notas: 'Mapas fiscais e exportação SAF-T (AO).', downloads: 1133, url: 'https://wa.me/244933609090?text=' + encodeURIComponent("Olá CFTEC! Quero o download de Negomil ERP — Módulo Fiscal") },
    { id: 7, nome: 'CFTEC Suporte Remoto', cat: 'Utilitários', versao: 'v2.0', tamanho: 9.4, agt: false, tipo: '.exe', notas: 'Ferramenta leve para a equipa técnica prestar assistência à distância.', downloads: 4021, url: 'https://wa.me/244933609090?text=' + encodeURIComponent("Olá CFTEC! Quero o download de CFTEC Suporte Remoto") },
    { id: 8, nome: 'Gestor de Cópias de Segurança', cat: 'Utilitários', versao: 'v1.6', tamanho: 14.7, agt: false, tipo: '.exe', notas: 'Backups automáticos das bases de dados PalancaSoft e Negomil.', downloads: 1788, url: 'https://wa.me/244933609090?text=' + encodeURIComponent("Olá CFTEC! Quero o download de Gestor de Cópias de Segurança") },
    { id: 9, nome: 'Manual do Utilizador PalancaSoft', cat: 'Utilitários', versao: 'v7.1', tamanho: 6.2, agt: false, tipo: 'PDF', notas: 'Guia passo a passo: instalação, faturação e relatórios.', downloads: 2950, url: 'https://wa.me/244933609090?text=' + encodeURIComponent("Olá CFTEC! Quero o download de Manual do Utilizador PalancaSoft") }
  ];

  const state = { cat: 'Todos', q: '' };
  const grid = $('#dlGrid'), empty = $('#dlEmpty'), count = $('#dlCount');
  const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  function fmt(n) { return n.toLocaleString('pt-PT'); }

  function renderDownloads() {
    const q = norm(state.q.trim());
    const list = DOWNLOADS.filter(d => {
      const okCat = state.cat === 'Todos' || d.cat === state.cat;
      const hay = norm([d.nome, d.cat, d.versao, d.notas].join(' '));
      return okCat && (!q || hay.includes(q));
    });

    count.textContent = list.length === 1 ? '1 ficheiro encontrado' : list.length + ' ficheiros encontrados';
    empty.classList.toggle('hidden', list.length > 0);

    grid.innerHTML = list.map(d => `
      <article class="card p-6 flex flex-col cursor-pointer" data-id="${d.id}">
        <div class="flex items-start justify-between gap-3">
          <div class="icon-box"><i data-lucide="${d.tipo === 'PDF' ? 'file-text' : 'package'}" class="w-6 h-6"></i></div>
          <div class="flex flex-wrap gap-1.5 justify-end">
            ${d.agt ? '<span class="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1 font-display"><i data-lucide="badge-check" class="w-3 h-3"></i>Oficial AGT</span>' : ''}
            <span class="text-[10px] font-bold px-2.5 py-1 rounded-full font-display ${d.cat === 'PalancaSoft' ? 'bg-blue-50 text-royal-dark border border-blue-100' : d.cat === 'Negomil' ? 'bg-violet-50 text-violet-700 border border-violet-200' : 'bg-slate-100 text-slate-600'}">${esc(d.cat)}</span>
          </div>
        </div>
        <h3 class="font-display font-semibold text-base mt-4 leading-snug">${esc(d.nome)}</h3>
        <div class="mt-2.5 flex items-center gap-2 text-xs">
          <span class="px-2 py-0.5 rounded-md bg-blue-50 text-royal-dark font-bold border border-blue-100">${esc(d.versao)}</span>
          <span class="text-slate-500 inline-flex items-center gap-1.5"><i data-lucide="hard-drive" class="w-3.5 h-3.5"></i>${d.tamanho.toFixed(1).replace('.', ',')} MB</span>
          <span class="text-slate-300">•</span>
          <span class="text-slate-500 font-medium">${esc(d.tipo)}</span>
        </div>
        <p class="text-sm mt-3 leading-relaxed flex-1">${esc(d.notas)}</p>
        <div class="mt-5 flex items-center justify-between gap-3 pt-4 border-t border-slate-100">
          <span class="text-xs text-slate-500 inline-flex items-center gap-1.5"><i data-lucide="download-cloud" class="w-4 h-4"></i><span class="dl-count">${fmt(d.downloads)}</span> downloads</span>
          <div class="flex gap-2">
            <a href="detalhes.html?id=${d.id}" class="btn btn-outline !py-2 !px-3 !text-xs flex-1 text-center">
              <i data-lucide="external-link" class="w-3 h-3"></i> Detalhes
            </a>
            <a href="${esc(d.url)}" class="btn btn-primary !py-2 !px-3 !text-xs flex-1 text-center dl-btn" data-id="${d.id}" ${d.url !== '#' ? 'download' : ''}>
              <i data-lucide="download" class="w-3 h-3"></i> Baixar
            </a>
          </div>
        </div>
      </article>`).join('');
    icons();
  }

  if (grid) grid.addEventListener('click', (e) => {
    const btn = e.target.closest('.dl-btn');
    const detalhesLink = e.target.closest('a[href*="detalhes.html"]');
    const card = e.target.closest('article[data-id]');

    // Se clicou em link interno, não abre modal
    if (btn || detalhesLink) return;

    if (card) {
      // Clique no card abre o modal com detalhes
      const item = DOWNLOADS.find(d => d.id === Number(card.dataset.id));
      if (item && modalOk) abrirModal(item);
    }
  });

  const dlSearch = $('#dlSearch');
  if (dlSearch) dlSearch.addEventListener('input', (e) => { state.q = e.target.value; renderDownloads(); });

  function setCat(cat) {
    state.cat = cat;
    $$('#dlFilters .chip').forEach(c => c.classList.toggle('active', c.dataset.cat === cat));
    renderDownloads();
  }
  const dlFilters = $('#dlFilters');
  if (dlFilters) dlFilters.addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (chip) setCat(chip.dataset.cat);
  });
  $$('.pick-filter').forEach(a => a.addEventListener('click', () => setCat(a.dataset.filter)));
  if (grid && count && empty) renderDownloads();

  /* ---------- Atalhos de planos e assuntos ---------- */
  $$('.pick-plan').forEach(a => a.addEventListener('click', () => {
    const selPlan = $('#pModalidade');
    if (selPlan) selPlan.value = a.dataset.plan;
  }));
  $$('.pick-subject').forEach(a => a.addEventListener('click', () => {
    const sel = $('#cAssunto');
    if (!sel) return;
    const opt = Array.from(sel.options).find(o => o.value === a.dataset.subject || o.text === a.dataset.subject);
    if (opt) sel.value = opt.value;
  }));

  /* ---------- Validação e envio de formulários ---------- */
  const WHATSAPP = '244933609090'; // substitua pelo número comercial real (formato internacional, sem +)

  function validate(fields) {
    let ok = true;
    fields.forEach(f => {
      const bad = !f.value.trim();
      f.classList.toggle('invalid', bad);
      if (bad) ok = false;
    });
    return ok;
  }
  function phoneOk(v) { return v.replace(/\D/g, '').length >= 9; }

  function handleForm(form, fieldIds, msgEl, build, okText) {
    const els = fieldIds.map(id => $('#' + id));
    els.forEach(el => el.addEventListener('input', () => el.classList.remove('invalid')));
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      msgEl.className = 'text-sm min-h-[1.25rem]';
      if (!validate(els)) {
        msgEl.textContent = 'Preencha todos os campos obrigatórios.';
        msgEl.classList.add('text-red-600');
        return;
      }
      const tel = els.find(el => el.type === 'tel');
      if (tel && !phoneOk(tel.value)) {
        tel.classList.add('invalid');
        msgEl.textContent = 'Indique um número de telefone válido.';
        msgEl.classList.add('text-red-600');
        return;
      }
      const text = build();
      window.open('https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(text), '_blank', 'noopener');
      msgEl.textContent = okText;
      msgEl.classList.add('text-emerald-700');
      toast(okText);
      form.reset();
    });
  }

  if ($('#partnerForm')) handleForm(
    $('#partnerForm'),
    ['pModalidade', 'pNome', 'pNif', 'pTel', 'pProv'],
    $('#pMsg'),
    () => [
      '*Inscrição — Programa de Parcerias Negomil*',
      'Modalidade: ' + $('#pModalidade').value,
      'Nome: ' + $('#pNome').value.trim(),
      'NIF/Empresa: ' + $('#pNif').value.trim(),
      'Telefone: ' + $('#pTel').value.trim(),
      'Província: ' + $('#pProv').value
    ].join('\n'),
    'Inscrição preparada! Conclua o envio na janela do WhatsApp.'
  );

  if ($('#contactForm')) handleForm(
    $('#contactForm'),
    ['cNome', 'cTel', 'cAssunto', 'cMsg'],
    $('#cMsgFeedback'),
    () => [
      '*' + $('#cAssunto').value + '*',
      'Nome: ' + $('#cNome').value.trim(),
      'Telefone: ' + $('#cTel').value.trim(),
      $('#cEmail').value.trim() ? 'E-mail: ' + $('#cEmail').value.trim() : '',
      'Mensagem: ' + $('#cMsg').value.trim()
    ].filter(Boolean).join('\n'),
    'Pedido preparado! Conclua o envio na janela do WhatsApp.'
  );

  /* ---------- Links legais (placeholders) ---------- */
  $$('[data-legal]').forEach(a => a.addEventListener('click', (e) => {
    e.preventDefault();
    toast(a.dataset.legal + ': documento disponível mediante solicitação à CFTEC.');
  }));

  /* ---------- Animações GSAP ---------- */
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function countUp() {
    $$('[data-count]').forEach(el => {
      const target = Number(el.dataset.count), suffix = el.dataset.suffix || '';
      if (reduce || !window.gsap) { el.textContent = target + suffix; return; }
      const o = { v: 0 };
      gsap.to(o, { v: target, duration: 1.6, ease: 'power2.out', delay: .4,
        onUpdate: () => { el.textContent = Math.round(o.v) + suffix; },
        onComplete: () => { el.textContent = target + suffix; } });
    });
  }

  if (window.gsap && !reduce) {
    gsap.registerPlugin(ScrollTrigger);
    gsap.from('.hero-anim', { y: 28, opacity: 0, duration: .8, ease: 'power3.out', stagger: .12 });
    $$('.reveal').forEach((el) => {
      gsap.from(el, {
        y: 36, opacity: 0, duration: .8, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true }
      });
    });
  }

  countUp();
})();
