/* ============================================
   ZONGA ELEMENTS — Lógica de la landing
   - Renderizado dinámico de herramientas
   - Animaciones por scroll (IntersectionObserver)
   - Navbar con sombra al scrollear
   - Menú móvil
   - Año dinámico en el footer
   ============================================ */

/* Lectura de claves que otras herramientas ahora guardan comprimidas (ZongaLS).
   Compatible con datos antiguos sin comprimir. */
function readLS(key) {
  return window.ZongaLS ? ZongaLS.load(key) : localStorage.getItem(key);
}

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
    url: 'https://claude.site/public/artifacts/71f877eb-2516-4449-94c5-366ee02a7f7e/embed?utm_source=embedded_artifact&utm_medium=iframe&utm_campaign=artifact_frame',
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
    id: 'product-hub',
    name: 'Product Hub',
    description: 'Centro de control para dropshipping orgánico. Trata cada producto como un proyecto: ventas día a día, cuentas de redes y diagnóstico por fases y pilares.',
    url: 'Product Hub/Product Hub.html',
    status: 'available',
    category: 'personal',
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-6 9 6v11a2 2 0 0 1-2 2h-4v-7H10v7H6a2 2 0 0 1-2-2V9z"/><path d="M8 13h8"/></svg>`
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
    id: 'click-here',
    name: 'Generador de enlaces Click-Here',
    description: 'Crea el enlace para redirigir desde tu bio de TikTok directo a tu tienda. Sin fricción, sin pasos intermedios.',
    url: 'https://www.click-here.store/admin',
    status: 'available',
    category: 'redes',
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`
  },
  {
    id: 'banco-productos',
    name: 'Banco de productos',
    description: 'Guarda cada producto con su foto, link de la tienda, coste, precio de venta y beneficio. Organízalos por estado (evaluar, testeando, ganador, descartado) y fuente. Todo sincronizado en la nube.',
    url: 'banco-productos/index.html',
    status: 'available',
    category: 'personal',
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>`
  },
  {
    id: 'notas-libros',
    name: 'Notas de Libros',
    description: 'Tu biblioteca personal de lectura: guarda cada libro con su portada, progreso de páginas, valoración con estrellas y todas tus notas. Organízalos por estado (por leer, leyendo, leído), con buscador y modo oscuro. Todo sincronizado en la nube entre tus dispositivos.',
    url: 'notas-libros/index.html',
    status: 'available',
    category: 'personal',
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v15.5H5.5A1.5 1.5 0 0 0 4 21z"/><path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H13v15.5h5.5A1.5 1.5 0 0 1 20 21z"/></svg>`
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

/* ----- "Última vez usado" por herramienta ----- */
const LAST_USED_KEY = '__zonga_tool_last_used__';
function readLastUsed() {
  try { return JSON.parse(localStorage.getItem(LAST_USED_KEY) || '{}'); }
  catch { return {}; }
}
function writeLastUsed(map) {
  try { localStorage.setItem(LAST_USED_KEY, JSON.stringify(map)); } catch {}
}
function markToolUsed(id) {
  const map = readLastUsed();
  map[id] = Date.now();
  writeLastUsed(map);
}
function formatLastUsed(ts) {
  if (!ts) return null;
  const diff = Date.now() - ts;
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)   return 'Hace un momento';
  if (mins < 60)  return `Hace ${mins} min`;
  if (hours < 24) return `Hace ${hours} h`;
  if (days === 1) return 'Ayer';
  if (days < 7)   return `Hace ${days} días`;
  if (days < 30)  return `Hace ${Math.floor(days/7)} sem`;
  return `Hace ${Math.floor(days/30)} meses`;
}

/* ----- Render de tarjetas (aplica filtro y búsqueda) ----- */
function renderTools() {
  const grid = document.getElementById('toolsGrid');
  const empty = document.getElementById('toolsEmpty');
  if (!grid) return;

  const q = norm(searchQuery.trim());
  const lastUsed = readLastUsed();

  const filtered = tools.filter(t => {
    if (t.status === 'coming-soon') {
      return activeCategory === 'all' && !q;
    }
    if (activeCategory !== 'all' && t.category !== activeCategory) return false;
    if (q && !(norm(t.name).includes(q) || norm(t.description).includes(q))) return false;
    return true;
  });

  grid.innerHTML = filtered.map((t, idx) => {
    const isSoon = t.status === 'coming-soon';
    const isExternal = !isSoon && /^https?:\/\//.test(t.url);
    const linkText = isSoon ? 'Próximamente' : 'Abrir';
    const linkAttrs = isSoon
      ? 'aria-disabled="true"'
      : (isExternal ? 'target="_blank" rel="noopener noreferrer"' : '');

    let metaHTML = '';
    if (!isSoon) {
      const used = formatLastUsed(lastUsed[t.id]);
      metaHTML = used
        ? `<span class="tool-meta">${used}</span>`
        : `<span class="tool-meta is-pending">Sin abrir aún</span>`;
    }

    const delay = Math.min(idx * 50, 600);
    return `
      <article class="tool-card cockpit-enter ${isSoon ? 'is-soon' : ''}" style="--delay:${delay}ms" data-tool-id="${t.id}">
        <div class="tool-icon" aria-hidden="true">${t.icon}</div>
        <h3>${t.name}</h3>
        <p>${t.description}</p>
        ${metaHTML}
        <a class="tool-link" href="${t.url}" ${linkAttrs} data-tool-link="${t.id}">
          ${linkText} <span aria-hidden="true">→</span>
        </a>
      </article>
    `;
  }).join('');

  // Marcar la herramienta como usada al hacer clic en su link
  grid.querySelectorAll('a[data-tool-link]').forEach(a => {
    a.addEventListener('click', () => {
      const id = a.getAttribute('data-tool-link');
      if (id) markToolUsed(id);
    });
  });

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

/* ============================================
   COCKPIT — saludo, stats, producto activo, objetivo
   ============================================ */

/* Producto + Objetivo: se leen de Product Hub (localStorage.ph_db_v1).
   Si no hay datos, se usa el mock de cockpitData.productoActivo. */
const PH_STORAGE_KEY = 'ph_db_v1';
const COCKPIT_ACTIVE_KEY = '__zonga_cockpit_active_product__';

function loadProductHubProducts() {
  try {
    const raw = localStorage.getItem(PH_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed?.products) ? parsed.products : [];
  } catch { return []; }
}

/* Productos activos = los que están en "testeando" (los que se están
   probando ahora mismo en el reto de 14 días). */
function getActiveProducts() {
  return loadProductHubProducts().filter(p => p?.status === 'testeando');
}

/* ----- Rachas del Diario Electrónico ----- */
const DIARIO_ENTRIES_KEY = 'diario_entries_v2';
const DIARIO_STREAKS_KEY = 'diario_streaks_v2';

function loadDiaryStreaks() {
  try {
    const streaks = JSON.parse(readLS(DIARIO_STREAKS_KEY) || '[]');
    const entries = JSON.parse(readLS(DIARIO_ENTRIES_KEY) || '{}');
    if (!Array.isArray(streaks) || !streaks.length) return [];
    const todayKey = new Date().toISOString().slice(0, 10);
    return streaks.map(s => {
      let days = 0;
      Object.keys(entries).sort().forEach(k => {
        if (k >= s.startDate && entries[k]?.streaks?.[s.id]) days++;
      });
      const activeToday = !!entries[todayKey]?.streaks?.[s.id];
      return { id: s.id, name: s.name, startDate: s.startDate, days, activeToday };
    }).sort((a, b) => b.days - a.days);
  } catch { return []; }
}
function getTopDiaryStreak() {
  return loadDiaryStreaks()[0] || null;
}

/* ----- Metas del Gestor de Ingresos y Gastos ----- */
const FZ_GOALS_KEY = 'fz:goals';

function loadFinanceGoals() {
  try {
    const raw = readLS(FZ_GOALS_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}
function getTopFinanceGoal() {
  const all = loadFinanceGoals();
  if (!all.length) return null;
  const open = all.find(g => (g.current || 0) < (g.target || 0));
  return open || all[0];
}

/* ----- pctChange: variación de la segunda mitad vs la primera ----- */
function pctChange(arr) {
  if (!Array.isArray(arr) || arr.length < 4) return null;
  const mid = Math.floor(arr.length / 2);
  const prev = arr.slice(0, mid).reduce((a, b) => a + b, 0);
  const recent = arr.slice(mid).reduce((a, b) => a + b, 0);
  if (!prev) return null;
  return Math.round(((recent - prev) / prev) * 100);
}

/* Iconos SVG reutilizables para las stats */
const ICONS = {
  wallet:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="13" rx="2"/><path d="M2 10h20"/><path d="M14 15h4"/></svg>`,
  package: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>`,
  eye:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`,
  flame:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>`
};

/* Fallback para cuando no hay producto activo en Product Hub */
const cockpitData = {
  productoActivo: {
    nombre: 'Sin producto activo',
    emoji: '📦',
    diaActual: 1,
    diasTotal: 14,
    cuentas: 0,
    vistas: 0,
    breakEven: 0,
    revenue: 0
  }
};

/* ----- Construir las 4 stats del cockpit a partir del producto activo
   y de los datos del Diario.
   Las 3 primeras van con el producto; la última con la racha del diario. */
function buildStatsForProduct(view, product) {
  const stats = [];

  // 1. Revenue del test
  if (product?.series?.length) {
    const ingresos = product.series.map(d => d.ingresos || 0);
    stats.push({
      label: 'Revenue del test',
      value: ingresos.reduce((a, b) => a + b, 0),
      prefix: '€',
      change: pctChange(ingresos),
      trend: ingresos.length >= 2 ? ingresos : null,
      icon: ICONS.wallet,
      iconClass: ''
    });
  } else {
    stats.push({
      label: 'Revenue del test',
      value: 0, prefix: '€',
      icon: ICONS.wallet, iconClass: '',
      empty: 'Sin producto en testeo',
      emptyHref: 'Product Hub/Product Hub.html'
    });
  }

  // 2. Pedidos del test
  if (product?.series?.length) {
    const pedidos = product.series.map(d => d.pedidos || 0);
    stats.push({
      label: 'Pedidos del test',
      value: pedidos.reduce((a, b) => a + b, 0),
      change: pctChange(pedidos),
      trend: pedidos.length >= 2 ? pedidos : null,
      icon: ICONS.package,
      iconClass: 'is-violet'
    });
  } else {
    stats.push({
      label: 'Pedidos del test',
      value: 0,
      icon: ICONS.package, iconClass: 'is-violet',
      empty: '—'
    });
  }

  // 3. Vistas acumuladas del producto
  stats.push({
    label: 'Vistas acumuladas',
    value: view?.vistas || 0,
    compact: true,
    icon: ICONS.eye,
    iconClass: 'is-rose',
    empty: !view || !view.vistas ? '—' : null
  });

  // 4. Racha del Diario electrónico
  const streak = getTopDiaryStreak();
  if (streak) {
    const labelName = streak.name || 'tu racha';
    stats.push({
      label: `Racha ${labelName}`,
      value: streak.days,
      suffix: streak.days === 1 ? ' día' : ' días',
      icon: ICONS.flame,
      iconClass: 'is-amber',
      flame: streak.activeToday,
      flameLabel: streak.activeToday ? 'Activa hoy' : 'Sin marcar hoy',
      href: 'diario electronico/Diario-completo.html'
    });
  } else {
    stats.push({
      label: 'Rachas',
      value: 0,
      icon: ICONS.flame, iconClass: 'is-amber',
      empty: 'Crea una en el Diario',
      emptyHref: 'diario electronico/Diario-completo.html'
    });
  }

  return stats;
}

/* ----- Nombre del usuario logueado -----
   Fuentes (en orden):
   1. El nombre ya pintado en #profileMenuName (auth.js lo rellena con
      currentProfile.name || user.displayName || email.split('@')[0])
   2. window.__zongaAuth.user.displayName / email
   3. Fallback genérico
*/
function getUserFirstName() {
  // 1. DOM ya renderizado por auth.js
  const menuName = document.getElementById('profileMenuName')?.textContent?.trim();
  if (menuName && menuName !== 'Usuario' && menuName !== '—') {
    return firstNameOf(menuName);
  }
  // 2. usuario de Firebase si ya está disponible
  const user = window.__zongaAuth?.user;
  if (user) {
    if (user.displayName) return firstNameOf(user.displayName);
    if (user.email)       return firstNameOf(user.email.split('@')[0]);
  }
  // 3. fallback
  return null;
}
function firstNameOf(str) {
  if (!str) return '';
  // primer "trozo" antes de espacio o punto, capitalizado
  const piece = str.split(/[\s.]+/)[0] || str;
  return piece.charAt(0).toUpperCase() + piece.slice(1);
}

/* ----- Saludo dinámico + fecha + contexto ----- */
function renderWelcome() {
  const greetEl   = document.getElementById('ckGreet');
  const iconEl    = document.getElementById('ckTimeIcon');
  const dateEl    = document.getElementById('ckDate');
  const contextEl = document.getElementById('ckContext');
  if (!greetEl) return;

  const now = new Date();
  const h = now.getHours();
  let greet, isNight = false;
  if (h >= 6 && h < 13)       greet = 'Buenos días';
  else if (h >= 13 && h < 21) greet = 'Buenas tardes';
  else                        { greet = 'Buenas noches'; isNight = true; }

  const name = getUserFirstName();
  greetEl.textContent = name ? `${greet}, ${name}` : greet;

  iconEl.classList.add(isNight ? 'is-night' : 'is-day');
  iconEl.innerHTML = isNight
    ? `<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`
    : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4.5" fill="currentColor" stroke="none"/><line x1="12" y1="2" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.05" y2="7.05"/><line x1="16.95" y1="16.95" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.05" y2="16.95"/><line x1="16.95" y1="7.05" x2="19.07" y2="4.93"/></svg>`;

  try {
    const dateStr = new Intl.DateTimeFormat('es-ES', {
      weekday: 'long', day: 'numeric', month: 'long'
    }).format(now);
    dateEl.textContent = dateStr;
  } catch {
    dateEl.textContent = now.toDateString();
  }

  const p = cockpitData.productoActivo;
  contextEl.textContent = `Día ${p.diaActual} de ${p.diasTotal} del test de ${p.nombre}`;
}

/* ----- Sparkline SVG (curvas suaves, stroke no escalable, crisp) ----- */
function smoothPath(points, tension = 0.5) {
  if (points.length < 2) return '';
  const n = points.length;
  let d = `M${points[0][0].toFixed(2)},${points[0][1].toFixed(2)}`;
  for (let i = 0; i < n - 1; i++) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;
    const cp1x = p1[0] + ((p2[0] - p0[0]) * tension) / 3;
    const cp1y = p1[1] + ((p2[1] - p0[1]) * tension) / 3;
    const cp2x = p2[0] - ((p3[0] - p1[0]) * tension) / 3;
    const cp2y = p2[1] - ((p3[1] - p1[1]) * tension) / 3;
    d += ` C${cp1x.toFixed(2)},${cp1y.toFixed(2)} ${cp2x.toFixed(2)},${cp2y.toFixed(2)} ${p2[0].toFixed(2)},${p2[1].toFixed(2)}`;
  }
  return d;
}

function buildSparkline(values) {
  if (!values || values.length < 2) return '';

  // Resolución alta del viewBox para no perder precisión
  const W = 300, H = 80;
  const padX = 4;            // margen para que el punto final no salga
  const padTop = 8;
  const padBottom = 6;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const usableW = W - padX * 2;
  const usableH = H - padTop - padBottom;
  const stepX = usableW / (values.length - 1);

  const pts = values.map((v, i) => [
    padX + i * stepX,
    padTop + (1 - (v - min) / range) * usableH
  ]);

  const linePath = smoothPath(pts, 0.5);
  const fillPath = `${linePath} L${(W - padX).toFixed(2)},${H} L${padX.toFixed(2)},${H} Z`;
  const last = pts[pts.length - 1];

  return `
    <svg class="ck-spark" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none"
         shape-rendering="geometricPrecision" aria-hidden="true">
      <path class="fill" d="${fillPath}"/>
      <path class="line" d="${linePath}" pathLength="1"
            vector-effect="non-scaling-stroke"/>
      <circle class="ck-spark-dot-pulse" cx="${last[0].toFixed(2)}" cy="${last[1].toFixed(2)}" r="5"
              vector-effect="non-scaling-stroke"/>
      <circle class="ck-spark-dot-halo" cx="${last[0].toFixed(2)}" cy="${last[1].toFixed(2)}" r="4.5"
              vector-effect="non-scaling-stroke"/>
      <circle class="ck-spark-dot" cx="${last[0].toFixed(2)}" cy="${last[1].toFixed(2)}" r="2.6"
              vector-effect="non-scaling-stroke"/>
    </svg>
  `;
}

/* ----- Format helpers ----- */
function formatNumber(n, decimals = 0) {
  return new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(n);
}
function formatCompact(n) {
  if (n >= 1000000) return formatNumber(n / 1000000, 1) + 'M';
  if (n >= 1000)    return formatNumber(n / 1000, 1) + 'k';
  return formatNumber(n, 0);
}

/* ----- Count-up con easing easeOutExpo ----- */
function countUp(el, target, { duration = 1400, decimals = 0, compact = false } = {}) {
  const startTime = performance.now();
  const valueEl = el.querySelector('.ck-stat-num');
  if (!valueEl) return;
  const fmt = (v) => compact ? formatCompact(v) : formatNumber(v, decimals);
  // cancelar animación previa si la había
  if (valueEl._raf) cancelAnimationFrame(valueEl._raf);
  function tick(now) {
    const t = Math.min(1, (now - startTime) / duration);
    const eased = 1 - Math.pow(2, -10 * t);
    const current = target * eased;
    valueEl.textContent = fmt(current);
    if (t < 1) valueEl._raf = requestAnimationFrame(tick);
    else valueEl.textContent = fmt(target);
  }
  valueEl._raf = requestAnimationFrame(tick);
}

/* Escapa texto antes de inyectarlo como HTML (los nombres de rachas y
   metas vienen del usuario) */
function escapeHTML(str) {
  return String(str ?? '').replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
}

/* ----- Render de las 4 stats ----- */
function renderStats(statsArr, { animate = true } = {}) {
  const wrap = document.getElementById('ckStats');
  if (!wrap) return;
  const stats = statsArr || [];

  wrap.innerHTML = stats.map((s, idx) => {
    const isEmpty = s.empty != null;
    const isDown  = !isEmpty && typeof s.change === 'number' && s.change < 0;
    const showChange = !isEmpty && typeof s.change === 'number' && s.change !== 0;
    const changeHTML = showChange ? `
      <span class="ck-stat-change ${isDown ? 'down' : 'up'}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          ${isDown ? '<polyline points="6 9 12 15 18 9"/>' : '<polyline points="6 15 12 9 18 15"/>'}
        </svg>
        ${Math.abs(s.change)}%
      </span>
    ` : '';

    const valueRow = isEmpty ? `
      <div class="ck-stat-value is-empty">
        <span class="ck-stat-num">—</span>
        ${s.flame ? `<span class="ck-stat-flame">🔥</span>` : ''}
      </div>
    ` : `
      <div class="ck-stat-value" data-target="${s.value}" data-compact="${s.compact ? '1' : '0'}">
        ${s.prefix ? `<span class="ck-stat-prefix">${s.prefix}</span>` : ''}
        <span class="ck-stat-num">0</span>
        ${s.suffix ? `<span class="ck-stat-suffix">${escapeHTML(s.suffix)}</span>` : ''}
        ${s.flame ? `<span class="ck-stat-flame" title="${escapeHTML(s.flameLabel || '')}">🔥</span>` : ''}
      </div>
    `;

    const emptyLink = isEmpty && s.emptyHref ? `
      <a class="ck-stat-empty-link" href="${s.emptyHref}">${escapeHTML(s.empty)} <span aria-hidden="true">→</span></a>
    ` : (isEmpty ? `<span class="ck-stat-empty-text">${escapeHTML(s.empty)}</span>` : '');

    const labelHTML = s.href
      ? `<a class="ck-stat-label-link" href="${s.href}">${escapeHTML(s.label)}</a>`
      : `<span class="ck-stat-label">${escapeHTML(s.label)}</span>`;

    const enterCls = animate ? 'cockpit-enter' : '';
    const sparkHTML = !isEmpty && s.trend && s.trend.length > 1 ? buildSparkline(s.trend) : '';

    return `
      <div class="ck-stat ${enterCls} ${isDown ? 'is-down' : ''} ${isEmpty ? 'is-empty-state' : ''}" style="--delay:${100 + idx * 100}ms; --spark-delay:${500 + idx * 100}ms">
        <div class="ck-stat-head">
          <span class="ck-stat-icon ${s.iconClass || ''}" aria-hidden="true">${s.icon}</span>
          ${labelHTML}
        </div>
        <div class="ck-stat-value-row">
          ${valueRow}
          ${changeHTML}
        </div>
        ${sparkHTML || emptyLink}
      </div>
    `;
  }).join('');

  // Count-up por stat
  stats.forEach((s, idx) => {
    if (s.empty != null) return;
    const card = wrap.children[idx];
    if (!card) return;
    setTimeout(() => {
      countUp(card, s.value, { duration: 1300, decimals: 0, compact: !!s.compact });
    }, animate ? (400 + idx * 100) : 0);
  });
}

/* ----- Mapeo de un producto de Product Hub al formato del cockpit ----- */
function productToCockpitView(p) {
  if (!p) return null;

  const revenue = (p.series || []).reduce((a, d) => a + (d.ingresos || 0), 0);
  const totalDias = 14;
  const diaActual = Math.max(1, Math.min(totalDias, p.day || 1));

  // cuentas activas
  const cuentas = Array.isArray(p.accounts) ? p.accounts.length : 0;

  // Vistas acumuladas:
  // En Product Hub real, cada cuenta tiene videos: [{ views, ... }] y NO
  // hay un campo "views" en la cuenta. En los datos seed/demo sí existe
  // un campo agregado account.views. Soportamos ambos casos.
  let vistas = 0;
  if (Array.isArray(p.accounts)) {
    for (const a of p.accounts) {
      if (Array.isArray(a.videos)) {
        for (const v of a.videos) {
          if (typeof v.views === 'number') vistas += v.views;
        }
      } else if (typeof a.views === 'number') {
        vistas += a.views;
      }
    }
  }

  return {
    nombre: p.name || 'Sin nombre',
    emoji: p.emoji || '📦',
    diaActual,
    diasTotal: totalDias,
    cuentas,
    vistas,
    breakEven: p.breakEven || 0,
    revenue
  };
}

/* ----- Producto activo + barra 14 días ----- */
function renderProducto(view) {
  const p = view || cockpitData.productoActivo;
  const setText = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  setText('ckProductName', p.nombre);
  setText('ckProductEmoji', p.emoji);
  setText('ckProductSub', `Test de ${p.diasTotal} días en curso`);
  setText('ckPDaysLeft', Math.max(0, p.diasTotal - p.diaActual));
  setText('ckPCuentas', p.cuentas);
  setText('ckPViews', formatCompact(p.vistas));

  const daysEl = document.getElementById('ckDays');
  if (!daysEl) return;
  let html = '';
  for (let i = 1; i <= p.diasTotal; i++) {
    let cls = '';
    if (i < p.diaActual)      cls = 'is-past';
    else if (i === p.diaActual) cls = 'is-now';
    const delay = 600 + (i - 1) * 60;
    html += `<span class="ck-day ${cls}" style="--day-delay:${delay}ms" aria-label="Día ${i}"></span>`;
  }
  daysEl.innerHTML = html;
}

/* ----- Anillo de objetivo: conectado a Finanzas (fz:goals) ----- */
function renderObjetivo() {
  const titleEl = document.getElementById('ckGoalTitle');
  const subEl   = document.getElementById('ckGoalSub');
  const pctEl   = document.getElementById('ckGoalPct');
  const fillEl  = document.getElementById('ckGoalFill');
  const goalCard = document.querySelector('.ck-goal');
  const eyebrowEl = goalCard?.querySelector('.ck-eyebrow');

  const goal = getTopFinanceGoal();

  let label, sub, pct, eyebrowText = 'Próximo objetivo';

  if (goal) {
    const target = Number(goal.target) || 0;
    const current = Math.max(0, Number(goal.current) || 0);
    pct = target > 0 ? Math.max(0, Math.min(1, current / target)) : 0;
    label = goal.name || 'Mi objetivo';
    const restante = Math.max(0, target - current);
    if (pct >= 1) {
      sub = `🎉 ¡Meta conseguida! ${formatNumber(current)} € de ${formatNumber(target)} €.`;
    } else {
      sub = `Faltan ${formatNumber(restante)} € de ${formatNumber(target)} € en total.`;
    }
  } else {
    // Sin metas en Finanzas → empty state
    pct = 0;
    label = 'Sin metas activas';
    sub = 'Crea tu primera meta desde el Gestor de ingresos y gastos.';
  }

  if (eyebrowEl) eyebrowEl.textContent = eyebrowText;
  if (titleEl)   titleEl.textContent = label;
  if (subEl)     subEl.textContent = sub;

  const pctStr = Math.round(pct * 100) + '%';
  if (pctEl) {
    if (pctEl._raf) cancelAnimationFrame(pctEl._raf);
    const start = performance.now();
    const dur = 1100;
    function tick(now) {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(2, -10 * t);
      pctEl.textContent = Math.round(pct * 100 * eased) + '%';
      if (t < 1) pctEl._raf = requestAnimationFrame(tick);
      else pctEl.textContent = pctStr;
    }
    pctEl._raf = requestAnimationFrame(tick);
  }

  if (fillEl) {
    const circumference = 2 * Math.PI * 52;
    const offset = circumference * (1 - pct);
    fillEl.style.transition = 'none';
    fillEl.getBoundingClientRect();
    fillEl.style.transition = '';
    fillEl.style.strokeDashoffset = offset;
  }

  if (goalCard) {
    goalCard.classList.remove('is-near', 'is-mid', 'is-far', 'is-empty');
    if (!goal)            goalCard.classList.add('is-empty');
    else if (pct >= 0.75) goalCard.classList.add('is-near');
    else if (pct >= 0.4)  goalCard.classList.add('is-mid');
    else                  goalCard.classList.add('is-far');
  }

  // Si no hay meta, el link "abrir Product Hub" no aplica para el objetivo;
  // pero podemos transformar la sub en clickable. Lo dejamos como texto.
}

/* ============================================
   Switcher de productos activos
   ============================================ */
const cockpitState = {
  activeProducts: [],
  activeIdx: 0
};

function loadActiveIdx() {
  try {
    const raw = localStorage.getItem(COCKPIT_ACTIVE_KEY);
    return raw ? parseInt(raw, 10) || 0 : 0;
  } catch { return 0; }
}
function saveActiveIdx(idx) {
  try { localStorage.setItem(COCKPIT_ACTIVE_KEY, String(idx)); } catch {}
}

function renderActiveProduct(animate = true) {
  const products = cockpitState.activeProducts;
  const switcher = document.getElementById('ckSwitcher');
  const idxLabel = document.getElementById('ckProductIdx');
  const prevBtn  = document.getElementById('ckProductPrev');
  const nextBtn  = document.getElementById('ckProductNext');
  const productLink = document.querySelector('.ck-product-link');

  let view = null;
  let product = null;

  if (!products.length) {
    if (switcher) switcher.hidden = true;
    view = cockpitData.productoActivo;
  } else {
    if (cockpitState.activeIdx < 0) cockpitState.activeIdx = products.length - 1;
    if (cockpitState.activeIdx >= products.length) cockpitState.activeIdx = 0;
    product = products[cockpitState.activeIdx];
    view = productToCockpitView(product);

    if (switcher) switcher.hidden = products.length < 2;
    if (idxLabel) idxLabel.textContent = `${cockpitState.activeIdx + 1} / ${products.length}`;
    if (prevBtn) prevBtn.disabled = products.length < 2;
    if (nextBtn) nextBtn.disabled = products.length < 2;
    if (productLink && product.id) {
      productLink.href = `Product Hub/Product Hub.html#product-${encodeURIComponent(product.id)}`;
    }
  }

  // Animación al cambiar de producto
  const card = document.getElementById('ckProductCard');
  if (animate && card) {
    card.classList.remove('is-swap'); void card.offsetWidth;
    card.classList.add('is-swap');
  }

  renderProducto(view);
  // Las 3 primeras stats se recalculan con cada producto; la 4ª (racha) es global
  renderStats(buildStatsForProduct(view, product), { animate });
  // El objetivo viene de Finanzas — no depende del producto, pero lo refrescamos
  renderObjetivo();

  if (products.length) saveActiveIdx(cockpitState.activeIdx);
}

function initProductSwitcher() {
  cockpitState.activeProducts = getActiveProducts();
  cockpitState.activeIdx = loadActiveIdx();

  const prevBtn = document.getElementById('ckProductPrev');
  const nextBtn = document.getElementById('ckProductNext');
  prevBtn?.addEventListener('click', () => {
    cockpitState.activeIdx--;
    renderActiveProduct(true);
  });
  nextBtn?.addEventListener('click', () => {
    cockpitState.activeIdx++;
    renderActiveProduct(true);
  });

  // Atajos de teclado ← / → cuando el foco está fuera de inputs
  document.addEventListener('keydown', (e) => {
    const tag = document.activeElement?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement?.isContentEditable) return;
    if (!cockpitState.activeProducts.length || cockpitState.activeProducts.length < 2) return;
    if (e.key === 'ArrowLeft')  { cockpitState.activeIdx--; renderActiveProduct(true); }
    if (e.key === 'ArrowRight') { cockpitState.activeIdx++; renderActiveProduct(true); }
  });

  // Si cualquiera de las fuentes (Product Hub, Diario, Finanzas) cambia en
  // otra pestaña, refrescamos el cockpit.
  window.addEventListener('storage', (e) => {
    if (e.key === PH_STORAGE_KEY) {
      cockpitState.activeProducts = getActiveProducts();
      renderActiveProduct(false);
    } else if (e.key === DIARIO_ENTRIES_KEY || e.key === DIARIO_STREAKS_KEY ||
               e.key === FZ_GOALS_KEY) {
      renderActiveProduct(false);
    }
  });

  renderActiveProduct(false);
}

/* ----- Mantener el saludo sincronizado con el nombre del usuario -----
   auth.js actualiza #profileMenuName cuando llega el usuario y cuando
   edita su nombre. Observamos ese elemento y re-aplicamos el saludo. */
function watchUserName() {
  const target = document.getElementById('profileMenuName');
  const greetEl = document.getElementById('ckGreet');
  if (!target || !greetEl) return;

  const apply = () => {
    const now = new Date();
    const h = now.getHours();
    let greet;
    if (h >= 6 && h < 13)       greet = 'Buenos días';
    else if (h >= 13 && h < 21) greet = 'Buenas tardes';
    else                        greet = 'Buenas noches';
    const name = getUserFirstName();
    greetEl.textContent = name ? `${greet}, ${name}` : greet;
  };

  const observer = new MutationObserver(apply);
  observer.observe(target, { childList: true, characterData: true, subtree: true });

  // Si el usuario llega después (Firebase tarda en restaurar), también
  // reaplicar al detectar la clase auth-ok en <html>.
  const htmlObserver = new MutationObserver(apply);
  htmlObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
}

function renderCockpit() {
  renderWelcome();
  initProductSwitcher();
  watchUserName();
}

/* ----- Contador de herramientas activas (compat con cualquier otro contador) ----- */
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

/* ----- Tabs Orgánico / Ads (navbar) ----- */
function initTabs() {
  const tabs = Array.from(document.querySelectorAll('.nav-tab'));
  if (!tabs.length) return;

  const panels = {
    organico: document.getElementById('organico'),
    ads: document.getElementById('ads'),
  };
  const heroSubs = {
    organico: document.getElementById('heroSubOrganico'),
    ads: document.getElementById('heroSubAds'),
  };

  function activate(name) {
    if (!panels[name]) name = 'organico';
    tabs.forEach(t => {
      const on = t.dataset.tab === name;
      t.classList.toggle('is-active', on);
      if (on) t.setAttribute('aria-current', 'page');
      else t.removeAttribute('aria-current');
    });
    Object.entries(panels).forEach(([key, el]) => {
      if (el) el.hidden = key !== name;
    });
    // Descripción del hero según la sección
    Object.entries(heroSubs).forEach(([key, el]) => {
      if (el) el.hidden = key !== name;
    });
    // Paleta roja en Ads
    document.body.classList.toggle('theme-ads', name === 'ads');
    // El panel recién mostrado puede tener elementos .reveal sin observar
    observeReveals();
  }

  tabs.forEach(t => {
    t.addEventListener('click', (e) => {
      e.preventDefault();
      const name = t.dataset.tab;
      activate(name);
      history.replaceState(null, '', '#' + name);
    });
  });

  const initial = (location.hash || '').replace('#', '');
  activate(panels[initial] ? initial : 'organico');
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
  initTabs();
  setYear();
});
