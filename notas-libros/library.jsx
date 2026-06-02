/* library.jsx — pantalla principal: rejilla de portadas, buscador, filtros */

function BookCard({ book, onOpen }) {
  const pct = book.totalPages > 0 ? Math.round((book.currentPage / book.totalPages) * 100) : 0;
  return (
    <button className="book" onClick={() => onOpen(book.id)}>
      <div className="cover-wrap">
        <img src={book.cover} alt={book.title} />
      </div>
      <div className="book-meta">
        <div className="book-title">{book.title}</div>
        <div className="book-row">
          <StatusBadge status={book.status} />
          {book.status === "leyendo" && book.totalPages > 0 && (
            <span className="mini-progress">{pct}%</span>
          )}
        </div>
        {book.rating > 0 && (
          <div className="cover-rating"><StarRating value={book.rating} size="sm" /></div>
        )}
      </div>
    </button>
  );
}

function EmptyState({ onAdd, filtered }) {
  if (filtered) {
    return (
      <div className="empty">
        <div className="empty-art"><Icon.search /></div>
        <h2>Sin resultados</h2>
        <p>No hay libros que coincidan con tu búsqueda o filtro. Prueba con otro término.</p>
      </div>
    );
  }
  return (
    <div className="empty">
      <div className="empty-art"><Icon.shelf /></div>
      <h2>Tu estantería está vacía</h2>
      <p>Agrega el primer libro que estés leyendo. Sube su portada, anota por qué página vas y empieza a guardar tus notas.</p>
      <button className="btn" onClick={onAdd}><Icon.plus /> Agregar libro</button>
    </div>
  );
}

function Library({ books, onOpen, onAdd, theme, onToggleTheme }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("todos");

  const counts = {
    todos: books.length,
    leyendo: books.filter(b => b.status === "leyendo").length,
    "por-leer": books.filter(b => b.status === "por-leer").length,
    leido: books.filter(b => b.status === "leido").length,
  };

  const visible = books.filter(b => {
    const matchQ = b.title.toLowerCase().includes(query.trim().toLowerCase());
    const matchF = filter === "todos" || b.status === filter;
    return matchQ && matchF;
  });

  const chips = [
    { key: "todos", label: "Todos", color: "var(--ink-faint)" },
    { key: "leyendo", label: "Leyendo", color: "var(--st-leyendo)" },
    { key: "por-leer", label: "Por leer", color: "var(--st-porleer)" },
    { key: "leido", label: "Leído", color: "var(--st-leido)" },
  ];

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark"><Icon.book /></div>
          <div>
            <h1>Notas de Libros</h1>
            <div className="sub">Tu estantería personal</div>
          </div>
        </div>
        <div className="search">
          <Icon.search />
          <input
            type="text"
            placeholder="Buscar por título…"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>
        <button className="icon-btn" onClick={onToggleTheme} aria-label="Cambiar tema" title={theme === "dark" ? "Modo día" : "Modo noche"}>
          {theme === "dark" ? <Icon.sun /> : <Icon.moon />}
        </button>
        <button className="btn" onClick={onAdd}><Icon.plus /> Agregar libro</button>
      </header>

      <main className="library">
        <div className="lib-head">
          <div>
            <h2 className="lib-title">Mi <em>biblioteca</em></h2>
            <div className="lib-count">{books.length} {books.length === 1 ? "libro" : "libros"} en tu estantería</div>
          </div>
        </div>

        {books.length > 0 && (
          <div className="filters">
            {chips.map(c => (
              <button
                key={c.key}
                className={"chip" + (filter === c.key ? " active" : "")}
                onClick={() => setFilter(c.key)}
              >
                <span className="dot" style={{ background: c.color }}></span>
                {c.label}
                <span className="num">{counts[c.key] ?? 0}</span>
              </button>
            ))}
          </div>
        )}

        {visible.length === 0 ? (
          <EmptyState onAdd={onAdd} filtered={books.length > 0} />
        ) : (
          <div className="grid">
            {visible.map(b => <BookCard key={b.id} book={b} onOpen={onOpen} />)}
          </div>
        )}
      </main>
    </div>
  );
}

Object.assign(window, { Library });
