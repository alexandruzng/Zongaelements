/* ============================================
   ZONGA ELEMENTS — Lógica de la landing
   - Renderizado dinámico de herramientas
   - Animaciones por scroll (IntersectionObserver)
   - Navbar con sombra al scrollear
   - Menú móvil
   - Año dinámico en el footer
   ============================================ */

/* ----- Catálogo de herramientas ----- */
/* Para añadir una nueva herramienta basta con sumar un objeto aquí.
   status: 'available' | 'coming-soon'
   icon: string SVG inline (usa currentColor) */
const tools = [
  {
    id: 'reviews',
    name: 'Generador de reseñas CSV',
    description: 'Crea archivos de reseñas listos para importar en Shopify o Areviews, con variaciones realistas.',
    url: 'https://claude.ai/public/artifacts/f1333354-222d-4533-b9c9-74667e57a896',
    status: 'available',
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`
  },
  {
    id: 'finanzas',
    name: 'Gestor de ingresos y gastos',
    description: 'Tracker financiero en RON y EUR con categorías personalizadas y visualización clara de tu flujo de caja.',
    url: 'finanzas/Fianzas (standalone).html',
    status: 'available',
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`
  },
  {
    id: 'tiktok-dl',
    name: 'Descargador TikTok sin WM',
    description: 'Descarga videos de TikTok sin marca de agua en HD, SD o solo audio MP3. Requiere servidor local activo.',
    url: 'http://localhost:5000/',
    status: 'available',
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`
  },
  {
    id: 'metadata',
    name: 'Removedor de Metadata',
    description: 'Elimina EXIF, ubicación, autor y cualquier rastro de tus imágenes, videos o audios.',
    url: 'removedor-metadata/index.html',
    status: 'available',
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>`
  },
  {
    id: 'prompt-nanobanana',
    name: 'Prompts para Nanobanana',
    description: 'Generador de prompts optimizados para crear imágenes con Nanobanana.',
    url: 'https://claude.ai/public/artifacts/87f64a94-68ff-458c-8a56-888691cad732',
    status: 'available',
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="M21 15l-5-5-11 11"/></svg>`
  },
  {
    id: 'prompt-kling',
    name: 'Prompts para Kling 3.0',
    description: 'Generador de prompts optimizados para crear vídeos con Kling 3.0.',
    url: 'https://claude.ai/public/artifacts/41e34a63-387d-4cda-83b1-0da9be4f91cd',
    status: 'available',
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>`
  },
  {
    id: 'fake-chat',
    name: 'Generador de Fake Chat',
    description: 'Crea conversaciones falsas de Instagram con dos personas, mensajes, fotos y perfil personalizado. Exporta la captura en PNG.',
    url: 'generador-fake-chat/index.html',
    status: 'available',
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>`
  },
  {
    id: 'generador-comentarios',
    name: 'Generador de comentarios',
    description: 'Crea comentarios falsos de TikTok o Instagram con tu usuario, foto, verificado y texto. Exporta en PNG listo para usar.',
    url: 'generador-comentarios/index.html',
    status: 'available',
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`
  },
  {
    id: 'politicas',
    name: 'Generador de políticas',
    description: 'Crea políticas legales (privacidad, devoluciones, envíos, términos) listas para tu tienda en segundos.',
    url: 'https://claude.site/public/artifacts/8db4c369-adf7-4f26-a5e3-03360703e591/embed?utm_source=embedded_artifact&utm_medium=iframe&utm_campaign=artifact_frame',
    status: 'available',
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="15" y2="17"/></svg>`
  },
  {
    id: 'diario-general',
    name: 'Diario electrónico',
    description: 'Diario personal sin límite de fechas: registra tu día, adjunta fotos, define objetivos y escribe cartas a tu yo del futuro.',
    url: 'diario electronico/Diario.html',
    status: 'available',
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><line x1="9" y1="7" x2="15" y2="7"/><line x1="9" y1="11" x2="14" y2="11"/></svg>`
  },
  {
    id: 'diario-30',
    name: 'Diario de 30 días',
    description: 'Registra tu punto de partida y cada día del mes. Al final del reto obtén un recap con tu antes vs ahora.',
    url: 'diario-30-dias/index.html',
    status: 'available',
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M8 14h3"/><path d="M8 18h6"/></svg>`
  },
  {
    id: 'soon-2',
    name: 'Próximamente',
    description: 'Estamos trabajando en más piezas para completar tu flujo de trabajo.',
    url: '#',
    status: 'coming-soon',
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`
  }
];

/* ----- Render de tarjetas ----- */
function renderTools() {
  const grid = document.getElementById('toolsGrid');
  if (!grid) return;

  grid.innerHTML = tools.map(t => {
    const isSoon = t.status === 'coming-soon';
    const isExternal = !isSoon && /^https?:\/\//.test(t.url);
    const linkText = isSoon ? 'Próximamente' : 'Abrir';
    const linkAttrs = isSoon
      ? 'aria-disabled="true"'
      : (isExternal ? 'target="_blank" rel="noopener noreferrer"' : '');
    return `
      <article class="tool-card reveal ${isSoon ? 'is-soon' : ''}">
        <div class="tool-icon" aria-hidden="true">${t.icon}</div>
        <h3>${t.name}</h3>
        <p>${t.description}</p>
        <a class="tool-link" href="${t.url}" ${linkAttrs}>
          ${linkText} <span aria-hidden="true">→</span>
        </a>
      </article>
    `;
  }).join('');

  // Re-observa los elementos .reveal recién insertados
  observeReveals();
}

/* ----- Contador de herramientas activas en el hero ----- */
function renderToolsCount() {
  const el = document.getElementById('toolsCount');
  if (!el) return;
  const count = tools.filter(t => t.status === 'available').length;
  el.textContent = count;
}

/* ----- Render de links del footer ----- */
function renderFooterLinks() {
  const ul = document.getElementById('footerTools');
  if (!ul) return;
  ul.innerHTML = tools
    .filter(t => t.status === 'available')
    .map(t => `<li><a href="${t.url}">${t.name}</a></li>`)
    .join('');
}

/* ----- Scroll reveal ----- */
let revealObserver;
function observeReveals() {
  if (!('IntersectionObserver' in window)) {
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('is-visible'));
    return;
  }
  if (!revealObserver) {
    revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  }
  document.querySelectorAll('.reveal:not(.is-visible)').forEach(el => revealObserver.observe(el));
}

/* ----- Navbar con sombra al scrollear ----- */
function initNavbarScroll() {
  const nav = document.getElementById('navbar');
  if (!nav) return;
  const onScroll = () => {
    nav.classList.toggle('is-scrolled', window.scrollY > 8);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
}

/* ----- Menú móvil ----- */
function initMobileMenu() {
  const nav = document.getElementById('navbar');
  const toggle = document.getElementById('navToggle');
  if (!nav || !toggle) return;

  toggle.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });

  // Cierra el menú al tocar un link
  nav.querySelectorAll('.nav-links a').forEach(a => {
    a.addEventListener('click', () => {
      nav.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
}

/* ----- Año dinámico ----- */
function setYear() {
  const y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
}

/* ----- Init ----- */
document.addEventListener('DOMContentLoaded', () => {
  renderTools();
  renderToolsCount();
  renderFooterLinks();
  observeReveals();
  initNavbarScroll();
  initMobileMenu();
  setYear();
});
