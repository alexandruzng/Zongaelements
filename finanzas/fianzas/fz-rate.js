/* ─── Fianzas: tipo de cambio EUR→RON en tiempo real ───────────────────────
 * Script normal (NO babel): se ejecuta antes de que Babel corra data.js, así
 * `window.FZ_RATE.value` ya está disponible cuando data.js define EUR_TO_RON.
 *
 * Estrategia:
 *  - Lee de localStorage la última tasa cacheada (síncrono) → valor de arranque.
 *  - refresh() descarga la tasa del día solo si la cache no es de hoy.
 *  - Fuente principal: Frankfurter (BCE, sin API key, con CORS).
 *    Fallback: open.er-api.com.
 *  - Si no hay red: se queda con el último valor conocido (o 4.97) y lo marca
 *    como "stale". Nunca rompe la app.
 * ---------------------------------------------------------------------------*/
(function () {
  'use strict';

  var STORAGE_KEY = 'fz:eurRon';
  var FALLBACK = 4.97;          // último valor conocido antes de tener red
  var MIN = 3.0, MAX = 8.0;     // rango sano para descartar respuestas absurdas

  function todayISO() {
    var d = new Date();
    var mm = String(d.getMonth() + 1).padStart(2, '0');
    var dd = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + mm + '-' + dd;
  }

  // ── Lectura síncrona de la cache ─────────────────────────────────────────
  var cache = null;
  try {
    var raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      var parsed = JSON.parse(raw);
      if (parsed && typeof parsed.rate === 'number' && parsed.rate > MIN && parsed.rate < MAX) {
        cache = parsed;
      }
    }
  } catch (e) { /* cache corrupta → ignorar */ }

  var FZ_RATE = {
    value: cache ? cache.rate : FALLBACK,
    date: cache ? cache.date : null,     // 'YYYY-MM-DD' del último dato válido
    source: cache ? cache.source : null, // 'frankfurter' | 'er-api' | null
    stale: !cache,                        // true si aún no hay dato descargado
    refreshing: false,
  };

  // ── Etiqueta legible para el indicador ("hoy" / "ayer" / "DD mmm") ───────
  FZ_RATE.dateLabel = function () {
    if (!FZ_RATE.date) return null;
    var t = todayISO();
    if (FZ_RATE.date === t) return 'hoy';
    // ayer
    var y = new Date(); y.setDate(y.getDate() - 1);
    var ymm = String(y.getMonth() + 1).padStart(2, '0');
    var ydd = String(y.getDate()).padStart(2, '0');
    var yISO = y.getFullYear() + '-' + ymm + '-' + ydd;
    if (FZ_RATE.date === yISO) return 'ayer';
    var parts = FZ_RATE.date.split('-'); // yyyy-mm-dd
    var meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    return parseInt(parts[2], 10) + ' ' + (meses[parseInt(parts[1], 10) - 1] || '');
  };

  function apply(rate, source) {
    FZ_RATE.value = rate;
    FZ_RATE.date = todayISO();
    FZ_RATE.source = source;
    FZ_RATE.stale = false;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ rate: rate, date: FZ_RATE.date, source: source }));
    } catch (e) { /* cuota llena → seguimos con el valor en memoria */ }
    // Propagar a los datos de la app si ya están cargados.
    if (window.FIANZAS_DATA) window.FIANZAS_DATA.EUR_TO_RON = rate;
    try { window.dispatchEvent(new Event('fz:rate-updated')); } catch (e) {}
  }

  function sane(n) { return typeof n === 'number' && isFinite(n) && n > MIN && n < MAX; }

  // ── Fuentes ──────────────────────────────────────────────────────────────
  function fetchFrankfurter() {
    return fetch('https://api.frankfurter.dev/v1/latest?base=EUR&symbols=RON')
      .then(function (r) { if (!r.ok) throw new Error('http ' + r.status); return r.json(); })
      .then(function (j) {
        var rate = j && j.rates && j.rates.RON;
        if (!sane(rate)) throw new Error('tasa inválida');
        return { rate: rate, source: 'frankfurter' };
      });
  }

  function fetchErApi() {
    return fetch('https://open.er-api.com/v6/latest/EUR')
      .then(function (r) { if (!r.ok) throw new Error('http ' + r.status); return r.json(); })
      .then(function (j) {
        var rate = j && j.rates && j.rates.RON;
        if (!sane(rate)) throw new Error('tasa inválida');
        return { rate: rate, source: 'er-api' };
      });
  }

  // ── Refresh diario ───────────────────────────────────────────────────────
  FZ_RATE.refresh = function (force) {
    // Ya tenemos el dato de hoy → no gastamos red.
    if (!force && FZ_RATE.date === todayISO() && !FZ_RATE.stale) {
      return Promise.resolve(FZ_RATE.value);
    }
    if (FZ_RATE.refreshing) return Promise.resolve(FZ_RATE.value);
    FZ_RATE.refreshing = true;

    return fetchFrankfurter()
      .catch(function () { return fetchErApi(); })
      .then(function (res) { apply(res.rate, res.source); return FZ_RATE.value; })
      .catch(function () {
        // Sin red: nos quedamos con el último valor conocido.
        FZ_RATE.stale = true;
        try { window.dispatchEvent(new Event('fz:rate-updated')); } catch (e) {}
        return FZ_RATE.value;
      })
      .then(function (v) { FZ_RATE.refreshing = false; return v; });
  };

  window.FZ_RATE = FZ_RATE;
})();
