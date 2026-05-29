/* ============================================================
   PRODUCT HUB — App orchestrator
   State · router · vistas · animaciones · microinteracciones
   ============================================================ */

const state = {
  view: "list",        // "list" | "product"
  productId: null,
  tab: "tienda",       // "tienda" | "redes"
};

/* ---------- Theme ---------- */
function initTheme() {
  const saved = localStorage.getItem("ph-theme");
  if (saved) document.documentElement.setAttribute("data-theme", saved);
}
function toggleTheme() {
  const cur = document.documentElement.getAttribute("data-theme");
  const next = cur === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem("ph-theme", next);
  const tb = document.getElementById("themeBtn");
  if (tb) { tb.innerHTML = `<i data-lucide="${next === "dark" ? "sun" : "moon"}"></i>`; }
  refreshIcons();
  // re-render chart if visible (colores cambian)
  if (state.view === "product" && state.tab === "tienda") {
    const c = document.getElementById("revChart");
    if (c) renderRevenueChart(c, getProduct(state.productId));
  }
}

function refreshIcons() { if (window.lucide) lucide.createIcons(); }

/* ---------- Toast ---------- */
function toast(msg, icon = "check") {
  const root = document.getElementById("toast-root");
  const t = document.createElement("div");
  t.className = "toast";
  t.innerHTML = `<span class="check"><i data-lucide="${icon}"></i></span><span>${msg}</span>`;
  root.appendChild(t);
  refreshIcons();
  setTimeout(() => { t.classList.add("out"); setTimeout(() => t.remove(), 350); }, 2600);
}

/* ---------- Ripple (delegado) ---------- */
function attachRipple() {
  document.addEventListener("pointerdown", (e) => {
    const btn = e.target.closest(".btn, .btn-icon, .tab, .mode-tab");
    if (!btn) return;
    const r = btn.getBoundingClientRect();
    const size = Math.max(r.width, r.height);
    const ink = document.createElement("span");
    ink.className = "ripple";
    ink.style.width = ink.style.height = size + "px";
    ink.style.left = e.clientX - r.left - size / 2 + "px";
    ink.style.top = e.clientY - r.top - size / 2 + "px";
    btn.appendChild(ink);
    setTimeout(() => ink.remove(), 620);
  });
}

/* ---------- Count-up ---------- */
function countUp(el, to, opts = {}) {
  const { dur = 1100, money = false, suffix = "", dec = 0 } = opts;
  const start = performance.now();
  const from = 0;
  function frame(now) {
    const t = Math.min(1, (now - start) / dur);
    const e = 1 - Math.pow(1 - t, 3); // easeOutCubic
    const val = from + (to - from) * e;
    el.textContent = money ? fmtMoney(val, dec) : fmtNum(val) + suffix;
    if (t < 1) requestAnimationFrame(frame);
    else el.textContent = money ? fmtMoney(to, dec) : fmtNum(to) + suffix;
  }
  requestAnimationFrame(frame);
}

/* ============================================================
   TOPBAR
   ============================================================ */
function topbarHTML() {
  return `
  <div class="topbar">
    <div class="topbar-inner">
      <div class="brand">
        <span class="brand-mark"><i data-lucide="box"></i></span>
        <b>Product Hub</b>
      </div>
      <div class="spacer"></div>
      <button class="btn-icon" id="themeBtn" aria-label="Cambiar tema"><i data-lucide="moon"></i></button>
      <button class="btn btn-primary" id="newProductBtn"><i data-lucide="plus"></i>Nuevo producto</button>
    </div>
  </div>`;
}

/* ============================================================
   PANTALLA 1 — Lista de productos
   ============================================================ */
function listHTML() {
  let totalRev = 0, activos = 0;
  DB.products.forEach((p) => {
    totalRev += productTotals(p).revenue;
    if (p.status === "testeando" || p.status === "escalando") activos++;
  });
  const total = DB.products.length;

  const stats = `
    <div class="stats-row">
      <div class="stat enter" style="animation-delay:.05s">
        <div class="ic"><i data-lucide="layout-grid"></i></div>
        <div class="val" data-count="${total}" data-kind="num">0</div>
        <div class="cap">Productos en seguimiento</div>
      </div>
      <div class="stat enter" style="animation-delay:.12s">
        <div class="ic"><i data-lucide="euro"></i></div>
        <div class="val" data-count="${totalRev}" data-kind="money">0</div>
        <div class="cap">Revenue total acumulado</div>
      </div>
      <div class="stat enter" style="animation-delay:.19s">
        <div class="ic"><i data-lucide="activity"></i></div>
        <div class="val" data-count="${activos}" data-kind="num">0</div>
        <div class="cap">Productos activos ahora</div>
      </div>
    </div>`;

  const cards = DB.products.map((p, i) => productCardHTML(p, i)).join("");

  const grid = DB.products.length
    ? `<div class="grid-products">${cards}</div>`
    : `<div class="empty enter" style="animation-delay:.1s">
         ${emptySVG()}
         <h3>Aún no tienes productos</h3>
         <p>Crea tu primer producto para empezar a registrar ventas y diagnosticar tus vídeos.</p>
         <button class="btn btn-primary" id="emptyNewBtn"><i data-lucide="plus"></i>Nuevo producto</button>
       </div>`;

  return `
    <div class="shell">
      <div class="page-head">
        <div>
          <div class="eyebrow">Centro de control</div>
          <h1 class="h1">Product Hub</h1>
          <div class="sub">Gestiona cada producto en testeo como un proyecto independiente.</div>
        </div>
      </div>
      ${stats}
      ${grid}
      ${introHTML()}
      <footer class="credit">Hecho por <b>Alexandru</b> para <b>ZongaElements</b></footer>
    </div>`;
}

function introHTML() {
  const steps = [
    { n: "Paso 01", icon: "package-plus", t: "Crea el producto", d: "Cada test es un proyecto con su estado y su break-even." },
    { n: "Paso 02", icon: "trending-up", t: "Registra tus ventas", d: "Pedidos e ingresos de cada día, con gráfica y KPIs." },
    { n: "Paso 03", icon: "smartphone", t: "Conecta tus redes", d: "TikTok, Instagram, Facebook o YouTube por producto." },
    { n: "Paso 04", icon: "target", t: "Diagnostica el vídeo", d: "Termómetro de fases y constelación de pilares." },
  ];
  const flow = steps.map((s) => `
    <div class="flow-step">
      <div class="fic"><i data-lucide="${s.icon}"></i></div>
      <div class="fstep-n">${s.n}</div>
      <div class="ft">${s.t}</div>
      <div class="fd">${s.d}</div>
    </div>`).join("");
  return `
    <section class="intro enter" style="animation-delay:.04s">
      <p class="intro-lead"><b>Product Hub</b> es tu centro de control para dropshipping orgánico. Trata cada producto como un proyecto independiente: registra las ventas día a día, sigue tus cuentas de redes y descubre por qué un vídeo no despega con el método de <b>fases y pilares</b>.</p>
      <div class="flow">${flow}</div>
    </section>`;
}

function productCardHTML(p, i) {
  const { revenue, orders } = productTotals(p);
  const meta = STATUS_META[p.status];
  const pct = p.extended ? 100 : Math.min(100, Math.round((p.day / p.target) * 100));
  const daysLabel = p.extended ? `Día ${p.day} · extendido` : `Día ${Math.min(p.day, p.target)} / ${p.target}`;
  return `
    <div class="pcard enter" data-product="${p.id}" style="--accent:${p.accent};animation-delay:${0.1 + i * 0.06}s">
      <div class="pcard-top">
        <div class="pemoji">${p.emoji}</div>
        <div style="flex:1;min-width:0">
          <h3>${p.name}</h3>
          <div class="pmeta">${p.accounts.length} ${p.accounts.length === 1 ? "cuenta" : "cuentas"} · inicio ${fmtDate(p.startDate)}</div>
        </div>
        <span class="badge s-${p.status}"><span class="dot"></span>${meta.label}</span>
      </div>
      <div class="prog">
        <div class="prog-head">
          <span class="label">Progreso del test</span>
          <span class="days">${daysLabel}</span>
        </div>
        <div class="prog-track"><div class="prog-fill ${p.extended ? "extended" : ""}" data-fill="${pct}"></div></div>
      </div>
      <div class="pcard-foot">
        <div>
          <div class="rev">${fmtMoney(revenue)}</div>
          <div class="orders">${fmtNum(orders)} pedidos</div>
        </div>
        <div class="foot-actions">
          <button class="card-del" data-del-product="${p.id}" aria-label="Eliminar producto"><i data-lucide="trash-2"></i></button>
          <span class="go"><i data-lucide="arrow-right"></i></span>
        </div>
      </div>
    </div>`;
}

/* ============================================================
   PANTALLA 2 — Dashboard del producto
   ============================================================ */
function dashboardHTML(p) {
  const meta = STATUS_META[p.status];
  const testDone = p.day >= p.target;
  const pct = p.extended ? 100 : Math.min(100, (p.day / p.target) * 100);
  const daysLabel = p.extended ? `Día ${p.day} · test extendido` : `Día ${Math.min(p.day, p.target)} de ${p.target}`;
  const scale = p.extended
    ? `<div class="mega-note">Modo extendido — contando los días reales que el producto lleva activo (sin límite de ${p.target}).</div>`
    : `<div class="mega-scale">${Array.from({ length: p.target }, (_, i) => `<span>${i + 1}</span>`).join("")}</div>`;

  let actions = "";
  if (testDone) {
    actions = `<div class="test-actions">
      <button class="btn btn-soft" id="resumenBtn"><i data-lucide="file-text"></i>Ver resumen del test</button>
      ${p.extended
        ? `<span class="ext-badge"><i data-lucide="infinity"></i>Test extendido · Día ${p.day}</span>`
        : `<button class="btn btn-ghost" id="prolongarBtn"><i data-lucide="clock"></i>Prolongar tiempo</button>`}
    </div>`;
  }

  return `
    <div class="shell">
      <div class="back-row">
        <button class="btn btn-ghost btn-sm" id="backBtn"><i data-lucide="arrow-left"></i>Volver</button>
        <button class="btn btn-danger btn-sm" id="deleteProductBtn"><i data-lucide="trash-2"></i>Eliminar producto</button>
      </div>
      <div class="dash-head">
        <div class="dash-emoji">${p.emoji}</div>
        <div class="dash-title" style="flex:1;min-width:240px">
          <h1>${p.name}</h1>
          <div class="row">
            <span class="badge s-${p.status} clickable" id="statusBadge" title="Click para cambiar estado">
              <span class="dot"></span>${meta.label}</span>
            <span class="label" style="color:var(--faint)">Inicio ${fmtDate(p.startDate)} · break-even ${fmtMoney(p.breakEven)}</span>
          </div>
        </div>
      </div>

      <div class="mega-prog">
        <div class="prog-head">
          <span class="label">${p.extended ? "Seguimiento extendido" : "Test de " + p.target + " días"}</span>
          <span class="days">${daysLabel}</span>
        </div>
        <div class="mega-track">
          <div class="mega-fill ${p.extended ? "extended" : ""}" data-fill="${pct}"></div>
          <div class="mega-dot" data-pos="${pct}"></div>
        </div>
        ${scale}
        ${actions}
      </div>

      <div class="tabs" id="dashTabs">
        <button class="tab ${state.tab === "tienda" ? "active" : ""}" data-tab="tienda"><i data-lucide="store"></i>Tienda</button>
        <button class="tab ${state.tab === "redes" ? "active" : ""}" data-tab="redes"><i data-lucide="smartphone"></i>Redes</button>
      </div>

      <div id="tabContent"></div>
    </div>`;
}

/* ---------- TAB TIENDA ---------- */
function tiendaHTML(p) {
  const { revenue, orders, ticket } = productTotals(p);
  const beLeft = Math.max(0, p.breakEven - revenue);
  const bePct = Math.min(100, (revenue / p.breakEven) * 100);
  const beOver = revenue >= p.breakEven;

  const kpis = `
    <div class="kpi-row">
      <div class="kpi enter" style="animation-delay:.04s">
        <div class="ic"><i data-lucide="euro"></i></div>
        <div class="val" data-count="${revenue}" data-kind="money">0</div>
        <div class="cap">Revenue total</div>
      </div>
      <div class="kpi enter" style="animation-delay:.1s">
        <div class="ic"><i data-lucide="shopping-bag"></i></div>
        <div class="val" data-count="${orders}" data-kind="num">0</div>
        <div class="cap">Pedidos totales</div>
      </div>
      <div class="kpi enter" style="animation-delay:.16s">
        <div class="ic"><i data-lucide="receipt"></i></div>
        <div class="val" data-count="${ticket}" data-kind="money" data-dec="2">0</div>
        <div class="cap">Ticket medio</div>
      </div>
      <div class="kpi enter" style="animation-delay:.22s">
        <div class="ic"><i data-lucide="target"></i></div>
        <div class="val">${beOver ? "✓ Cubierto" : fmtMoney(beLeft)}</div>
        <div class="cap">${beOver ? "Break-even superado" : "Falta para break-even"}
          <span class="editable-be" id="editBe"><i data-lucide="pencil"></i>editar</span></div>
        <div class="be-bar"><div class="be-fill ${beOver?"over":""}" data-fill="${bePct}"></div></div>
      </div>
    </div>`;

  const chartPanel = `
    <div class="panel">
      <div class="panel-head">
        <h3>Revenue por día</h3>
        <span class="label">14 días de test · break-even ${fmtMoney(p.breakEven)}</span>
      </div>
      ${p.series.length
        ? `<div class="chart-wrap"><canvas id="revChart"></canvas></div>`
        : `<div class="empty" style="padding:48px 20px">${emptySVG()}<h3>Sin datos todavía</h3><p>Registra tu primer día con el formulario de la derecha y la gráfica empezará a dibujarse.</p></div>`}
    </div>`;

  const inputCard = `
    <div class="input-card">
      <h3><span class="ic"><i data-lucide="calendar-plus"></i></span>Registrar día de hoy</h3>
      <div class="field">
        <label>Fecha</label>
        <input class="input" type="date" id="inDate" value="${new Date().toISOString().slice(0,10)}" />
      </div>
      <div class="field field-2">
        <div><label>Pedidos del día</label><input class="input" type="number" min="0" id="inOrders" placeholder="0" /></div>
        <div><label>Ingresos del día (€)</label><input class="input" type="number" min="0" id="inRev" placeholder="0" /></div>
      </div>
      <button class="btn btn-primary" id="saveDayBtn" style="width:100%;justify-content:center;margin-top:18px">
        <i data-lucide="check"></i>Guardar día</button>
    </div>`;

  const history = `
    <div class="panel block">
      <div class="panel-head"><h3>Histórico de días</h3><span class="label">${p.series.length} registros</span></div>
      <div style="overflow-x:auto">
        <table class="htable">
          <thead><tr><th>Fecha</th><th class="num">Pedidos</th><th class="num">Ingresos</th><th></th></tr></thead>
          <tbody id="histBody">${historyRows(p)}</tbody>
        </table>
      </div>
    </div>`;

  return `<div class="tab-panel">
    ${kpis}
    <div class="block-grid">${chartPanel}${inputCard}</div>
    ${history}
  </div>`;
}

function historyRows(p) {
  if (!p.series.length) {
    return `<tr><td colspan="4" style="text-align:center;color:var(--faint);padding:28px">Aún no has registrado ningún día.</td></tr>`;
  }
  return [...p.series].reverse().map((d, idx) => {
    const realIdx = p.series.length - 1 - idx;
    return `<tr>
      <td>${fmtDate(d.date)}</td>
      <td class="num">${fmtNum(d.pedidos)}</td>
      <td class="num money">${fmtMoney(d.ingresos)}</td>
      <td class="num"><button class="row-del" data-del="${realIdx}" aria-label="Eliminar"><i data-lucide="trash-2"></i></button></td>
    </tr>`;
  }).join("");
}

/* ---------- TAB REDES ---------- */
function redesHTML(p) {
  if (!p.accounts.length) {
    return `<div class="tab-panel">${emptyAccountsHTML()}</div>`;
  }
  const cards = p.accounts.map((a, i) => {
    return `
      <div class="acct enter" data-acct-card="${a.id}" data-open-acct="${a.id}" style="animation-delay:${0.05+i*0.07}s">
        <div class="acct-top">
          <div class="plat ${a.platform}"><i data-lucide="${platformIcon(a.platform)}"></i></div>
          <div style="flex:1;min-width:0">
            <h4>${platformName(a.platform)}</h4>
            <div class="handle">${a.handle}</div>
            <div class="since">Creada el ${fmtDate(a.since)}</div>
          </div>
          <span class="acct-go"><i data-lucide="chevron-right"></i></span>
        </div>
        <div class="acct-stats">
          <div class="s"><div class="n" data-stat="videos">${fmtNum(acctVideoCount(a))}</div><div class="l">Vídeos</div></div>
          <div class="s"><div class="n" data-stat="views">${fmtViews(acctViews(a))}</div><div class="l">Vistas tot.</div></div>
          <div class="s"><div class="n" data-stat="best">${fmtViews(acctBest(a))}</div><div class="l">Mejor vídeo</div></div>
        </div>
        <div class="acct-actions">
          <button class="btn btn-soft" data-open-acct-btn="${a.id}"><i data-lucide="clapperboard"></i>Gestionar vídeos</button>
          <button class="btn btn-ghost" data-diag="${a.id}"><i data-lucide="line-chart"></i>Diagnóstico</button>
        </div>
      </div>`;
  }).join("");

  return `<div class="tab-panel">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-top:26px;flex-wrap:wrap;gap:12px">
      <div><div class="label">Cuentas asociadas</div>
        <div style="font-size:20px;font-weight:700;letter-spacing:-.02em;margin-top:2px">${p.accounts.length} cuentas en testeo</div></div>
      <button class="btn btn-ghost" id="addAcctBtn"><i data-lucide="plus"></i>Añadir cuenta</button>
    </div>
    <div class="accounts-grid">${cards}</div>
  </div>`;
}

function emptyAccountsHTML() {
  return `<div class="empty">
    ${emptySVG()}
    <h3>Sin cuentas todavía</h3>
    <p>Añade las cuentas de TikTok, Instagram, Facebook o YouTube donde estás testeando este producto.</p>
    <button class="btn btn-primary" id="addAcctBtn"><i data-lucide="plus"></i>Añadir primera cuenta</button>
  </div>`;
}

function emptySVG() {
  return `<svg width="120" height="96" viewBox="0 0 120 96" fill="none">
    <rect x="16" y="20" width="88" height="60" rx="12" fill="var(--blue-tint)" stroke="var(--blue-pastel)" stroke-width="2"/>
    <rect x="30" y="34" width="40" height="7" rx="3.5" fill="var(--blue-pastel)"/>
    <rect x="30" y="48" width="60" height="6" rx="3" fill="var(--surface-2)"/>
    <rect x="30" y="60" width="48" height="6" rx="3" fill="var(--surface-2)"/>
    <circle cx="92" cy="28" r="14" fill="var(--blue)"/>
    <path d="M86 28h12M92 22v12" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>
  </svg>`;
}

/* ============================================================
   RENDER + animaciones de entrada
   ============================================================ */
function render() {
  const app = document.getElementById("app");
  if (state.view === "list") {
    app.innerHTML = topbarHTML() + listHTML();
  } else {
    const p = getProduct(state.productId);
    app.innerHTML = topbarHTML() + dashboardHTML(p);
    renderTab();
  }
  refreshIcons();
  bindGlobal();
  runEntranceAnims();
}

function renderTab() {
  const p = getProduct(state.productId);
  const host = document.getElementById("tabContent");
  host.innerHTML = state.tab === "tienda" ? tiendaHTML(p) : redesHTML(p);
  refreshIcons();
  if (state.tab === "tienda") {
    const c = document.getElementById("revChart");
    if (c) renderRevenueChart(c, p);
  }
  runEntranceAnims();
  bindTab();
}

function runEntranceAnims() {
  // count-up (rAF for smoothness) + ALWAYS-on setTimeout safety net for frozen/backgrounded clocks
  document.querySelectorAll("[data-count]").forEach((el) => {
    if (el._counted) return;
    el._counted = true;
    const to = parseFloat(el.dataset.count);
    const kind = el.dataset.kind;
    const dec = el.dataset.dec ? parseInt(el.dataset.dec, 10) : 0;
    countUp(el, to, { money: kind === "money", dec });
    setTimeout(() => { el.textContent = kind === "money" ? fmtMoney(to, dec) : fmtNum(to); }, 1250);
  });

  // progress fills — animate via CSS transition on a live clock
  setTimeout(() => {
    document.querySelectorAll("[data-fill]").forEach((el) => (el.style.width = el.dataset.fill + "%"));
    document.querySelectorAll("[data-pos]").forEach((el) => (el.style.left = el.dataset.pos + "%"));
  }, 60);

  // GUARANTEED reveal — runs unconditionally (NOT gated on document.timeline, which can
  // advance while CSS animations are frozen). After the entrance window we strip `.enter`,
  // reverting elements to their natural opacity:1 so content is never blank, and so hover
  // transforms keep working (no pinned !important transform). On a live clock the entrance
  // animation has already played by now, so this is a visual no-op.
  setTimeout(() => {
    document.querySelectorAll(".enter").forEach((el) => {
      el.classList.remove("enter");
      el.style.removeProperty("animation-delay");
      el.style.removeProperty("opacity");
      el.style.removeProperty("transform");
    });
    // Force progress fills to their final width in case a frozen clock stalled the transition.
    document.querySelectorAll("[data-fill]").forEach((el) => { el.style.transition = "none"; el.style.width = el.dataset.fill + "%"; });
    document.querySelectorAll("[data-pos]").forEach((el) => { el.style.transition = "none"; el.style.left = el.dataset.pos + "%"; });
  }, 1150);
}

/* ============================================================
   EVENTOS
   ============================================================ */
function bindGlobal() {
  const tb = document.getElementById("themeBtn");
  if (tb) {
    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    tb.innerHTML = `<i data-lucide="${isDark ? "sun" : "moon"}"></i>`;
    refreshIcons();
    tb.addEventListener("click", toggleTheme);
  }
  const np = document.getElementById("newProductBtn");
  if (np) np.addEventListener("click", openNewProduct);

  if (state.view === "list") {
    document.querySelectorAll("[data-product]").forEach((c) =>
      c.addEventListener("click", () => goProduct(c.dataset.product))
    );
    document.querySelectorAll("[data-del-product]").forEach((b) =>
      b.addEventListener("click", (e) => { e.stopPropagation(); confirmDelete(b.dataset.delProduct); })
    );
    const emptyNew = document.getElementById("emptyNewBtn");
    if (emptyNew) emptyNew.addEventListener("click", openNewProduct);
  } else {
    document.getElementById("backBtn").addEventListener("click", goList);
    const delBtn = document.getElementById("deleteProductBtn");
    if (delBtn) delBtn.addEventListener("click", () => confirmDelete(state.productId));
    const resumenBtn = document.getElementById("resumenBtn");
    if (resumenBtn) resumenBtn.addEventListener("click", () => openResumen(state.productId));
    const prolongarBtn = document.getElementById("prolongarBtn");
    if (prolongarBtn) prolongarBtn.addEventListener("click", prolongarTiempo);
    const badge = document.getElementById("statusBadge");
    if (badge) badge.addEventListener("click", cycleStatus);
    document.getElementById("dashTabs").addEventListener("click", (e) => {
      const t = e.target.closest("[data-tab]");
      if (!t || t.dataset.tab === state.tab) return;
      state.tab = t.dataset.tab;
      document.querySelectorAll("#dashTabs .tab").forEach((x) => x.classList.toggle("active", x.dataset.tab === state.tab));
      renderTab();
    });
  }
}

function bindTab() {
  if (state.tab === "tienda") bindTienda();
  else bindRedes();
}

function bindTienda() {
  const p = getProduct(state.productId);
  const save = document.getElementById("saveDayBtn");
  if (save) save.addEventListener("click", () => {
    const date = document.getElementById("inDate").value;
    const ord = parseInt(document.getElementById("inOrders").value || "0", 10);
    const rev = parseFloat(document.getElementById("inRev").value || "0");
    if (!date || (ord === 0 && rev === 0)) { toast("Rellena pedidos o ingresos", "alert-triangle"); return; }
    p.series.push({ date, pedidos: Math.max(0, ord), ingresos: Math.max(0, rev) });
    p.series.sort((a, b) => a.date.localeCompare(b.date));
    p.day = p.extended ? p.day + 1 : Math.min(p.target, p.day + 1);
    toast("Día guardado correctamente");
    render();
  });

  document.querySelectorAll("[data-del]").forEach((b) =>
    b.addEventListener("click", () => {
      const idx = parseInt(b.dataset.del, 10);
      p.series.splice(idx, 1);
      toast("Día eliminado", "trash-2");
      renderTab();
    })
  );

  const eb = document.getElementById("editBe");
  if (eb) eb.addEventListener("click", () => {
    const val = prompt("Nuevo break-even (€):", p.breakEven);
    if (val !== null && !isNaN(parseFloat(val))) {
      p.breakEven = Math.max(0, parseFloat(val));
      toast("Break-even actualizado", "target");
      renderTab();
    }
  });
}

function bindRedes() {
  const p = getProduct(state.productId);
  document.querySelectorAll("[data-open-acct]").forEach((card) =>
    card.addEventListener("click", (e) => {
      if (e.target.closest("[data-diag]")) return; // diag button handles itself
      openAccount(p.id, card.dataset.openAcct);
    })
  );
  document.querySelectorAll("[data-diag]").forEach((b) =>
    b.addEventListener("click", (e) => { e.stopPropagation(); openDiagnostico(p.id, b.dataset.diag); })
  );
  const add = document.getElementById("addAcctBtn");
  if (add) add.addEventListener("click", () => openNewAccount(p.id));
}

/* ---------- Navegación ---------- */
function goProduct(id) {
  state.view = "product";
  state.productId = id;
  state.tab = "tienda";
  window.scrollTo({ top: 0 });
  render();
}
function goList() {
  state.view = "list";
  state.productId = null;
  window.scrollTo({ top: 0 });
  render();
}
function cycleStatus() {
  const p = getProduct(state.productId);
  const i = STATUS_ORDER.indexOf(p.status);
  p.status = STATUS_ORDER[(i + 1) % STATUS_ORDER.length];
  const badge = document.getElementById("statusBadge");
  badge.className = `badge s-${p.status} clickable`;
  badge.innerHTML = `<span class="dot"></span>${STATUS_META[p.status].label}`;
  toast("Estado: " + STATUS_META[p.status].label, "refresh-cw");
}

function prolongarTiempo() {
  const p = getProduct(state.productId);
  if (!p) return;
  p.extended = true;
  render();
  toast("Tiempo prolongado · seguimos contando días reales", "clock");
}

/* ============================================================
   INIT (con skeleton breve)
   ============================================================ */
function skeletonHTML() {
  const cards = Array.from({ length: 6 }).map(() => `
    <div class="card" style="padding:22px">
      <div style="display:flex;gap:14px"><div class="skel" style="width:56px;height:56px;border-radius:14px"></div>
        <div style="flex:1"><div class="skel" style="height:16px;width:70%"></div>
        <div class="skel" style="height:11px;width:45%;margin-top:9px"></div></div></div>
      <div class="skel" style="height:7px;width:100%;margin-top:22px"></div>
      <div class="skel" style="height:30px;width:50%;margin-top:22px"></div>
    </div>`).join("");
  return `<div class="shell">
    <div class="page-head"><div><div class="skel" style="height:14px;width:120px"></div>
      <div class="skel" style="height:48px;width:340px;margin-top:14px"></div></div></div>
    <div class="stats-row">${Array.from({length:3}).map(()=>'<div class="skel" style="height:120px;border-radius:16px"></div>').join("")}</div>
    <div class="grid-products" style="margin-top:28px">${cards}</div>
  </div>`;
}

function init() {
  initTheme();
  attachRipple();
  const app = document.getElementById("app");
  app.innerHTML = topbarHTML() + skeletonHTML();
  refreshIcons();
  // skeleton breve → render real
  setTimeout(render, 520);
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
else init();
