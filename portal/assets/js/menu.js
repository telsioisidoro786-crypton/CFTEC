/**
 * menu.js — Menu com dropdowns funcionais (desktop + mobile)
 * Seleciona os painéis pelos atributos data-dd-menu / data-md-menu (não por id).
 */

(function () {
  'use strict';

  function panel(selector) {
    return document.querySelector(selector);
  }

  // =========================================
  // Desktop dropdowns (clique para abrir/fechar)
  // =========================================
  const desktopTriggers = document.querySelectorAll('[data-dd-trigger]');

  // Rotação da seta inline: mais robusta do que confiar só na classe .rotate-180
  function setArrow(arrow, open) {
    if (!arrow) return;
    arrow.classList.toggle('rotate-180', open);
    arrow.style.transform = open ? 'rotate(180deg)' : '';
  }

  function closeAllDesktop() {
    document.querySelectorAll('[data-dd-menu]').forEach((m) => m.classList.add('hidden'));
    desktopTriggers.forEach((t) => {
      t.classList.remove('nav-dd-open');
      setArrow(t.querySelector('[data-dd-arrow]'), false);
    });
  }

  desktopTriggers.forEach((trigger) => {
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      const targetId = trigger.getAttribute('data-dd-trigger');
      const targetMenu = panel('[data-dd-menu="' + targetId + '"]');
      if (!targetMenu) return;

      const isOpen = !targetMenu.classList.contains('hidden');
      closeAllDesktop();

      if (!isOpen) {
        targetMenu.classList.remove('hidden');
        trigger.classList.add('nav-dd-open');
        setArrow(trigger.querySelector('[data-dd-arrow]'), true);
      }
    });
  });

  // Fechar desktop dropdowns ao clicar fora
  document.addEventListener('click', (e) => {
    if (!e.target.closest('[data-dd-wrapper]')) closeAllDesktop();
  });

  // Fechar ao premir Esc
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAllDesktop();
  });

  // =========================================
  // Mobile menu (hamburguer)
  // =========================================
  const menuBtn = document.getElementById('menuBtn');
  const mobileMenu = document.getElementById('mobileMenu');

  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener('click', () => {
      const isOpen = !mobileMenu.classList.contains('hidden');
      mobileMenu.classList.toggle('hidden', isOpen);
      menuBtn.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
    });
  }

  // =========================================
  // Mobile dropdowns (accordion)
  // =========================================
  const mobileTriggers = document.querySelectorAll('[data-md-trigger]');

  function closeAllMobile() {
    document.querySelectorAll('[data-md-menu]').forEach((m) => m.classList.add('hidden'));
    document.querySelectorAll('[data-md-arrow]').forEach((a) => setArrow(a, false));
  }

  mobileTriggers.forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-md-trigger');
      const content = panel('[data-md-menu="' + targetId + '"]');
      if (!content) return;

      const isOpen = !content.classList.contains('hidden');
      closeAllMobile();

      if (!isOpen) {
        content.classList.remove('hidden');
        setArrow(btn.querySelector('[data-md-arrow]'), true);
      }
    });
  });

  // Fechar mobile menu ao clicar em link
  document.querySelectorAll('#mobileMenu a').forEach((link) => {
    link.addEventListener('click', () => {
      if (mobileMenu) {
        mobileMenu.classList.add('hidden');
        if (menuBtn) menuBtn.setAttribute('aria-expanded', 'false');
      }
    });
  });
})();
