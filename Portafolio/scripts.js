// © Raúl Sebastián – Portfolio UI
// ================== Utilidades ==================
const $  = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

// Año footer
$('#y').textContent = new Date().getFullYear();

// Smooth scroll (con reducción de motion)
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
$$('a[href^="#"]').forEach(a => {
  a.addEventListener('click', (e) => {
    const id = a.getAttribute('href');
    const el = document.querySelector(id);
    if (!el) return;
    e.preventDefault();
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', block: 'start' });
  });
});

// ================== Tema persistente ==================
const THEME_KEY = 'raul:theme';
(function initTheme(){
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === 'light') document.documentElement.classList.add('light');
  $('#themeBtn').textContent = document.documentElement.classList.contains('light') ? '🌙' : '☀️';
})();
$('#themeBtn').addEventListener('click', () => {
  const root = document.documentElement;
  const isLight = root.classList.toggle('light');
  localStorage.setItem(THEME_KEY, isLight ? 'light' : 'dark');
  $('#themeBtn').textContent = isLight ? '🌙' : '☀️';
});

// ================== Scroll-spy nav activo ==================
const sections = ['#proyectos','#skills','#cv','#contacto'].map(id => document.querySelector(id)).filter(Boolean);
const navLinks = Array.from($$('.nav-link'));

const setActive = (id) => {
  navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === id));
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) setActive('#' + entry.target.id);
  });
}, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });

sections.forEach(sec => observer.observe(sec));

// ================== Botón "Back to top" ==================
const toTop = $('#toTop');
const topObserver = new IntersectionObserver(([entry]) => {
  toTop.classList.toggle('show', !entry.isIntersecting);
});
topObserver.observe($('#top'));

toTop.addEventListener('click', () => {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.scrollTo({ top: 0, behavior: prefersReduced ? 'auto' : 'smooth' });
});
