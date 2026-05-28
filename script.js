/* ============================================
   ZONGA ELEMENTS — Lógica de la landing
   - Renderizado dinámico de herramientas
   - Animaciones por scroll (IntersectionObserver)
   - Navbar con sombra al scrollear
   - Menú móvil
   - Año dinámico en el footer
   ============================================ */

/* ----- Categorías ----- */
/* Cada herramienta pertenece a una categoría. Los chips se renderizan en orden. */
const categories = [
  { id: 'all',      label: 'Todas' },
  { id: 'redes',    label: 'Contenido & Redes Sociales' },
  { id: 'ia',       label: 'IA & Creación Visual' },
  { id: 'tienda',   label: 'Tienda & Producto' },
  { id: 'finanzas', label: 'Finanzas & Operaciones' },
  { id: 'personal', label: 'Productividad Personal' }
];

/* ----- Catálogo de herramientas ----- */
/* Para añadir una nueva herramienta basta con sumar un objeto aquí.
   status: 'available' | 'coming-soon'
   category: 'redes' | 'ia' | 'tienda' | 'finanzas' | 'personal'
   icon: string SVG inline (usa currentColor) */
const tools = [
  {
    id: 'reviews',
    name: 'Generador de reseñas CSV',
    description: 'Crea archivos de reseñas listos para importar en Shopify o Areviews, con variaciones realistas.',
    url: 'https://claude.ai/public/artifacts/f1333354-222d-4533-b9c9-74667e57a896',
    status: 'available',
    category: 'tienda',
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`
  },
  {
    id: 'finanzas',
    name: 'Gestor de ingresos y gastos',
    description: 'Tracker financiero en RON y EUR con categorías personalizadas y visualización clara de tu flujo de caja.',
    url: 'finanzas/Fianzas.html',
    status: 'available',
    category: 'finanzas',
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`
  },
  {
    id: 'tiktok-dl',
    name: 'Descargador TikTok sin WM',
    description: 'Descarga videos de TikTok sin marca de agua en HD, SD o solo audio MP3.',
    url: 'descargador-video/index.html',
    status: 'available',
    category: 'redes',
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`
  },
  {
    id: 'metadata',
    name: 'Removedor de Metadata',
    description: 'Elimina EXIF, ubicación, autor y cualquier rastro de tus imágenes, videos o audios.',
    url: 'removedor-metadata/index.html',
    status: 'available',
    category: 'redes',
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>`
  },
  {
    id: 'prompt-nanobanana',
    name: 'Prompts para Nanobanana',
    description: 'Generador de prompts optimizados para crear imágenes con Nanobanana.',
    url: 'https://claude.ai/public/artifacts/87f64a94-68ff-458c-8a56-888691cad732',
    status: 'available',
    category: 'ia',
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="M21 15l-5-5-11 11"/></svg>`
  },
  {
    id: 'prompt-kling',
    name: 'Prompts para Kling 3.0',
    description: 'Generador de prompts optimizados para crear vídeos con Kling 3.0.',
    url: 'https://claude.ai/public/artifacts/41e34a63-387d-4cda-83b1-0da9be4f91cd',
    status: 'available',
    category: 'ia',
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>`
  },
  {
    id: 'fake-chat',
    name: 'Generador de Fake Chat',
    description: 'Crea conversaciones falsas de Instagram con dos personas, mensajes, fotos y perfil personalizado. Exporta la captura en PNG.',
    url: 'generador-fake-chat/index.html',
    status: 'available',
    category: 'redes',
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>`
  },
  {
    id: 'generador-comentarios',
    name: 'Generador de comentarios',
    description: 'Crea comentarios falsos de TikTok o Instagram con tu usuario, foto, verificado y texto. Exporta en PNG listo para usar.',
    url: 'generador-comentarios/index.html',
    status: 'available',
    category: 'redes',
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`
  },
  {
    id: 'politicas',
    name: 'Generador de políticas',
    description: 'Crea políticas legales (privacidad, devoluciones, envíos, términos) listas para tu tienda en segundos.',
    url: 'https://claude.site/public/artifacts/8db4c369-adf7-4f26-a5e3-03360703e591/embed?utm_source=embedded_artifact&utm_medium=iframe&utm_campaign=artifact_frame',
    status: 'available',
    category: 'tienda',
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="15" y2="17"/></svg>`
  },
  {
    id: 'diario-general',
    name: 'Diario electrónico',
    description: 'Diario personal sin límite de fechas: registra tu día, adjunta fotos, define objetivos y escribe cartas a tu yo del futuro.',
    url: 'diario electronico/Diario-completo.html',
    status: 'available',
    category: 'personal',
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><line x1="9" y1="7" x2="15" y2="7"/><line x1="9" y1="11" x2="14" y2="11"/></svg>`
  },
  {
    id: 'diario-30',
    name: 'Diario de 30 días',
    description: 'Registra tu punto de partida y cada día del mes. Al final del reto obtén un recap con tu antes vs ahora.',
    url: 'diario-30-dias/index.html',
    status: 'available',
    category: 'personal',
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M8 14h3"/><path d="M8 18h6"/></svg>`
  },
  {
    id: 'pedidos-diarios',
    name: 'Pedidos diarios',
    description: 'Registra los pedidos y la facturación de cada día. Calendario mensual con totales y media diaria.',
    url: 'pedidos-diarios/index.html',
    status: 'available',
    category: 'finanzas',
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M9 16l2 2 4-4"/></svg>`
  },
  {
    id: 'tracker-habitos',
    name: 'Tracker de hábitos',
    description: 'Sigue hasta 9 hábitos al mes en una rueda visual. Marca cada día como cumplido o no hecho y mira tu constancia volverse geometría.',
    url: 'tracker-habitos/index.html',
    status: 'available',
    category: 'personal',
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><line x1="12" y1="3" x2="12" y2="8"/><line x1="12" y1="16" x2="12" y2="21"/></svg>`
  },
  {
    id: 'reviews-ig',
    name: 'Generador de reviews Instagram',
    description: 'Crea capturas realistas de conversaciones de Instagram con clientes elogiando tu producto. Hasta 20 por ronda, en ES o EN.',
    url: 'generador-reviews-ig/index.html',
    status: 'available',
    category: 'redes',
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>`
  },
  {
    id: 'analisis-realismo-ia',
    name: 'Análisis de realismo IA',
    description: 'Sube una foto generada con IA y obtén un análisis de qué tan realista parece, con detalles a corregir.',
    url: 'https://claude.ai/public/artifacts/de1e606d-f1e9-418e-9480-4c0e909bc02f',
    status: 'available',
    category: 'ia',
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/><path d="M8 11h6"/><path d="M11 8v6"/></svg>`
  },
  {
    id: 'generador-nombres-marca',
    name: 'Generador de nombres de marca',
    description: 'Genera ideas de nombres de marca originales a partir de tu sector, estilo y palabras clave.',
    url: 'https://claude.ai/public/artifacts/dbffd737-f536-40c4-85b3-aa3a6e245518',
    status: 'available',
    category: 'tienda',
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>`
  },
  {
    id: 'generador-paleta-colores',
    name: 'Generador de paleta de colores',
    description: 'Crea paletas de colores armónicas para tu marca a partir de un estilo o color base. Ideal para branding y diseño web.',
    url: 'https://claude.ai/public/artifacts/2b1d2ab5-375b-4df1-b5a9-d5281627b171',
    status: 'available',
    category: 'tienda',
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r="1.5"/><circle cx="17.5" cy="10.5" r="1.5"/><circle cx="8.5" cy="7.5" r="1.5"/><circle cx="6.5" cy="12.5" r="1.5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>`
  },
  {
    id: 'generador-copy-tienda',
    name: 'Generador de copy para tienda',
    description: 'Genera el copy completo de tu tienda: reseñas, beneficios con emojis, palabras clave y textos persuasivos listos para usar.',
    url: 'https://claude.ai/public/artifacts/7c9d3db9-8d5d-464b-b4a7-0c658903c642',
    status: 'available',
    category: 'tienda',
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>`
  },
  {
    id: 'analisis-cliente',
    name: 'Generador de análisis de cliente',
    description: 'Genera un perfil detallado de tu cliente ideal: demografía, motivaciones, objeciones y canales para enfocar tu marketing.',
    url: 'https://claude.ai/public/artifacts/bd86cf82-fb34-44e7-9440-b2de2599f618',
    status: 'available',
    category: 'tienda',
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`
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

/* ----- Estado de filtros ----- */
let activeCategory = 'all';
let searchQuery = '';

/* ----- Normalización para búsqueda (sin acentos, lowercase) ----- */
function norm(str) {
  return (str || '')
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

/* ----- Conteo por categoría (solo herramientas disponibles) ----- */
function countByCategory(catId) {
  if (catId === 'all') return tools.filter(t => t.status === 'available').length;
  return tools.filter(t => t.status === 'available' && t.category === catId).length;
}

/* ----- Render de chips de categoría ----- */
function renderCategoryChips() {
  const wrap = document.getElementById('toolsFilters');
  if (!wrap) return;
  wrap.innerHTML = categories.map(c => {
    const count = countByCategory(c.id);
    const isActive = c.id === activeCategory;
    return `
      <button type="button"
              class="chip ${isActive ? 'is-active' : ''}"
              data-category="${c.id}"
              aria-pressed="${isActive}">
        ${c.label}
        <span class="chip-count">${count}</span>
      </button>
    `;
  }).join('');

  wrap.querySelectorAll('.chip').forEach(btn => {
    btn.addEventListener('click', () => {
      activeCategory = btn.dataset.category;
      renderCategoryChips();
      renderTools();
    });
  });
}

/* ----- Render de tarjetas (aplica filtro y búsqueda) ----- */
function renderTools() {
  const grid = document.getElementById('toolsGrid');
  const empty = document.getElementById('toolsEmpty');
  if (!grid) return;

  const q = norm(searchQuery.trim());

  const filtered = tools.filter(t => {
    // Coming-soon solo visible cuando estamos en "Todas" y sin búsqueda
    if (t.status === 'coming-soon') {
      return activeCategory === 'all' && !q;
    }
    if (activeCategory !== 'all' && t.category !== activeCategory) return false;
    if (q && !(norm(t.name).includes(q) || norm(t.description).includes(q))) return false;
    return true;
  });

  grid.innerHTML = filtered.map(t => {
    const isSoon = t.status === 'coming-soon';
    const isExternal = !isSoon && /^https?:\/\//.test(t.url);
    const linkText = isSoon ? 'Próximamente' : 'Abrir';
    const linkAttrs = isSoon
      ? 'aria-disabled="true"'
      : (isExternal ? 'target="_blank" rel="noopener noreferrer"' : '');
    return `
      <article class="tool-card reveal is-visible ${isSoon ? 'is-soon' : ''}">
        <div class="tool-icon" aria-hidden="true">${t.icon}</div>
        <h3>${t.name}</h3>
        <p>${t.description}</p>
        <a class="tool-link" href="${t.url}" ${linkAttrs}>
          ${linkText} <span aria-hidden="true">→</span>
        </a>
      </article>
    `;
  }).join('');

  if (empty) {
    empty.hidden = filtered.length > 0;
  }
}

/* ----- Buscador ----- */
function initToolsSearch() {
  const input = document.getElementById('toolsSearch');
  const clearBtn = document.getElementById('toolsSearchClear');
  if (!input) return;

  const onInput = () => {
    searchQuery = input.value;
    if (clearBtn) clearBtn.hidden = !searchQuery;
    renderTools();
  };

  input.addEventListener('input', onInput);
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      input.value = '';
      searchQuery = '';
      clearBtn.hidden = true;
      input.focus();
      renderTools();
    });
  }
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
  renderCategoryChips();
  renderTools();
  renderToolsCount();
  renderFooterLinks();
  initToolsSearch();
  observeReveals();
  initNavbarScroll();
  initMobileMenu();
  setYear();
});
