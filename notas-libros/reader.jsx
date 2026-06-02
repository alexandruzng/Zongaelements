/* reader.jsx — pantalla de notas: progreso, lateral con portada, guardar */

function Reader({ book, onBack, onUpdate }) {
  const [notes, setNotes] = useState(book.notes || "");
  const [page, setPage] = useState(book.currentPage || 0);
  const [rating, setRating] = useState(book.rating || 0);
  const [status, setStatus] = useState(book.status);
  const [savedFlash, setSavedFlash] = useState(false);
  const [dirty, setDirty] = useState(false);
  const flashTimer = useRef(null);

  const pct = book.totalPages > 0 ? Math.min(100, Math.round((page / book.totalPages) * 100)) : 0;

  // Detecta cambios sin guardar
  useEffect(() => {
    const changed = notes !== (book.notes || "") || page !== book.currentPage || rating !== book.rating || status !== book.status;
    setDirty(changed);
  }, [notes, page, rating, status]);

  const clampPage = (v) => Math.max(0, Math.min(book.totalPages, v));

  const adjustPage = (delta) => setPage(p => clampPage((parseInt(p, 10) || 0) + delta));

  const deriveStatus = (p) => {
    if (p <= 0) return "por-leer";
    if (book.totalPages > 0 && p >= book.totalPages) return "leido";
    return "leyendo";
  };

  const setPageSmart = (v) => {
    const np = clampPage(v);
    setPage(np);
    setStatus(deriveStatus(np));
  };

  const doSave = () => {
    onUpdate(book.id, { notes, currentPage: clampPage(parseInt(page, 10) || 0), rating, status });
    setDirty(false);
    setSavedFlash(true);
    clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setSavedFlash(false), 2200);
  };

  // Guardar con Cmd/Ctrl + S
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault(); doSave();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // Aviso al salir con cambios sin guardar
  const handleBack = () => {
    if (dirty && !window.confirm("Tienes cambios sin guardar. ¿Salir de todos modos?")) return;
    onBack();
  };

  const words = notes.trim() ? notes.trim().split(/\s+/).length : 0;

  return (
    <div className="reader">
      <div className="reader-top">
        <div className="reader-topbar">
          <button className="back-btn" onClick={handleBack}><Icon.back /> Estantería</button>
          <div className={"save-state" + (savedFlash ? " saved" : "")}>
            {savedFlash ? (<><Icon.check /> Guardado</>) : dirty ? "Cambios sin guardar" : "Todo guardado"}
          </div>
        </div>
        <div className="progress-bar" title={pct + "% leído"}>
          <div className="progress-fill" style={{ width: pct + "%" }}></div>
        </div>
      </div>

      <div className="reader-body">
        <aside className="side">
          <div className="side-cover"><img src={book.cover} alt={book.title} /></div>
          <div className="side-info">
            <h2>{book.title}</h2>
            <div className="side-status"><StatusBadge status={status} /></div>
          </div>

          <div className="page-card">
            <div className="pc-head">Progreso de lectura</div>
            <div className="page-now">
              <span className="big">{page}</span>
              <span className="of">de {book.totalPages} págs</span>
            </div>
            <div className="page-pct">{pct}% completado · faltan {Math.max(0, book.totalPages - page)} págs</div>
            <div className="stepper">
              <button type="button" onClick={() => { adjustPage(-1); setStatus(s => deriveStatus(clampPage((parseInt(page,10)||0) - 1))); }} aria-label="Una página menos">−</button>
              <input
                type="number" min="0" max={book.totalPages} value={page}
                onChange={e => setPageSmart(parseInt(e.target.value, 10) || 0)}
              />
              <button type="button" onClick={() => { adjustPage(1); setStatus(s => deriveStatus(clampPage((parseInt(page,10)||0) + 1))); }} aria-label="Una página más">+</button>
            </div>
          </div>

          <div className="page-card side-rate">
            <div className="pc-head">Tu calificación</div>
            <StarRating value={rating} onChange={setRating} />
          </div>
        </aside>

        <section className="notes-area">
          <div className="notes-paper">
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Escribe aquí tus notas, citas favoritas, ideas y reflexiones del libro…"
              spellCheck="true"
            />
          </div>
          <div className="notes-foot">
            <span className="words">{words} {words === 1 ? "palabra" : "palabras"}</span>
            {savedFlash ? (
              <span className="save-flash"><Icon.check /> Notas guardadas</span>
            ) : (
              <button className="btn" onClick={doSave} disabled={!dirty}>
                <Icon.save /> Guardar
              </button>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

Object.assign(window, { Reader });
