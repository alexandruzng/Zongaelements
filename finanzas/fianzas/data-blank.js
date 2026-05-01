// ─── Fianzas: datos vacíos (versión standalone limpia) ───────────────────
const EUR_TO_RON = 4.97;

const CATEGORIES = {
  food:       { key: 'food',       label: 'Comida',        color: '#f97316', icon: 'utensils'  },
  transport:  { key: 'transport',  label: 'Transporte',    color: '#3b82f6', icon: 'car'       },
  home:       { key: 'home',       label: 'Hogar',         color: '#8b5cf6', icon: 'home'      },
  leisure:    { key: 'leisure',    label: 'Ocio',          color: '#ec4899', icon: 'sparkles'  },
  health:     { key: 'health',     label: 'Salud',         color: '#14b8a6', icon: 'heart'     },
  shopping:   { key: 'shopping',   label: 'Compras',       color: '#eab308', icon: 'bag'       },
  subs:       { key: 'subs',       label: 'Suscripciones', color: '#6366f1', icon: 'repeat'    },
  other:      { key: 'other',      label: 'Otros',         color: '#78716c', icon: 'more'      },
  salary:     { key: 'salary',     label: 'Sueldo',        color: '#10b981', icon: 'briefcase' },
  freelance:  { key: 'freelance',  label: 'Freelance',     color: '#059669', icon: 'laptop'    },
  gift:       { key: 'gift',       label: 'Regalo',        color: '#22c55e', icon: 'gift'      },
};

// "Hoy" = fecha real del dispositivo al abrir
const _now = new Date();
const TODAY = { y: _now.getFullYear(), m: _now.getMonth() + 1, d: _now.getDate() };

window.FIANZAS_DATA = {
  EUR_TO_RON,
  CATEGORIES,
  TODAY,
  SEED_TX: [],        // sin transacciones
  GOALS_SEED: [],     // sin metas
  BUDGETS_SEED: {},   // sin presupuestos
};
