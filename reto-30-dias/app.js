/* ============================================================
   RETO DE 30 DÍAS — Zonga Elements
   Define tus tareas, cúmplelas 30 días seguidos. Si fallas,
   vuelves al día 1. Los comodines los juzga un motor de reglas
   determinista que lee las horas que escribes.

   Estructura del archivo:
   1. Constantes y reglas del motor
   2. Utilidades
   3. Motor de evaluación de comodines
   4. Estado y persistencia
   5. Render de vistas
   6. Acciones (sellar día, comodín, reinicio…)
   7. Efectos (sonido, confeti, vibración de pantalla)
   ============================================================ */
(function () {
  'use strict';

  /* ============================================================
     1. CONSTANTES Y REGLAS DEL MOTOR
     ============================================================ */

  var STORE_KEY = 'reto30:data';

  var RULES = {
    MIN_FREE_MIN: 180,        // hueco libre que invalida el comodín (3 h)
    DEFAULT_WAKE: 8 * 60,     // hora de despertar por defecto
    DEFAULT_SLEEP: 23 * 60,   // límite del día si no hay hora en las tareas
    ALL_DAY: ['todo el dia','todo el rato','sin parar','sin descanso','ni un momento','ni un hueco','sin un momento','no ha habido ni','de sol a sol','todo el tiempo','no he tenido tiempo libre','sin poder parar','todas las horas'],
    INVOLUNTARY: ['enferm','fiebre','gripe','vomit','mareo','migrana','dolor','urgencia','hospital','medico','ambulancia','accidente','muerte','falleci','funeral','velatorio','imprevisto','emergencia','averia','se alargo','se quedo mas','sin avisar','me llamaron','apagon','tormenta','inundacion','robo','policia','se puso mal','tuve que cuidar','ingres'],
    TASK_EXTRA: ['trabaj','anunci','gimnasio','entren','estudi'],
    STOPWORDS: ['para','como','todos','todas','desde','hasta','sobre','antes','despues','menos','cada','este','esta','porque','muy','mas','del','los','las','una','unos','con','sin','que','por','mis','tus'],
    CATEGORIES: [
      { key: 'salud',      label: 'Salud',      color: 'var(--bad)',    words: ['enferm','fiebre','gripe','vomit','mareo','dolor','hospital','medico','urgencia','ambulancia','migrana','ingres','se puso mal'] },
      { key: 'relacion',   label: 'Relación',   color: 'var(--wild)',   words: ['novia','novio','pareja','mujer','marido','familia','madre','padre','hermano','hermana','hijo','hija','amigo','amiga','cumpleanos','boda','cena con'] },
      { key: 'imprevisto', label: 'Imprevisto', color: 'var(--accent)', words: ['imprevisto','averia','accidente','se alargo','sin avisar','emergencia','apagon','se quedo mas','me llamaron','tormenta','atasco','vuelo','tren','viaje','mudanza','robo'] },
      { key: 'otros',      label: 'Otros',      color: 'var(--ink2)',   words: [] }
    ]
  };

  var XP_DAY = 100;
  var XP_WILD = 25;

  var RANKS = [
    { n: 'Novato',       xp: 0,    c: '#98938a', s: 1, blurb: 'Empiezas. Nadie te conoce todavía, ni tú mismo.' },
    { n: 'Constante',    xp: 300,  c: '#3fae76', s: 2, blurb: 'Ya no dependes de las ganas. Apareces igual.' },
    { n: 'Disciplinado', xp: 800,  c: '#e8833a', s: 3, blurb: 'La disciplina dejó de doler. Ahora es tu suelo.' },
    { n: 'Implacable',   xp: 1500, c: '#7c6ce0', s: 4, blurb: 'No negocias contigo. Ejecutas y sigues.' },
    { n: 'Imparable',    xp: 2500, c: '#c9a227', s: 5, blurb: 'Ya no es un reto: es quien eres.' }
  ];

  var BADGE_DAYS = [
    { d: 7,  n: 'Semana 1' },
    { d: 14, n: 'Semana 2' },
    { d: 21, n: 'Semana 3' },
    { d: 30, n: 'Reto completo' }
  ];

  var QUOTES = [
    'La motivación se acaba a las 48 horas. La disciplina no pide permiso.',
    'Nadie va a venir. Levántate tú.',
    'Hoy no tienes que ser brillante. Solo tienes que aparecer.',
    'Las excusas son cómodas hasta que ves en quién te convierten.',
    'Un día perfecto no cambia nada. Treinta seguidos lo cambian todo.',
    'Lo que evitas hoy te espera mañana con intereses.',
    'No cuentes los días. Haz que los días cuenten contigo.',
    'La versión de ti que quieres ser no descansa de sí misma.',
    'Cumple cuando no te apetezca. Ahí se construye.',
    'Es más fácil mantener la racha que volver a empezarla.',
    'El dolor de la disciplina dura minutos. El del arrepentimiento, años.',
    'Cada casilla sellada es una promesa que te cumpliste.',
    'No busques ganas. Busca el hábito.',
    'Tus resultados son la media de tus días normales.',
    'Hazlo aburrido. Hazlo siempre.'
  ];

  var ICONS = ['🌙','🏋️','💼','📚','💧','🧘','🧠','💰','🥗','⏰','📵','🚿'];

  var TUTORIAL = [
    { icon: '30', title: 'Treinta días seguidos', body: 'Eliges lo que vas a cumplir todos los días. Si cumples, avanzas. Si fallas, vuelves al día 1. El objetivo es llegar a 30/30 sin excusas.' },
    { icon: '⧉', title: 'Tus tareas, tus secciones', body: 'Organizas tus tareas en secciones con icono y nombre (Sueño, Entrenamiento, Trabajo…). Cuando empieces, quedan bloqueadas para todo el intento.' },
    { icon: '✓', title: 'Cada noche sellas el día', body: 'Marcas las tareas y pulsas «Finalizar día». Si están todas, la casilla del día se sella y pasas al siguiente.' },
    { icon: '❄', title: 'Fallar reinicia. El comodín congela.', body: 'Si te falta alguna, puedes usar un comodín: escribes por qué. Un motor de reglas mira las horas que mencionas; si tuviste 3 h libres, se rechaza y reinicias. Si es válido, el día se congela y te quedas en el mismo número.' },
    { icon: '★', title: 'Sube de rango', body: 'Cada día cumplido da XP y sube tu rango: Novato, Constante, Disciplinado, Implacable, Imparable. Al llegar al día 30 desbloqueas el certificado final.' }
  ];

  var MONTHS = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  var DOW = ['L','M','X','J','V','S','D'];

  /* ============================================================
     2. UTILIDADES
     ============================================================ */

  /* Minúsculas sin acentos y con espacios colapsados: el motor compara así. */
  function norm(s) {
    return (s || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/\s+/g, ' ');
  }
  function pad2(n) { return String(n).padStart(2, '0'); }
  function hm(m) {
    var t = ((m % 1440) + 1440) % 1440;
    return pad2(Math.floor(t / 60)) + ':' + pad2(t % 60);
  }
  function uid() { return Math.random().toString(36).slice(2, 9); }
  function dkey(d) { return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }
  function esDate(iso) {
    var d = new Date(iso);
    return isNaN(d) ? '—' : pad2(d.getDate()) + '/' + pad2(d.getMonth() + 1) + '/' + d.getFullYear();
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function el(id) { return document.getElementById(id); }

  /* ============================================================
     3. MOTOR DE EVALUACIÓN DE COMODINES
     Determinista: mismo texto → mismo veredicto. Sin IA.
     ============================================================ */

  /* Extrae todas las horas mencionadas en el texto normalizado. */
  function findTimes(text) {
    var pats = [
      { re: /(?:a\s+)?las?\s+(\d{1,2})(?:[:.](\d{2}))?(?:\s*de la\s+(manana|tarde|noche|madrugada))?/g, g: [1, 2, 3] },
      { re: /\b(\d{1,2})[:.](\d{2})(?!\d)\s*(am|pm)?/g, g: [1, 2, 3] },
      { re: /\b(\d{1,2})\s*(am|pm)\b/g, g: [1, null, 2] },
      { re: /\b(\d{1,2})(?:[:.](\d{2}))?\s*(?:h|hs|hrs)\b/g, g: [1, 2, null] },
      { re: /\b(\d{1,2})(?:[:.](\d{2}))?\s+de la\s+(manana|tarde|noche|madrugada)\b/g, g: [1, 2, 3] },
      { re: /\bmediodia\b/g, fixed: 12 * 60 },
      { re: /\bmedianoche\b/g, fixed: 24 * 60 }
    ];
    var raw = [];
    pats.forEach(function (p) {
      var m; p.re.lastIndex = 0;
      while ((m = p.re.exec(text)) !== null) {
        var min;
        if (p.fixed != null) {
          min = p.fixed;
        } else {
          var h = parseInt(m[p.g[0]], 10);
          var mi = (p.g[1] && m[p.g[1]]) ? parseInt(m[p.g[1]], 10) : 0;
          var per = p.g[2] ? m[p.g[2]] : null;
          if (h > 24 || mi > 59) continue;
          if (per === 'pm' && h < 12) h += 12;
          else if (per === 'am' && h === 12) h = 0;
          else if ((per === 'tarde' || per === 'noche') && h < 12) h += 12;
          else if (per === 'manana' && h === 12) h = 0;
          min = h * 60 + mi;
          if (!per && h >= 1 && h <= 6) min += 12 * 60; // «las 3» → 15:00
        }
        raw.push({ i: m.index, len: m[0].length, min: min });
      }
    });
    raw.sort(function (a, b) { return a.i - b.i || b.len - a.len; });
    var out = [];
    raw.forEach(function (r) {
      var overlap = out.some(function (o) { return r.i < o.i + o.len && o.i < r.i + r.len; });
      if (!overlap) out.push(r);
    });
    return out;
  }

  /* Sustituye cada hora por un marcador @n@ para poder analizar la estructura. */
  function tokenize(text) {
    var times = findTimes(text);
    var t = text, offset = 0, map = [];
    times.forEach(function (tm, idx) {
      var tag = '@' + idx + '@';
      var s = tm.i + offset;
      t = t.slice(0, s) + tag + t.slice(s + tm.len);
      offset += tag.length - tm.len;
      map.push(tm.min);
    });
    return { tok: t, times: map };
  }

  /* Deduce la hora de dormir a partir de las tareas del usuario.
     Solo acepta horas plausibles (20:00–24:00) y exige formato con ":",
     sufijo h/am/pm o prefijo «las», para no confundir «10.000 pasos». */
  function sleepLimitFromTasks(taskNames) {
    var pats = [
      /\b(\d{1,2}):(\d{2})(?!\d)/g,
      /\b(\d{1,2})(?::(\d{2}))?\s*(?:h|hs|hrs)\b/g,
      /\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/g,
      /las?\s+(\d{1,2})(?::(\d{2}))?/g
    ];
    var best = null;
    taskNames.forEach(function (rawName) {
      var n = norm(rawName);
      pats.forEach(function (p) {
        var m; p.lastIndex = 0;
        while ((m = p.exec(n)) !== null) {
          var h = parseInt(m[1], 10);
          var mi = m[2] ? parseInt(m[2], 10) : 0;
          if (h > 24 || mi > 59) continue;
          if (m[3] === 'pm' && h < 12) h += 12;
          var min = h * 60 + mi;
          if (min < 12 * 60) min += 12 * 60;            // «las 11» en tarea de sueño → 23:00
          if (min < 20 * 60 || min > 24 * 60) continue; // solo horas de dormir creíbles
          if (best == null || min > best) best = min;
        }
      });
    });
    return best == null ? RULES.DEFAULT_SLEEP : Math.min(best, 24 * 60);
  }

  /* Veredicto final del comodín. */
  function evaluateWildcard(rawText, taskNames) {
    var text = norm(rawText);
    var trace = [];
    var cat = null;
    for (var ci = 0; ci < RULES.CATEGORIES.length; ci++) {
      var c = RULES.CATEGORIES[ci];
      if (c.words.some(function (w) { return text.indexOf(w) !== -1; })) { cat = c; break; }
    }
    if (!cat) cat = RULES.CATEGORIES[RULES.CATEGORIES.length - 1];

    if (text.replace(/\s/g, '').length < 15) {
      return {
        accepted: false, cat: cat,
        reason: 'La justificación es demasiado corta para poder evaluarla. Describe qué pasó y a qué horas.',
        trace: [{ k: 'texto', v: 'insuficiente' }]
      };
    }

    var sleep = sleepLimitFromTasks(taskNames);
    var tk = tokenize(text);
    var tok = tk.tok, times = tk.times;

    // Hora de despertar
    var wake = RULES.DEFAULT_WAKE, wakeSrc = 'por defecto', wakeTok = null;
    var wm = /(?:despert|levant|abri los ojos|me he levantado)[^@]{0,30}@(\d+)@/.exec(tok);
    if (wm) { wake = times[+wm[1]] % 1440; wakeSrc = 'texto'; wakeTok = wm[1]; }

    // Franjas ocupadas
    var busy = [];
    var used = {};
    function addRange(a, b, src) {
      var s = a, e = b;
      if (e <= s) e += (e + 720 <= s ? 1440 : 720);
      busy.push({ s: Math.max(s, 0), e: Math.min(e, sleep), src: src });
    }
    var m;
    var pairRe = /(?:desde|de|entre)?\s*@(\d+)@\s*(?:hasta|hast|a|al|-|y)\s*@(\d+)@/g;
    while ((m = pairRe.exec(tok)) !== null) {
      used[m[1]] = 1; used[m[2]] = 1;
      addRange(times[+m[1]], times[+m[2]], 'rango');
    }
    var untilRe = /hasta\s*(?:las?\s*)?@(\d+)@/g;
    while ((m = untilRe.exec(tok)) !== null) if (!used[m[1]]) { used[m[1]] = 1; addRange(wake, times[+m[1]], 'hasta'); }
    var fromRe = /(?:desde|a partir de)\s*(?:las?\s*)?@(\d+)@/g;
    while ((m = fromRe.exec(tok)) !== null) if (!used[m[1]]) { used[m[1]] = 1; addRange(times[+m[1]], sleep, 'desde'); }

    var presets = { manana: [wake, 13 * 60], tarde: [16 * 60, 20 * 60 + 30], noche: [21 * 60, sleep] };
    var presetRe = /(?:toda|todo|por)\s+la\s+(manana|tarde|noche)/g;
    while ((m = presetRe.exec(tok)) !== null) { var p = presets[m[1]]; addRange(p[0], p[1], 'franja'); }

    // Fusión de franjas y cálculo de huecos libres
    var merged = [];
    busy.filter(function (b) { return b.e > b.s; })
        .sort(function (a, b) { return a.s - b.s; })
        .forEach(function (b) {
          var last = merged[merged.length - 1];
          if (last && b.s <= last.e) last.e = Math.max(last.e, b.e);
          else merged.push({ s: b.s, e: b.e });
        });
    var gaps = [], cur = wake;
    merged.forEach(function (b) {
      if (b.s > cur) gaps.push([cur, Math.min(b.s, sleep)]);
      cur = Math.max(cur, b.e);
    });
    if (cur < sleep) gaps.push([cur, sleep]);
    var clean = gaps.filter(function (g) { return g[1] - g[0] > 0; });
    var maxGap = clean.reduce(function (a, g) { return Math.max(a, g[1] - g[0]); }, 0);

    trace.push({ k: 'despertar', v: hm(wake) + ' (' + wakeSrc + ')' });
    trace.push({ k: 'dormir', v: hm(sleep) });
    trace.push({ k: 'ocupado', v: merged.length ? merged.map(function (b) { return hm(b.s) + '–' + hm(b.e); }).join('  ') : 'no detectado' });
    trace.push({ k: 'libre', v: clean.length ? clean.map(function (g) { return hm(g[0]) + '–' + hm(g[1]) + ' (' + (Math.round((g[1] - g[0]) / 6) / 10) + 'h)'; }).join('  ') : 'ninguno' });
    trace.push({ k: 'categoría', v: cat.label });

    // Contradicción: menciona una tarea con hora dentro de un hueco declarado libre
    var words = {};
    RULES.TASK_EXTRA.forEach(function (w) { words[w] = 1; });
    taskNames.forEach(function (n) {
      norm(n).split(/[^a-z0-9]+/).forEach(function (w) {
        if (w.length > 3 && RULES.STOPWORDS.indexOf(w) === -1) words[w] = 1;
      });
    });
    /* Solo cuentan las horas "sueltas": las que ya definen una franja ocupada
       (used) o la hora de despertar no son señal de contradicción, porque no
       describen algo hecho dentro de un hueco libre. Se mira primero después
       de la palabra y, si no hay nada, justo antes. */
    var contra = null;
    function freeTimeNear(idx, len) {
      var after = tok.slice(idx + len, idx + len + 45);
      var before = tok.slice(Math.max(0, idx - 45), idx);
      var cands = [];
      var re = /@(\d+)@/g, mm;
      while ((mm = re.exec(after)) !== null) cands.push(mm[1]);
      re.lastIndex = 0;
      while ((mm = re.exec(before)) !== null) cands.push(mm[1]);
      for (var i = 0; i < cands.length; i++) {
        var n = cands[i];
        if (used[n] || n === wakeTok) continue;
        var t = times[+n];
        if (clean.some(function (g) { return t >= g[0] && t <= g[1]; })) return t;
      }
      return null;
    }
    Object.keys(words).forEach(function (w) {
      if (contra) return;
      var idx = tok.indexOf(w);
      while (idx !== -1) {
        var neg = /(no |ni |tampoco|sin )[^@]{0,18}$/.test(tok.slice(Math.max(0, idx - 22), idx));
        if (!neg) {
          var t = freeTimeNear(idx, w.length);
          if (t !== null) { contra = { w: w, t: t }; break; }
        }
        idx = tok.indexOf(w, idx + 1);
      }
    });

    if (merged.length === 0) {
      var allDay = RULES.ALL_DAY.some(function (k) { return text.indexOf(k) !== -1; });
      var invol = RULES.INVOLUNTARY.some(function (k) { return text.indexOf(k) !== -1; });
      if (contra) {
        return { accepted: false, cat: cat, trace: trace,
          reason: 'Contradicción: mencionas «' + contra.w + '» a las ' + hm(contra.t) + ', dentro de una franja que declaras libre. Si pudiste con eso, podías con el reto.' };
      }
      if (allDay || invol) {
        return { accepted: true, cat: cat, trace: trace,
          reason: 'No describes ninguna ventana libre y el motivo encaja con una situación ' + (invol ? 'fuera de tu control' : 'que te ocupó el día completo') + '. Comodín válido.' };
      }
      return { accepted: false, cat: cat, trace: trace,
        reason: 'No hay horas concretas ni una causa fuera de tu control. Sin datos que demuestren que no tuviste 3 h libres, el comodín se rechaza.' };
    }

    if (maxGap >= RULES.MIN_FREE_MIN) {
      var g = clean.filter(function (x) { return x[1] - x[0] >= RULES.MIN_FREE_MIN; })[0];
      return { accepted: false, cat: cat, trace: trace,
        reason: 'Tuviste de ' + hm(g[0]) + ' a ' + hm(g[1]) + ' libres (' + (Math.round((g[1] - g[0]) / 6) / 10) + ' h, más de ' + (RULES.MIN_FREE_MIN / 60) + ' h). Había ventana real para cumplir y no se cumplió.' };
    }
    if (contra) {
      return { accepted: false, cat: cat, trace: trace,
        reason: 'Contradicción: mencionas «' + contra.w + '» a las ' + hm(contra.t) + ', dentro de una franja libre. Eso invalida el comodín.' };
    }
    return { accepted: true, cat: cat, trace: trace,
      reason: 'El día quedó ocupado y tu hueco libre más grande fue de ' + (Math.round(maxGap / 6) / 10) + ' h, por debajo de las ' + (RULES.MIN_FREE_MIN / 60) + ' h mínimas. Comodín válido.' };
  }

  /* ============================================================
     4. ESTADO Y PERSISTENCIA
     ============================================================ */

  function defaultData() {
    return {
      dark: false, sound: true, tutorialDone: false, phase: 'tutorial',
      sections: [
        { id: uid(), icon: '🌙', name: 'Sueño', tasks: [{ id: uid(), name: 'Acostarme a las 23:30' }, { id: uid(), name: 'Sin pantallas la última media hora' }] },
        { id: uid(), icon: '🏋️', name: 'Entrenamiento', tasks: [{ id: uid(), name: 'Ir al gimnasio' }, { id: uid(), name: '10.000 pasos' }] }
      ],
      day: 1, checked: {}, events: [], xp: 0, attempt: 1, resets: 0, best: 0,
      history: [], wildcards: [], activity: [], failCounts: {}, badges: []
    };
  }

  var D = null; // datos persistidos
  var UI = {    // estado efímero de interfaz
    tutStep: 1, wildStage: null, wildText: '', wildRes: null, wildTries: 0,
    showStats: false, showConfirm: false, showRankup: false,
    recap: null, wipeStep: 0
  };

  function readStore(key) {
    return window.ZongaLS ? ZongaLS.load(key) : localStorage.getItem(key);
  }
  function writeStore(key, str) {
    if (window.ZongaLS) return ZongaLS.save(key, str);
    try { localStorage.setItem(key, str); return true; } catch (e) { return false; }
  }
  function load() {
    var raw = null;
    try { raw = readStore(STORE_KEY); } catch (e) {}
    var d = null;
    if (raw) { try { d = JSON.parse(raw); } catch (e) { d = null; } }
    if (!d || typeof d !== 'object') d = defaultData();
    // Saneado defensivo por si llega un snapshot antiguo o incompleto
    var base = defaultData();
    Object.keys(base).forEach(function (k) { if (d[k] === undefined) d[k] = base[k]; });
    if (!Array.isArray(d.sections) || !d.sections.length) d.sections = base.sections;
    if (!d.tutorialDone) d.phase = 'tutorial';
    return d;
  }
  function save() {
    try { writeStore(STORE_KEY, JSON.stringify(D)); } catch (e) {}
  }

  function applyTheme() {
    document.documentElement.setAttribute('data-theme', D && D.dark ? 'dark' : 'light');
  }

  /* Helpers de datos */
  function allTasks() {
    var out = [];
    (D.sections || []).forEach(function (s) {
      (s.tasks || []).forEach(function (t) { out.push({ id: t.id, name: t.name, sec: s.name }); });
    });
    return out;
  }
  function doneCount() {
    return allTasks().filter(function (t) { return D.checked[t.id]; }).length;
  }
  function rankIdx(xp) {
    var i = 0;
    RANKS.forEach(function (r, k) { if (xp >= r.xp) i = k; });
    return i;
  }
  function markActivity(type) {
    var k = dkey(new Date());
    D.activity = (D.activity || []).filter(function (a) { return a.k !== k; });
    D.activity.push({ k: k, t: type });
    if (D.activity.length > 200) D.activity = D.activity.slice(-200);
  }

  /* ============================================================
     5. RENDER
     ============================================================ */

  var root = el('root');

  function render() {
    applyTheme();
    var html = '';
    if (D.phase === 'tutorial') html = viewTutorial();
    else if (D.phase === 'setup') html = viewSetup();
    else if (D.phase === 'active') html = viewDashboard();
    else if (D.phase === 'done') html = viewDone();

    if (UI.showConfirm) html += modalConfirmStart();
    if (UI.wildStage) html += modalWildcard();
    if (UI.recap) html += modalRecap();
    if (UI.showStats) html += viewStats();
    if (UI.showRankup) html += viewRankup();

    root.innerHTML = html;
    wire();
  }

  /* Emblema de rango: SVG generado, sin recursos externos. */
  function emblem(idx, size) {
    var r = RANKS[idx];
    var s = size || 84;
    var bars = '';
    for (var i = 0; i < r.s; i++) {
      var w = 46 - i * 6;
      bars += '<rect x="' + (50 - w / 2) + '" y="' + (60 + i * 9) + '" width="' + w + '" height="5" rx="2.5" fill="' + r.c + '" opacity="' + (1 - i * 0.13) + '"/>';
    }
    return '<svg width="' + s + '" height="' + s + '" viewBox="0 0 100 100" aria-label="Rango ' + esc(r.n) + '" role="img">' +
      '<circle cx="50" cy="38" r="26" fill="none" stroke="' + r.c + '" stroke-width="3" opacity=".35"/>' +
      '<circle cx="50" cy="38" r="19" fill="' + r.c + '" opacity=".16"/>' +
      '<text x="50" y="47" text-anchor="middle" font-family="Oswald, sans-serif" font-size="26" font-weight="700" fill="' + r.c + '">' + r.s + '</text>' +
      bars + '</svg>';
  }

  function topbar(extra) {
    return '<div class="topbar">' +
      '<a class="back" href="../index.html">← Volver a Zonga Elements</a>' +
      '<div class="tools">' + (extra || '') +
        '<button class="icon-btn" data-act="sound" title="Sonido">' + (D.sound ? '🔊' : '🔇') + '</button>' +
        '<button class="icon-btn" data-act="theme" title="Cambiar tema">' + (D.dark ? '☀' : '☾') + '</button>' +
      '</div></div>';
  }

  /* ---------- Tutorial ---------- */
  function viewTutorial() {
    var st = TUTORIAL[UI.tutStep - 1];
    var dots = TUTORIAL.map(function (_, i) { return '<i class="' + (i < UI.tutStep ? 'on' : '') + '"></i>'; }).join('');
    return '<div id="view-tutorial"><div class="tut-card">' +
      '<div class="tut-head"><span class="eyebrow">Cómo funciona · ' + UI.tutStep + '/5</span>' +
      '<button class="link-btn" data-act="tut-skip">Saltar</button></div>' +
      '<div class="tut-icon">' + st.icon + '</div>' +
      '<h2>' + esc(st.title) + '</h2><p>' + esc(st.body) + '</p>' +
      '<div class="tut-foot"><div class="tut-dots">' + dots + '</div>' +
      '<button class="btn-soft" data-act="tut-prev">Atrás</button>' +
      '<button class="btn btn-ink" data-act="tut-next">' + (UI.tutStep === 5 ? 'Configurar' : 'Siguiente') + '</button>' +
      '</div></div></div>';
  }

  /* ---------- Setup ---------- */
  function viewSetup() {
    var tasks = allTasks();
    var secs = D.sections.map(function (s, i) {
      var rows = s.tasks.map(function (t, j) {
        return '<div class="task-row"><span class="dot"></span>' +
          '<input class="task-input" type="text" value="' + esc(t.name) + '" placeholder="Ej: ir al gimnasio" data-act="task-name" data-s="' + i + '" data-t="' + j + '">' +
          '<button class="x-btn" data-act="task-del" data-s="' + i + '" data-t="' + j + '" title="Eliminar tarea">✕</button></div>';
      }).join('');
      return '<div class="card"><div class="sec-head">' +
        '<button class="sec-icon" data-act="sec-icon" data-s="' + i + '" title="Cambiar icono">' + s.icon + '</button>' +
        '<input class="sec-name" type="text" value="' + esc(s.name) + '" placeholder="Nombre de la sección" data-act="sec-name" data-s="' + i + '">' +
        '<button class="x-btn" data-act="sec-del" data-s="' + i + '" title="Eliminar sección">✕</button></div>' +
        '<div class="task-rows">' + rows +
        '<button class="btn-dashed" style="align-self:flex-start;margin-top:4px" data-act="task-add" data-s="' + i + '">+ Añadir tarea</button>' +
        '</div></div>';
    }).join('');

    return '<div class="wrap">' + topbar() +
      '<span class="eyebrow">Configuración · Intento nº ' + D.attempt + '</span>' +
      '<h1 class="page-title">Define tu reto</h1>' +
      '<p class="lead">Crea las secciones y las tareas que vas a cumplir <b>todos los días durante 30 días</b>. Cuando empieces, quedan bloqueadas hasta que termines o falles.</p>' +
      secs +
      '<button class="btn-dashed btn-block" style="margin-bottom:22px" data-act="sec-add">+ Nueva sección</button>' +
      '<div class="sticky-bar"><div style="flex:1;min-width:150px">' +
        '<div class="mono" style="font-size:24px;font-weight:700;line-height:1">' + tasks.length + '</div>' +
        '<div style="font-size:12px;color:var(--ink3);letter-spacing:.06em;text-transform:uppercase">tareas diarias · ' + D.sections.length + ' secciones</div>' +
      '</div><button class="btn btn-primary" style="flex:1;min-width:200px" data-act="start-ask">Empezar reto de 30 días</button></div>' +
      '</div>';
  }

  /* ---------- Dashboard ---------- */
  function viewDashboard() {
    var tasks = allTasks();
    var done = doneCount();
    var ri = rankIdx(D.xp), rank = RANKS[ri], next = RANKS[ri + 1];
    var xpPct = next ? Math.round(((D.xp - rank.xp) / (next.xp - rank.xp)) * 100) : 100;
    var streak = Math.max(0, D.day - 1);
    var flameW = Math.round(16 + Math.min(streak, 30) * 0.62);
    var flameIn = Math.round(7 + Math.min(streak, 30) * 0.3);
    var flameOp = (0.45 + Math.min(streak, 20) * 0.0275).toFixed(2);

    // Tarjeta de sellos
    var cells = '', sealed = 0;
    (D.events || []).forEach(function (e) {
      if (e.t === 'done') { sealed++; cells += '<div class="stamp done" title="Día ' + sealed + ' cumplido">' + sealed + '</div>'; }
      else { cells += '<div class="stamp wild" title="Comodín (' + esc(e.cat || 'otros') + ')">•</div>'; }
    });
    cells += '<div class="stamp today" title="Hoy">' + D.day + '</div>';
    for (var i = sealed + 1; i < 30; i++) cells += '<div class="stamp" title="Pendiente"></div>';

    // Insignias
    var badges = BADGE_DAYS.map(function (b) {
      var got = (D.badges || []).indexOf(b.d) !== -1;
      return '<div class="badge' + (got ? ' got' : '') + '"><div class="badge-ring">' + b.d + '</div>' +
        '<div style="min-width:0"><div class="badge-name">' + esc(b.n) + '</div>' +
        '<div class="badge-state">' + (got ? 'desbloqueada' : 'día ' + b.d) + '</div></div></div>';
    }).join('');

    // Checklist
    var secs = D.sections.map(function (s) {
      var n = s.tasks.filter(function (t) { return D.checked[t.id]; }).length;
      var rows = s.tasks.map(function (t) {
        return '<button class="check-row' + (D.checked[t.id] ? ' on' : '') + '" data-act="toggle" data-id="' + esc(t.id) + '">' +
          '<span class="box"></span><span class="check-label">' + esc(t.name) + '</span></button>';
      }).join('');
      return '<div class="card" style="padding:6px 14px 12px">' +
        '<div class="sec-title"><span style="font-size:19px;line-height:1">' + s.icon + '</span>' +
        '<b>' + esc(s.name) + '</b><span class="mono" style="font-size:11px;color:var(--ink3)">' + n + '/' + s.tasks.length + '</span></div>' +
        rows + '</div>';
    }).join('');

    var ready = tasks.length > 0 && done === tasks.length;

    return '<div class="wrap">' + topbar('<button class="icon-btn" data-act="stats" title="Estadísticas">◫</button>') +
      '<div class="hud"><div class="hud-row">' +
        '<div class="flame"><span style="width:' + flameW + 'px;height:' + flameW + 'px;opacity:' + flameOp + '"></span>' +
        '<em style="width:' + flameIn + 'px;height:' + flameIn + 'px;opacity:' + flameOp + '"></em></div>' +
        '<div style="flex:1;min-width:0">' +
          '<div style="display:flex;align-items:baseline;gap:7px">' +
            '<span style="font-family:Oswald,sans-serif;font-size:26px;font-weight:700;line-height:1">' + streak + '</span>' +
            '<span style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--ink3)">días de racha</span></div>' +
          '<div style="display:flex;align-items:center;gap:8px;margin-top:6px">' +
            '<div class="xp-bar"><i style="width:' + Math.max(3, Math.min(100, xpPct)) + '%"></i></div>' +
            '<span class="mono" style="font-size:11px;color:var(--ink3);white-space:nowrap">' + D.xp + (next ? ' / ' + next.xp + ' XP' : ' XP · MAX') + '</span></div>' +
        '</div>' +
      '</div></div>' +

      '<div class="day-block"><div style="flex:1;min-width:0">' +
        '<span class="eyebrow">día actual</span>' +
        '<div style="display:flex;align-items:baseline;gap:6px">' +
          '<span class="day-num">' + pad2(D.day) + '</span><span class="day-of">/30</span></div>' +
      '</div>' +
      '<div class="rank-emblem">' + emblem(ri, 84) +
        '<span class="rank-label" style="color:' + rank.c + '">' + esc(rank.n) + '</span>' +
        '<span class="mono" style="font-size:10px;color:var(--ink3)">' + (next ? (next.xp - D.xp) + ' XP → ' + next.n : 'rango máximo') + '</span>' +
      '</div></div>' +

      '<div class="quote">' + esc(QUOTES[(D.day - 1 + (D.attempt - 1) * 3) % QUOTES.length]) + '</div>' +

      '<div class="card"><div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">' +
        '<span style="font-family:Oswald,sans-serif;font-size:16px;font-weight:600;text-transform:uppercase;letter-spacing:.06em">Tarjeta de sellos</span>' +
        '<span class="mono" style="font-size:11px;color:var(--ink3)">' + sealed + '/30 sellados</span></div>' +
        '<div class="stamps">' + cells + '</div>' +
        '<div class="legend">' +
          '<span><i style="background:var(--ok)"></i>cumplido</span>' +
          '<span><i style="background:var(--wild)"></i>comodín</span>' +
          '<span><i style="border:1.5px solid var(--accent)"></i>hoy</span>' +
        '</div></div>' +

      '<div class="badges">' + badges + '</div>' +

      '<div style="font-family:Oswald,sans-serif;font-size:18px;font-weight:600;text-transform:uppercase;letter-spacing:.06em">Checklist de hoy</div>' +
      '<div class="mono" style="font-size:13px;color:var(--ink3);margin-bottom:14px">' + done + '/' + tasks.length + ' completadas</div>' +
      secs +
      '<button class="finish-btn' + (ready ? ' ready' : '') + '" data-act="finish">' +
        (ready ? 'Sellar día ' + D.day : 'Finalizar día · ' + done + '/' + tasks.length) + '</button>' +
      '<div class="foot-note">Si fallas alguna tarea vuelves al día 1, salvo comodín válido.</div>' +
      '</div>';
  }

  /* ---------- Reto completado ---------- */
  function viewDone() {
    var ri = rankIdx(D.xp);
    var fails = Object.keys(D.failCounts || {}).sort(function (a, b) { return D.failCounts[b] - D.failCounts[a]; });
    var rows = [
      ['Intentos totales', String(D.attempt)],
      ['Reinicios', String(D.resets)],
      ['Comodines usados', String((D.wildcards || []).length)],
      ['Tarea más difícil', fails.length ? fails[0] : '—'],
      ['XP acumulada', String(D.xp)],
      ['Rango final', RANKS[ri].n]
    ].map(function (r) {
      return '<div class="kv"><span class="kv-k">' + esc(r[0]) + '</span><span class="kv-fill"></span><span class="kv-v">' + esc(r[1]) + '</span></div>';
    }).join('');

    return '<div class="wrap">' + topbar('<button class="icon-btn" data-act="stats" title="Estadísticas">◫</button>') +
      '<div style="text-align:center;margin:26px 0"><div style="position:relative;display:inline-flex;align-items:center;justify-content:center;width:120px;height:120px">' +
        '<div style="position:absolute;inset:0;border-radius:50%;border:2px solid var(--accent);animation:glowRing 2.4s ease-out infinite"></div>' +
        '<div style="width:78px;height:78px;border-radius:50%;background:linear-gradient(150deg,#f0c36a,var(--accent));display:flex;align-items:center;justify-content:center;font-family:Oswald,sans-serif;font-size:34px;font-weight:700;color:#fff;animation:floatY 3s ease-in-out infinite">30</div>' +
      '</div>' +
      '<h1 class="page-title" style="margin-top:14px">Reto completado</h1>' +
      '<p style="margin:0;color:var(--ink2);font-size:17px">30 días seguidos. Sin excusas. Esto ya no es motivación: es identidad.</p></div>' +

      '<div class="card" style="padding:22px">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;padding-bottom:14px;border-bottom:1.5px dashed var(--line);margin-bottom:14px">' +
        '<span style="font-family:Oswald,sans-serif;font-size:19px;font-weight:600;text-transform:uppercase;letter-spacing:.08em">Certificado</span>' +
        '<span class="mono" style="font-size:11px;color:var(--ink3)">' + esDate(new Date().toISOString()) + '</span></div>' +
        '<div class="rows">' + rows + '</div></div>' +

      '<div class="modal-actions">' +
        '<button class="btn btn-primary" data-act="repeat">Repetir mismo reto</button>' +
        '<button class="btn btn-ghost" data-act="new-challenge">Reto nuevo</button></div>' +
      '<div style="text-align:center;margin-top:16px"><button class="link-btn" data-act="stats">Ver estadísticas e historial</button></div>' +
      '</div>';
  }

  /* ---------- Modales ---------- */
  function modalConfirmStart() {
    var tasks = allTasks();
    return '<div class="overlay" data-overlay="confirm"><div class="modal">' +
      '<h3>¿Bloqueamos tus tareas?</h3>' +
      '<p>Vas a empezar con <b>' + tasks.length + ' tareas</b> en ' + D.sections.length + ' secciones.</p>' +
      '<p>A partir de ahora <b>no podrás editarlas, añadirlas ni quitarlas</b> durante este intento. Sin excepciones.</p>' +
      '<div class="modal-actions"><button class="btn-soft" data-act="start-cancel">Seguir editando</button>' +
      '<button class="btn btn-ink" data-act="start-go">Bloquear y empezar</button></div></div></div>';
  }

  function modalWildcard() {
    var tasks = allTasks();
    var missing = tasks.filter(function (t) { return !D.checked[t.id]; });
    var inner = '';

    if (UI.wildStage === 'offer') {
      inner = '<span class="eyebrow" style="color:var(--bad)">Día incompleto</span>' +
        '<h3 style="margin-top:8px">Te faltan ' + missing.length + (missing.length === 1 ? ' tarea' : ' tareas') + '</h3>' +
        '<div class="miss-list">' + missing.map(function (m) { return '<div>· ' + esc(m.name) + '</div>'; }).join('') + '</div>' +
        '<p>Si aceptas el fallo vuelves al <b>día 1</b>. También puedes usar un comodín: escribes por qué no pudiste y un motor de reglas decide si es válido.</p>' +
        '<div class="stack">' +
          '<button class="btn btn-wild" data-act="wild-form">Usar comodín</button>' +
          '<button class="btn-soft" style="border:1.5px solid var(--line)" data-act="wild-fail">Aceptar fallo y reiniciar</button>' +
          '<button class="link-btn" data-act="wild-close">Volver al checklist</button>' +
        '</div>';
    } else if (UI.wildStage === 'form') {
      var sleep = hm(sleepLimitFromTasks(tasks.map(function (t) { return t.name; })));
      inner = '<span class="eyebrow" style="color:var(--wild)">Comodín · justificación</span>' +
        '<h3 style="margin-top:8px">¿Por qué no pudiste?</h3>' +
        '<p style="font-size:14px">Sé concreto con las horas. El motor busca si tuviste un hueco libre de <b>3 horas o más</b> entre que te despertaste y tu hora de dormir (' + sleep + ').</p>' +
        '<textarea class="wild-text" id="wildText" placeholder="Ej: me desperté a las 8 y he estado con mi novia desde las 13:00 hasta las 22:00">' + esc(UI.wildText) + '</textarea>' +
        '<div class="mono" style="font-size:11px;color:var(--ink3);margin:8px 0 16px" id="wildCount">' + UI.wildText.length + ' caracteres · intento ' + (UI.wildTries + 1) + '/2</div>' +
        '<div class="modal-actions"><button class="btn-soft" style="flex:none;min-width:0" data-act="wild-back">Atrás</button>' +
        '<button class="btn btn-wild" data-act="wild-eval">Evaluar comodín</button></div>';
    } else if (UI.wildStage === 'result') {
      var r = UI.wildRes;
      var col = r.accepted ? 'var(--wild)' : 'var(--bad)';
      var bgc = r.accepted ? 'var(--wild-soft)' : 'var(--bad-soft)';
      inner = '<div class="verdict-head">' +
        '<div class="verdict-icon" style="background:' + bgc + ';border-color:' + col + ';color:' + col + '">' + (r.accepted ? '✓' : '✕') + '</div>' +
        '<div><span class="eyebrow">Veredicto del motor</span>' +
        '<h3 style="margin:2px 0 0;font-size:26px;color:' + col + '">' + (r.accepted ? 'Comodín válido' : 'Comodín rechazado') + '</h3></div></div>' +
        '<p>' + esc(r.reason) + '</p>' +
        '<div class="trace">' + r.trace.map(function (t) {
          return '<div class="trace-row"><span class="trace-k">' + esc(t.k) + '</span><span class="trace-v">' + esc(t.v) + '</span></div>';
        }).join('') + '</div>' +
        '<div class="stack">' +
          (r.accepted ? '<button class="btn btn-wild" data-act="wild-freeze">Congelar día ' + D.day + '</button>' : '') +
          (!r.accepted && UI.wildTries < 2 ? '<button class="btn-soft" style="border:1.5px solid var(--line);font-weight:600" data-act="wild-retry">Reescribir el motivo (1 intento)</button>' : '') +
          (!r.accepted ? '<button class="btn btn-bad" data-act="wild-fail">Aceptar reinicio a día 1</button>' : '') +
        '</div>';
    }
    return '<div class="overlay bottom" data-overlay="wild"><div class="modal sheet">' + inner + '</div></div>';
  }

  function modalRecap() {
    var r = UI.recap;
    var rows = r.rows.map(function (x) {
      return '<div class="kv"><span class="kv-k">' + esc(x[0]) + '</span><span class="kv-fill"></span><span class="kv-v">' + esc(x[1]) + '</span></div>';
    }).join('');
    return '<div class="overlay" data-overlay="recap"><div class="modal">' +
      '<span class="eyebrow" style="color:var(--bad)">Intento nº ' + r.attempt + ' cerrado</span>' +
      '<h3 style="margin-top:8px">Vuelta al día 1</h3>' +
      '<p>' + esc(r.line) + '</p>' +
      '<div class="rows" style="margin-bottom:20px">' + rows + '</div>' +
      '<button class="btn btn-ink btn-block" data-act="recap-close">Empezar de nuevo</button></div></div>';
  }

  function viewRankup() {
    var ri = rankIdx(D.xp), rank = RANKS[ri];
    return '<div id="view-rankup"><div class="rankup-inner">' +
      '<span class="eyebrow">Nuevo rango desbloqueado</span>' +
      '<div class="rankup-emblem" style="margin-top:16px"><div class="ring"></div>' + emblem(ri, 160) + '</div>' +
      '<h1 style="color:' + rank.c + '">' + esc(rank.n) + '</h1>' +
      '<p style="margin:0 0 24px;color:var(--ink2);font-size:16px">' + esc(rank.blurb) + '</p>' +
      '<button class="btn btn-ink" data-act="rankup-close">Seguir</button></div></div>';
  }

  /* ---------- Estadísticas ---------- */
  function viewStats() {
    var streak = Math.max(0, D.day - 1);
    var stats = [
      ['Racha actual', String(D.phase === 'active' ? streak : 0), 'var(--accent)'],
      ['Mejor racha', String(D.best), 'var(--ok)'],
      ['Intentos', String(D.attempt), 'var(--ink)'],
      ['Reinicios', String(D.resets), 'var(--bad)'],
      ['Comodines', String((D.wildcards || []).length), 'var(--wild)'],
      ['XP total', String(D.xp), 'var(--ink)']
    ].map(function (s) {
      return '<div class="stat-card"><div class="stat-v" style="color:' + s[2] + '">' + esc(s[1]) + '</div><div class="stat-k">' + esc(s[0]) + '</div></div>';
    }).join('');

    // Mapa de calor 90 días
    var actMap = {};
    (D.activity || []).forEach(function (a) { actMap[a.k] = a.t; });
    var today = new Date();
    var heat = '';
    for (var i = 89; i >= 0; i--) {
      var dd = new Date(today); dd.setDate(dd.getDate() - i);
      var k = dkey(dd), t = actMap[k] || '';
      heat += '<i class="' + t + '" title="' + k + (t ? ' · ' + t : '') + '"></i>';
    }

    // Calendario del mes
    var first = new Date(today.getFullYear(), today.getMonth(), 1);
    var offset = (first.getDay() + 6) % 7;
    var dim = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    var cal = DOW.map(function (d) { return '<div class="cal-dow">' + d + '</div>'; }).join('');
    var cells = '';
    for (var b = 0; b < offset; b++) cells += '<div class="cal-cell blank"></div>';
    for (var n = 1; n <= dim; n++) {
      var kk = dkey(new Date(today.getFullYear(), today.getMonth(), n));
      var tt = actMap[kk] || '';
      var isToday = n === today.getDate() ? ' today' : '';
      cells += '<div class="cal-cell ' + tt + isToday + '">' + n + '</div>';
    }

    // Ranking de fallos
    var fe = Object.keys(D.failCounts || {})
      .map(function (k) { return [k, D.failCounts[k]]; })
      .sort(function (a, b) { return b[1] - a[1]; })
      .slice(0, 6);
    var maxFail = fe.length ? fe[0][1] : 1;
    var failHtml = fe.length ? fe.map(function (f) {
      return '<div class="fail-row"><div class="fail-top"><span>' + esc(f[0]) + '</span>' +
        '<span class="mono" style="color:var(--ink3)">' + f[1] + '×</span></div>' +
        '<div class="fail-bar"><i style="width:' + Math.round((f[1] / maxFail) * 100) + '%"></i></div></div>';
    }).join('') : '<div class="empty">Todavía no has fallado ninguna tarea.</div>';

    // Muro de comodines
    var wildHtml = (D.wildcards || []).length ? (D.wildcards).map(function (w) {
      return '<div class="wild-item' + (w.accepted ? '' : ' no') + '">' +
        '<div class="wild-meta"><span class="wild-verdict" style="color:' + (w.accepted ? 'var(--wild)' : 'var(--bad)') + '">' + (w.accepted ? 'Aceptado' : 'Rechazado') + '</span>' +
        '<span class="mono" style="font-size:11px;color:var(--ink3)">día ' + w.day + ' · ' + esc(w.cat) + ' · ' + esDate(w.date) + '</span></div>' +
        '<div class="wild-quote">«' + esc(w.text) + '»</div></div>';
    }).join('') : '<div class="empty">Ningún comodín usado todavía.</div>';

    // Historial
    var histHtml = (D.history || []).length ? (D.history).map(function (h) {
      return '<div class="hist-row"><span class="hist-n">#' + h.attempt + '</span>' +
        '<div style="flex:1;min-width:0"><div style="font-family:Oswald,sans-serif;font-size:15px;font-weight:600;text-transform:uppercase;letter-spacing:.04em;color:' + (h.result === 'completado' ? 'var(--ok)' : 'var(--bad)') + '">' + (h.result === 'completado' ? 'Completado' : 'Reiniciado') + '</div>' +
        '<div class="mono" style="font-size:11px;color:var(--ink3)">' + esDate(h.date) + ' · ' + h.wilds + ' comodines</div></div>' +
        '<div style="text-align:right;flex:none"><div class="mono" style="font-size:17px;font-weight:700">' + h.days + '</div>' +
        '<div style="font-size:10px;color:var(--ink3);text-transform:uppercase;letter-spacing:.08em">días</div></div></div>';
    }).join('') : '<div class="empty" style="padding:14px 15px">Este es tu primer intento. Todavía no hay historial.</div>';

    var wipeCopy = UI.wipeStep === 0
      ? 'Borrar todos los datos elimina tareas, historial, comodines y XP. No hay vuelta atrás.'
      : UI.wipeStep === 1
        ? 'Confirmación 1 de 2: vas a perder ' + D.attempt + ' intentos y ' + D.xp + ' XP. ¿Seguro?'
        : 'Confirmación 2 de 2: última oportunidad para cancelar.';
    var wipeLabel = UI.wipeStep === 0 ? 'Borrar todos los datos' : UI.wipeStep === 1 ? 'Sí, continuar' : 'Borrar definitivamente';

    return '<div id="view-stats"><div class="wrap">' +
      '<div class="stats-head"><h2 style="font-size:28px;font-weight:700">Estadísticas</h2>' +
      '<button class="icon-btn" data-act="stats-close" title="Cerrar">✕</button></div>' +
      '<div class="stat-grid">' + stats + '</div>' +
      '<div class="block-title">Actividad · últimos 90 días</div>' +
      '<div class="card"><div class="heat">' + heat + '</div>' +
        '<div class="legend"><span><i style="background:var(--ok)"></i>cumplido</span>' +
        '<span><i style="background:var(--wild)"></i>comodín</span>' +
        '<span><i style="background:var(--bad)"></i>fallo</span></div></div>' +
      '<div class="block-title">Calendario · ' + MONTHS[today.getMonth()] + ' ' + today.getFullYear() + '</div>' +
      '<div class="card"><div class="cal-grid" style="margin-bottom:6px">' + cal + '</div>' +
        '<div class="cal-grid">' + cells + '</div></div>' +
      '<div class="block-title">Tareas que más te tumban</div>' +
      '<div class="card">' + failHtml + '</div>' +
      '<div class="block-title">Muro de comodines</div>' + wildHtml +
      '<div class="block-title" style="margin-top:22px">Historial de intentos</div>' +
      '<div class="card" style="padding:0;overflow:hidden">' + histHtml + '</div>' +
      '<div class="danger"><div class="danger-title">Zona peligrosa</div>' +
        '<p style="margin:0 0 12px;font-size:14px;color:var(--ink2)">' + esc(wipeCopy) + '</p>' +
        '<div style="display:flex;gap:9px;flex-wrap:wrap">' +
        '<button class="btn-soft" style="border:1.5px solid var(--bad);color:' + (UI.wipeStep === 2 ? '#fff' : 'var(--bad)') + ';background:' + (UI.wipeStep === 2 ? 'var(--bad)' : 'transparent') + ';font-weight:600;flex:none;min-width:0" data-act="wipe">' + wipeLabel + '</button>' +
        (UI.wipeStep > 0 ? '<button class="btn-soft" style="background:none;flex:none;min-width:0" data-act="wipe-cancel">Cancelar</button>' : '') +
        '</div></div>' +
      '</div></div>';
  }

  /* ============================================================
     6. ACCIONES
     ============================================================ */

  function sealDay() {
    var prevXp = D.xp, day = D.day, last = day === 30;
    sound('seal');
    burst(60, { y: window.innerHeight * 0.55, spread: 320, colors: ['#3fae76', '#8fd6b0', '#e0c341'] });

    D.events.push({ t: 'done', day: day, date: new Date().toISOString() });
    markActivity('done');
    D.xp += XP_DAY;
    D.best = Math.max(D.best, day);
    D.checked = {};
    BADGE_DAYS.forEach(function (b) {
      if (day >= b.d && D.badges.indexOf(b.d) === -1) D.badges.push(b.d);
    });

    if (last) {
      D.phase = 'done';
      D.history.unshift({
        attempt: D.attempt, date: new Date().toISOString(), days: 30, result: 'completado',
        wilds: (D.wildcards || []).filter(function (w) { return w.attempt === D.attempt && w.accepted; }).length
      });
    } else {
      D.day = day + 1;
    }
    save();
    if (rankIdx(D.xp) > rankIdx(prevXp)) { UI.showRankup = true; sound('rank'); }
    render();
    if (last) { sound('win'); burst(220, { spread: 500 }); setTimeout(function () { burst(160, { spread: 600 }); }, 700); }
    else if (UI.showRankup) setTimeout(function () { burst(140, { colors: ['#e8833a', '#e0c341', '#fff1c9'] }); }, 120);
  }

  function freezeDay(res) {
    var prevXp = D.xp;
    sound('seal');
    burst(50, { colors: ['#7c6ce0', '#b6a9f2', '#e6e0ff'] });
    D.events.push({ t: 'wild', day: D.day, cat: res.cat.label, date: new Date().toISOString() });
    markActivity('wild');
    D.xp += XP_WILD;
    D.checked = {};
    save();
    UI.wildStage = null; UI.wildRes = null; UI.wildText = ''; UI.wildTries = 0;
    if (rankIdx(D.xp) > rankIdx(prevXp)) { UI.showRankup = true; sound('rank'); }
    render();
  }

  function resetChallenge() {
    var tasks = allTasks();
    var missing = tasks.filter(function (t) { return !D.checked[t.id]; }).map(function (t) { return t.name; });
    var wilds = (D.wildcards || []).filter(function (w) { return w.attempt === D.attempt; });
    var attempt = D.attempt, days = D.day;

    sound('fail'); shake();

    missing.forEach(function (n) { D.failCounts[n] = (D.failCounts[n] || 0) + 1; });
    markActivity('fail');
    D.history.unshift({
      attempt: attempt, date: new Date().toISOString(), days: days, result: 'reiniciado',
      wilds: wilds.filter(function (w) { return w.accepted; }).length
    });
    D.resets += 1;
    D.attempt += 1;
    D.day = 1;
    D.checked = {};
    D.events = [];
    D.badges = [];
    save();

    UI.wildStage = null; UI.wildRes = null; UI.wildText = ''; UI.wildTries = 0;
    UI.recap = {
      attempt: attempt,
      line: 'Llegaste al día ' + days + ' de 30. Tu XP y tu rango se quedan contigo: eso no se reinicia.',
      rows: [
        ['Días aguantados', days + '/30'],
        ['Tareas falladas', missing.length ? (missing.slice(0, 2).join(', ') + (missing.length > 2 ? ' +' + (missing.length - 2) : '')) : '—'],
        ['Comodines del intento', wilds.filter(function (w) { return w.accepted; }).length + ' ok / ' + wilds.filter(function (w) { return !w.accepted; }).length + ' no']
      ]
    };
    render();
  }

  /* ============================================================
     7. EFECTOS (sonido, confeti, vibración)
     ============================================================ */

  var ac = null;
  function sound(kind) {
    if (!D || !D.sound) return;
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ac = ac || new AC();
      if (ac.state === 'suspended') ac.resume();
      var seq = {
        tick: [[880, 0, .05, .06]],
        seal: [[523, 0, .12, .12], [784, .07, .22, .12]],
        fail: [[196, 0, .3, .16], [147, .12, .4, .12]],
        win:  [[523, 0, .2, .14], [659, .1, .2, .14], [784, .2, .25, .14], [1046, .32, .5, .16]],
        rank: [[659, 0, .18, .13], [880, .1, .3, .13], [1174, .24, .5, .14]]
      }[kind] || [];
      seq.forEach(function (s) {
        var f = s[0], t = s[1], dur = s[2], vol = s[3];
        var o = ac.createOscillator(), g = ac.createGain();
        o.type = 'sine'; o.frequency.value = f;
        g.gain.setValueAtTime(0, ac.currentTime + t);
        g.gain.linearRampToValueAtTime(vol, ac.currentTime + t + .02);
        g.gain.exponentialRampToValueAtTime(.0001, ac.currentTime + t + dur);
        o.connect(g); g.connect(ac.destination);
        o.start(ac.currentTime + t); o.stop(ac.currentTime + t + dur + .02);
      });
    } catch (e) {}
  }

  function shake() {
    var b = document.body;
    b.style.animation = 'none';
    void b.offsetWidth;
    b.style.animation = 'shakeScreen .55s cubic-bezier(.36,.07,.19,.97)';
    setTimeout(function () { b.style.animation = ''; }, 620);
  }

  var canvas = el('confetti'), parts = [], raf = null;
  function sizeCanvas() {
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  function burst(n, opts) {
    if (!canvas) return;
    opts = opts || {};
    sizeCanvas();
    var ctx = canvas.getContext('2d');
    var cols = opts.colors || ['#e8833a', '#3fae76', '#7c6ce0', '#e0c341', '#e05c5c'];
    var ox = opts.x != null ? opts.x : canvas.width / 2;
    var oy = opts.y != null ? opts.y : canvas.height * .3;
    for (var i = 0; i < n; i++) {
      parts.push({
        x: ox + (Math.random() - .5) * (opts.spread || 200),
        y: oy + (Math.random() - .5) * 40,
        vx: (Math.random() - .5) * 9, vy: -Math.random() * 11 - 3,
        g: .28 + Math.random() * .12, s: 3 + Math.random() * 6,
        r: Math.random() * 6.28, vr: (Math.random() - .5) * .3,
        life: 1, col: cols[(Math.random() * cols.length) | 0]
      });
    }
    if (raf) return;
    var loop = function () {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      parts = parts.filter(function (p) { return p.life > 0 && p.y < canvas.height + 40; });
      parts.forEach(function (p) {
        p.x += p.vx; p.y += p.vy; p.vy += p.g; p.vx *= .995; p.r += p.vr; p.life -= .006;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r);
        ctx.globalAlpha = Math.max(0, Math.min(1, p.life));
        ctx.fillStyle = p.col;
        ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 1.6);
        ctx.restore();
      });
      if (parts.length) raf = requestAnimationFrame(loop);
      else { cancelAnimationFrame(raf); raf = null; ctx.clearRect(0, 0, canvas.width, canvas.height); }
    };
    raf = requestAnimationFrame(loop);
  }
  window.addEventListener('resize', sizeCanvas);

  /* ============================================================
     EVENTOS DE INTERFAZ
     ============================================================ */

  function wire() {
    // Conservar el foco/caret al reescribir el DOM no es necesario aquí porque
    // los inputs de texto se actualizan en 'input' sin re-render completo.
    root.querySelectorAll('[data-act]').forEach(function (node) {
      var act = node.getAttribute('data-act');
      if (node.tagName === 'INPUT' || node.tagName === 'TEXTAREA') {
        node.addEventListener('input', function (e) { onInput(act, node, e); });
      } else {
        node.addEventListener('click', function (e) { e.preventDefault(); onClick(act, node); });
      }
    });
  }

  function onInput(act, node) {
    var si = +node.getAttribute('data-s');
    var ti = +node.getAttribute('data-t');
    if (act === 'sec-name') { D.sections[si].name = node.value; save(); }
    else if (act === 'task-name') { D.sections[si].tasks[ti].name = node.value; save(); }
  }

  function onClick(act, node) {
    var si = +node.getAttribute('data-s');
    var ti = +node.getAttribute('data-t');

    switch (act) {
      /* Ajustes */
      case 'theme': D.dark = !D.dark; save(); render(); return;
      case 'sound': D.sound = !D.sound; save(); sound('tick'); render(); return;

      /* Tutorial */
      case 'tut-next':
        sound('tick');
        if (UI.tutStep === 5) { D.tutorialDone = true; D.phase = 'setup'; save(); }
        else UI.tutStep++;
        render(); return;
      case 'tut-prev': UI.tutStep = Math.max(1, UI.tutStep - 1); render(); return;
      case 'tut-skip': D.tutorialDone = true; D.phase = 'setup'; save(); render(); return;

      /* Setup */
      case 'sec-icon':
        D.sections[si].icon = ICONS[(ICONS.indexOf(D.sections[si].icon) + 1) % ICONS.length];
        save(); render(); return;
      case 'sec-del': D.sections.splice(si, 1); save(); render(); return;
      case 'sec-add':
        D.sections.push({ id: uid(), icon: ICONS[D.sections.length % ICONS.length], name: 'Nueva sección', tasks: [{ id: uid(), name: '' }] });
        save(); render(); return;
      case 'task-add': D.sections[si].tasks.push({ id: uid(), name: '' }); save(); render(); return;
      case 'task-del': D.sections[si].tasks.splice(ti, 1); save(); render(); return;
      case 'start-ask':
        if (!allTasks().filter(function (t) { return t.name.trim(); }).length) { shake(); sound('fail'); return; }
        UI.showConfirm = true; render(); return;
      case 'start-cancel': UI.showConfirm = false; render(); return;
      case 'start-go':
        UI.showConfirm = false; sound('seal');
        D.sections = D.sections
          .map(function (s) { return { id: s.id, icon: s.icon, name: s.name, tasks: s.tasks.filter(function (t) { return t.name.trim(); }) }; })
          .filter(function (s) { return s.tasks.length; });
        D.phase = 'active'; D.day = 1; D.checked = {}; D.events = []; D.badges = [];
        save(); render(); return;

      /* Dashboard */
      case 'toggle': {
        var id = node.getAttribute('data-id');
        sound('tick');
        if (D.checked[id]) delete D.checked[id]; else D.checked[id] = true;
        save(); render(); return;
      }
      case 'finish': {
        var tasks = allTasks();
        if (!tasks.length) return;
        if (doneCount() === tasks.length) sealDay();
        else { UI.wildStage = 'offer'; UI.wildText = ''; UI.wildRes = null; UI.wildTries = 0; render(); }
        return;
      }

      /* Comodín */
      case 'wild-form': UI.wildStage = 'form'; render(); return;
      case 'wild-back': UI.wildStage = 'offer'; render(); return;
      case 'wild-close': UI.wildStage = null; render(); return;
      case 'wild-eval': {
        var ta = el('wildText');
        if (ta) UI.wildText = ta.value;
        var names = allTasks().map(function (t) { return t.name; });
        var res = evaluateWildcard(UI.wildText, names);
        D.wildcards.unshift({
          attempt: D.attempt, day: D.day, text: UI.wildText.trim(),
          accepted: res.accepted, cat: res.cat.label, catKey: res.cat.key,
          date: new Date().toISOString()
        });
        save();
        UI.wildStage = 'result'; UI.wildRes = res; UI.wildTries++;
        sound(res.accepted ? 'seal' : 'fail');
        if (!res.accepted) shake();
        render(); return;
      }
      case 'wild-retry': UI.wildStage = 'form'; UI.wildRes = null; render(); return;
      case 'wild-freeze': freezeDay(UI.wildRes); return;
      case 'wild-fail': resetChallenge(); return;

      /* Rank up / recap */
      case 'rankup-close': UI.showRankup = false; render(); return;
      case 'recap-close': UI.recap = null; render(); return;

      /* Final */
      case 'repeat':
        D.phase = 'active'; D.day = 1; D.checked = {}; D.events = []; D.badges = []; D.attempt += 1;
        save(); render(); return;
      case 'new-challenge':
        D.phase = 'setup'; D.day = 1; D.checked = {}; D.events = []; D.badges = []; D.attempt += 1;
        save(); render(); return;

      /* Estadísticas */
      case 'stats': UI.showStats = true; UI.wipeStep = 0; render(); return;
      case 'stats-close': UI.showStats = false; render(); return;
      case 'wipe-cancel': UI.wipeStep = 0; render(); return;
      case 'wipe':
        if (UI.wipeStep < 2) { UI.wipeStep++; render(); return; }
        try { localStorage.removeItem(STORE_KEY); } catch (e) {}
        var keepDark = D.dark, keepSound = D.sound;
        D = defaultData();
        D.dark = keepDark; D.sound = keepSound; D.tutorialDone = true; D.phase = 'setup';
        save();
        UI = { tutStep: 1, wildStage: null, wildText: '', wildRes: null, wildTries: 0, showStats: false, showConfirm: false, showRankup: false, recap: null, wipeStep: 0 };
        sound('fail'); render(); return;
    }
  }

  /* Textarea del comodín: enlazar por id (no lleva data-act para no re-renderizar) */
  document.addEventListener('input', function (e) {
    if (e.target && e.target.id === 'wildText') {
      UI.wildText = e.target.value;
      var c = el('wildCount');
      if (c) c.textContent = e.target.value.length + ' caracteres · intento ' + (UI.wildTries + 1) + '/2';
    }
  });

  /* ============================================================
     ARRANQUE
     ============================================================ */
  D = load();
  sizeCanvas();
  render();
})();
