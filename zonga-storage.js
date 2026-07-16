/* Zonga Storage — guardado en localStorage con compresión y aviso de cuota llena.
   Carga ANTES del código de la app:
     <script src="/lz-string.min.js"></script>
     <script src="/zonga-storage.js"></script>

   Por qué existe:
   - El localStorage es compartido por todas las herramientas del dominio y en
     móvil el límite es más estricto (~5 MB en iOS Safari). Cuando se llena,
     localStorage.setItem lanza QuotaExceededError. Varias herramientas se lo
     tragaban en silencio y perdías datos sin enterarte.
   - Este helper comprime el texto (~7-10x con LZString) para que quepa mucho
     más en el mismo espacio, y AVISA con un banner cuando aun así no cabe, en
     vez de fallar en silencio.

   API global (window.ZongaLS):
   - ZongaLS.save(key, jsonString) -> true si guardó, false si la cuota llena.
   - ZongaLS.load(key)             -> string original (descomprimido) o null.
   - ZongaLS.warnQuotaFull()       -> muestra el banner de "almacenamiento lleno".

   Compatibilidad: lee valores antiguos sin comprimir; los nuevos se guardan con
   el prefijo "LZ1:". compressToEncodedURIComponent produce ASCII seguro para
   JSON/Firestore (la sincronización lo sube tal cual). */
(function () {
  "use strict";

  var PREFIX = "LZ1:";
  var hasLZ = function () { return typeof LZString !== "undefined"; };

  function encode(str) {
    if (hasLZ()) return PREFIX + LZString.compressToEncodedURIComponent(str);
    return str; // sin la librería, se guarda en plano (respaldo)
  }

  function decode(raw) {
    if (raw == null) return null;
    if (raw.slice(0, PREFIX.length) === PREFIX) {
      if (!hasLZ()) return null;
      var json = LZString.decompressFromEncodedURIComponent(raw.slice(PREFIX.length));
      return json == null ? null : json;
    }
    return raw; // datos antiguos sin comprimir
  }

  function isQuotaError(e) {
    if (!e) return false;
    return (
      e.name === "QuotaExceededError" ||
      e.name === "NS_ERROR_DOM_QUOTA_REACHED" ||
      e.code === 22 ||
      e.code === 1014
    );
  }

  function save(key, jsonString) {
    try {
      localStorage.setItem(key, encode(jsonString));
      return true;
    } catch (e) {
      if (isQuotaError(e)) { warnQuotaFull(); return false; }
      // Otro error (p. ej. LZString): reintentar guardando en plano.
      try { localStorage.setItem(key, jsonString); return true; }
      catch (e2) { if (isQuotaError(e2)) warnQuotaFull(); return false; }
    }
  }

  function load(key) {
    try { return decode(localStorage.getItem(key)); }
    catch (e) { return null; }
  }

  // ── Banner de aviso (una sola vez, no bloqueante) ──
  var warned = false;
  function warnQuotaFull() {
    if (warned) return;
    warned = true;
    var show = function () {
      if (document.getElementById("__zonga_quota_banner__")) return;
      var el = document.createElement("div");
      el.id = "__zonga_quota_banner__";
      el.setAttribute("role", "alert");
      Object.assign(el.style, {
        position: "fixed", left: "0", right: "0", top: "0", zIndex: "2147483647",
        background: "#7a1212", color: "#fff",
        font: "600 13px/1.4 system-ui, -apple-system, 'Segoe UI', sans-serif",
        padding: "12px 44px 12px 16px", textAlign: "center",
        boxShadow: "0 4px 16px rgba(0,0,0,.25)"
      });
      el.innerHTML =
        "⚠ El almacenamiento de este dispositivo está lleno: los cambios nuevos " +
        "no se están guardando. Libera espacio borrando fotos o entradas antiguas " +
        "en el Diario, o notas que ya no uses.";
      var close = document.createElement("button");
      close.textContent = "×";
      Object.assign(close.style, {
        position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)",
        background: "transparent", border: "0", color: "#fff",
        fontSize: "22px", lineHeight: "1", cursor: "pointer", padding: "0 6px"
      });
      close.setAttribute("aria-label", "Cerrar aviso");
      close.addEventListener("click", function () { el.remove(); });
      el.appendChild(close);
      document.body.appendChild(el);
    };
    if (document.body) show();
    else document.addEventListener("DOMContentLoaded", show);
  }

  // ── Compactación proactiva ──
  // El bucket compartido puede estar ya lleno (sobre todo en móvil). Comprimimos
  // in situ las claves grandes que ya existen SIN comprimir para liberar espacio
  // al instante. Solo se tocan claves cuyos lectores ya descomprimen (ZongaLS).
  // Reemplazar un valor grande por su versión comprimida deja hueco neto, así que
  // esto no puede fallar por cuota. Idempotente: salta lo que ya lleva prefijo.
  var COMPACT_KEYS = [
    "diario_entries_v2", "diario_streaks_v2",
    "diario_letters_v2", "diario_objectives_v2",
    "fz:transactions", "fz:goals", "fz:budgets",
    "fz:categories", "fz:categoryOverrides",
    "tracker_habitos_v1",
    "zonga_tracker_beneficio_v3"
  ];
  function compact() {
    if (!hasLZ()) return;
    for (var i = 0; i < COMPACT_KEYS.length; i++) {
      var key = COMPACT_KEYS[i];
      try {
        var raw = localStorage.getItem(key);
        if (raw == null || raw.slice(0, PREFIX.length) === PREFIX) continue;
        var packed = encode(raw);
        if (packed.length < raw.length) localStorage.setItem(key, packed);
      } catch (e) { /* si una clave falla, seguir con las demás */ }
    }
  }
  try { compact(); } catch (e) {}

  window.ZongaLS = { save: save, load: load, warnQuotaFull: warnQuotaFull, compact: compact };
})();
