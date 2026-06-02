/* addbook.jsx — modal para agregar un libro nuevo */

function AddBookModal({ onClose, onCreate }) {
  const [cover, setCover] = useState(null);
  const [title, setTitle] = useState("");
  const [totalPages, setTotalPages] = useState("");
  const [currentPage, setCurrentPage] = useState("0");
  const [status, setStatus] = useState("leyendo");
  const [rating, setRating] = useState(0);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState({});
  const fileRef = useRef(null);

  const pickFile = async (file) => {
    if (!file) return;
    setBusy(true);
    try {
      const dataUrl = await fileToCover(file);
      setCover(dataUrl);
      setErrors(e => ({ ...e, cover: null }));
    } catch (e) { /* ignore */ }
    setBusy(false);
  };

  const onDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files && e.dataTransfer.files[0];
    if (f && f.type.startsWith("image/")) pickFile(f);
  };

  const validate = () => {
    const err = {};
    if (!cover) err.cover = "La portada es obligatoria.";
    if (!title.trim()) err.title = "Escribe el título del libro.";
    const tp = parseInt(totalPages, 10);
    if (!tp || tp <= 0) err.totalPages = "Indica el total de páginas.";
    const cp = parseInt(currentPage, 10) || 0;
    if (tp && cp > tp) err.currentPage = "No puede superar el total.";
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const submit = () => {
    if (!validate()) return;
    const tp = parseInt(totalPages, 10);
    const cp = Math.max(0, Math.min(parseInt(currentPage, 10) || 0, tp));
    onCreate({
      id: "b" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      cover, title: title.trim(),
      totalPages: tp, currentPage: cp,
      status, rating, notes: "",
      createdAt: Date.now(),
    });
  };

  // Sincroniza estado <-> páginas de forma intuitiva
  const handleStatus = (s) => {
    setStatus(s);
    const tp = parseInt(totalPages, 10);
    if (s === "por-leer") setCurrentPage("0");
    if (s === "leido" && tp) setCurrentPage(String(tp));
  };

  return (
    <div className="overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" role="dialog" aria-modal="true">
        <div className="modal-head">
          <h2>Agregar un libro</h2>
          <button className="x-btn" onClick={onClose} aria-label="Cerrar"><Icon.x /></button>
        </div>

        <div className="modal-body">
          <div className="dz-col">
            <div
              className={"dropzone" + (cover ? " has-img" : "") + (errors.cover ? " required-miss" : "")}
              onClick={() => fileRef.current && fileRef.current.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={onDrop}
            >
              {cover ? (
                <>
                  <img src={cover} alt="Portada" />
                  <span className="dz-replace">Cambiar portada</span>
                </>
              ) : (
                <div className="dz-inner">
                  <Icon.image />
                  <b>Sube la portada</b>
                  <span>Obligatoria · clic o arrastra</span>
                </div>
              )}
              <input
                ref={fileRef} type="file" accept="image/*" hidden
                onChange={(e) => pickFile(e.target.files && e.target.files[0])}
              />
            </div>
            {errors.cover && <div className="err" style={{ marginTop: 8, textAlign: "center", color: "var(--accent)", fontSize: 12, fontWeight: 600 }}>{errors.cover}</div>}
          </div>

          <div className="dz-fields">
            <div className="field">
              <label>Título del libro <span className="req-star">*</span></label>
              <input type="text" value={title} placeholder="Ej. Cien años de soledad" onChange={e => setTitle(e.target.value)} />
              {errors.title && <span className="err">{errors.title}</span>}
            </div>

            <div className="two-col">
              <div className="field">
                <label>Total de páginas <span className="req-star">*</span></label>
                <input type="number" min="1" value={totalPages} placeholder="320" onChange={e => setTotalPages(e.target.value)} />
                {errors.totalPages && <span className="err">{errors.totalPages}</span>}
              </div>
              <div className="field">
                <label>Voy por la página</label>
                <input type="number" min="0" value={currentPage} placeholder="0" onChange={e => setCurrentPage(e.target.value)} />
                {errors.currentPage && <span className="err">{errors.currentPage}</span>}
              </div>
            </div>

            <div className="field">
              <label>Estado del libro</label>
              <div className="status-pick">
                {STATUS_ORDER.map(key => (
                  <button
                    key={key}
                    type="button"
                    className={"status-opt " + STATUS[key].cls + (status === key ? " sel" : "")}
                    onClick={() => handleStatus(key)}
                  >
                    <span className="dot" style={{ background: STATUS[key].color }}></span>
                    {STATUS[key].label}
                  </button>
                ))}
              </div>
            </div>

            <div className="field" style={{ marginBottom: 0 }}>
              <label>Calificación <span style={{ color: "var(--ink-faint)", fontWeight: 500 }}>(opcional)</span></label>
              <StarRating value={rating} onChange={setRating} />
            </div>
          </div>
        </div>

        <div className="modal-foot">
          <span className="hint">Los campos con <span className="req-star">*</span> son obligatorios.</span>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn ghost" onClick={onClose}>Cancelar</button>
            <button className="btn" onClick={submit} disabled={busy}>
              <Icon.plus /> {busy ? "Procesando…" : "Agregar libro"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { AddBookModal });
