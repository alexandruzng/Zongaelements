/* ============================================================
   PRODUCT HUB — Diagnóstico de Fases y Pilares
   Termómetro de visitas + Constelación de pilares
   ============================================================ */

/* estado vivo del modal (por sesión) */
const diagState = {
  visits: 0,
  mode: "fases",          // "fases" | "pilares"
  corrections: 0,         // regla de las 3
  pillarViews: { visual: 0, texto: 0, musica: 0, info: 0, emocion: 0 },
};

function openDiagnostico(productId, accountId, seedViews) {
  const product = getProduct(productId);
  const acct = product.accounts.find((a) => a.id === accountId);

  // reset / seed según la cuenta o el vídeo concreto
  diagState.visits = seedViews != null ? seedViews : (acct ? acctBest(acct) : 0);
  diagState.corrections = 0;
  diagState.pillarViews = { visual: 0, texto: 0, musica: 0, info: 0, emocion: 0 };
  diagState.mode = diagState.visits > 5000 ? "pilares" : "fases";

  const root = document.getElementById("modal-root");
  root.innerHTML = `
    <div class="modal-overlay" data-close-overlay>
      <div class="modal" role="dialog" aria-modal="true" aria-label="Diagnóstico de vídeo">
        <div class="modal-head">
          <div>
            <h2>📊 Diagnóstico del vídeo</h2>
            <div class="sub">${acct ? platformName(acct.platform) + " · " + acct.handle : product.name}</div>
          </div>
          <button class="btn-icon" data-close aria-label="Cerrar"><i data-lucide="x"></i></button>
        </div>
        <div class="modal-body">
          <div class="field" style="max-width:420px">
            <label>Visitas del vídeo</label>
            <div class="visits-input">
              <input class="input" id="visitsInput" type="number" min="0" inputmode="numeric"
                     value="${diagState.visits || ""}" placeholder="Ej. 3200" />
              <div class="mode-tabs" id="modeTabs">
                <button class="mode-tab ${diagState.mode === "fases" ? "active" : ""}" data-mode="fases">Fases · ≤5.000</button>
                <button class="mode-tab ${diagState.mode === "pilares" ? "active" : ""}" data-mode="pilares">Pilares · +5.000</button>
              </div>
            </div>
          </div>
          <div id="diagContent" style="margin-top:22px"></div>
        </div>
      </div>
    </div>`;

  renderDiagContent();
  if (window.lucide) lucide.createIcons();

  // events
  const overlay = root.querySelector(".modal-overlay");
  overlay.addEventListener("click", (e) => { if (e.target.matches("[data-close-overlay]")) closeModal(); });
  root.querySelector("[data-close]").addEventListener("click", closeModal);
  document.addEventListener("keydown", escClose);

  const vi = root.querySelector("#visitsInput");
  vi.addEventListener("input", () => {
    const v = Math.max(0, parseInt(vi.value || "0", 10));
    diagState.visits = v;
    const newMode = v > 5000 ? "pilares" : "fases";
    if (newMode !== diagState.mode) { diagState.mode = newMode; renderDiagContent(); if (window.lucide) lucide.createIcons(); }
    else updateLiveViz();
  });
  root.querySelector("#modeTabs").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-mode]");
    if (!btn) return;
    diagState.mode = btn.dataset.mode;
    renderDiagContent(); if (window.lucide) lucide.createIcons();
  });
  // animar termómetro/constelación en la entrada
  setTimeout(updateLiveViz, 40);
}

function escClose(e) { if (e.key === "Escape") closeModal(); }
function closeModal() {
  const root = document.getElementById("modal-root");
  const ov = root.querySelector(".modal-overlay");
  if (ov) { ov.style.animation = "fadeIn .2s reverse"; setTimeout(() => (root.innerHTML = ""), 160); }
  document.removeEventListener("keydown", escClose);
}

function platformName(p) {
  return { tiktok: "TikTok", ig: "Instagram", fb: "Facebook", yt: "YouTube" }[p] || p;
}

/* ---------- Router de contenido del modal ---------- */
function renderDiagContent() {
  const el = document.getElementById("diagContent");
  el.innerHTML = diagState.mode === "pilares" ? pilaresHTML() : fasesHTML();
  bindModeContent();
}

/* ============================================================
   FASES — Termómetro
   ============================================================ */
function fasesHTML() {
  // marcas en bottom% (5 bandas iguales de 20%)
  const marks = [
    { v: "5.000", pct: 100 },
    { v: "2.000", pct: 80 },
    { v: "1.500", pct: 60 },
    { v: "250", pct: 40 },
    { v: "80", pct: 20 },
    { v: "0", pct: 0 },
  ];
  const marksHTML = marks
    .map((m) => `<div class="thermo-mark" style="bottom:${m.pct}%"><span class="v">${m.v}</span></div>`)
    .join("");

  return `
    <div class="thermo-layout">
      <div class="thermo">
        <div class="thermo-bar" id="thermoBar">
          ${marksHTML}
          <div class="thermo-dot" id="thermoDot" style="bottom:0%"></div>
        </div>
      </div>
      <div class="phase-info" id="phaseInfo"></div>
    </div>
    ${rule3HTML()}`;
}

/* mapea visitas → % de altura (bandas iguales por fase) */
function visitsToPct(v) {
  if (v >= 5000) return 100;
  for (let i = 0; i < PHASES.length; i++) {
    const p = PHASES[i];
    if (v >= p.min && v < p.max) {
      const frac = (v - p.min) / (p.max - p.min);
      return (i + frac) * 20;
    }
  }
  return 0;
}

function rule3HTML() {
  const dots = [0, 1, 2]
    .map((i) => `<button class="r-dot ${i < diagState.corrections ? "filled" : ""}" data-rdot="${i}">
        <i data-lucide="${i < diagState.corrections ? "check" : "minus"}"></i></button>`)
    .join("");
  const done = diagState.corrections >= 3;
  return `
    <div class="rule3">
      <div class="rule3-head">
        <div class="ic"><i data-lucide="alert-triangle"></i></div>
        <div>
          <h4>${RULE3.title}</h4>
          <p>${RULE3.sub}</p>
        </div>
      </div>
      <div class="rule3-dots">
        ${dots}
        <span class="rule3-msg ${done ? "show" : ""}"><i data-lucide="refresh-cw" style="width:15px;height:15px"></i>${RULE3.done}</span>
        ${diagState.corrections > 0 ? '<button class="rule3-reset" data-rreset>reiniciar</button>' : ""}
      </div>
    </div>`;
}

/* ============================================================
   PILARES — Constelación + matriz 5x5
   ============================================================ */
function pilaresHTML() {
  // orbes en pentágono
  const orbs = PILLARS.map((p, i) => {
    const pos = PENTAGON[i];
    return `<div class="pillar" id="orb-${p.id}" style="left:${pos.x}%;top:${pos.y}%">
        <div class="pillar-orb"><span class="ring"></span><i data-lucide="${p.icon}"></i></div>
        <div class="pillar-name">${p.name}</div>
        <div class="pillar-views" id="views-${p.id}">—</div>
      </div>`;
  }).join("");

  // líneas constelación (pentágono cerrado)
  let lines = "";
  for (let i = 0; i < PENTAGON.length; i++) {
    const a = PENTAGON[i], b = PENTAGON[(i + 1) % PENTAGON.length];
    lines += `<line class="const-line" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" />`;
  }

  // matriz
  const rows = PILLARS.map((changed, ri) => {
    const cells = PILLARS.map((col) =>
      col.id === changed.id
        ? `<td class="chg">🔄 cambia</td>`
        : `<td class="same">igual</td>`
    ).join("");
    return `<tr data-row="${changed.id}">
      <td class="vh">V${ri + 1} · ${changed.name}</td>
      ${cells}
      <td class="viewcell"><input class="vinput" type="number" min="0" inputmode="numeric"
          placeholder="visitas" data-pillar="${changed.id}" value="${diagState.pillarViews[changed.id] || ""}" /></td>
    </tr>`;
  }).join("");

  return `
    <p style="color:var(--muted);font-size:15px;line-height:1.6;max-width:74ch">${PILLARS_INTRO}</p>

    <div class="constellation" id="constellation" style="margin-top:18px">
      <svg class="const-svg" viewBox="0 0 100 100" preserveAspectRatio="none">${lines}</svg>
      ${orbs}
    </div>

    <div class="panel" style="margin-top:8px;padding:18px 20px">
      <div style="overflow-x:auto">
        <table class="matrix">
          <thead>
            <tr>
              <th class="vh">Versión</th>
              ${PILLARS.map((p) => `<th>${p.name}</th>`).join("")}
              <th>Visitas</th>
            </tr>
          </thead>
          <tbody id="matrixBody">${rows}</tbody>
        </table>
      </div>
    </div>

    <div class="verdict" id="verdict"></div>`;
}

/* ---------- Bind de eventos del contenido activo ---------- */
function bindModeContent() {
  const root = document.getElementById("modal-root");
  if (diagState.mode === "fases") {
    root.querySelectorAll("[data-rdot]").forEach((d) =>
      d.addEventListener("click", () => {
        const i = parseInt(d.dataset.rdot, 10);
        diagState.corrections = diagState.corrections === i + 1 ? i : i + 1;
        renderDiagContent(); if (window.lucide) lucide.createIcons();
      })
    );
    const reset = root.querySelector("[data-rreset]");
    if (reset) reset.addEventListener("click", () => { diagState.corrections = 0; renderDiagContent(); if (window.lucide) lucide.createIcons(); });
  } else {
    root.querySelectorAll(".vinput").forEach((inp) =>
      inp.addEventListener("input", () => {
        diagState.pillarViews[inp.dataset.pillar] = Math.max(0, parseInt(inp.value || "0", 10));
        updatePilares();
      })
    );
    updatePilares();
  }
}

/* ---------- Live update dispatcher ---------- */
function updateLiveViz() {
  if (diagState.mode === "fases") updateTermometro();
  else updatePilares();
}

/* ---------- Termómetro live ---------- */
function updateTermometro() {
  const dot = document.getElementById("thermoDot");
  const bar = document.getElementById("thermoBar");
  const info = document.getElementById("phaseInfo");
  if (!dot || !info) return;

  const v = diagState.visits;
  const pct = visitsToPct(v);
  const phase = v >= 0 && v <= 5000 ? getPhase(v) : PHASES[PHASES.length - 1];

  bar.classList.toggle("lit", v > 0);
  dot.style.bottom = pct + "%";
  dot.style.borderColor = phase.colorHex;
  dot.style.color = phase.colorHex;
  dot.style.boxShadow = `0 0 0 6px ${hexA(phase.colorHex, 0.2)}, 0 0 26px 5px ${hexA(phase.colorHex, 0.6)}`;
  dot.textContent = v > 0 ? fmtViews(v) : "";

  // info panel
  let pts = phase.points.map((p) => `<div class="li"><span style="color:${phase.colorHex}">•</span><span>${p}</span></div>`).join("");
  let extra = "";
  if (phase.id === 5 && v >= 2000) {
    const s = segundoParaProbar(v);
    extra = `<div class="quote" style="--accent:${phase.colorHex}">
        Con <b>${fmtNum(v)}</b> visitas, empieza por el <b>segundo ${s}</b>.
        Si no es eso, prueba el <b>segundo ${s + 1}</b>.<br><span style="color:var(--faint)">${phase.example}</span></div>`;
  }
  info.innerHTML = `
    <div class="phase-tag" style="background:${phase.colorHex}">${phase.emoji} Fase ${phase.id}</div>
    <div class="phase-icon" style="background:${phase.colorHex}"><i data-lucide="${phase.icon}"></i></div>
    <h3>${phase.tag}</h3>
    <div class="range">${phase.range}</div>
    <p>${phase.text}</p>
    <div class="seg-list">${pts}</div>
    ${extra}`;
  if (window.lucide) lucide.createIcons();
}

/* ---------- Pilares live ---------- */
function updatePilares() {
  const views = diagState.pillarViews;
  const entries = PILLARS.map((p) => ({ id: p.id, v: views[p.id] || 0 }));
  const filled = entries.filter((e) => e.v > 0);
  const max = Math.max(...entries.map((e) => e.v), 1);
  const winner = filled.length >= 2 ? filled.reduce((a, b) => (b.v > a.v ? b : a)) : null;
  const loser = filled.length >= 2 ? filled.reduce((a, b) => (b.v < a.v ? b : a)) : null;

  PILLARS.forEach((p) => {
    const orb = document.getElementById("orb-" + p.id);
    const vEl = document.getElementById("views-" + p.id);
    if (!orb) return;
    const v = views[p.id] || 0;
    const intensity = v / max; // 0..1
    const orbEl = orb.querySelector(".pillar-orb");
    if (v > 0) {
      orbEl.style.boxShadow = `0 0 ${10 + intensity * 34}px ${intensity * 8}px rgba(37,99,235,${0.18 + intensity * 0.5})`;
      orbEl.style.borderColor = `rgba(37,99,235,${0.4 + intensity * 0.6})`;
      orbEl.style.color = "#2563EB";
      vEl.textContent = fmtViews(v);
    } else {
      orbEl.style.boxShadow = "none";
      orbEl.style.borderColor = "";
      orbEl.style.color = "";
      vEl.textContent = "—";
    }
    orb.classList.toggle("winner", !!winner && winner.id === p.id);
    orb.classList.toggle("dim", !!loser && loser.id === p.id && winner.id !== p.id);
  });

  // matriz row highlight
  document.querySelectorAll("#matrixBody tr").forEach((tr) => {
    tr.classList.toggle("is-winner", !!winner && tr.dataset.row === winner.id);
    tr.classList.toggle("is-loser", !!loser && tr.dataset.row === loser.id && (!winner || winner.id !== loser.id));
  });

  // veredicto
  const verdict = document.getElementById("verdict");
  if (verdict) {
    if (winner) {
      const wName = PILLARS.find((p) => p.id === winner.id).name;
      const lName = loser ? PILLARS.find((p) => p.id === loser.id).name : "—";
      verdict.innerHTML = `
        <div class="verdict-card good">
          <div class="ic"><i data-lucide="award"></i></div>
          <div><div class="t">Pilar que funciona · mantenlo</div><div class="n">${wName} — ${fmtViews(winner.v)} visitas</div></div>
        </div>
        <div class="verdict-card bad">
          <div class="ic"><i data-lucide="x"></i></div>
          <div><div class="t">Pilar irrelevante · deja de testearlo</div><div class="n">${lName} — ${fmtViews(loser.v)} visitas</div></div>
        </div>`;
      if (window.lucide) lucide.createIcons();
    } else {
      verdict.innerHTML = `<div class="verdict-card bad" style="grid-column:1/-1">
        <div class="ic"><i data-lucide="info"></i></div>
        <div><div class="t">Sigue rellenando</div><div class="n">Mete las visitas de al menos 2 versiones para ver el veredicto</div></div></div>`;
      if (window.lucide) lucide.createIcons();
    }
  }
}

/* hex (#RRGGBB) → rgba string */
function hexA(hex, a) {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}
