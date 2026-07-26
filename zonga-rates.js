/* ─── Zonga: tipos de cambio multi-divisa (base EUR) ────────────────────────
 * Módulo compartido para herramientas que solo necesitan la tasa del día
 * (sin histórico por fecha). Finanzas usa su propio fz-rate.js, que además
 * guarda el histórico para congelar cada transacción a la tasa de SU fecha.
 *
 * Estrategia:
 *  - Lee de localStorage la última tasa cacheada (síncrono) → valor de arranque,
 *    así la UI nunca se queda sin número mientras baja la tasa fresca.
 *  - refresh() descarga las tasas del día solo si la cache no es de hoy.
 *  - Fuente principal: Frankfurter (BCE, sin API key, con CORS), una sola
 *    llamada para las tres divisas. Fallback: open.er-api.com.
 *  - Si no hay red: se queda con el último valor conocido (o los fallbacks
 *    duros) y lo marca como "stale". Nunca rompe la app.
 *
 * Uso:
 *   ZongaRates.rate('RON')        → 5.0912
 *   ZongaRates.convert(1200,'RON')→ 6109.44
 *   ZongaRates.refresh()          → Promise (falla en silencio)
 *   window.addEventListener('zonga:rates-updated', render)
 * ---------------------------------------------------------------------------*/
(function () {
  'use strict';

  var STORAGE_KEY = 'zr:rates';   // { rates, date, source } — cache derivada, no se sincroniza

  // Fallbacks duros (último valor conocido antes de tener red) y rango sano
  // por divisa para descartar respuestas absurdas de la API.
  var SPEC = {
    EUR: { fallback: 1,    min: 1,   max: 1 },
    USD: { fallback: 1.08, min: 0.7, max: 2.0 },
    GBP: { fallback: 0.85, min: 0.5, max: 1.5 },
    RON: { fallback: 4.97, min: 3.0, max: 8.0 },
  };
  var SYMBOLS = ['USD', 'GBP', 'RON'];   // lo que pedimos a la API (EUR es la base)

  function todayISO() {
    var d = new Date();
    var mm = String(d.getMonth() + 1).padStart(2, '0');
    var dd = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + mm + '-' + dd;
  }

  function sane(cur, n) {
    var s = SPEC[cur];
    return !!s && typeof n === 'number' && isFinite(n) && n >= s.min && n <= s.max;
  }

  function defaults() {
    var r = {};
    Object.keys(SPEC).forEach(function (c) { r[c] = SPEC[c].fallback; });
    return r;
  }

  // ── Lectura síncrona de la cache ─────────────────────────────────────────
  var cache = null;
  try {
    var raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      var parsed = JSON.parse(raw);
      if (parsed && parsed.rates && typeof parsed.rates === 'object') {
        var clean = defaults();
        var any = false;
        SYMBOLS.forEach(function (c) {
          if (sane(c, parsed.rates[c])) { clean[c] = parsed.rates[c]; any = true; }
        });
        if (any) cache = { rates: clean, date: parsed.date || null, source: parsed.source || null };
      }
    }
  } catch (e) { /* cache corrupta → ignorar */ }

  var ZongaRates = {
    base: 'EUR',
    rates: cache ? cache.rates : defaults(),
    date: cache ? cache.date : null,      // 'YYYY-MM-DD' del último dato válido
    source: cache ? cache.source : null,  // 'frankfurter' | 'er-api' | null
    stale: !cache,                        // true si aún no hay dato descargado
    refreshing: false,
  };

  // Multiplicador EUR → divisa. Devuelve 1 para divisas desconocidas, así una
  // moneda nueva nunca falsea las cifras: se muestra el importe en euros.
  ZongaRates.rate = function (cur) {
    var v = ZongaRates.rates[cur];
    return (typeof v === 'number' && isFinite(v) && v > 0) ? v : 1;
  };

  ZongaRates.convert = function (x, cur) {
    var n = typeof x === 'number' ? x : parseFloat(x);
    if (!isFinite(n)) return NaN;
    return n * ZongaRates.rate(cur);
  };

  // ── Etiqueta legible para el indicador ("hoy" / "ayer" / "DD mmm") ───────
  ZongaRates.dateLabel = function () {
    if (!ZongaRates.date) return null;
    if (ZongaRates.date === todayISO()) return 'hoy';
    var y = new Date(); y.setDate(y.getDate() - 1);
    var ymm = String(y.getMonth() + 1).padStart(2, '0');
    var ydd = String(y.getDate()).padStart(2, '0');
    if (ZongaRates.date === y.getFullYear() + '-' + ymm + '-' + ydd) return 'ayer';
    var parts = ZongaRates.date.split('-');
    var meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    return parseInt(parts[2], 10) + ' ' + (meses[parseInt(parts[1], 10) - 1] || '');
  };

  function apply(rates, source) {
    ZongaRates.rates = rates;
    ZongaRates.date = todayISO();
    ZongaRates.source = source;
    ZongaRates.stale = false;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ rates: rates, date: ZongaRates.date, source: source }));
    } catch (e) { /* cuota llena → seguimos con el valor en memoria */ }
    try { window.dispatchEvent(new Event('zonga:rates-updated')); } catch (e) {}
  }

  // Convierte la respuesta de una API {USD:.., GBP:.., RON:..} en tasas sanas.
  // Exige al menos una divisa válida para no aplicar una respuesta vacía.
  function parseRates(obj) {
    if (!obj) throw new Error('sin rates');
    var out = defaults();
    var any = false;
    SYMBOLS.forEach(function (c) {
      if (sane(c, obj[c])) { out[c] = obj[c]; any = true; }
    });
    if (!any) throw new Error('tasas inválidas');
    return out;
  }

  // ── Fuentes ──────────────────────────────────────────────────────────────
  function fetchFrankfurter() {
    return fetch('https://api.frankfurter.dev/v1/latest?base=EUR&symbols=' + SYMBOLS.join(','))
      .then(function (r) { if (!r.ok) throw new Error('http ' + r.status); return r.json(); })
      .then(function (j) { return { rates: parseRates(j && j.rates), source: 'frankfurter' }; });
  }

  function fetchErApi() {
    return fetch('https://open.er-api.com/v6/latest/EUR')
      .then(function (r) { if (!r.ok) throw new Error('http ' + r.status); return r.json(); })
      .then(function (j) { return { rates: parseRates(j && j.rates), source: 'er-api' }; });
  }

  // ── Refresh diario ───────────────────────────────────────────────────────
  ZongaRates.refresh = function (force) {
    // Ya tenemos el dato de hoy → no gastamos red.
    if (!force && ZongaRates.date === todayISO() && !ZongaRates.stale) {
      return Promise.resolve(ZongaRates.rates);
    }
    if (ZongaRates.refreshing) return Promise.resolve(ZongaRates.rates);
    ZongaRates.refreshing = true;

    return fetchFrankfurter()
      .catch(function () { return fetchErApi(); })
      .then(function (res) { apply(res.rates, res.source); return ZongaRates.rates; })
      .catch(function () {
        // Sin red: nos quedamos con el último valor conocido.
        ZongaRates.stale = true;
        try { window.dispatchEvent(new Event('zonga:rates-updated')); } catch (e) {}
        return ZongaRates.rates;
      })
      .then(function (r) { ZongaRates.refreshing = false; return r; });
  };

  window.ZongaRates = ZongaRates;
})();
