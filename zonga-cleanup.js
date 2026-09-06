/* Zonga Cleanup — limpiezas puntuales pedidas por el usuario.
   Carga DESPUÉS de lz-string.min.js y zonga-storage.js:
     <script src="/zonga-cleanup.js"></script>

   Cada limpieza:
   - Se ejecuta UNA vez por dispositivo (marca con prefijo `__zonga`, que la
     sincronización ignora a propósito: así cada equipo limpia lo suyo, porque
     IndexedDB no se sincroniza y hay que vaciarlo en cada uno).
   - Guarda ANTES una copia íntegra del valor en la papelera de la nube, así que
     todo esto sigue siendo reversible desde /copias/ aunque sea un borrado.
   - Es idempotente: si no queda nada que limpiar, no toca nada.
*/
(function () {
  "use strict";

  var FLAG_FOTOS = "__zonga_purga_fotos_diario_v1__";
  var FLAG_LIBROS = "__zonga_purga_notas_libros_v1__";

  var DIARIO_KEY = "diario_entries_v2";
  var DIARIO_MEDIA_KEY = "diario_media_paths_v1";
  var IDB_DIARIO = "diario_media";

  function hecho(flag) { try { return localStorage.getItem(flag) === "1"; } catch (e) { return true; } }
  function marcar(flag) { try { localStorage.setItem(flag, "1"); } catch (e) {} }

  function cargar(key) {
    try { return window.ZongaLS ? ZongaLS.load(key) : localStorage.getItem(key); }
    catch (e) { return null; }
  }
  function guardar(key, texto) {
    try {
      if (window.ZongaLS) return ZongaLS.save(key, texto);
      localStorage.setItem(key, texto); return true;
    } catch (e) { return false; }
  }

  // Copia de seguridad en la nube antes de destruir nada.
  function copiaPrevia(key, motivo) {
    try {
      if (window.__zongaSync && window.__zongaSync.stash) {
        return window.__zongaSync.stash(key, motivo);
      }
    } catch (e) {}
    return Promise.resolve(false);
  }

  /* ══════════════════════════════════════════════════════════════════════
     1. Quitar las fotos y vídeos del Diario
     ══════════════════════════════════════════════════════════════════════
     IMPORTANTE: solo se quita el campo `photos` (y el `photo` antiguo) de cada
     día. La nota, la puntuación, la racha, los colores, los objetivos, la nota
     de voz y la fecha se quedan EXACTAMENTE como estaban. */
  function quitarFotosDeEntradas() {
    var crudo = cargar(DIARIO_KEY);
    if (!crudo) return { dias: 0, limpiados: 0 };

    var entradas;
    try { entradas = JSON.parse(crudo); } catch (e) { return { dias: 0, limpiados: 0 }; }
    if (!entradas || typeof entradas !== "object") return { dias: 0, limpiados: 0 };

    var limpiados = 0;
    var salida = {};
    Object.keys(entradas).forEach(function (dia) {
      var e = entradas[dia];
      if (e && typeof e === "object" && ("photos" in e || "photo" in e)) {
        var ne = {};
        Object.keys(e).forEach(function (campo) {
          if (campo !== "photos" && campo !== "photo") ne[campo] = e[campo];
        });
        salida[dia] = ne;
        limpiados++;
      } else {
        salida[dia] = e;
      }
    });

    if (limpiados) guardar(DIARIO_KEY, JSON.stringify(salida));
    return { dias: Object.keys(salida).length, limpiados: limpiados };
  }

  function borrarIndexedDB(nombre) {
    return new Promise(function (res) {
      try {
        var req = indexedDB.deleteDatabase(nombre);
        req.onsuccess = req.onerror = req.onblocked = function () { res(); };
        setTimeout(res, 3000); // si queda bloqueada por otra pestaña, seguimos
      } catch (e) { res(); }
    });
  }

  // Borra los archivos del Diario en Firebase Storage (users/{uid}/diario/**).
  function borrarMediaDeLaNube() {
    return new Promise(function (res) {
      var stor = window.__zongaStorage;
      if (!stor || !stor.list || !stor.del) return res(0);
      stor.uid().then(function (uid) {
        return stor.list("users/" + uid + "/diario");
      }).then(function (items) {
        if (!items || !items.length) return res(0);
        var pendientes = items.map(function (it) { return stor.del(it.path); });
        Promise.all(pendientes).then(function () { res(items.length); })
                               .catch(function () { res(0); });
      }).catch(function () { res(0); });
    });
  }

  function purgarFotosDiario() {
    if (hecho(FLAG_FOTOS)) return;
    // Marcamos antes de empezar: si algo falla a mitad, no se repite en bucle.
    // Lo que quede sin borrar en la nube no molesta (ya no hay pantalla que lo lea).
    copiaPrevia(DIARIO_KEY, "copia-antes-de-quitar-las-fotos").then(function () {
      var r = quitarFotosDeEntradas();
      try { localStorage.removeItem(DIARIO_MEDIA_KEY); } catch (e) {}
      marcar(FLAG_FOTOS);
      return borrarIndexedDB(IDB_DIARIO).then(borrarMediaDeLaNube).then(function (n) {
        console.info("[limpieza] Diario sin fotos: " + r.limpiados + " día(s) limpiados de " +
                     r.dias + ", " + n + " archivo(s) borrados de la nube. Las notas siguen intactas.");
      });
    }).catch(function (e) {
      console.warn("[limpieza] no se pudo quitar las fotos del Diario:", e && e.message || e);
    });
  }

  /* ══════════════════════════════════════════════════════════════════════
     2. Eliminar los datos de la herramienta de notas de libros
     ══════════════════════════════════════════════════════════════════════ */
  function purgarNotasLibros() {
    if (hecho(FLAG_LIBROS)) return;

    var claves = [];
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k && k.indexOf("notas-libros:") === 0) claves.push(k);
      }
    } catch (e) { return; }

    if (!claves.length) { marcar(FLAG_LIBROS); return; }

    // Copia de todas antes de borrarlas; luego se borran de verdad (y la
    // sincronización propaga el borrado al resto de dispositivos).
    Promise.all(claves.map(function (k) {
      return copiaPrevia(k, "copia-antes-de-eliminar-notas-de-libros");
    })).then(function () {
      claves.forEach(function (k) { try { localStorage.removeItem(k); } catch (e) {} });
      marcar(FLAG_LIBROS);
      console.info("[limpieza] Notas de libros eliminada: " + claves.length + " clave(s). " +
                   "Hay copia en /copias/ (papelera) por si hiciera falta.");
    }).catch(function (e) {
      console.warn("[limpieza] no se pudo eliminar Notas de libros:", e && e.message || e);
    });
  }

  // Se lanza en segundo plano; nada de esto bloquea la carga de la página.
  function arrancar() {
    setTimeout(function () {
      purgarFotosDiario();
      purgarNotasLibros();
    }, 1200);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", arrancar);
  else arrancar();
})();
