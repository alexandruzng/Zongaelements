/* helpers.jsx — almacenamiento, utilidades de imagen, iconos, estrellas */
const { useState, useEffect, useRef, useCallback } = React;

/* ---------- Almacenamiento persistente ---------- */
const STORE_KEY = "notas-libros:v1";
const THEME_KEY = "notas-libros:theme";

function loadBooks() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* ignore */ }
  return null;
}
function saveBooks(books) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(books)); } catch (e) { /* quota */ }
}

/* Hook de libros con persistencia */
function useBooks() {
  const [books, setBooks] = useState(() => loadBooks() || []);
  useEffect(() => { saveBooks(books); }, [books]);
  return [books, setBooks];
}

/* ---------- Tema (modo noche) ---------- */
function useTheme() {
  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_KEY) || "light");
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);
  return [theme, setTheme];
}

/* ---------- Redimensionar imagen de portada a dataURL ligero ---------- */
function fileToCover(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const MAX_W = 560;
        const scale = Math.min(1, MAX_W / img.width);
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

/* ---------- Estado del libro ---------- */
const STATUS = {
  "por-leer": { label: "Por leer", cls: "porleer", color: "var(--st-porleer)" },
  "leyendo":  { label: "Leyendo",  cls: "leyendo",  color: "var(--st-leyendo)" },
  "leido":    { label: "Leído",    cls: "leido",    color: "var(--st-leido)" },
};
const STATUS_ORDER = ["leyendo", "por-leer", "leido"];

function StatusBadge({ status }) {
  const s = STATUS[status] || STATUS["por-leer"];
  return (
    <span className={"status " + s.cls}>
      <span className="dot" style={{ background: s.color }}></span>
      {s.label}
    </span>
  );
}

/* ---------- Estrellas ---------- */
function StarIcon({ filled }) {
  return (
    <svg viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.6">
      <path d="M12 2.5l2.9 5.9 6.5.95-4.7 4.58 1.1 6.47L12 17.4l-5.8 3.05 1.1-6.47-4.7-4.58 6.5-.95z" strokeLinejoin="round"/>
    </svg>
  );
}
function StarRating({ value, onChange, size }) {
  const [hover, setHover] = useState(0);
  const readonly = !onChange;
  if (readonly) {
    return (
      <div className={"stars" + (size === "sm" ? " sm" : "")}>
        {[1,2,3,4,5].map(n => (
          <span key={n} className={n <= value ? "on" : ""}>
            <StarIcon filled={n <= value} />
          </span>
        ))}
      </div>
    );
  }
  return (
    <div className={"stars" + (size === "sm" ? " sm" : "")} onMouseLeave={() => setHover(0)}>
      {[1,2,3,4,5].map(n => (
        <button
          key={n}
          type="button"
          className={(hover ? n <= hover : n <= value) ? "on" : ""}
          onMouseEnter={() => setHover(n)}
          onClick={() => onChange(n === value ? 0 : n)}
          aria-label={n + " estrellas"}
        >
          <StarIcon filled={hover ? n <= hover : n <= value} />
        </button>
      ))}
    </div>
  );
}

/* ---------- Iconos ---------- */
const Icon = {
  book: (p) => (<svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v15.5H5.5A1.5 1.5 0 0 0 4 21z"/><path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H13v15.5h5.5A1.5 1.5 0 0 1 20 21z"/></svg>),
  search: (p) => (<svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>),
  plus: (p) => (<svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>),
  moon: (p) => (<svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.8A8.5 8.5 0 1 1 11.2 3a6.6 6.6 0 0 0 9.8 9.8z"/></svg>),
  sun: (p) => (<svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="4.2"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M19.1 4.9l-1.8 1.8M6.7 17.3l-1.8 1.8"/></svg>),
  x: (p) => (<svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>),
  back: (p) => (<svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>),
  image: (p) => (<svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.6"/><path d="M21 16l-5-5L5 20"/></svg>),
  check: (p) => (<svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>),
  save: (p) => (<svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8M7 3v5h8"/></svg>),
  shelf: (p) => (<svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="3" width="4" height="14"/><rect x="9.5" y="6" width="4" height="11"/><path d="M16 17l1.6-11 3.8.6L19.5 17"/><path d="M3 17h18"/></svg>),
};

Object.assign(window, {
  useBooks, useTheme, fileToCover, STATUS, STATUS_ORDER,
  StatusBadge, StarRating, StarIcon, Icon,
});
