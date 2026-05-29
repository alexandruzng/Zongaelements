/* ============================================================
   PRODUCT HUB — Modales de gestión
   Nuevo producto · Confirmar borrado · Resumen del test
   (usa closeModal/escClose de diagnostico.js)
   ============================================================ */

/* scaffold común de modal */
function mountModal(innerHTML, sizeClass = "modal-sm") {
  const root = document.getElementById("modal-root");
  root.innerHTML = `
    <div class="modal-overlay" data-close-overlay>
      <div class="modal ${sizeClass}" role="dialog" aria-modal="true">${innerHTML}</div>
    </div>`;
  const overlay = root.querySelector(".modal-overlay");
  overlay.addEventListener("click", (e) => { if (e.target.matches("[data-close-overlay]")) closeModal(); });
  root.querySelectorAll("[data-close]").forEach((b) => b.addEventListener("click", closeModal));
  document.addEventListener("keydown", escClose);
  if (window.lucide) lucide.createIcons();
  return root;
}

/* ============================================================
   NUEVO PRODUCTO
   ============================================================ */
const newProdState = { emoji: EMOJI_OPTIONS[0], status: "testeando" };

function openNewProduct() {
  newProdState.emoji = EMOJI_OPTIONS[0];
  newProdState.status = "testeando";
  const today = new Date().toISOString().slice(0, 10);

  const emojis = EMOJI_OPTIONS.map((e, i) =>
    `<button type="button" class="emoji-chip ${i === 0 ? "sel" : ""}" data-emoji="${e}">${e}</button>`
  ).join("");

  const statuses = STATUS_ORDER.map((s) =>
    `<button type="button" class="seg-control-btn ${s === "testeando" ? "sel" : ""}" data-status="${s}">
       <span class="dot" style="background:${STATUS_ACCENT[s]}"></span>${STATUS_META[s].label}</button>`
  ).join("");

  mountModal(`
    <div class="modal-head">
      <div>
        <h2>Nuevo producto</h2>
        <div class="sub">Empieza a testear un producto nuevo</div>
      </div>
      <button class="btn-icon" data-close aria-label="Cerrar"><i data-lucide="x"></i></button>
    </div>
    <div class="modal-body">
      <div class="field">
        <label>Nombre del producto</label>
        <input class="input" id="npName" placeholder="Ej. Lámpara de Luna 3D" autocomplete="off" />
      </div>
      <div class="field">
        <label>Emoji</label>
        <div class="emoji-grid" id="npEmoji">${emojis}</div>
      </div>
      <div class="field">
        <label>Estado inicial</label>
        <div class="seg-control" id="npStatus">${statuses}</div>
      </div>
      <div class="field field-2">
        <div><label>Fecha de inicio</label><input class="input" type="date" id="npDate" value="${today}" /></div>
        <div><label>Break-even (€)</label><input class="input" type="number" min="0" id="npBe" placeholder="1000" /></div>
      </div>
      <div class="confirm-actions">
        <button class="btn btn-ghost" data-close>Cancelar</button>
        <button class="btn btn-primary" id="npCreate" style="flex:2"><i data-lucide="check"></i>Crear producto</button>
      </div>
    </div>`);

  const root = document.getElementById("modal-root");
  root.querySelector("#npEmoji").addEventListener("click", (e) => {
    const b = e.target.closest("[data-emoji]"); if (!b) return;
    newProdState.emoji = b.dataset.emoji;
    root.querySelectorAll(".emoji-chip").forEach((x) => x.classList.toggle("sel", x === b));
  });
  root.querySelector("#npStatus").addEventListener("click", (e) => {
    const b = e.target.closest("[data-status]"); if (!b) return;
    newProdState.status = b.dataset.status;
    root.querySelectorAll(".seg-control-btn").forEach((x) => x.classList.toggle("sel", x === b));
  });
  const nameInput = root.querySelector("#npName");
  nameInput.focus();
  root.querySelector("#npCreate").addEventListener("click", () => {
    const name = nameInput.value.trim();
    if (!name) { toast("Ponle un nombre al producto", "alert-triangle"); nameInput.focus(); return; }
    const be = Math.max(0, parseFloat(root.querySelector("#npBe").value || "0")) || 1000;
    const date = root.querySelector("#npDate").value || new Date().toISOString().slice(0, 10);
    createProduct({ name, emoji: newProdState.emoji, status: newProdState.status, startDate: date, breakEven: be });
  });
}

function createProduct({ name, emoji, status, startDate, breakEven }) {
  const slug = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 24) || "producto";
  const id = slug + "-" + Date.now().toString(36);
  const product = {
    id, name, emoji, status, startDate,
    day: 0, breakEven, accent: STATUS_ACCENT[status] || "#2563EB",
    series: [], accounts: [], target: 14, extended: false,
  };
  DB.products.unshift(product);
  closeModal();
  state.view = "list"; state.productId = null;
  render();
  toast("Producto creado · " + name, "plus");
}

/* ============================================================
   CONFIRMAR BORRADO
   ============================================================ */
function confirmDelete(productId) {
  const p = getProduct(productId);
  if (!p) return;
  mountModal(`
    <div class="confirm-body">
      <div class="confirm-ic"><i data-lucide="trash-2"></i></div>
      <h2>¿Eliminar “${p.name}”?</h2>
      <p>Se eliminará el producto con todos sus días registrados, cuentas y diagnósticos. Esta acción no se puede deshacer.</p>
      <div class="confirm-actions">
        <button class="btn btn-ghost" data-close>Cancelar</button>
        <button class="btn btn-danger-solid" id="confirmDelBtn"><i data-lucide="trash-2"></i>Eliminar producto</button>
      </div>
    </div>`);
  document.getElementById("confirmDelBtn").addEventListener("click", () => deleteProduct(productId));
}

function deleteProduct(id) {
  const name = (getProduct(id) || {}).name || "Producto";
  const wasViewing = state.productId === id;
  const idx = DB.products.findIndex((p) => p.id === id);
  if (idx >= 0) DB.products.splice(idx, 1);
  closeModal();
  state.view = "list"; state.productId = null;
  render();
  toast(name + " eliminado", "trash-2");
}

/* ============================================================
   RESUMEN DEL TEST (al cumplir los 14 días)
   ============================================================ */
function openResumen(productId) {
  const p = getProduct(productId);
  if (!p) return;
  const { revenue, orders, ticket } = productTotals(p);
  const daysLogged = p.series.length || 1;
  const avgDay = revenue / daysLogged;
  const bestDay = p.series.reduce((a, d) => (d.ingresos > (a ? a.ingresos : -1) ? d : a), null);
  const totalViews = p.accounts.reduce((a, ac) => a + acctViews(ac), 0);
  const totalVideos = p.accounts.reduce((a, ac) => a + acctVideoCount(ac), 0);
  const bestVideo = p.accounts.reduce((a, ac) => Math.max(a, acctBest(ac)), 0);
  const viewsPerVideo = totalVideos ? totalViews / totalVideos : 0;
  const rentable = revenue >= p.breakEven;

  mountModal(`
    <div class="modal-head">
      <div>
        <h2>📄 Resumen del test</h2>
        <div class="sub">${p.emoji} ${p.name} · ${p.day} días activos</div>
      </div>
      <button class="btn-icon" data-close aria-label="Cerrar"><i data-lucide="x"></i></button>
    </div>
    <div class="modal-body">
      <div class="resumen-verdict ${rentable ? "win" : "lose"}">
        <div class="ic"><i data-lucide="${rentable ? "trophy" : "trending-down"}"></i></div>
        <div>
          <div class="t">${rentable ? "Break-even superado" : "Por debajo del break-even"}</div>
          <div class="n">${rentable ? "Producto rentable — valóralo para escalar" : "Faltaron " + fmtMoney(p.breakEven - revenue) + " para cubrir gastos"}</div>
        </div>
      </div>

      <div class="resumen-section">🏪 Tienda</div>
      <div class="resumen-grid">
        <div class="resumen-stat"><div class="ic"><i data-lucide="euro"></i></div><div class="n">${fmtMoney(revenue)}</div><div class="l">Revenue total</div></div>
        <div class="resumen-stat"><div class="ic"><i data-lucide="shopping-bag"></i></div><div class="n">${fmtNum(orders)}</div><div class="l">Pedidos totales</div></div>
        <div class="resumen-stat"><div class="ic"><i data-lucide="receipt"></i></div><div class="n">${fmtMoney(ticket, 2)}</div><div class="l">Ticket medio</div></div>
        <div class="resumen-stat"><div class="ic"><i data-lucide="calendar-days"></i></div><div class="n">${fmtMoney(avgDay)}</div><div class="l">Media por día</div></div>
        <div class="resumen-stat"><div class="ic"><i data-lucide="flame"></i></div><div class="n">${bestDay ? fmtMoney(bestDay.ingresos) : "—"}</div><div class="l">Mejor día${bestDay ? " · " + fmtDate(bestDay.date) : ""}</div></div>
        <div class="resumen-stat"><div class="ic"><i data-lucide="target"></i></div><div class="n">${fmtMoney(p.breakEven)}</div><div class="l">Break-even objetivo</div></div>
      </div>

      <div class="resumen-section">📱 Redes</div>
      <div class="resumen-grid">
        <div class="resumen-stat"><div class="ic"><i data-lucide="eye"></i></div><div class="n">${fmtViews(totalViews)}</div><div class="l">Vistas totales</div></div>
        <div class="resumen-stat"><div class="ic"><i data-lucide="video"></i></div><div class="n">${fmtNum(totalVideos)}</div><div class="l">Vídeos publicados</div></div>
        <div class="resumen-stat"><div class="ic"><i data-lucide="trophy"></i></div><div class="n">${fmtViews(bestVideo)}</div><div class="l">Mejor vídeo</div></div>
        <div class="resumen-stat"><div class="ic"><i data-lucide="bar-chart-3"></i></div><div class="n">${fmtViews(viewsPerVideo)}</div><div class="l">Media por vídeo</div></div>
        <div class="resumen-stat"><div class="ic"><i data-lucide="at-sign"></i></div><div class="n">${p.accounts.length}</div><div class="l">Cuentas activas</div></div>
        <div class="resumen-stat"><div class="ic"><i data-lucide="calendar-check"></i></div><div class="n">${p.day}</div><div class="l">Días de test</div></div>
      </div>

      <div class="confirm-actions" style="margin-top:26px">
        <button class="btn btn-primary" data-close style="flex:1;justify-content:center"><i data-lucide="check"></i>Entendido</button>
      </div>
    </div>`, "modal");
}

/* ============================================================
   NUEVA CUENTA
   ============================================================ */
const newAcctState = { platform: "tiktok" };

function openNewAccount(productId) {
  newAcctState.platform = "tiktok";
  const today = new Date().toISOString().slice(0, 10);
  const opts = PLATFORMS.map((pl) =>
    `<button type="button" class="plat-opt ${pl.id === "tiktok" ? "sel" : ""}" data-plat="${pl.id}">
       <span class="plat ${pl.id}"><i data-lucide="${pl.icon}"></i></span>${pl.name}</button>`
  ).join("");

  mountModal(`
    <div class="modal-head">
      <div><h2>Nueva cuenta</h2><div class="sub">Conecta una cuenta de redes a este producto</div></div>
      <button class="btn-icon" data-close aria-label="Cerrar"><i data-lucide="x"></i></button>
    </div>
    <div class="modal-body">
      <div class="field">
        <label>Plataforma</label>
        <div class="plat-pick" id="naPlat">${opts}</div>
      </div>
      <div class="field">
        <label>Handle / nombre de la cuenta</label>
        <input class="input" id="naHandle" placeholder="@mi.cuenta" autocomplete="off" />
      </div>
      <div class="field">
        <label>Fecha de creación</label>
        <input class="input" type="date" id="naSince" value="${today}" />
      </div>
      <div class="confirm-actions">
        <button class="btn btn-ghost" data-close>Cancelar</button>
        <button class="btn btn-primary" id="naCreate" style="flex:2"><i data-lucide="check"></i>Añadir cuenta</button>
      </div>
    </div>`);

  const root = document.getElementById("modal-root");
  root.querySelector("#naPlat").addEventListener("click", (e) => {
    const b = e.target.closest("[data-plat]"); if (!b) return;
    newAcctState.platform = b.dataset.plat;
    root.querySelectorAll(".plat-opt").forEach((x) => x.classList.toggle("sel", x === b));
  });
  const handle = root.querySelector("#naHandle");
  handle.focus();
  root.querySelector("#naCreate").addEventListener("click", () => {
    let h = handle.value.trim();
    if (!h) { toast("Escribe el handle de la cuenta", "alert-triangle"); handle.focus(); return; }
    if (newAcctState.platform !== "fb" && !h.startsWith("@")) h = "@" + h;
    createAccount(productId, { platform: newAcctState.platform, handle: h, since: root.querySelector("#naSince").value || new Date().toISOString().slice(0, 10) });
  });
}

function createAccount(productId, { platform, handle, since }) {
  const p = getProduct(productId);
  const acct = { id: "acct-" + Date.now().toString(36), platform, handle, since, videos: [] };
  p.accounts.unshift(acct);
  closeModal();
  renderTab();
  toast("Cuenta añadida · " + platformName(platform), "plus");
}

/* ============================================================
   GESTIÓN DE VÍDEOS DE UNA CUENTA
   ============================================================ */
const acctCtx = { productId: null, accountId: null };

function getAcct() {
  const p = getProduct(acctCtx.productId);
  return p ? p.accounts.find((a) => a.id === acctCtx.accountId) : null;
}

function openAccount(productId, accountId) {
  acctCtx.productId = productId; acctCtx.accountId = accountId;
  const a = getAcct(); if (!a) return;
  mountModal(`
    <div class="modal-head">
      <div style="display:flex;align-items:center;gap:13px">
        <div class="plat ${a.platform}"><i data-lucide="${platformIcon(a.platform)}"></i></div>
        <div><h2>${a.handle}</h2><div class="sub">${platformName(a.platform)} · gestiona tus vídeos y visitas</div></div>
      </div>
      <button class="btn-icon" data-close aria-label="Cerrar"><i data-lucide="x"></i></button>
    </div>
    <div class="modal-body" id="acctBody"></div>`, "modal");
  refreshAccountBody();
}

function accountBodyHTML() {
  const a = getAcct();
  const today = new Date().toISOString().slice(0, 10);
  const rows = a.videos.length
    ? [...a.videos].reverse().map((v) => `
        <div class="vid-row" data-vid="${v.id}">
          <div class="vid-info"><div class="vid-label">${v.label}</div><div class="vid-date">${fmtDate(v.date)}</div></div>
          <div class="vid-views">
            <input class="vinput-edit" type="number" min="0" inputmode="numeric" value="${v.views}" data-vid-views="${v.id}" />
            <span class="vid-views-l">visitas</span>
          </div>
          <button class="vid-diag" data-vid-diag="${v.id}" title="Diagnosticar este vídeo"><i data-lucide="activity"></i></button>
          <button class="vid-del" data-vid-del="${v.id}" title="Eliminar vídeo"><i data-lucide="trash-2"></i></button>
        </div>`).join("")
    : `<div class="empty" style="padding:34px 20px"><h3 style="font-size:17px">Sin vídeos todavía</h3><p>Añade tu primer vídeo con sus visitas para empezar a seguir la cuenta.</p></div>`;

  return `
    <div class="acct-summary">
      <div class="s"><div class="n" id="sumVideos">${fmtNum(acctVideoCount(a))}</div><div class="l">Vídeos</div></div>
      <div class="s"><div class="n" id="sumViews">${fmtViews(acctViews(a))}</div><div class="l">Vistas totales</div></div>
      <div class="s"><div class="n" id="sumBest">${fmtViews(acctBest(a))}</div><div class="l">Mejor vídeo</div></div>
    </div>

    <div class="addvid">
      <div class="label" style="margin-bottom:12px">Añadir un vídeo</div>
      <div class="field-3">
        <input class="input" id="vidLabel" placeholder="Vídeo ${a.videos.length + 1}" autocomplete="off" />
        <input class="input" id="vidViews" type="number" min="0" placeholder="Visitas" />
        <input class="input" id="vidDate" type="date" value="${today}" />
      </div>
      <button class="btn btn-primary" id="addVidBtn"><i data-lucide="plus"></i>Añadir vídeo</button>
    </div>

    <div class="label" style="margin:22px 0 10px">Vídeos publicados (${a.videos.length})</div>
    <div class="vid-list">${rows}</div>`;
}

function refreshAccountBody() {
  const body = document.getElementById("acctBody");
  if (!body) return;
  body.innerHTML = accountBodyHTML();
  if (window.lucide) lucide.createIcons();
  bindAccountBody();
}

function updateAcctSummary() {
  const a = getAcct(); if (!a) return;
  const sv = document.getElementById("sumVideos"), svw = document.getElementById("sumViews"), sb = document.getElementById("sumBest");
  if (sv) sv.textContent = fmtNum(acctVideoCount(a));
  if (svw) svw.textContent = fmtViews(acctViews(a));
  if (sb) sb.textContent = fmtViews(acctBest(a));
  updateAcctCard(acctCtx.accountId);
}

function updateAcctCard(accountId) {
  const card = document.querySelector(`[data-acct-card="${accountId}"]`);
  if (!card) return;
  const a = getAcct();
  const set = (sel, val) => { const el = card.querySelector(sel); if (el) el.textContent = val; };
  set('[data-stat="videos"]', fmtNum(acctVideoCount(a)));
  set('[data-stat="views"]', fmtViews(acctViews(a)));
  set('[data-stat="best"]', fmtViews(acctBest(a)));
}

function bindAccountBody() {
  const a = getAcct(); if (!a) return;
  const root = document.getElementById("modal-root");

  const addBtn = root.querySelector("#addVidBtn");
  if (addBtn) addBtn.addEventListener("click", () => {
    const viewsRaw = root.querySelector("#vidViews").value;
    const views = Math.max(0, parseInt(viewsRaw || "0", 10));
    if (!viewsRaw) { toast("Pon las visitas del vídeo", "alert-triangle"); root.querySelector("#vidViews").focus(); return; }
    const label = root.querySelector("#vidLabel").value.trim() || ("Vídeo " + (a.videos.length + 1));
    const date = root.querySelector("#vidDate").value || new Date().toISOString().slice(0, 10);
    a.videos.push({ id: newVideoId(), label, views, date });
    a.videos.sort((x, y) => x.date.localeCompare(y.date));
    refreshAccountBody();
    updateAcctCard(acctCtx.accountId);
    toast("Vídeo añadido", "check");
  });

  // edición en vivo de las visitas (sin reconstruir la lista → no se pierde el foco)
  root.querySelectorAll("[data-vid-views]").forEach((inp) =>
    inp.addEventListener("input", () => {
      const v = a.videos.find((x) => x.id === inp.dataset.vidViews);
      if (v) { v.views = Math.max(0, parseInt(inp.value || "0", 10)); updateAcctSummary(); }
    })
  );

  root.querySelectorAll("[data-vid-del]").forEach((b) =>
    b.addEventListener("click", () => {
      const idx = a.videos.findIndex((x) => x.id === b.dataset.vidDel);
      if (idx >= 0) a.videos.splice(idx, 1);
      refreshAccountBody();
      updateAcctCard(acctCtx.accountId);
      toast("Vídeo eliminado", "trash-2");
    })
  );

  root.querySelectorAll("[data-vid-diag]").forEach((b) =>
    b.addEventListener("click", () => {
      const v = a.videos.find((x) => x.id === b.dataset.vidDiag);
      openDiagnostico(acctCtx.productId, acctCtx.accountId, v ? v.views : 0);
    })
  );
}