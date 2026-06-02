/* app.jsx — raíz: navegación entre biblioteca y lector + modal */

/* Genera una portada de ejemplo (placeholder) como dataURL */
function makeSeedCover(title, author, bg1, bg2, ink) {
  const c = document.createElement("canvas");
  c.width = 400; c.height = 600;
  const ctx = c.getContext("2d");
  const g = ctx.createLinearGradient(0, 0, 400, 600);
  g.addColorStop(0, bg1); g.addColorStop(1, bg2);
  ctx.fillStyle = g; ctx.fillRect(0, 0, 400, 600);
  // marco interno tenue
  ctx.strokeStyle = ink + "44"; ctx.lineWidth = 2;
  ctx.strokeRect(26, 26, 348, 548);
  // título
  ctx.fillStyle = ink;
  ctx.textAlign = "center";
  ctx.font = "600 40px Spectral, Georgia, serif";
  const words = title.split(" ");
  const lines = []; let line = "";
  words.forEach(w => {
    if ((line + w).length > 12) { lines.push(line.trim()); line = w + " "; }
    else line += w + " ";
  });
  if (line.trim()) lines.push(line.trim());
  const startY = 300 - (lines.length - 1) * 26;
  lines.forEach((l, i) => ctx.fillText(l, 200, startY + i * 52));
  // autor
  ctx.font = "500 19px 'Hanken Grotesk', sans-serif";
  ctx.fillStyle = ink + "cc";
  ctx.fillText(author.toUpperCase(), 200, 510);
  // línea
  ctx.strokeStyle = ink + "88"; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(150, 470); ctx.lineTo(250, 470); ctx.stroke();
  return c.toDataURL("image/jpeg", 0.85);
}

function seedBooks() {
  return [
    {
      id: "seed1", title: "El nombre del viento", author: "P. Rothfuss",
      cover: makeSeedCover("El nombre del viento", "P. Rothfuss", "#3a4a52", "#1e2a30", "#e8ddc8"),
      totalPages: 662, currentPage: 248, status: "leyendo", rating: 5,
      notes: "Kvothe narra su historia en la Posada Roca de Guía.\n\nEl sistema de magia (la Simpatía) se basa en vínculos y transferencia de energía — muy lógico, casi científico.\n\nCita favorita (pág. 142): la música como lenguaje universal del dolor y la alegría.\n\nPendiente: entender mejor los Chandrian y su relación con el fuego azul.",
      createdAt: Date.now() - 800000,
    },
    {
      id: "seed2", title: "Sapiens", author: "Y. N. Harari",
      cover: makeSeedCover("Sapiens", "Y. N. Harari", "#c2632e", "#8c3d18", "#fdf2e2"),
      totalPages: 496, currentPage: 496, status: "leido", rating: 4,
      notes: "La revolución cognitiva (~70.000 años) es lo que nos permitió crear ficciones compartidas: dinero, naciones, religiones.\n\nIdea clave: el trigo nos domesticó a nosotros, no al revés.\n\nMe quedo con la pregunta final: ¿más poder nos ha hecho más felices?",
      createdAt: Date.now() - 5000000,
    },
    {
      id: "seed3", title: "La sombra del viento", author: "C. Ruiz Zafón",
      cover: makeSeedCover("La sombra del viento", "C. Ruiz Zafón", "#2d2438", "#161019", "#d8c7e0"),
      totalPages: 576, currentPage: 0, status: "por-leer", rating: 0,
      notes: "",
      createdAt: Date.now() - 200000,
    },
  ];
}

function App() {
  const [books, setBooks] = useBooks();
  const [theme, setTheme] = useTheme();
  const [view, setView] = useState({ name: "library", id: null });
  const [showAdd, setShowAdd] = useState(false);
  const [seeded, setSeeded] = useState(false);

  // Sembrar ejemplos solo la primera vez (si nunca ha habido datos)
  useEffect(() => {
    if (!seeded && books.length === 0 && !localStorage.getItem("notas-libros:seeded")) {
      setBooks(seedBooks());
      localStorage.setItem("notas-libros:seeded", "1");
    }
    setSeeded(true);
  }, []);

  const openBook = (id) => setView({ name: "reader", id });
  const goLibrary = () => setView({ name: "library", id: null });

  const createBook = (book) => {
    setBooks(prev => [book, ...prev]);
    setShowAdd(false);
    setView({ name: "reader", id: book.id });
  };

  const updateBook = (id, patch) => {
    setBooks(prev => prev.map(b => b.id === id ? { ...b, ...patch } : b));
  };

  const deleteBook = (id) => {
    const b = books.find(x => x.id === id);
    if (b && b.coverPath) deleteCover(b.coverPath); // limpia la portada de Storage
    setBooks(prev => prev.filter(x => x.id !== id));
    setView({ name: "library", id: null });
  };

  // Migración: sube a Storage las portadas antiguas que aún viven como dataURL
  // en localStorage, dejándolas como URL + ruta. Se ejecuta una vez por sesión,
  // cuando hay datos. Las portadas de ejemplo (seed) se quedan como están.
  const migratedRef = useRef(false);
  useEffect(() => {
    if (migratedRef.current || !seeded) return;
    const pending = books.filter(b =>
      !b.coverPath &&
      typeof b.cover === "string" && b.cover.startsWith("data:") &&
      !String(b.id).startsWith("seed")
    );
    if (pending.length === 0) return;
    migratedRef.current = true;
    (async () => {
      for (const b of pending) {
        try {
          const up = await uploadCover(b.id, dataUrlToBlob(b.cover));
          if (up) updateBook(b.id, { cover: up.url, coverPath: up.path });
        } catch (e) { /* se reintenta en la próxima carga */ }
      }
    })();
  }, [books, seeded]);

  const current = books.find(b => b.id === view.id);

  return (
    <>
      {view.name === "reader" && current ? (
        <Reader book={current} onBack={goLibrary} onUpdate={updateBook} onDelete={deleteBook} />
      ) : (
        <Library
          books={books}
          onOpen={openBook}
          onAdd={() => setShowAdd(true)}
          theme={theme}
          onToggleTheme={() => setTheme(t => t === "dark" ? "light" : "dark")}
        />
      )}
      {showAdd && <AddBookModal onClose={() => setShowAdd(false)} onCreate={createBook} />}
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
