// ─── Fianzas: datos semilla ────────────────────────────────────────────────
// 6+ meses de transacciones realistas en EUR. Tasa EUR↔RON.

const EUR_TO_RON = 4.97;

const CATEGORIES = {
  // Gastos
  food:       { key: 'food',       label: 'Comida',        color: '#f97316', icon: 'utensils'  },
  transport:  { key: 'transport',  label: 'Transporte',    color: '#3b82f6', icon: 'car'       },
  home:       { key: 'home',       label: 'Hogar',         color: '#8b5cf6', icon: 'home'      },
  leisure:    { key: 'leisure',    label: 'Ocio',          color: '#ec4899', icon: 'sparkles'  },
  health:     { key: 'health',     label: 'Salud',         color: '#14b8a6', icon: 'heart'     },
  shopping:   { key: 'shopping',   label: 'Compras',       color: '#eab308', icon: 'bag'       },
  subs:       { key: 'subs',       label: 'Suscripciones', color: '#6366f1', icon: 'repeat'    },
  other:      { key: 'other',      label: 'Otros',         color: '#78716c', icon: 'more'      },
  // Ingresos
  salary:     { key: 'salary',     label: 'Sueldo',        color: '#10b981', icon: 'briefcase' },
  freelance:  { key: 'freelance',  label: 'Freelance',     color: '#059669', icon: 'laptop'    },
  gift:       { key: 'gift',       label: 'Regalo',        color: '#22c55e', icon: 'gift'      },
};

// genera una fecha ISO yyyy-mm-dd
function d(year, month, day) {
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

// Período: 2025-10 hasta 2026-04 (ancla "hoy" = 15 abril 2026)
const TODAY = { y: 2026, m: 4, d: 15 };

const SEED_TX = [
  // ── Octubre 2025 ─────────────────────────────────────────────────────────
  { date: d(2025,10,1),  type:'income',  category:'salary',    concept:'Sueldo octubre',             amount:2450 },
  { date: d(2025,10,3),  type:'expense', category:'home',      concept:'Alquiler piso',              amount:780  },
  { date: d(2025,10,4),  type:'expense', category:'food',      concept:'Mercadona compra semanal',   amount:74.30 },
  { date: d(2025,10,6),  type:'expense', category:'subs',      concept:'Spotify Familiar',           amount:17.99 },
  { date: d(2025,10,8),  type:'expense', category:'transport', concept:'Bono metro mensual',         amount:43.40 },
  { date: d(2025,10,11), type:'expense', category:'leisure',   concept:'Cine Kinepolis',             amount:19.50 },
  { date: d(2025,10,12), type:'expense', category:'food',      concept:'Mercadona',                  amount:62.80 },
  { date: d(2025,10,15), type:'income',  category:'freelance', concept:'Diseño web cliente Cluj',    amount:520  },
  { date: d(2025,10,18), type:'expense', category:'shopping',  concept:'Zapatillas Decathlon',       amount:59.99 },
  { date: d(2025,10,20), type:'expense', category:'food',      concept:'Lidl',                       amount:58.10 },
  { date: d(2025,10,22), type:'expense', category:'health',    concept:'Farmacia',                   amount:23.40 },
  { date: d(2025,10,26), type:'expense', category:'leisure',   concept:'Cena con amigos',            amount:42.00 },
  { date: d(2025,10,28), type:'expense', category:'subs',      concept:'Netflix',                    amount:13.99 },
  { date: d(2025,10,29), type:'expense', category:'transport', concept:'Gasolina',                   amount:55.00 },

  // ── Noviembre 2025 ───────────────────────────────────────────────────────
  { date: d(2025,11,1),  type:'income',  category:'salary',    concept:'Sueldo noviembre',           amount:2450 },
  { date: d(2025,11,3),  type:'expense', category:'home',      concept:'Alquiler piso',              amount:780  },
  { date: d(2025,11,5),  type:'expense', category:'food',      concept:'Mercadona',                  amount:81.20 },
  { date: d(2025,11,6),  type:'expense', category:'subs',      concept:'Spotify Familiar',           amount:17.99 },
  { date: d(2025,11,9),  type:'expense', category:'shopping',  concept:'Producto AliExpress',        amount:38.45 },
  { date: d(2025,11,10), type:'expense', category:'home',      concept:'Factura luz',                amount:68.30 },
  { date: d(2025,11,11), type:'expense', category:'leisure',   concept:'Concierto La Riviera',       amount:45.00 },
  { date: d(2025,11,14), type:'expense', category:'food',      concept:'Cena sushi',                 amount:38.90 },
  { date: d(2025,11,15), type:'income',  category:'freelance', concept:'Logo restaurante',           amount:350  },
  { date: d(2025,11,17), type:'expense', category:'transport', concept:'Bono metro',                 amount:43.40 },
  { date: d(2025,11,19), type:'expense', category:'food',      concept:'Mercadona',                  amount:69.40 },
  { date: d(2025,11,22), type:'expense', category:'shopping',  concept:'Black Friday — auriculares', amount:129.00 },
  { date: d(2025,11,25), type:'expense', category:'health',    concept:'Dentista revisión',          amount:60.00 },
  { date: d(2025,11,27), type:'expense', category:'subs',      concept:'Netflix',                    amount:13.99 },
  { date: d(2025,11,28), type:'expense', category:'leisure',   concept:'Escape room',                amount:24.00 },
  { date: d(2025,11,29), type:'expense', category:'food',      concept:'Lidl',                       amount:51.30 },

  // ── Diciembre 2025 ───────────────────────────────────────────────────────
  { date: d(2025,12,1),  type:'income',  category:'salary',    concept:'Sueldo diciembre',           amount:2450 },
  { date: d(2025,12,1),  type:'income',  category:'salary',    concept:'Paga extra Navidad',         amount:1800 },
  { date: d(2025,12,3),  type:'expense', category:'home',      concept:'Alquiler piso',              amount:780  },
  { date: d(2025,12,5),  type:'expense', category:'shopping',  concept:'Regalos familia',            amount:240.00 },
  { date: d(2025,12,6),  type:'expense', category:'subs',      concept:'Spotify Familiar',           amount:17.99 },
  { date: d(2025,12,8),  type:'expense', category:'food',      concept:'Mercadona',                  amount:88.70 },
  { date: d(2025,12,11), type:'expense', category:'leisure',   concept:'Cena de empresa',            amount:55.00 },
  { date: d(2025,12,12), type:'expense', category:'transport', concept:'Vuelo Bucarest',             amount:189.00 },
  { date: d(2025,12,15), type:'income',  category:'freelance', concept:'Consultoría Acme',           amount:680  },
  { date: d(2025,12,18), type:'expense', category:'shopping',  concept:'Amazon — libro, funda',      amount:47.80 },
  { date: d(2025,12,20), type:'expense', category:'food',      concept:'Compra navideña',            amount:124.50 },
  { date: d(2025,12,23), type:'income',  category:'gift',      concept:'Aguinaldo abuelos',          amount:200  },
  { date: d(2025,12,24), type:'expense', category:'leisure',   concept:'Cena Nochebuena',            amount:78.00 },
  { date: d(2025,12,27), type:'expense', category:'subs',      concept:'Netflix',                    amount:13.99 },
  { date: d(2025,12,29), type:'expense', category:'home',      concept:'Factura gas',                amount:72.10 },
  { date: d(2025,12,31), type:'expense', category:'leisure',   concept:'Fiesta Nochevieja',          amount:62.00 },

  // ── Enero 2026 ───────────────────────────────────────────────────────────
  { date: d(2026,1,2),   type:'income',  category:'salary',    concept:'Sueldo enero',               amount:2510 },
  { date: d(2026,1,3),   type:'expense', category:'home',      concept:'Alquiler piso',              amount:780  },
  { date: d(2026,1,5),   type:'expense', category:'food',      concept:'Mercadona',                  amount:76.40 },
  { date: d(2026,1,6),   type:'expense', category:'subs',      concept:'Spotify Familiar',           amount:17.99 },
  { date: d(2026,1,7),   type:'expense', category:'shopping',  concept:'Rebajas — abrigo',           amount:89.00 },
  { date: d(2026,1,9),   type:'expense', category:'health',    concept:'Gimnasio mensual',           amount:39.90 },
  { date: d(2026,1,11),  type:'expense', category:'leisure',   concept:'Teatro',                     amount:32.00 },
  { date: d(2026,1,13),  type:'expense', category:'food',      concept:'Lidl',                       amount:54.80 },
  { date: d(2026,1,15),  type:'income',  category:'freelance', concept:'Diseño landing page',        amount:450  },
  { date: d(2026,1,16),  type:'expense', category:'transport', concept:'Bono metro',                 amount:43.40 },
  { date: d(2026,1,18),  type:'expense', category:'food',      concept:'Mercadona',                  amount:66.20 },
  { date: d(2026,1,21),  type:'expense', category:'home',      concept:'Factura luz',               amount:74.60 },
  { date: d(2026,1,23),  type:'expense', category:'shopping',  concept:'Producto AliExpress',        amount:22.90 },
  { date: d(2026,1,25),  type:'expense', category:'leisure',   concept:'Brunch',                     amount:28.50 },
  { date: d(2026,1,27),  type:'expense', category:'subs',      concept:'Netflix',                    amount:13.99 },
  { date: d(2026,1,29),  type:'expense', category:'food',      concept:'Mercadona',                  amount:62.10 },

  // ── Febrero 2026 ─────────────────────────────────────────────────────────
  { date: d(2026,2,2),   type:'income',  category:'salary',    concept:'Sueldo febrero',             amount:2510 },
  { date: d(2026,2,3),   type:'expense', category:'home',      concept:'Alquiler piso',              amount:780  },
  { date: d(2026,2,5),   type:'expense', category:'food',      concept:'Mercadona',                  amount:82.30 },
  { date: d(2026,2,6),   type:'expense', category:'subs',      concept:'Spotify Familiar',           amount:17.99 },
  { date: d(2026,2,9),   type:'expense', category:'health',    concept:'Gimnasio mensual',           amount:39.90 },
  { date: d(2026,2,10),  type:'expense', category:'home',      concept:'Factura gas',                amount:65.40 },
  { date: d(2026,2,12),  type:'expense', category:'leisure',   concept:'San Valentín cena',          amount:68.00 },
  { date: d(2026,2,14),  type:'expense', category:'shopping',  concept:'Regalo pareja',              amount:55.00 },
  { date: d(2026,2,15),  type:'income',  category:'freelance', concept:'Web corporativa',            amount:780  },
  { date: d(2026,2,16),  type:'expense', category:'transport', concept:'Bono metro',                 amount:43.40 },
  { date: d(2026,2,17),  type:'expense', category:'food',      concept:'Lidl',                       amount:48.60 },
  { date: d(2026,2,20),  type:'expense', category:'leisure',   concept:'Escapada rural fin de semana', amount:140.00 },
  { date: d(2026,2,22),  type:'expense', category:'food',      concept:'Mercadona',                  amount:71.10 },
  { date: d(2026,2,24),  type:'expense', category:'shopping',  concept:'Libros Casa del Libro',      amount:34.80 },
  { date: d(2026,2,26),  type:'expense', category:'subs',      concept:'Netflix',                    amount:13.99 },
  { date: d(2026,2,27),  type:'expense', category:'transport', concept:'Gasolina',                   amount:58.00 },

  // ── Marzo 2026 ───────────────────────────────────────────────────────────
  { date: d(2026,3,2),   type:'income',  category:'salary',    concept:'Sueldo marzo',               amount:2510 },
  { date: d(2026,3,3),   type:'expense', category:'home',      concept:'Alquiler piso',              amount:780  },
  { date: d(2026,3,4),   type:'expense', category:'food',      concept:'Mercadona',                  amount:78.90 },
  { date: d(2026,3,6),   type:'expense', category:'subs',      concept:'Spotify Familiar',           amount:17.99 },
  { date: d(2026,3,8),   type:'expense', category:'leisure',   concept:'Concierto indie',            amount:38.00 },
  { date: d(2026,3,9),   type:'expense', category:'health',    concept:'Gimnasio mensual',           amount:39.90 },
  { date: d(2026,3,11),  type:'expense', category:'transport', concept:'Uber varios',                amount:41.50 },
  { date: d(2026,3,13),  type:'expense', category:'food',      concept:'Mercadona',                  amount:69.00 },
  { date: d(2026,3,15),  type:'income',  category:'freelance', concept:'Diseño app móvil',           amount:950  },
  { date: d(2026,3,16),  type:'expense', category:'shopping',  concept:'Zara — camisas',             amount:79.80 },
  { date: d(2026,3,18),  type:'expense', category:'home',      concept:'Factura luz',               amount:71.20 },
  { date: d(2026,3,20),  type:'expense', category:'food',      concept:'Lidl',                       amount:53.40 },
  { date: d(2026,3,22),  type:'expense', category:'leisure',   concept:'Cena amigos',                amount:42.50 },
  { date: d(2026,3,25),  type:'expense', category:'health',    concept:'Farmacia',                   amount:18.90 },
  { date: d(2026,3,27),  type:'expense', category:'subs',      concept:'Netflix',                    amount:13.99 },
  { date: d(2026,3,28),  type:'expense', category:'transport', concept:'Bono metro',                 amount:43.40 },
  { date: d(2026,3,30),  type:'expense', category:'food',      concept:'Mercadona',                  amount:64.20 },

  // ── Abril 2026 (parcial, hasta el 15) ────────────────────────────────────
  { date: d(2026,4,2),   type:'income',  category:'salary',    concept:'Sueldo abril',               amount:2510 },
  { date: d(2026,4,3),   type:'expense', category:'home',      concept:'Alquiler piso',              amount:780  },
  { date: d(2026,4,4),   type:'expense', category:'food',      concept:'Mercadona',                  amount:77.60 },
  { date: d(2026,4,5),   type:'expense', category:'subs',      concept:'Spotify Familiar',           amount:17.99 },
  { date: d(2026,4,7),   type:'expense', category:'shopping',  concept:'Producto AliExpress',        amount:29.40 },
  { date: d(2026,4,8),   type:'expense', category:'leisure',   concept:'Cine + palomitas',           amount:22.50 },
  { date: d(2026,4,9),   type:'expense', category:'health',    concept:'Gimnasio mensual',           amount:39.90 },
  { date: d(2026,4,10),  type:'expense', category:'food',      concept:'Lidl',                       amount:46.80 },
  { date: d(2026,4,11),  type:'expense', category:'transport', concept:'Gasolina',                   amount:54.00 },
  { date: d(2026,4,13),  type:'expense', category:'food',      concept:'Mercadona',                  amount:68.30 },
  { date: d(2026,4,14),  type:'expense', category:'leisure',   concept:'Bar con compañeros',         amount:31.00 },
];

// dar id a cada tx
const TX_WITH_IDS = SEED_TX.map((t, i) => ({ id: 'seed-' + i, ...t }));

const GOALS_SEED = [
  { id:'g1', name:'Viaje a Japón',         target: 3500, current: 1420, accent: '#ef4444', emojiPlaceholder: 'JP' },
  { id:'g2', name:'Fondo emergencia',      target: 6000, current: 4150, accent: '#10b981', emojiPlaceholder: 'EM' },
  { id:'g3', name:'MacBook nuevo',         target: 2200, current:  680, accent: '#3b82f6', emojiPlaceholder: 'MB' },
];

const BUDGETS_SEED = {
  food:      400,
  transport: 120,
  home:      900,
  leisure:   200,
  shopping:  180,
  subs:       60,
  health:     80,
  other:     100,
};

window.FIANZAS_DATA = {
  EUR_TO_RON,
  CATEGORIES,
  TODAY,
  SEED_TX: TX_WITH_IDS,
  GOALS_SEED,
  BUDGETS_SEED,
};
