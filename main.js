/**
 * main.js — Triple Frontera Transfers
 * Internacionalización (i18n) + comportamiento UI
 *
 * CLIENTE: buscá "TODO CLIENTE" para encontrar los lugares
 * donde debés completar datos reales.
 */

'use strict';

/* ── Configuración ── */

// WhatsApp: +55 45 99149-2238
const WHATSAPP_NUMBER = '5545991492238';

const SUPPORTED_LANGS = ['es', 'pt'];
const DEFAULT_LANG    = 'es';
const LS_KEY          = 'tft_lang'; // localStorage key

/* ── Estado ── */
let currentLang = DEFAULT_LANG;
let currentData = {};

/* ── Carga del JSON ── */
async function loadLang(lang) {
  try {
    const res = await fetch(`./${lang}.json`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error(`Error cargando idioma "${lang}":`, err);
    return null;
  }
}

/* ── Acceso profundo al objeto JSON por clave "dot.notation" ── */
function getNestedValue(obj, key) {
  return key.split('.').reduce((acc, part) => {
    if (acc === undefined || acc === null) return '';
    return acc[part];
  }, obj);
}

/* ── Aplica textos al DOM ── */
function applyTranslations(data) {
  // Elementos de texto simple
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key   = el.getAttribute('data-i18n');
    const value = getNestedValue(data, key);
    if (value !== undefined && value !== '') el.textContent = value;
  });

  // Atributos (aria-label, placeholder, title, alt, etc.)
  document.querySelectorAll('[data-i18n-attr]').forEach(el => {
    const pairs = el.getAttribute('data-i18n-attr').split(',');
    pairs.forEach(pair => {
      const [attr, key] = pair.trim().split(':');
      const value = getNestedValue(data, key.trim());
      if (value) el.setAttribute(attr.trim(), value);
    });
  });
}

/* ── Renderiza los servicios dinámicamente ── */
function renderServices(data) {
  const grid = document.getElementById('services-grid');
  if (!grid) return;

  const items = data?.services?.items;
  if (!Array.isArray(items)) return;

  grid.innerHTML = items.map(item => `
    <article class="service-card" role="listitem">
      <div class="service-card__icon" aria-hidden="true">${item.icon}</div>
      <h3 class="service-card__name">${item.name}</h3>
      <p class="service-card__desc">${item.description}</p>
    </article>
  `).join('');
}

/* ── Renderiza los párrafos de "Quiénes somos" ── */
function renderAbout(data) {
  const container = document.getElementById('about-description');
  if (!container) return;

  const paragraphs = data?.about?.description;
  if (!Array.isArray(paragraphs)) return;

  container.innerHTML = paragraphs.map(p => `<p>${p}</p>`).join('');
}

/* ── Actualiza el botón de idioma ── */
function updateLangButton(lang) {
  const esSpan = document.getElementById('lang-es');
  const ptSpan = document.getElementById('lang-pt');
  if (!esSpan || !ptSpan) return;

  if (lang === 'es') {
    esSpan.classList.add('active');
    ptSpan.classList.remove('active');
  } else {
    ptSpan.classList.add('active');
    esSpan.classList.remove('active');
  }
}

/* ── Actualiza el link de WhatsApp ── */
function updateWhatsApp(data) {
  const btn     = document.getElementById('whatsapp-btn');
  const tooltip = document.getElementById('whatsapp-tooltip');

  if (btn) {
    // TODO CLIENTE: WHATSAPP_NUMBER al principio del archivo
    btn.href = `https://wa.me/${WHATSAPP_NUMBER}`;
    btn.setAttribute('aria-label', data?.whatsapp?.tooltip || 'WhatsApp');
  }

  if (tooltip) {
    tooltip.textContent = data?.whatsapp?.tooltip || '';
  }
}

/* ── Función principal de cambio de idioma ── */
async function setLang(lang) {
  if (!SUPPORTED_LANGS.includes(lang)) lang = DEFAULT_LANG;

  const data = await loadLang(lang);
  if (!data) return; // aborta si falló la carga

  currentLang = lang;
  currentData = data;

  // Guarda preferencia
  try {
    localStorage.setItem(LS_KEY, lang);
  } catch (_) { /* Safari private mode puede fallar */ }

  // Aplica al DOM
  applyTranslations(data);
  renderServices(data);
  renderAbout(data);
  updateLangButton(lang);
  updateWhatsApp(data);

  // Actualiza atributo lang del HTML para accesibilidad
  document.documentElement.lang = lang === 'pt' ? 'pt-BR' : 'es-AR';
}

/* ── Menú hamburger ── */
function initHamburger() {
  const btn = document.getElementById('hamburger');
  const nav = document.getElementById('main-nav');
  if (!btn || !nav) return;

  btn.addEventListener('click', () => {
    const isOpen = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', String(!isOpen));
    nav.classList.toggle('is-open', !isOpen);
  });

  // Cierra el menú al hacer clic en un enlace
  nav.querySelectorAll('.nav__link').forEach(link => {
    link.addEventListener('click', () => {
      btn.setAttribute('aria-expanded', 'false');
      nav.classList.remove('is-open');
    });
  });

  // Cierra al hacer clic fuera
  document.addEventListener('click', e => {
    if (!btn.contains(e.target) && !nav.contains(e.target)) {
      btn.setAttribute('aria-expanded', 'false');
      nav.classList.remove('is-open');
    }
  });

  // Cierra con Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) {
      btn.setAttribute('aria-expanded', 'false');
      nav.classList.remove('is-open');
      btn.focus();
    }
  });
}

/* ── Botón de cambio de idioma ── */
function initLangToggle() {
  const toggle = document.getElementById('lang-toggle');
  if (!toggle) return;

  toggle.addEventListener('click', () => {
    const next = currentLang === 'es' ? 'pt' : 'es';
    setLang(next);
  });

  toggle.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggle.click();
    }
  });
}

/* ── Header: añade clase al hacer scroll ── */
function initScrollHeader() {
  const header = document.querySelector('.header');
  if (!header) return;

  const observer = new IntersectionObserver(
    ([entry]) => header.classList.toggle('header--scrolled', !entry.isIntersecting),
    { threshold: 0, rootMargin: '-68px 0px 0px 0px' }
  );

  const hero = document.querySelector('.hero');
  if (hero) observer.observe(hero);
}

/* ── Init ── */
document.addEventListener('DOMContentLoaded', () => {
  // Lee preferencia guardada o usa español por defecto
  let savedLang = DEFAULT_LANG;
  try {
    const stored = localStorage.getItem(LS_KEY);
    if (stored && SUPPORTED_LANGS.includes(stored)) savedLang = stored;
  } catch (_) { /* sin acceso a localStorage */ }

  initHamburger();
  initLangToggle();
  initScrollHeader();
  setLang(savedLang);
});
