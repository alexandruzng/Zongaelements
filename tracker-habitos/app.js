var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
const { useState, useEffect, useMemo, useRef, useCallback } = React;
const WHEEL_VIEW = 1e3;
const WHEEL_CX = 500;
const WHEEL_CY = 500;
const WHEEL_INNER = 145;
const WHEEL_RING_W = 30;
const WHEEL_OUTER = WHEEL_INNER + 9 * WHEEL_RING_W;
const WHEEL_LABEL_R = WHEEL_OUTER + 38;
const WHEEL_DAYS = 31;
const WHEEL_GAP_DEG = 14;
const WHEEL_SPAN_DEG = 360 - WHEEL_GAP_DEG;
const WHEEL_DAY_DEG = WHEEL_SPAN_DEG / WHEEL_DAYS;
const WHEEL_START_DEG = -90 + WHEEL_GAP_DEG / 2;
function toRad(deg) {
  return deg * Math.PI / 180;
}
function polar(cx, cy, r, deg) {
  const a = toRad(deg);
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
}
function cellPath(rIn, rOut, aStart, aEnd) {
  const [x1, y1] = polar(WHEEL_CX, WHEEL_CY, rIn, aStart);
  const [x2, y2] = polar(WHEEL_CX, WHEEL_CY, rOut, aStart);
  const [x3, y3] = polar(WHEEL_CX, WHEEL_CY, rOut, aEnd);
  const [x4, y4] = polar(WHEEL_CX, WHEEL_CY, rIn, aEnd);
  const largeArc = aEnd - aStart > 180 ? 1 : 0;
  return [
    `M ${x1.toFixed(2)} ${y1.toFixed(2)}`,
    `L ${x2.toFixed(2)} ${y2.toFixed(2)}`,
    `A ${rOut} ${rOut} 0 ${largeArc} 1 ${x3.toFixed(2)} ${y3.toFixed(2)}`,
    `L ${x4.toFixed(2)} ${y4.toFixed(2)}`,
    `A ${rIn} ${rIn} 0 ${largeArc} 0 ${x1.toFixed(2)} ${y1.toFixed(2)}`,
    "Z"
  ].join(" ");
}
function dayAngles(day) {
  const aStart = WHEEL_START_DEG + (day - 1) * WHEEL_DAY_DEG;
  const aEnd = aStart + WHEEL_DAY_DEG;
  return [aStart, aEnd];
}
function ringRadii(habitIdx) {
  const rIn = WHEEL_INNER + habitIdx * WHEEL_RING_W;
  const rOut = rIn + WHEEL_RING_W;
  return [rIn, rOut];
}
const RING_TINTS = [
  "#b8a78a",
  "#c89878",
  "#a48a6a",
  "#8f8463",
  "#7d9078",
  "#6b8a8e",
  "#7a7d99",
  "#8e7a96",
  "#9c7385"
];
function Wheel({ habits, marks, onCellClick, onCellHover, hoveredDay, selectedCell, todayDay }) {
  const cells = [];
  const numberLabels = [];
  for (let h = 0; h < 9; h++) {
    const active = !!habits[h];
    const [rIn, rOut] = ringRadii(h);
    for (let d = 1; d <= WHEEL_DAYS; d++) {
      const [aS, aE] = dayAngles(d);
      const inset = 0.6;
      const path = cellPath(rIn + 0.4, rOut - 0.4, aS + inset / (rIn / 30), aE - inset / (rIn / 30));
      const key = `${h}_${d}`;
      const mark = marks[key];
      const isSelected = selectedCell === key;
      const isHoveredDay = hoveredDay === d;
      let fill = active ? "#fbfaf5" : "#efeadd";
      let cls = "wheel-cell";
      if (mark === "done") {
        fill = "var(--done)";
        cls += " wheel-cell-done";
      } else if (mark === "miss") {
        fill = "var(--miss)";
        cls += " wheel-cell-miss";
      }
      cells.push(
        /* @__PURE__ */ React.createElement(
          "path",
          {
            key,
            d: path,
            className: cls + (isSelected ? " sel" : "") + (isHoveredDay ? " col-hover" : ""),
            fill,
            stroke: isSelected ? "#14130e" : isHoveredDay ? "#14130e" : "#9b9580",
            strokeWidth: isSelected ? 2 : isHoveredDay ? 1.1 : 0.55,
            style: {
              cursor: active ? "pointer" : "not-allowed",
              opacity: active ? 1 : 0.55,
              transition: "fill 0.22s ease, transform 0.18s ease, stroke-width 0.15s ease",
              transformOrigin: `${WHEEL_CX}px ${WHEEL_CY}px`
            },
            onClick: (e) => {
              if (active) onCellClick(h, d, e);
            },
            onMouseEnter: () => onCellHover(d),
            onMouseLeave: () => onCellHover(null)
          }
        )
      );
    }
  }
  for (let d = 1; d <= WHEEL_DAYS; d++) {
    const [aS, aE] = dayAngles(d);
    const aMid = (aS + aE) / 2;
    const [lx, ly] = polar(WHEEL_CX, WHEEL_CY, WHEEL_LABEL_R, aMid);
    const rotate = aMid + 90;
    numberLabels.push(
      /* @__PURE__ */ React.createElement(
        "text",
        {
          key: `d${d}`,
          x: lx,
          y: ly,
          textAnchor: "middle",
          dominantBaseline: "middle",
          fontFamily: "Instrument Serif",
          fontStyle: "italic",
          fontSize: d === todayDay ? 30 : 26,
          fontWeight: d === todayDay ? 600 : 400,
          fill: d === todayDay ? "var(--ink)" : hoveredDay === d ? "var(--ink)" : "var(--ink-soft)",
          transform: `rotate(${rotate} ${lx} ${ly})`,
          style: { pointerEvents: "none", transition: "fill 0.15s" }
        },
        d
      )
    );
  }
  let todayTick = null;
  if (todayDay >= 1 && todayDay <= 31) {
    const [aS, aE] = dayAngles(todayDay);
    const aMid = (aS + aE) / 2;
    const [tx1, ty1] = polar(WHEEL_CX, WHEEL_CY, WHEEL_OUTER + 6, aMid);
    const [tx2, ty2] = polar(WHEEL_CX, WHEEL_CY, WHEEL_OUTER + 18, aMid);
    todayTick = /* @__PURE__ */ React.createElement("line", { x1: tx1, y1: ty1, x2: tx2, y2: ty2, stroke: "var(--ink)", strokeWidth: "2", strokeLinecap: "round" });
  }
  const ringHints = [];
  for (let h = 0; h < 9; h++) {
    if (!habits[h]) continue;
    const [rIn] = ringRadii(h);
    const [dx, dy] = polar(WHEEL_CX, WHEEL_CY, rIn + WHEEL_RING_W / 2, WHEEL_START_DEG - 0.4);
    ringHints.push(
      /* @__PURE__ */ React.createElement("circle", { key: `hint${h}`, cx: dx, cy: dy, r: "3.2", fill: RING_TINTS[h], stroke: "#fff", strokeWidth: "1" })
    );
  }
  return /* @__PURE__ */ React.createElement("svg", { viewBox: `0 0 ${WHEEL_VIEW} ${WHEEL_VIEW}`, className: "wheel-svg", style: { width: "100%", height: "100%", overflow: "visible" } }, cells, ringHints, todayTick, numberLabels);
}
window.Wheel = Wheel;
window.WHEEL_DAYS = WHEEL_DAYS;
window.RING_TINTS = RING_TINTS;
function WelcomeScreen({ onStart }) {
  return /* @__PURE__ */ React.createElement("div", { className: "welcome" }, /* @__PURE__ */ React.createElement("style", null, `
        .welcome { min-height: 100vh; display: grid; place-items: center; padding: 48px 24px; }
        .welcome-card { width: min(1080px, 100%); background: #fffdf7; border: 1px solid var(--rule); border-radius: 4px; padding: 56px 64px; box-shadow: 0 1px 0 #fff inset, 0 30px 60px -30px rgba(50,40,20,0.18); }
        .welcome-eyebrow { font-family: "JetBrains Mono"; font-size: 11px; letter-spacing: 0.22em; text-transform: uppercase; color: var(--ink-muted); }
        .welcome-h1 { font-family: "Inter Tight"; font-weight: 800; font-size: clamp(38px, 5vw, 64px); line-height: 0.98; letter-spacing: -0.025em; margin: 12px 0 18px; }
        .welcome-h1 .grey { color: var(--ink-muted); font-weight: 700; display:block; font-size: 0.55em; letter-spacing: 0.04em; text-transform: uppercase; margin-bottom: 4px; }
        .welcome-lead { font-family: "Instrument Serif"; font-size: 24px; line-height: 1.35; color: var(--ink-soft); max-width: 640px; margin: 0 0 40px; }
        .welcome-lead em { font-style: italic; color: var(--ink); }
        .steps { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin: 8px 0 40px; }
        .step { padding: 24px; background: var(--paper-2); border: 1px solid var(--rule); border-radius: 2px; position: relative; }
        .step-num { font-family: "Instrument Serif"; font-style: italic; font-size: 56px; line-height: 1; color: var(--ink); }
        .step-title { font-weight: 700; margin: 10px 0 6px; font-size: 17px; }
        .step-desc { font-size: 14px; color: var(--ink-soft); line-height: 1.45; }
        .step-icon { position: absolute; top: 20px; right: 20px; width: 36px; height: 36px; }
        .anatomy { display: grid; grid-template-columns: 280px 1fr; gap: 36px; padding: 28px; background: #fffdf7; border: 1px solid var(--rule); border-radius: 2px; margin-bottom: 36px; align-items: center; }
        .anatomy-title { font-family: "JetBrains Mono"; font-size: 11px; letter-spacing: 0.22em; text-transform: uppercase; color: var(--ink-muted); margin-bottom: 12px; }
        .anatomy-points { list-style: none; padding: 0; margin: 0; display: grid; gap: 14px; }
        .anatomy-points li { font-size: 15px; color: var(--ink-soft); display: flex; gap: 12px; align-items: baseline; }
        .anatomy-points li strong { color: var(--ink); font-weight: 600; }
        .anatomy-points .tag { font-family: "JetBrains Mono"; font-size: 10px; letter-spacing: 0.1em; padding: 3px 6px; background: var(--paper-2); border: 1px solid var(--rule); color: var(--ink); }
        .start-btn { background: var(--ink); color: #fff; border: 0; padding: 18px 36px; font-size: 16px; font-weight: 600; letter-spacing: 0.02em; border-radius: 2px; transition: transform 0.15s, background 0.15s; }
        .start-btn:hover { background: #000; transform: translateY(-1px); }
        .welcome-footer { margin-top: 32px; display: flex; justify-content: space-between; align-items: center; gap: 24px; }
        .welcome-quote { font-family: "Instrument Serif"; font-style: italic; font-size: 16px; color: var(--ink-soft); max-width: 480px; text-align: right; }
      `), /* @__PURE__ */ React.createElement("div", { className: "welcome-card" }, /* @__PURE__ */ React.createElement("div", { className: "welcome-eyebrow" }, "Bienvenida \xB7 01"), /* @__PURE__ */ React.createElement("h1", { className: "welcome-h1" }, /* @__PURE__ */ React.createElement("span", { className: "grey" }, "Tracker"), "H\xE1bitos"), /* @__PURE__ */ React.createElement("p", { className: "welcome-lead" }, "Sigue tus h\xE1bitos durante ", /* @__PURE__ */ React.createElement("em", null, "31 d\xEDas"), ". Marca cada d\xEDa en ", /* @__PURE__ */ React.createElement("em", null, "verde"), " si lo cumpliste, en ", /* @__PURE__ */ React.createElement("em", null, "rojo"), " si no. Mira de un vistazo c\xF3mo evolucionas mientras tu rueda se llena."), /* @__PURE__ */ React.createElement("div", { className: "steps" }, /* @__PURE__ */ React.createElement("div", { className: "step" }, /* @__PURE__ */ React.createElement("svg", { className: "step-icon", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5" }, /* @__PURE__ */ React.createElement("path", { d: "M4 6h16M4 12h16M4 18h10" })), /* @__PURE__ */ React.createElement("div", { className: "step-num" }, "01"), /* @__PURE__ */ React.createElement("div", { className: "step-title" }, "Define tus h\xE1bitos"), /* @__PURE__ */ React.createElement("div", { className: "step-desc" }, "Hasta 9 h\xE1bitos. Pueden ser de salud, mente, dinero o lo que decidas cultivar este mes.")), /* @__PURE__ */ React.createElement("div", { className: "step" }, /* @__PURE__ */ React.createElement("svg", { className: "step-icon", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5" }, /* @__PURE__ */ React.createElement("circle", { cx: "12", cy: "12", r: "9" }), /* @__PURE__ */ React.createElement("path", { d: "M9 12l2 2 4-4" })), /* @__PURE__ */ React.createElement("div", { className: "step-num" }, "02"), /* @__PURE__ */ React.createElement("div", { className: "step-title" }, "Marca cada d\xEDa"), /* @__PURE__ */ React.createElement("div", { className: "step-desc" }, "Toca una celda y elige Cumplido o No hecho. Sin juicio, sin culpa: solo registro.")), /* @__PURE__ */ React.createElement("div", { className: "step" }, /* @__PURE__ */ React.createElement("svg", { className: "step-icon", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5" }, /* @__PURE__ */ React.createElement("circle", { cx: "12", cy: "12", r: "9" }), /* @__PURE__ */ React.createElement("circle", { cx: "12", cy: "12", r: "5" }), /* @__PURE__ */ React.createElement("circle", { cx: "12", cy: "12", r: "1.2", fill: "currentColor" })), /* @__PURE__ */ React.createElement("div", { className: "step-num" }, "03"), /* @__PURE__ */ React.createElement("div", { className: "step-title" }, "Mira la rueda llenarse"), /* @__PURE__ */ React.createElement("div", { className: "step-desc" }, "Tu mes entero, visible en una sola imagen. La constancia se vuelve geometr\xEDa."))), /* @__PURE__ */ React.createElement("div", { className: "anatomy" }, /* @__PURE__ */ React.createElement(AnatomyDiagram, null), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "anatomy-title" }, "C\xF3mo leer la rueda"), /* @__PURE__ */ React.createElement("ul", { className: "anatomy-points" }, /* @__PURE__ */ React.createElement("li", null, /* @__PURE__ */ React.createElement("span", { className: "tag" }, "CU\xD1A"), /* @__PURE__ */ React.createElement("span", null, "Cada ", /* @__PURE__ */ React.createElement("strong", null, "cu\xF1a radial"), " = un d\xEDa (del 1 al 31).")), /* @__PURE__ */ React.createElement("li", null, /* @__PURE__ */ React.createElement("span", { className: "tag" }, "ANILLO"), /* @__PURE__ */ React.createElement("span", null, "Cada ", /* @__PURE__ */ React.createElement("strong", null, "anillo conc\xE9ntrico"), " = un h\xE1bito distinto.")), /* @__PURE__ */ React.createElement("li", null, /* @__PURE__ */ React.createElement("span", { className: "tag" }, "CENTRO"), /* @__PURE__ */ React.createElement("span", null, "El ", /* @__PURE__ */ React.createElement("strong", null, "n\xFAcleo"), " resume tu mes: porcentaje y racha actual."))))), /* @__PURE__ */ React.createElement("div", { className: "welcome-footer" }, /* @__PURE__ */ React.createElement("button", { className: "start-btn", onClick: onStart }, "Empezar  \u2192"), /* @__PURE__ */ React.createElement("div", { className: "welcome-quote" }, '"Haz hoy lo que otros no est\xE1n dispuestos a hacer, para vivir ma\xF1ana como otros nunca podr\xE1n."'))));
}
function AnatomyDiagram() {
  return /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 280 220", style: { width: "100%", height: "auto" } }, /* @__PURE__ */ React.createElement("g", { transform: "translate(140 130)" }, [35, 55, 75, 95].map((r, i) => /* @__PURE__ */ React.createElement("circle", { key: i, cx: "0", cy: "0", r, fill: "none", stroke: "#9b9580", strokeWidth: "0.7" })), [-90, -75, -60, -45, -30, -15, 0].map((deg, i) => {
    const a = deg * Math.PI / 180;
    return /* @__PURE__ */ React.createElement("line", { key: i, x1: 35 * Math.cos(a), y1: 35 * Math.sin(a), x2: 95 * Math.cos(a), y2: 95 * Math.sin(a), stroke: "#9b9580", strokeWidth: "0.7" });
  }), /* @__PURE__ */ React.createElement("path", { d: "M 35,0 L 95,0 A 95,95 0 0,0 91.74,-24.58 L 33.80,-9.06 A 35,35 0 0,1 35,0 Z", fill: "oklch(0.62 0.13 145 / 0.5)", stroke: "#14130e", strokeWidth: "1" }), /* @__PURE__ */ React.createElement("circle", { cx: "0", cy: "0", r: "65", fill: "none", stroke: "oklch(0.55 0.17 28)", strokeWidth: "2", strokeDasharray: "3 3", opacity: "0.7" })), /* @__PURE__ */ React.createElement("g", { fontFamily: "JetBrains Mono", fontSize: "9", fill: "#14130e" }, /* @__PURE__ */ React.createElement("line", { x1: "260", y1: "80", x2: "225", y2: "105", stroke: "#14130e", strokeWidth: "0.5" }), /* @__PURE__ */ React.createElement("text", { x: "263", y: "78", textAnchor: "end" }, "CU\xD1A \xB7 1 D\xCDA"), /* @__PURE__ */ React.createElement("line", { x1: "20", y1: "170", x2: "65", y2: "170", stroke: "#14130e", strokeWidth: "0.5" }), /* @__PURE__ */ React.createElement("text", { x: "18", y: "173", textAnchor: "end" }, "ANILLO \xB7 1 H\xC1BITO"), /* @__PURE__ */ React.createElement("line", { x1: "180", y1: "200", x2: "148", y2: "155", stroke: "#14130e", strokeWidth: "0.5" }), /* @__PURE__ */ React.createElement("text", { x: "184", y: "203" }, "N\xDACLEO")));
}
const MONTH_NAMES_ES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
function formatMonthKey(mk) {
  if (!mk) return "";
  const [y, m] = mk.split("-").map(Number);
  return `${MONTH_NAMES_ES[m - 1]} ${y}`;
}
function SetupScreen({ initial, onCreate, onBack, monthKey, isInherited }) {
  const [habits, setHabits] = useState(() => {
    const arr = Array(9).fill("");
    (initial || []).forEach((h, i) => {
      if (i < 9) arr[i] = h || "";
    });
    return arr;
  });
  const filled = habits.filter((h) => h.trim().length > 0).length;
  const canCreate = filled >= 1;
  const setHabit = (i, v) => {
    const next = [...habits];
    next[i] = v;
    setHabits(next);
  };
  const SUGGESTIONS = [
    "Leer 20 min",
    "Caminar 30 min",
    "Meditar",
    "8 vasos de agua",
    "Dormir 7h+",
    "Sin az\xFAcar",
    "Escribir 1 p\xE1gina",
    "Estudiar idioma",
    "Sin pantallas en cama"
  ];
  return /* @__PURE__ */ React.createElement("div", { className: "setup" }, /* @__PURE__ */ React.createElement("style", null, `
        .setup { min-height: 100vh; padding: 48px 24px; display: grid; place-items: start center; }
        .setup-card { width: min(1080px, 100%); }
        .setup-head { display: flex; justify-content: space-between; align-items: end; margin-bottom: 32px; gap: 24px; }
        .setup-eyebrow { font-family: "JetBrains Mono"; font-size: 11px; letter-spacing: 0.22em; text-transform: uppercase; color: var(--ink-muted); }
        .setup-h1 { font-family: "Inter Tight"; font-weight: 800; font-size: clamp(32px, 4vw, 48px); letter-spacing: -0.02em; margin: 6px 0 0; line-height: 1; }
        .setup-h1 .grey { color: var(--ink-muted); font-weight: 700; font-size: 0.55em; letter-spacing: 0.04em; text-transform: uppercase; display:block; margin-bottom: 4px; }
        .setup-meta { text-align: right; font-family: "JetBrains Mono"; font-size: 12px; color: var(--ink-soft); }
        .setup-meta .big { font-family: "Instrument Serif"; font-style: italic; font-size: 38px; color: var(--ink); line-height: 1; }
        .setup-help { font-family: "Instrument Serif"; font-size: 20px; color: var(--ink-soft); margin: 0 0 28px; max-width: 720px; line-height: 1.4; }
        .habit-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
        .habit-field { background: #fffdf7; border: 1px solid var(--rule); border-radius: 2px; padding: 18px 18px 16px; display: flex; flex-direction: column; gap: 6px; transition: border-color 0.15s, background 0.15s; }
        .habit-field:focus-within { border-color: var(--ink); background: #fff; }
        .habit-label { display: flex; align-items: center; gap: 10px; font-family: "JetBrains Mono"; font-size: 11px; letter-spacing: 0.18em; color: var(--ink-muted); text-transform: uppercase; }
        .habit-dot { width: 10px; height: 10px; border-radius: 999px; border: 1px solid #fff; box-shadow: 0 0 0 1px var(--rule); }
        .habit-input { border: 0; background: transparent; outline: none; font-size: 17px; color: var(--ink); padding: 4px 0 2px; font-weight: 500; }
        .habit-input::placeholder { color: var(--ink-muted); font-weight: 400; font-style: italic; font-family: "Instrument Serif"; font-size: 18px; }
        .habit-meta { font-size: 11px; color: var(--ink-muted); font-family: "JetBrains Mono"; letter-spacing: 0.08em; }
        .setup-actions { margin-top: 36px; display: flex; justify-content: space-between; align-items: center; gap: 24px; }
        .ghost-btn { background: transparent; border: 1px solid var(--rule); color: var(--ink-soft); padding: 14px 22px; font-size: 14px; border-radius: 2px; }
        .ghost-btn:hover { border-color: var(--ink); color: var(--ink); }
        .primary-btn { background: var(--ink); color: #fff; border: 0; padding: 16px 32px; font-size: 15px; font-weight: 600; letter-spacing: 0.02em; border-radius: 2px; transition: opacity 0.15s, transform 0.15s; }
        .primary-btn:disabled { opacity: 0.35; cursor: not-allowed; }
        .primary-btn:not(:disabled):hover { transform: translateY(-1px); }
        .inherit-note { display: flex; gap: 10px; align-items: flex-start; padding: 12px 14px; background: oklch(0.93 0.04 80); border: 1px solid oklch(0.78 0.08 80); border-radius: 2px; margin-top: 16px; max-width: 720px; font-size: 13.5px; color: var(--accent); line-height: 1.5; }
        .inherit-note svg { flex-shrink: 0; margin-top: 2px; }
        .inherit-note strong { color: var(--ink); font-weight: 600; }
      `), /* @__PURE__ */ React.createElement("div", { className: "setup-card" }, /* @__PURE__ */ React.createElement("div", { className: "setup-head" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "setup-eyebrow" }, "H\xE1bitos del mes \xB7 ", formatMonthKey(monthKey)), /* @__PURE__ */ React.createElement("h1", { className: "setup-h1" }, /* @__PURE__ */ React.createElement("span", { className: "grey" }, "Define"), "Tus 9 h\xE1bitos"), /* @__PURE__ */ React.createElement("p", { className: "setup-help" }, "El anillo interior es el h\xE1bito 1, el exterior es el 9. Llena los que quieras seguir ", /* @__PURE__ */ React.createElement("strong", null, "este mes"), " \u2014 cada mes guarda su propia lista, no afecta a otros meses."), isInherited && /* @__PURE__ */ React.createElement("div", { className: "inherit-note" }, /* @__PURE__ */ React.createElement("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2" }, /* @__PURE__ */ React.createElement("path", { d: "M3 12a9 9 0 1018 0 9 9 0 00-18 0" }), /* @__PURE__ */ React.createElement("path", { d: "M12 8v4l3 2" })), /* @__PURE__ */ React.createElement("span", null, "Estos h\xE1bitos los heredamos del mes anterior como punto de partida. ", /* @__PURE__ */ React.createElement("strong", null, "Si los cambias, s\xF3lo se actualizan para ", formatMonthKey(monthKey)), "."))), /* @__PURE__ */ React.createElement("div", { className: "setup-meta" }, /* @__PURE__ */ React.createElement("div", { className: "big" }, filled, /* @__PURE__ */ React.createElement("span", { style: { color: "var(--ink-muted)" } }, "/9")), /* @__PURE__ */ React.createElement("div", null, "h\xE1bitos definidos"))), /* @__PURE__ */ React.createElement("div", { className: "habit-grid" }, habits.map((h, i) => /* @__PURE__ */ React.createElement("label", { key: i, className: "habit-field" }, /* @__PURE__ */ React.createElement("div", { className: "habit-label" }, /* @__PURE__ */ React.createElement("span", { className: "habit-dot", style: { background: window.RING_TINTS[i] } }), /* @__PURE__ */ React.createElement("span", null, "H\xE1bito ", String(i + 1).padStart(2, "0")), /* @__PURE__ */ React.createElement("span", { style: { marginLeft: "auto", color: i === 0 ? "var(--ink)" : "var(--ink-muted)" } }, i === 0 ? "requerido" : "opcional")), /* @__PURE__ */ React.createElement(
    "input",
    {
      className: "habit-input",
      type: "text",
      value: h,
      maxLength: 40,
      placeholder: SUGGESTIONS[i],
      onChange: (e) => setHabit(i, e.target.value)
    }
  ), /* @__PURE__ */ React.createElement("div", { className: "habit-meta" }, "Anillo ", i === 0 ? "interior" : i === 8 ? "exterior" : `n\xBA${i + 1}`, " \xB7 ", h.length, "/40")))), /* @__PURE__ */ React.createElement("div", { className: "setup-actions" }, /* @__PURE__ */ React.createElement("button", { className: "ghost-btn", onClick: onBack }, "\u2190 Volver"), /* @__PURE__ */ React.createElement(
    "button",
    {
      className: "primary-btn",
      disabled: !canCreate,
      onClick: () => onCreate(habits.map((h) => h.trim()))
    },
    "Crear mi rueda  \u2192"
  ))));
}
window.WelcomeScreen = WelcomeScreen;
window.SetupScreen = SetupScreen;
const STORAGE_KEY = "tracker_habitos_v1";
const MONTH_NAMES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre"
];
function daysInMonth(year, month0) {
  return new Date(year, month0 + 1, 0).getDate();
}
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}
function saveState(s) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch (e) {
  }
}
function defaultState() {
  const now = /* @__PURE__ */ new Date();
  const mk = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  return {
    onboarded: false,
    // habits are now per-month
    habitsByMonth: {},
    // monthKey -> [9 strings]
    // marks keyed by `${monthKey}|${habitIdx}_${day}` → "done" | "miss"
    marks: {},
    // observations keyed by monthKey
    observations: {},
    currentMonth: mk
  };
}
function migrate(s) {
  if (!s) return s;
  if (s.habitsByMonth) return s;
  const out = __spreadProps(__spreadValues({}, s), { habitsByMonth: {} });
  if (Array.isArray(s.habits) && s.currentMonth) {
    out.habitsByMonth[s.currentMonth] = [...s.habits];
  }
  delete out.habits;
  return out;
}
function habitsForMonth(habitsByMonth, monthKey) {
  if (habitsByMonth[monthKey]) return habitsByMonth[monthKey];
  const keys = Object.keys(habitsByMonth).filter((k) => k !== monthKey).sort();
  if (!keys.length) return ["", "", "", "", "", "", "", "", ""];
  const prev = keys.filter((k) => k < monthKey);
  const src = prev.length ? prev[prev.length - 1] : keys[keys.length - 1];
  return [...habitsByMonth[src]];
}
function App() {
  const [state, setState] = useState(() => migrate(loadState()) || defaultState());
  const [screen, setScreen] = useState(() => {
    const s = migrate(loadState());
    if (!s) return "welcome";
    if (!s.onboarded) return "welcome";
    const anyHabits = s.habitsByMonth && Object.values(s.habitsByMonth).some(
      (arr) => arr.some((h) => h && h.trim())
    );
    if (!anyHabits) return "setup";
    return "main";
  });
  useEffect(() => {
    saveState(state);
  }, [state]);
  if (screen === "welcome") {
    return /* @__PURE__ */ React.createElement(WelcomeScreen, { onStart: () => {
      setState((s) => __spreadProps(__spreadValues({}, s), { onboarded: true }));
      setScreen("setup");
    } });
  }
  if (screen === "setup") {
    const targetMonth = state.currentMonth;
    const initialHabits = habitsForMonth(state.habitsByMonth, targetMonth);
    return /* @__PURE__ */ React.createElement(
      SetupScreen,
      {
        monthKey: targetMonth,
        initial: initialHabits,
        isInherited: !state.habitsByMonth[targetMonth] && Object.keys(state.habitsByMonth).length > 0,
        onBack: () => setScreen(Object.keys(state.habitsByMonth).length ? "main" : "welcome"),
        onCreate: (habits) => {
          setState((s) => __spreadProps(__spreadValues({}, s), {
            habitsByMonth: __spreadProps(__spreadValues({}, s.habitsByMonth), { [targetMonth]: habits })
          }));
          setScreen("main");
        }
      }
    );
  }
  return /* @__PURE__ */ React.createElement(
    MainScreen,
    {
      state,
      setState,
      onEditHabits: () => setScreen("setup"),
      onChangeMonth: (newKey) => setState((s) => __spreadProps(__spreadValues({}, s), { currentMonth: newKey })),
      onReset: () => {
        if (confirm("\xBFBorrar TODO (h\xE1bitos, marcas, observaciones)? Esta acci\xF3n no se puede deshacer.")) {
          const fresh = defaultState();
          setState(fresh);
          setScreen("welcome");
        }
      }
    }
  );
}
function MainScreen({ state, setState, onEditHabits, onChangeMonth, onReset }) {
  const monthKey = state.currentMonth;
  const [year, month0] = useMemo(() => {
    const [y, m] = monthKey.split("-").map(Number);
    return [y, m - 1];
  }, [monthKey]);
  const dim = daysInMonth(year, month0);
  const habits = useMemo(
    () => habitsForMonth(state.habitsByMonth, monthKey),
    [state.habitsByMonth, monthKey]
  );
  const isInherited = !state.habitsByMonth[monthKey] && Object.keys(state.habitsByMonth).length > 0;
  const marks = useMemo(() => {
    const out = {};
    const pref = monthKey + "|";
    Object.entries(state.marks).forEach(([k, v]) => {
      if (k.startsWith(pref)) out[k.slice(pref.length)] = v;
    });
    return out;
  }, [state.marks, monthKey]);
  const observations = state.observations[monthKey] || "";
  const setObservations = (v) => {
    setState((s) => __spreadProps(__spreadValues({}, s), { observations: __spreadProps(__spreadValues({}, s.observations), { [monthKey]: v }) }));
  };
  const [hoveredDay, setHoveredDay] = useState(null);
  const [popover, setPopover] = useState(null);
  const wheelHostRef = useRef(null);
  const today = /* @__PURE__ */ new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month0;
  const todayDay = isCurrentMonth ? today.getDate() : -1;
  const onCellClick = (h, d, evt) => {
    const rect = wheelHostRef.current.getBoundingClientRect();
    const x = evt.clientX - rect.left;
    const y = evt.clientY - rect.top;
    setPopover({ h, d, x, y });
  };
  const applyMark = (h, d, val) => {
    const key = `${monthKey}|${h}_${d}`;
    setState((s) => {
      const next = __spreadValues({}, s.marks);
      if (val === null) delete next[key];
      else next[key] = val;
      const habitsByMonth = s.habitsByMonth[monthKey] ? s.habitsByMonth : __spreadProps(__spreadValues({}, s.habitsByMonth), { [monthKey]: [...habits] });
      return __spreadProps(__spreadValues({}, s), { marks: next, habitsByMonth });
    });
    setPopover(null);
  };
  const activeHabits = habits.map((h, i) => h && h.trim() ? i : -1).filter((i) => i >= 0);
  const totalCells = activeHabits.length * dim;
  const doneCount = Object.values(marks).filter((v) => v === "done").length;
  const missCount = Object.values(marks).filter((v) => v === "miss").length;
  const pct = totalCells > 0 ? Math.round(doneCount / totalCells * 100) : 0;
  const streak = useMemo(() => {
    if (activeHabits.length === 0) return 0;
    let startDay = isCurrentMonth ? todayDay : dim;
    let s = 0;
    for (let d = startDay; d >= 1; d--) {
      const allDone = activeHabits.every((h) => marks[`${h}_${d}`] === "done");
      if (allDone) s++;
      else if (s > 0) break;
      else continue;
    }
    return s;
  }, [marks, activeHabits, todayDay, isCurrentMonth, dim]);
  const dayInfo = (d) => {
    if (!d) return null;
    const done = activeHabits.filter((h) => marks[`${h}_${d}`] === "done").length;
    const miss = activeHabits.filter((h) => marks[`${h}_${d}`] === "miss").length;
    return { done, miss, total: activeHabits.length };
  };
  const formatDate = (d) => `${String(d).padStart(2, "0")} \xB7 ${MONTH_NAMES[month0]} ${year}`;
  const print = () => window.print();
  const navMonth = (delta) => {
    const date = new Date(year, month0 + delta, 1);
    const newKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    onChangeMonth(newKey);
  };
  useEffect(() => {
    if (!popover) return;
    const onDoc = (e) => {
      if (e.target.closest(".cell-popover")) return;
      if (e.target.closest("path.wheel-cell")) return;
      setPopover(null);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [popover]);
  return /* @__PURE__ */ React.createElement("div", { className: "main" }, /* @__PURE__ */ React.createElement("style", null, `
        .main { min-height: 100vh; padding: 24px 28px 80px; max-width: 1680px; margin: 0 auto; }
        .topbar { display: flex; align-items: center; gap: 16px; justify-content: space-between; padding-bottom: 16px; border-bottom: 1px solid var(--rule); }
        .brand { display: flex; align-items: baseline; gap: 12px; }
        .brand-eyebrow { font-family: "JetBrains Mono"; font-size: 11px; letter-spacing: 0.22em; color: var(--ink-muted); text-transform: uppercase; }
        .brand-mark { font-family: "Instrument Serif"; font-style: italic; font-size: 26px; color: var(--ink); }
        .month-nav { display: flex; align-items: center; gap: 8px; background: #fffdf7; border: 1px solid var(--rule); padding: 4px; border-radius: 2px; }
        .month-nav button { background: transparent; border: 0; padding: 8px 12px; color: var(--ink-soft); border-radius: 2px; }
        .month-nav button:hover { background: var(--paper-2); color: var(--ink); }
        .month-nav .label { padding: 4px 14px; font-weight: 600; font-size: 14px; min-width: 160px; text-align: center; }
        .month-nav .label .y { color: var(--ink-muted); font-weight: 400; margin-left: 6px; font-family: "JetBrains Mono"; font-size: 12px;}
        .top-actions { display: flex; gap: 8px; }
        .top-actions button { background: transparent; border: 1px solid var(--rule); padding: 9px 14px; font-size: 13px; color: var(--ink-soft); border-radius: 2px; display: inline-flex; align-items: center; gap: 6px; }
        .top-actions button:hover { border-color: var(--ink); color: var(--ink); background: #fffdf7; }
        .top-actions button.danger:hover { border-color: var(--miss); color: var(--miss); }

        .hero-title { text-align: center; margin: 36px 0 8px; }
        .hero-title .eyebrow { font-family: "JetBrains Mono"; font-size: 11px; letter-spacing: 0.3em; color: var(--ink-muted); text-transform: uppercase; }
        .hero-title h1 { font-family: "Inter Tight"; font-weight: 800; font-size: clamp(40px, 5.5vw, 76px); letter-spacing: -0.025em; margin: 6px 0 0; line-height: 0.95; color: var(--ink); }
        .hero-title h1 .italic { font-family: "Instrument Serif"; font-style: italic; font-weight: 400; color: var(--ink); letter-spacing: -0.01em; }

        .stage { display: grid; grid-template-columns: 280px 1fr 320px; gap: 32px; margin-top: 24px; align-items: start; }
        @media (max-width: 1280px) { .stage { grid-template-columns: 240px 1fr 280px; gap: 20px; } }
        @media (max-width: 1024px) { .stage { grid-template-columns: 1fr; } }

        /* LEFT \u2014 Legend */
        .legend { background: #fffdf7; border: 1px solid var(--rule); border-radius: 2px; padding: 22px 22px 16px; }
        .legend-title { font-family: "JetBrains Mono"; font-size: 10px; letter-spacing: 0.22em; color: var(--ink-muted); text-transform: uppercase; margin-bottom: 14px; display: flex; justify-content: space-between;}
        .legend-list { list-style: none; padding: 0; margin: 0; display: grid; gap: 8px; }
        .legend-item { display: grid; grid-template-columns: 20px 1fr auto; gap: 10px; align-items: center; padding: 6px 0; border-bottom: 1px dashed var(--rule-soft); font-size: 13px; }
        .legend-item:last-child { border-bottom: 0; }
        .legend-item.inactive { opacity: 0.35; }
        .ring-no { font-family: "Instrument Serif"; font-style: italic; font-size: 18px; line-height: 1; text-align: center; color: var(--ink); }
        .ring-dot { width: 9px; height: 9px; border-radius: 999px; display: inline-block; margin-right: 6px; vertical-align: middle; box-shadow: 0 0 0 1px var(--rule); }
        .legend-name { color: var(--ink); font-weight: 500; }
        .legend-name.placeholder { color: var(--ink-muted); font-style: italic; font-family: "Instrument Serif"; font-size: 14px; font-weight: 400; }
        .legend-prog { font-family: "JetBrains Mono"; font-size: 10.5px; color: var(--ink-soft); letter-spacing: 0.04em;}
        .legend-state { display: flex; gap: 12px; padding-top: 14px; margin-top: 14px; border-top: 1px solid var(--rule); font-size: 12px; color: var(--ink-soft); align-items: center; }
        .swatch { width: 12px; height: 12px; border-radius: 2px; border: 1px solid rgba(0,0,0,0.08); }
        .swatch.done { background: var(--done); }
        .swatch.miss { background: var(--miss); }
        .legend-inherit { display: flex; gap: 8px; align-items: center; padding: 8px 10px; background: oklch(0.94 0.03 80); border: 1px solid oklch(0.82 0.06 80); border-radius: 2px; margin-bottom: 14px; font-size: 11px; color: var(--accent); cursor: pointer; line-height: 1.35; }
        .legend-inherit:hover { background: oklch(0.92 0.04 80); }
        .legend-inherit u { color: var(--ink); }

        /* CENTER \u2014 Wheel */
        .wheel-host { position: relative; aspect-ratio: 1 / 1; }
        .wheel-svg { display: block; }
        .center-info { position: absolute; inset: 0; display: grid; place-items: center; pointer-events: none; }
        .center-card { width: 28.5%; aspect-ratio: 1; border-radius: 50%; background: radial-gradient(ellipse at center, #fffdf7 60%, #f8f3e6 100%); border: 1px solid var(--rule); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; padding: 8px; text-align: center; box-shadow: 0 1px 0 #fff inset, 0 6px 18px -8px rgba(50,40,20,0.18); }
        .center-pct { font-family: "Inter Tight"; font-size: clamp(32px, 3.6vw, 54px); font-weight: 800; line-height: 0.9; letter-spacing: -0.04em; color: var(--ink); display: inline-flex; align-items: baseline; }
        .center-pct .unit { font-family: "Instrument Serif"; font-style: italic; font-weight: 400; color: var(--ink-soft); font-size: 0.45em; margin-left: 2px; }
        .center-label { font-family: "JetBrains Mono"; font-size: 8.5px; letter-spacing: 0.22em; color: var(--ink-muted); text-transform: uppercase; white-space: nowrap; }
        .center-divider { width: 28px; height: 1px; background: var(--rule); margin: 6px 0 4px; }
        .center-streak { display: flex; align-items: baseline; gap: 4px; }
        .center-streak .num { font-family: "Instrument Serif"; font-style: italic; font-size: clamp(20px, 2.2vw, 28px); line-height: 1; color: var(--ink); font-weight: 500; }
        .center-streak .lbl { font-size: 10px; color: var(--ink-soft); white-space: nowrap; font-family: "JetBrains Mono"; letter-spacing: 0.08em; text-transform: uppercase; }

        /* Hover info overlay */
        .hover-info { position: absolute; top: 6px; left: 50%; transform: translateX(-50%); background: var(--ink); color: #fff; padding: 8px 14px; border-radius: 2px; font-size: 12px; display: flex; align-items: center; gap: 12px; pointer-events: none; opacity: 0; transition: opacity 0.15s; z-index: 5;}
        .hover-info.show { opacity: 1; }
        .hover-info .date { font-family: "JetBrains Mono"; letter-spacing: 0.08em; }
        .hover-info .pill { background: rgba(255,255,255,0.15); padding: 2px 8px; border-radius: 999px; font-family: "JetBrains Mono"; letter-spacing: 0.04em; font-size: 11px; }
        .hover-info .pill.green { color: oklch(0.85 0.13 145); }
        .hover-info .pill.red { color: oklch(0.78 0.13 28); }

        /* Cell popover */
        .cell-popover { position: absolute; background: var(--ink); color: #fff; padding: 6px; border-radius: 4px; display: flex; gap: 4px; box-shadow: 0 10px 30px -8px rgba(0,0,0,0.4); transform: translate(-50%, -130%); z-index: 10; animation: pop-in 0.16s ease-out; }
        @keyframes pop-in { from { opacity: 0; transform: translate(-50%, -120%) scale(0.92); } to { opacity: 1; transform: translate(-50%, -130%) scale(1); } }
        .cell-popover::after { content: ""; position: absolute; bottom: -5px; left: 50%; transform: translateX(-50%) rotate(45deg); width: 10px; height: 10px; background: var(--ink); }
        .cell-popover-meta { padding: 6px 10px 4px; font-family: "JetBrains Mono"; font-size: 10px; letter-spacing: 0.12em; color: rgba(255,255,255,0.55); text-transform: uppercase; border-bottom: 1px solid rgba(255,255,255,0.1); display: block; width: 100%; text-align: center; }
        .cell-popover-row { display: flex; gap: 4px; }
        .pop-btn { background: transparent; border: 0; padding: 9px 14px; font-size: 13px; color: #fff; border-radius: 2px; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; transition: background 0.12s; }
        .pop-btn:hover { background: rgba(255,255,255,0.1); }
        .pop-btn.done { color: oklch(0.85 0.15 145); }
        .pop-btn.miss { color: oklch(0.82 0.17 28); }
        .pop-btn.clear { color: var(--ink-muted); font-size: 11px; padding: 9px 10px; }
        .pop-dot { width: 10px; height: 10px; border-radius: 999px; }
        .pop-dot.done { background: var(--done); }
        .pop-dot.miss { background: var(--miss); }

        /* RIGHT \u2014 Observations + extras */
        .side-stack { display: grid; gap: 14px; }
        .panel { background: #fffdf7; border: 1px solid var(--rule); border-radius: 2px; padding: 22px; }
        .panel-head { display:flex; justify-content: space-between; align-items: baseline; margin-bottom: 12px; }
        .panel-title { font-family: "Inter Tight"; font-weight: 700; font-size: 18px; letter-spacing: -0.01em; }
        .panel-meta { font-family: "JetBrains Mono"; font-size: 10px; letter-spacing: 0.18em; color: var(--ink-muted); text-transform: uppercase; }
        .obs-textarea { width: 100%; min-height: 280px; border: 0; background: transparent; resize: vertical; outline: none; font-family: "Instrument Serif"; font-size: 17px; line-height: 28px; color: var(--ink); background-image: repeating-linear-gradient(to bottom, transparent 0 27px, var(--rule-soft) 27px 28px); padding: 0 2px; }
        .obs-textarea::placeholder { color: var(--ink-muted); font-style: italic; }

        .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .stat-cell { background: var(--paper-2); border: 1px solid var(--rule-soft); padding: 12px 14px; border-radius: 2px; }
        .stat-num { font-family: "Instrument Serif"; font-style: italic; font-size: 28px; line-height: 1; color: var(--ink); font-weight: 500; }
        .stat-num .small { font-size: 14px; color: var(--ink-muted); font-style: normal; font-family: "JetBrains Mono"; }
        .stat-lbl { font-family: "JetBrains Mono"; font-size: 9.5px; letter-spacing: 0.18em; color: var(--ink-muted); text-transform: uppercase; margin-top: 6px; }

        /* Bottom motivational quote */
        .motiv { text-align: center; margin-top: 56px; font-family: "Instrument Serif"; font-style: italic; font-size: clamp(18px, 2vw, 22px); color: var(--ink-soft); padding: 0 20px; line-height: 1.4; max-width: 920px; margin-left: auto; margin-right: auto; }
        .motiv::before, .motiv::after { content: "\u2014"; margin: 0 12px; color: var(--ink-muted); font-style: normal; }

        /* Wheel hover: column highlight handled via per-cell stroke */
        path.wheel-cell.sel { filter: drop-shadow(0 0 0 var(--ink)); }
        path.wheel-cell-done.sel, path.wheel-cell-miss.sel { transform: scale(1.015); }

        @media print {
          .topbar, .top-actions, .month-nav, .side-stack, .legend, .center-info, .hero-title .eyebrow { display: none !important; }
          .stage { grid-template-columns: 1fr; }
          .hero-title h1 { color: #000; }
          .motiv { color: #000; }
          .wheel-host { max-width: 800px; margin: 0 auto; }
        }
      `), /* @__PURE__ */ React.createElement("div", { className: "topbar no-print" }, /* @__PURE__ */ React.createElement("div", { className: "brand" }, /* @__PURE__ */ React.createElement("span", { className: "brand-eyebrow" }, "Mes en curso"), /* @__PURE__ */ React.createElement("span", { className: "brand-mark" }, MONTH_NAMES[month0], " ", year)), /* @__PURE__ */ React.createElement("div", { className: "month-nav" }, /* @__PURE__ */ React.createElement("button", { onClick: () => navMonth(-1), "aria-label": "Mes anterior" }, "\u2039"), /* @__PURE__ */ React.createElement("span", { className: "label" }, MONTH_NAMES[month0], /* @__PURE__ */ React.createElement("span", { className: "y" }, year)), /* @__PURE__ */ React.createElement("button", { onClick: () => navMonth(1), "aria-label": "Mes siguiente" }, "\u203A")), /* @__PURE__ */ React.createElement("div", { className: "top-actions" }, /* @__PURE__ */ React.createElement("button", { onClick: onEditHabits }, /* @__PURE__ */ React.createElement("svg", { width: "13", height: "13", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2" }, /* @__PURE__ */ React.createElement("path", { d: "M12 20h9M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z" })), "Editar h\xE1bitos"), /* @__PURE__ */ React.createElement("button", { onClick: print }, /* @__PURE__ */ React.createElement("svg", { width: "13", height: "13", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2" }, /* @__PURE__ */ React.createElement("path", { d: "M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z" })), "Imprimir"), /* @__PURE__ */ React.createElement("button", { className: "danger", onClick: onReset }, "Reiniciar"))), /* @__PURE__ */ React.createElement("div", { className: "hero-title" }, /* @__PURE__ */ React.createElement("div", { className: "eyebrow no-print" }, "Planificaci\xF3n \xB7 ", dim, " d\xEDas"), /* @__PURE__ */ React.createElement("h1", null, "Tracker ", /* @__PURE__ */ React.createElement("span", { className: "italic" }, "H\xE1bitos"))), /* @__PURE__ */ React.createElement("div", { className: "stage" }, /* @__PURE__ */ React.createElement("div", { className: "legend no-print" }, /* @__PURE__ */ React.createElement("div", { className: "legend-title" }, /* @__PURE__ */ React.createElement("span", null, "Leyenda"), /* @__PURE__ */ React.createElement("span", null, activeHabits.length, " activos")), isInherited && /* @__PURE__ */ React.createElement("div", { className: "legend-inherit", onClick: onEditHabits, role: "button", title: "Personalizar h\xE1bitos para este mes" }, /* @__PURE__ */ React.createElement("span", null, "Heredados del mes anterior. ", /* @__PURE__ */ React.createElement("u", null, "Editar para ", MONTH_NAMES[month0]))), /* @__PURE__ */ React.createElement("ul", { className: "legend-list" }, habits.map((h, i) => {
    const active = !!(h && h.trim());
    const habitDone = activeHabits.includes(i) ? Object.entries(marks).filter(([k, v]) => v === "done" && k.startsWith(`${i}_`)).length : 0;
    return /* @__PURE__ */ React.createElement("li", { key: i, className: "legend-item" + (active ? "" : " inactive") }, /* @__PURE__ */ React.createElement("span", { className: "ring-no" }, i + 1), /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("span", { className: "ring-dot", style: { background: window.RING_TINTS[i] } }), /* @__PURE__ */ React.createElement("span", { className: "legend-name" + (active ? "" : " placeholder") }, active ? h : "\u2014")), /* @__PURE__ */ React.createElement("span", { className: "legend-prog" }, active ? `${habitDone}/${dim}` : "\u2014"));
  })), /* @__PURE__ */ React.createElement("div", { className: "legend-state" }, /* @__PURE__ */ React.createElement("span", { style: { display: "flex", alignItems: "center", gap: 6 } }, /* @__PURE__ */ React.createElement("span", { className: "swatch done" }), "Cumplido"), /* @__PURE__ */ React.createElement("span", { style: { display: "flex", alignItems: "center", gap: 6 } }, /* @__PURE__ */ React.createElement("span", { className: "swatch miss" }), "No hecho"))), /* @__PURE__ */ React.createElement("div", { className: "wheel-host", ref: wheelHostRef }, /* @__PURE__ */ React.createElement("div", { className: "hover-info no-print" + (hoveredDay ? " show" : "") }, hoveredDay && (() => {
    const info = dayInfo(hoveredDay);
    return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("span", { className: "date" }, formatDate(hoveredDay)), /* @__PURE__ */ React.createElement("span", { className: "pill green" }, "\u25CF ", info.done, " cumplidos"), /* @__PURE__ */ React.createElement("span", { className: "pill red" }, "\u25CF ", info.miss, " no hechos"), /* @__PURE__ */ React.createElement("span", { style: { color: "rgba(255,255,255,0.5)", fontSize: 11 } }, info.total - info.done - info.miss, " sin marcar"));
  })()), /* @__PURE__ */ React.createElement(
    Wheel,
    {
      habits,
      marks,
      todayDay,
      hoveredDay,
      selectedCell: popover ? `${popover.h}_${popover.d}` : null,
      onCellClick,
      onCellHover: setHoveredDay
    }
  ), /* @__PURE__ */ React.createElement("div", { className: "center-info" }, /* @__PURE__ */ React.createElement("div", { className: "center-card" }, /* @__PURE__ */ React.createElement("div", { className: "center-label" }, "Completado"), /* @__PURE__ */ React.createElement("div", { className: "center-pct" }, pct, /* @__PURE__ */ React.createElement("span", { className: "unit" }, "%")), /* @__PURE__ */ React.createElement("div", { className: "center-divider" }), /* @__PURE__ */ React.createElement("div", { className: "center-streak" }, /* @__PURE__ */ React.createElement("span", { className: "num" }, streak), /* @__PURE__ */ React.createElement("span", { className: "lbl" }, streak === 1 ? "d\xEDa" : "d\xEDas", " racha")))), popover && (() => {
    const habitName = habits[popover.h] || `H\xE1bito ${popover.h + 1}`;
    const cellKey = `${popover.h}_${popover.d}`;
    const currentMark = marks[cellKey];
    return /* @__PURE__ */ React.createElement("div", { className: "cell-popover no-print", style: { left: popover.x, top: popover.y } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "cell-popover-meta" }, "D\xEDa ", String(popover.d).padStart(2, "0"), " \xB7 ", habitName.length > 22 ? habitName.slice(0, 22) + "\u2026" : habitName), /* @__PURE__ */ React.createElement("div", { className: "cell-popover-row" }, /* @__PURE__ */ React.createElement("button", { className: "pop-btn done", onClick: () => applyMark(popover.h, popover.d, "done") }, /* @__PURE__ */ React.createElement("span", { className: "pop-dot done" }), "Cumplido"), /* @__PURE__ */ React.createElement("button", { className: "pop-btn miss", onClick: () => applyMark(popover.h, popover.d, "miss") }, /* @__PURE__ */ React.createElement("span", { className: "pop-dot miss" }), "No hecho"), currentMark && /* @__PURE__ */ React.createElement("button", { className: "pop-btn clear", onClick: () => applyMark(popover.h, popover.d, null) }, "Limpiar"))));
  })()), /* @__PURE__ */ React.createElement("div", { className: "side-stack no-print" }, /* @__PURE__ */ React.createElement("div", { className: "panel" }, /* @__PURE__ */ React.createElement("div", { className: "panel-head" }, /* @__PURE__ */ React.createElement("span", { className: "panel-title" }, "Resumen"), /* @__PURE__ */ React.createElement("span", { className: "panel-meta" }, MONTH_NAMES[month0].slice(0, 3), " \xB7 ", year)), /* @__PURE__ */ React.createElement("div", { className: "stats-grid" }, /* @__PURE__ */ React.createElement("div", { className: "stat-cell" }, /* @__PURE__ */ React.createElement("div", { className: "stat-num" }, doneCount, /* @__PURE__ */ React.createElement("span", { className: "small" }, "/", totalCells)), /* @__PURE__ */ React.createElement("div", { className: "stat-lbl" }, "Cumplidos")), /* @__PURE__ */ React.createElement("div", { className: "stat-cell" }, /* @__PURE__ */ React.createElement("div", { className: "stat-num" }, missCount), /* @__PURE__ */ React.createElement("div", { className: "stat-lbl" }, "No hechos")), /* @__PURE__ */ React.createElement("div", { className: "stat-cell" }, /* @__PURE__ */ React.createElement("div", { className: "stat-num" }, streak), /* @__PURE__ */ React.createElement("div", { className: "stat-lbl" }, "Racha actual")), /* @__PURE__ */ React.createElement("div", { className: "stat-cell" }, /* @__PURE__ */ React.createElement("div", { className: "stat-num" }, activeHabits.length, /* @__PURE__ */ React.createElement("span", { className: "small" }, "/9")), /* @__PURE__ */ React.createElement("div", { className: "stat-lbl" }, "H\xE1bitos activos")))), /* @__PURE__ */ React.createElement("div", { className: "panel" }, /* @__PURE__ */ React.createElement("div", { className: "panel-head" }, /* @__PURE__ */ React.createElement("span", { className: "panel-title" }, "Observaciones"), /* @__PURE__ */ React.createElement("span", { className: "panel-meta" }, "notas del mes")), /* @__PURE__ */ React.createElement(
    "textarea",
    {
      className: "obs-textarea",
      value: observations,
      onChange: (e) => setObservations(e.target.value),
      placeholder: "Qu\xE9 aprend\xED este mes\u2026"
    }
  )))), /* @__PURE__ */ React.createElement("div", { className: "motiv" }, "Haz hoy lo que otros no est\xE1n dispuestos a hacer, para vivir ma\xF1ana como otros nunca podr\xE1n."));
}
ReactDOM.createRoot(document.getElementById("root")).render(/* @__PURE__ */ React.createElement(App, null));
