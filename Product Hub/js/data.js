/* ============================================================
   PRODUCT HUB — Data layer & methodology logic
   Plain script (global scope). Exposes: DB, PHASES, PILLARS,
   getPhase(), fmtMoney(), fmtNum()
   ============================================================ */

/* ---------- Formatters ---------- */
const fmtMoney = (n, dec = 0) =>
  new Intl.NumberFormat("es-ES", { minimumFractionDigits: dec, maximumFractionDigits: dec, useGrouping: true }).format(n) + " €";
const fmtNum = (n) => new Intl.NumberFormat("es-ES", { useGrouping: true }).format(Math.round(n));
const fmtViews = (n) => {
  if (n >= 1000000) return (n / 1000000).toFixed(n % 1000000 === 0 ? 0 : 1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(n % 1000 === 0 ? 0 : 1).replace(".0", "") + "K";
  return String(n);
};
const fmtDate = (iso) => {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("es-ES", { day: "2-digit", month: "short" });
};

/* ============================================================
   FASES — vídeos con ≤ 5.000 visitas
   (textos según spec + PDF "Fases y Pilares")
   ============================================================ */
const PHASES = [
  {
    id: 1, min: 0, max: 80, color: "var(--phase-1)", colorHex: "#EF4444",
    emoji: "🔴", icon: "video-off", tag: "Cuenta o contenido",
    range: "0 – 80 visitas",
    text: "Mejora la iluminación y cuida lo que enseñas en el vídeo (pantallas, fuego, contenido sexual…). Evita los vídeos reciclados.",
    points: [
      "Mejorar iluminación",
      "Cuidado con pantallas, fuego o contenido sensible",
      "Nada de vídeos reciclados",
    ],
  },
  {
    id: 2, min: 80, max: 250, color: "var(--phase-2)", colorHex: "#F97316",
    emoji: "🟠", icon: "key-round", tag: "Palabras clave",
    range: "80 – 250 visitas",
    text: "Sigue mejorando la iluminación y añade palabras clave del nicho. Sácalas de los vídeos virales de tu nicho en TikTok.",
    points: [
      "Mejorar iluminación",
      "Añadir keywords del nicho",
      "Inspírate en vídeos virales del nicho",
    ],
  },
  {
    id: 3, min: 250, max: 1500, color: "var(--phase-3)", colorHex: "#EAB308",
    emoji: "🟡", icon: "rotate-ccw", tag: "Inicio entero",
    range: "250 – 1.500 visitas",
    text: "Cambia completamente el inicio del vídeo: el texto, el visual y la canción. Todo nuevo.",
    points: ["Texto nuevo", "Visual nuevo", "Canción nueva"],
  },
  {
    id: 4, min: 1500, max: 2000, color: "var(--phase-4)", colorHex: "#22C55E",
    emoji: "🟢", icon: "search-check", tag: "Análisis fino",
    range: "1.500 – 2.000 visitas",
    text: "Analiza el vídeo y saca 3 errores concretos. Aplícalos. Si aun así no sube de 2.000, cambia el inicio entero como en la fase anterior.",
    points: ["Saca 3 errores", "Aplícalos", "¿No sube de 2.000? → cambia el inicio entero"],
  },
  {
    id: 5, min: 2000, max: 5000, color: "var(--phase-5)", colorHex: "#3B82F6",
    emoji: "🔵", icon: "timer", tag: "Falla en el segundo X",
    range: "2.000 – 5.000 visitas",
    text: "El fallo está en un segundo concreto del inicio, según tus visitas. Prueba a rehacer ese segundo. Si no funciona, prueba el siguiente.",
    points: [
      "2.000 visitas → falla en el segundo 2",
      "3.000 visitas → falla en el segundo 3",
      "4.000 visitas → falla en el segundo 4",
      "5.000 visitas → falla en el segundo 5",
    ],
    example: "Ej.: 2.700 visitas → prueba el segundo 2; si no es eso, prueba el segundo 3.",
  },
];

/* Devuelve el segundo a probar para la fase 5 (2000-5000) */
function segundoParaProbar(visitas) {
  return Math.max(2, Math.floor(visitas / 1000));
}

/* Resuelve la fase activa según visitas (≤5000). >5000 => pilares */
function getPhase(visitas) {
  if (visitas > 5000) return { pilares: true };
  for (const p of PHASES) {
    if (visitas >= p.min && visitas < p.max) return p;
  }
  // exactamente 5000
  return PHASES[PHASES.length - 1];
}

/* Texto regla de las 3 correcciones */
const RULE3 = {
  title: "Regla de las 3 correcciones",
  sub: "Si tras 3 correcciones el vídeo no mejora, no insistas.",
  done: "Descarta el vídeo y empieza uno totalmente nuevo.",
};

/* ============================================================
   PILARES — vídeos con +5.000 visitas
   Se rueda el mismo vídeo 5 veces, cambiando 1 pilar cada vez.
   ============================================================ */
const PILLARS = [
  { id: "visual",  name: "Visual",       icon: "eye",    desc: "Otro plano, otra grabación, otro encuadre." },
  { id: "texto",   name: "Texto",        icon: "type",   desc: "Otro texto en pantalla / otro hook escrito." },
  { id: "musica",  name: "Música",       icon: "music",  desc: "Otra canción o audio de fondo." },
  { id: "info",    name: "Información",  icon: "layers", desc: "Cambia el orden / la estructura de la info." },
  { id: "emocion", name: "Emoción",      icon: "heart",  desc: "Otros movimientos, otra energía / emoción." },
];

const PILLARS_INTRO =
  "Al pasar de 5.000 visitas dejas las fases y entras en los pilares. Rueda el mismo vídeo 5 veces cambiando un único pilar en cada versión. La versión con más visitas señala el pilar que funciona (mantenlo); la que menos pille es un pilar irrelevante (deja de testearlo).";

/* posiciones del pentágono (en % del contenedor) para la constelación */
const PENTAGON = [
  { x: 50, y: 12 },   // arriba
  { x: 88, y: 42 },   // derecha-arriba
  { x: 73, y: 88 },   // derecha-abajo
  { x: 27, y: 88 },   // izquierda-abajo
  { x: 12, y: 42 },   // izquierda-arriba
];

/* ============================================================
   DEMO DATA — 6 productos realistas
   ============================================================ */

/* genera una serie diaria plausible que suma ~revenue y ~orders */
function buildSeries(startISO, days, totalRev, totalOrders, shape) {
  // shape: array de pesos relativos por día (length = days)
  const sum = shape.reduce((a, b) => a + b, 0);
  const series = [];
  let accR = 0, accO = 0;
  const start = new Date(startISO + "T00:00:00");
  for (let i = 0; i < days; i++) {
    const w = shape[i] / sum;
    let rev = Math.round(totalRev * w);
    let ord = Math.round(totalOrders * w);
    if (i === days - 1) { rev = totalRev - accR; ord = totalOrders - accO; }
    accR += rev; accO += ord;
    const d = new Date(start); d.setDate(start.getDate() + i);
    series.push({ date: d.toISOString().slice(0, 10), pedidos: Math.max(0, ord), ingresos: Math.max(0, rev) });
  }
  return series;
}

const DB = {
  products: [
    {
      id: "luna",
      name: "Lámpara de Luna 3D",
      emoji: "🌙",
      status: "escalando",
      startDate: "2026-05-15",
      day: 11,
      breakEven: 1800,
      accent: "#2563EB",
      series: buildSeries("2026-05-15", 11, 4820, 214, [12,18,26,30,42,55,70,88,110,130,149]),
      accounts: [
        { id: "a1", platform: "tiktok", handle: "@lunalamp.es", since: "2026-05-10", videos: 38, views: 412000, best: 96000, pillarTested: true },
        { id: "a2", platform: "ig", handle: "@luna.lamp", since: "2026-05-12", videos: 21, views: 88000, best: 14200, pillarTested: false },
      ],
    },
    {
      id: "galaxy",
      name: "Mini Proyector Galaxy",
      emoji: "🌌",
      status: "escalando",
      startDate: "2026-05-17",
      day: 9,
      breakEven: 1500,
      accent: "#7C3AED",
      series: buildSeries("2026-05-17", 9, 3560, 142, [20,28,34,45,60,78,95,120,140]),
      accounts: [
        { id: "b1", platform: "tiktok", handle: "@galaxy.proyector", since: "2026-05-14", videos: 31, views: 305000, best: 71000, pillarTested: true },
        { id: "b2", platform: "yt", handle: "@GalaxyHome", since: "2026-05-16", videos: 9, views: 22000, best: 8800, pillarTested: false },
      ],
    },
    {
      id: "cervical",
      name: "Masajeador Cervical",
      emoji: "💆",
      status: "testeando",
      startDate: "2026-05-22",
      day: 5,
      breakEven: 1200,
      accent: "#0EA5E9",
      series: buildSeries("2026-05-22", 5, 1240, 58, [30,42,55,70,90]),
      accounts: [
        { id: "c1", platform: "tiktok", handle: "@cuellosano", since: "2026-05-20", videos: 14, views: 47000, best: 9200, pillarTested: false },
      ],
    },
    {
      id: "alisador",
      name: "Cepillo Alisador",
      emoji: "💇",
      status: "pausado",
      startDate: "2026-05-05",
      day: 14,
      breakEven: 1100,
      accent: "#F59E0B",
      series: buildSeries("2026-05-05", 14, 890, 41, [40,48,55,60,58,52,48,40,36,30,28,25,22,20]),
      accounts: [
        { id: "d1", platform: "ig", handle: "@alisa.pro", since: "2026-05-02", videos: 26, views: 64000, best: 5400, pillarTested: false },
        { id: "d2", platform: "fb", handle: "Alisa Pro Oficial", since: "2026-05-03", videos: 12, views: 18000, best: 3100, pillarTested: false },
      ],
    },
    {
      id: "botella",
      name: "Botella Inteligente",
      emoji: "💧",
      status: "testeando",
      startDate: "2026-05-25",
      day: 3,
      breakEven: 900,
      accent: "#06B6D4",
      series: buildSeries("2026-05-25", 3, 410, 19, [55,70,90]),
      accounts: [
        { id: "e1", platform: "tiktok", handle: "@smartbottle.es", since: "2026-05-23", videos: 7, views: 12400, best: 4100, pillarTested: false },
      ],
    },
    {
      id: "anillo",
      name: "Anillo Antironquidos",
      emoji: "😴",
      status: "descartado",
      startDate: "2026-05-01",
      day: 14,
      breakEven: 800,
      accent: "#EF4444",
      series: buildSeries("2026-05-01", 14, 120, 6, [30,25,20,15,12,10,8,6,5,4,3,3,2,2]),
      accounts: [
        { id: "f1", platform: "tiktok", handle: "@stopronquidos", since: "2026-04-28", videos: 19, views: 21000, best: 2600, pillarTested: false },
      ],
    },
  ],
};

const STATUS_META = {
  testeando: { label: "Testeando", emoji: "🟢" },
  escalando: { label: "Escalando", emoji: "🔵" },
  pausado:   { label: "Pausado",   emoji: "🟡" },
  descartado:{ label: "Descartado",emoji: "🔴" },
};
const STATUS_ORDER = ["testeando", "escalando", "pausado", "descartado"];

/* ---------- Derived helpers ---------- */
function productTotals(p) {
  const revenue = p.series.reduce((a, d) => a + d.ingresos, 0);
  const orders = p.series.reduce((a, d) => a + d.pedidos, 0);
  const ticket = orders ? revenue / orders : 0;
  return { revenue, orders, ticket };
}
function getProduct(id) { return DB.products.find((p) => p.id === id); }

/* ---------- Cuentas: modelo de vídeos ---------- */
function acctVideoCount(a) { return a.videos.length; }
function acctViews(a) { return a.videos.reduce((s, v) => s + (v.views || 0), 0); }
function acctBest(a) { return a.videos.reduce((m, v) => Math.max(m, v.views || 0), 0); }

let _vidSeq = 0;
function newVideoId() { return "v" + Date.now().toString(36) + (_vidSeq++).toString(36) + Math.random().toString(36).slice(2, 5); }

/* genera una lista de vídeos plausible que suma ~total con un máximo = best */
function buildVideos(count, total, best, sinceISO) {
  count = Math.max(0, count | 0);
  const vids = [];
  if (count === 0) return vids;
  const start = new Date((sinceISO || "2026-05-01") + "T00:00:00");
  const others = count - 1;
  const remaining = Math.max(0, total - best);
  const vals = new Array(count);
  vals[0] = best;
  let acc = 0;
  const weights = [];
  for (let i = 0; i < others; i++) weights.push(others - i + 1);
  const wsum = weights.reduce((a, b) => a + b, 0) || 1;
  for (let i = 1; i < count; i++) {
    vals[i] = Math.min(best, Math.round(remaining * weights[i - 1] / wsum));
    acc += vals[i];
  }
  if (others > 0) vals[count - 1] = Math.max(0, vals[count - 1] + (remaining - acc));
  for (let i = 0; i < count; i++) {
    const d = new Date(start); d.setDate(start.getDate() + i);
    vids.push({ id: newVideoId(), label: "Vídeo " + (i + 1), views: vals[i], date: d.toISOString().slice(0, 10) });
  }
  return vids;
}

/* normaliza productos demo con campos nuevos */
DB.products.forEach((p) => {
  if (p.target == null) p.target = 14;
  if (p.extended == null) p.extended = false;
  p.accounts.forEach((a) => {
    if (typeof a.videos === "number") {
      a.videos = buildVideos(a.videos, a.views, a.best, a.since);
      delete a.views; delete a.best; delete a.pillarTested;
    }
  });
});

/* opciones de emoji para el formulario de nuevo producto */
const EMOJI_OPTIONS = ["🌙","🌌","💧","💆","💇","😴","🔥","⭐","🎧","👟","🧴","🕶️","🪞","🐾","🍳","💡","🧸","⌚","🧦","🪥","🎒","🧢","🔌","🪴"];

/* color de acento según estado */
const STATUS_ACCENT = { testeando: "#16A34A", escalando: "#2563EB", pausado: "#F59E0B", descartado: "#EF4444" };

/* plataformas de redes */
const PLATFORMS = [
  { id: "tiktok", name: "TikTok", icon: "music" },
  { id: "ig", name: "Instagram", icon: "instagram" },
  { id: "fb", name: "Facebook", icon: "facebook" },
  { id: "yt", name: "YouTube", icon: "youtube" },
];
function platformIcon(id) { return (PLATFORMS.find((p) => p.id === id) || {}).icon || "at-sign"; }
