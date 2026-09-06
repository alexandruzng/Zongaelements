/* Zonga Sync v2 — sincronización entre dispositivos SIN pérdida de datos
   Cárgalo en cualquier herramienta:  <script type="module" src="/sync.js"></script>
   Requiere sesión iniciada (auth se hace en index.html).

   ─────────────────────────────────────────────────────────────────────────
   POR QUÉ SE REESCRIBIÓ (v1 = "chunks-v1", perdía datos)
   ─────────────────────────────────────────────────────────────────────────
   La v1 subía TODO el localStorage como una foto única repartida en "chunks"
   empaquetados por tamaño. Eso provocaba cuatro fallos que borraban datos:

   1. Reempaquetado inestable: al cambiar un byte, las claves se recolocaban en
      otros chunks. Si una escritura se quedaba a medias (refrescar la página,
      cerrar el portátil, red lenta), la nube quedaba con una mezcla incoherente
      de chunks nuevos y viejos y algunas claves DESAPARECÍAN del conjunto.
   2. Borrado por ausencia: si una clave no aparecía en la foto remota, se
      borraba del dispositivo. Combinado con (1) → borrado masivo real.
   3. Cuota llena silenciosa: al bajar los datos, `setItem` fallaba por cuota
      (típico en un portátil nuevo que recibe todo de golpe) y el error se
      tragaba. Ese dispositivo se quedaba con datos INCOMPLETOS y a la primera
      edición subía esa foto incompleta encima de la nube → se perdía en todos.
   4. Última escritura gana sobre TODO el almacén: editar en un dispositivo
      machacaba lo que hubieras hecho en el otro, aunque fuera otra herramienta.

   ─────────────────────────────────────────────────────────────────────────
   CÓMO FUNCIONA AHORA ("kv-v2")
   ─────────────────────────────────────────────────────────────────────────
   · Un documento POR CLAVE en `users/{uid}/kv/{id}`. El id se deriva de la
     clave de forma determinista, así que nunca se recoloca nada.
   · Los valores grandes se parten en `{id}--p1`, `{id}--p2`… Cada parte lleva
     el `rev` (hash) del valor completo y la cabecera (parte 0) se escribe la
     ÚLTIMA. Un conjunto de partes incompleto o con revs distintos se IGNORA:
     una subida a medias nunca corrompe nada, como mucho no actualiza.
   · Se sube SOLO lo que ha cambiado, clave a clave. Una herramienta no puede
     pisar los datos de otra.
   · NUNCA se borra una clave local por no estar en la nube. Solo se borra si
     hay una lápida explícita (`del:true`) más nueva que lo local.
   · Antes de sobrescribir o borrar algo, el valor anterior va a la papelera
     `users/{uid}/trash`. Nada es irrecuperable.
   · Copia de seguridad completa diaria en `users/{uid}/backups/{YYYY-MM-DD}`,
     se guardan 14 días. `__zongaSync.listBackups()` / `.restoreBackup(dia)`.
   · Si el almacenamiento local se llena, se avisa Y se marca la clave como
     "no aplicada": jamás se sube un estado incompleto a la nube.
   · Las escrituras hechas antes de reconciliar con la nube (arranque, semillas,
     modo avión) van a una cola aparte y se resuelven comparando `rev`: si el
     dispositivo ya tenía la versión de la nube y la editó encima, gana lo local;
     si no, gana la nube y lo local se guarda en la papelera.
*/
import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-auth.js";
import {
  doc, collection, setDoc, deleteDoc, getDoc, getDocs, onSnapshot
} from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";

/* ══════════════════════════════════════════════════════════════════════════
   1. Constantes y estado
   ══════════════════════════════════════════════════════════════════════════ */

// `fz:eurRon` (Finanzas) y `zr:` (zonga-rates.js) son cachés de tipo de cambio
// derivadas: cada dispositivo las recalcula desde la API, así que NO se sincronizan.
const SKIP_PREFIXES = ["__zonga", "firebase:", "fz:eurRon", "zr:"];
const skipKey = (k) => !k || SKIP_PREFIXES.some(p => k.startsWith(p));

const DEVICE_KEY  = "__zonga_device_id__";
const META_KEY    = "__zonga_kv_meta__";     // { clave: { ts, rev, n } } — última versión confirmada con la nube
const DIRTY_KEY   = "__zonga_kv_dirty__";    // { clave: ts } — cambios locales pendientes de subir
const PRE_KEY     = "__zonga_kv_prepull__";  // { clave: ts } — escrituras hechas antes de reconciliar
const BLOCKED_KEY = "__zonga_kv_blocked__";  // { clave: ts } — no cupieron aquí: prohibido subirlas
const BACKUP_DAY  = "__zonga_backup_day__";  // último día con copia de seguridad hecha
const MIGRATED    = "__zonga_kv_migrated__"; // "1" cuando ya se migró de chunks-v1
const COMPACTED   = "__zonga_compacted__";   // { clave: rev del valor ANTES de comprimir } — lo deja zonga-storage.js

const PUSH_DEBOUNCE_MS = 700;
const PART_MAX_UNITS   = 250_000;  // ≈750 KB en UTF-8, con margen bajo el límite de 1 MiB
const TRASH_MAX_CHARS  = 400_000;
const BACKUP_KEEP_DAYS = 14;
const PUSH_CONCURRENCY = 4;

const origSet    = localStorage.setItem.bind(localStorage);
const origGet    = localStorage.getItem.bind(localStorage);
const origRemove = localStorage.removeItem.bind(localStorage);
const origClear  = localStorage.clear.bind(localStorage);

// ── Device ID estable por navegador ──
let deviceId = origGet(DEVICE_KEY);
if (!deviceId) {
  deviceId = (crypto.randomUUID?.() || String(Date.now()) + Math.random().toString(36).slice(2));
  origSet(DEVICE_KEY, deviceId);
}

let currentUid       = null;
let unsubscribe      = null;
let pushTimer        = null;
let applyingRemote   = false;   // mientras aplicamos la nube no queremos marcar "sucio"
let reconciled       = false;   // ¿ya hubo una foto CONFIRMADA POR EL SERVIDOR?
let pushInFlight     = false;
let pushPendingAfter = false;
let backupDoneThisSession = false;
let reconcileLock    = null;   // promesa en curso, para no solapar reconciliaciones

/* ══════════════════════════════════════════════════════════════════════════
   2. Utilidades de estado persistido
   ══════════════════════════════════════════════════════════════════════════ */

function readMap(key) {
  try { const o = JSON.parse(origGet(key) || "{}"); return (o && typeof o === "object") ? o : {}; }
  catch { return {}; }
}
function writeMap(key, obj) {
  try { origSet(key, JSON.stringify(obj)); } catch { /* si no cabe ni esto, seguimos en memoria */ }
}

let meta    = readMap(META_KEY);
let dirty   = readMap(DIRTY_KEY);
let pre     = readMap(PRE_KEY);
/* Claves que la nube tiene completas pero que NO caben en este dispositivo.
   Mientras estén aquí, este dispositivo tiene una copia incompleta o vieja de
   ellas y tiene PROHIBIDO subirlas: así una tablet o un portátil con la memoria
   llena no puede recortar los datos buenos de la nube. */
let blocked = readMap(BLOCKED_KEY);
/* zonga-storage.js comprime claves grandes al cargar la página, ANTES de que
   este módulo parchee localStorage, así que esa reescritura pasa desapercibida.
   Deja aquí el hash del valor original para que podamos reconocer que el valor
   local y el de la nube son el MISMO dato (solo que comprimido) y subir el
   comprimido en vez de machacarlo. Sin esto entraríamos en un bucle: bajar sin
   comprimir → comprimir → bajar sin comprimir… */
let compacted = readMap(COMPACTED);

const saveMeta    = () => writeMap(META_KEY, meta);
const saveDirty   = () => writeMap(DIRTY_KEY, dirty);
const savePre     = () => writeMap(PRE_KEY, pre);
const saveBlocked = () => writeMap(BLOCKED_KEY, blocked);

/* Hash rápido (FNV-1a) + longitud. Sirve para detectar cambios y para saber si
   un conjunto de partes pertenece a la misma versión del valor. */
function revOf(s) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return (h >>> 0).toString(36) + "-" + s.length.toString(36);
}

/* ID de documento determinista a partir de la clave.
   Prefijo "k_" para no chocar con los ids reservados de Firestore (__.*__). */
const SAFE = /[A-Za-z0-9._-]/;
function encId(key) {
  let out = "k_";
  const bytes = new TextEncoder().encode(key);
  for (const b of bytes) {
    const c = String.fromCharCode(b);
    out += SAFE.test(c) ? c : "~" + b.toString(16).padStart(2, "0");
  }
  // Firestore admite 1500 bytes de id; con margen de sobra, pero por si acaso.
  return out.length <= 1200 ? out : out.slice(0, 1180) + "~h" + revOf(key);
}
const partId = (base, i) => (i === 0 ? base : base + "--p" + i);

/* Partir un valor largo sin romper pares subrogados (emojis). */
function splitValue(v) {
  if (v.length <= PART_MAX_UNITS) return [v];
  const parts = [];
  let i = 0;
  while (i < v.length) {
    let end = Math.min(i + PART_MAX_UNITS, v.length);
    if (end < v.length) {
      const c = v.charCodeAt(end - 1);
      if (c >= 0xd800 && c <= 0xdbff) end--; // no cortar entre subrogados
    }
    parts.push(v.slice(i, end));
    i = end;
  }
  return parts;
}

/* Ejecuta tareas con concurrencia limitada (no saturar la conexión del móvil). */
async function pool(items, limit, fn) {
  const queue = items.slice();
  const workers = Array.from({ length: Math.min(limit, queue.length) }, async () => {
    while (queue.length) await fn(queue.shift());
  });
  await Promise.all(workers);
}

/* ══════════════════════════════════════════════════════════════════════════
   3. Lectura: agrupar documentos remotos en { clave: {v, ts, rev, del, dev} }
   ══════════════════════════════════════════════════════════════════════════ */

// Ids de documentos que existen ahora mismo en la nube (para limpiar partes sobrantes).
let remoteDocIds = new Set();

/* Reloj lógico. Los relojes del PC y del MacBook no van sincronizados: si el
   del portátil va 5 minutos atrasado, sus ediciones tendrían siempre un ts
   menor y perderían SIEMPRE. Guardando el ts más alto que hemos visto y
   escribiendo siempre por encima, una edición hecha DESPUÉS de leer la nube
   gana aunque el reloj local vaya atrasado. */
let maxRemoteTs = 0;

function groupRemote(docs) {
  const heads = new Map();   // clave -> datos de la parte 0
  const parts = new Map();   // clave -> Map(indice -> {rev, v})
  remoteDocIds = new Set();

  docs.forEach(d => {
    remoteDocIds.add(d.id);
    const x = d.data() || {};
    const k = x.k;
    if (typeof k !== "string" || skipKey(k)) return;
    const ts = Number(x.ts || 0);
    if (ts > maxRemoteTs) maxRemoteTs = ts;
    const i = Number(x.i || 0);
    if (i === 0) heads.set(k, x);
    else {
      if (!parts.has(k)) parts.set(k, new Map());
      parts.get(k).set(i, x);
    }
  });

  const out = new Map();
  heads.forEach((h, k) => {
    const ts = Number(h.ts || 0);
    if (h.del === true) { out.set(k, { del: true, ts, dev: h.dev || null, rev: "del" }); return; }
    const n = Math.max(1, Number(h.n || 1));
    const rev = String(h.rev || "");
    if (typeof h.v !== "string") return;

    if (n === 1) { out.set(k, { v: h.v, ts, rev, dev: h.dev || null }); return; }

    // Multiparte: solo vale si están TODAS las partes y todas con el mismo rev.
    const pm = parts.get(k);
    if (!pm) return;
    let value = h.v;
    for (let i = 1; i < n; i++) {
      const p = pm.get(i);
      if (!p || String(p.rev) !== rev || typeof p.v !== "string") return; // incompleto → ignorar
      value += p.v;
    }
    if (revOf(value) !== rev) return; // reconstrucción corrupta → ignorar
    out.set(k, { v: value, ts, rev, dev: h.dev || null });
  });

  return out;
}

/* ══════════════════════════════════════════════════════════════════════════
   4. Escritura: subir una clave (con partes) o su lápida
   ══════════════════════════════════════════════════════════════════════════ */

async function deleteSurplusParts(uid, base, keepParts) {
  const dead = [];
  for (const id of remoteDocIds) {
    if (!id.startsWith(base + "--p")) continue;
    const idx = Number(id.slice((base + "--p").length));
    if (Number.isFinite(idx) && idx >= keepParts) dead.push(id);
  }
  if (!dead.length) return;
  await Promise.all(dead.map(id => deleteDoc(doc(db, "users", uid, "kv", id)).catch(() => {})));
  dead.forEach(id => remoteDocIds.delete(id));
}

async function pushKey(uid, key, ts) {
  const base = encId(key);
  const value = origGet(key);
  // Nunca por debajo de lo ya visto en la nube (ver `maxRemoteTs`).
  ts = Math.max(ts || Date.now(), maxRemoteTs + 1);
  maxRemoteTs = ts;

  if (value === null) {
    // Lápida: borrado explícito hecho por la app en este dispositivo.
    await setDoc(doc(db, "users", uid, "kv", base),
      { k: key, i: 0, n: 1, rev: "del", ts, dev: deviceId, del: true });
    await deleteSurplusParts(uid, base, 1);
    meta[key] = { ts, rev: "del", n: 1 };
    remoteDocIds.add(base);
    return;
  }

  const rev = revOf(value);
  const chunks = splitValue(value);

  // Las partes >0 PRIMERO; la cabecera (parte 0) al final: hasta que no está la
  // cabecera con este rev, ningún lector considera válida la nueva versión.
  await pool(chunks.map((v, i) => ({ v, i })).slice(1), PUSH_CONCURRENCY, async ({ v, i }) => {
    await setDoc(doc(db, "users", uid, "kv", partId(base, i)),
      { k: key, i, n: chunks.length, rev, ts, dev: deviceId, v });
    remoteDocIds.add(partId(base, i));
  });

  await setDoc(doc(db, "users", uid, "kv", base),
    { k: key, i: 0, n: chunks.length, rev, ts, dev: deviceId, v: chunks[0] });
  remoteDocIds.add(base);

  await deleteSurplusParts(uid, base, chunks.length);
  meta[key] = { ts, rev, n: chunks.length };
}

/* ══════════════════════════════════════════════════════════════════════════
   5. Papelera — nada se sobrescribe ni se borra sin dejar copia
   ══════════════════════════════════════════════════════════════════════════ */

async function toTrash(uid, key, value, reason) {
  if (typeof value !== "string" || !value.length) return;
  try {
    const truncated = value.length > TRASH_MAX_CHARS;
    await setDoc(doc(db, "users", uid, "trash", encId(key) + "_" + Date.now()), {
      k: key,
      v: truncated ? value.slice(0, TRASH_MAX_CHARS) : value,
      truncated,
      bytes: value.length,
      ts: Date.now(),
      dev: deviceId,
      reason,
    });
  } catch (e) { console.warn("[sync] papelera", key, e?.message || e); }
}

/* ══════════════════════════════════════════════════════════════════════════
   6. Aplicar la nube al localStorage (con control de cuota REAL)
   ══════════════════════════════════════════════════════════════════════════ */

function isQuotaError(e) {
  return !!e && (e.name === "QuotaExceededError" || e.name === "NS_ERROR_DOM_QUOTA_REACHED" ||
                 e.code === 22 || e.code === 1014);
}

let quotaWarned = false;
function warnQuota(key) {
  console.error("[sync] cuota llena al escribir", key);
  if (window.ZongaLS && typeof ZongaLS.warnQuotaFull === "function") { ZongaLS.warnQuotaFull(); return; }
  if (quotaWarned) return;
  quotaWarned = true;
  const show = () => {
    if (document.getElementById("__zonga_quota_banner__")) return;
    const el = document.createElement("div");
    el.id = "__zonga_quota_banner__";
    el.setAttribute("role", "alert");
    Object.assign(el.style, {
      position: "fixed", left: "0", right: "0", top: "0", zIndex: "2147483647",
      background: "#7a1212", color: "#fff",
      font: "600 13px/1.4 system-ui, -apple-system, 'Segoe UI', sans-serif",
      padding: "12px 44px 12px 16px", textAlign: "center",
    });
    el.textContent = "⚠ Este dispositivo no tiene espacio para bajar todos tus datos. " +
      "No se ha perdido nada en la nube, pero aquí verás información incompleta. " +
      "Libera espacio borrando fotos o entradas antiguas.";
    document.body.appendChild(el);
  };
  document.body ? show() : document.addEventListener("DOMContentLoaded", show);
}

/* Devuelve true si escribió; false si la cuota lo impidió (y entonces NO se
   toca `meta`, para que en la próxima sesión se vuelva a intentar y para que
   este dispositivo nunca crea que su copia incompleta es la buena). */
function applyValue(key, value) {
  try { origSet(key, value); return true; }
  catch (e) {
    if (isQuotaError(e)) {
      // Intento de rescate: compactar lo que ya hay y reintentar una vez.
      try { window.ZongaLS?.compact?.(); origSet(key, value); return true; } catch { /* sigue sin caber */ }
      warnQuota(key);
      return false;
    }
    console.warn("[sync] no se pudo escribir", key, e);
    return false;
  }
}

/* ══════════════════════════════════════════════════════════════════════════
   7. Reconciliación
   ══════════════════════════════════════════════════════════════════════════ */

function localKeys() {
  const s = new Set();
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (!skipKey(k)) s.add(k);
  }
  return s;
}

function markDirty(key, ts) {
  dirty[key] = Math.max(ts || Date.now(), dirty[key] || 0);
  saveDirty();
}

/* Resuelve una clave contra la nube. Devuelve true si cambió el localStorage. */
async function reconcileKey(uid, key, remote, preTs) {
  const local = origGet(key);
  const localMeta = meta[key] || null;
  const dirtyTs = dirty[key];

  // ── Caso A: la clave no está en la nube ──────────────────────────────────
  // NUNCA se borra por ausencia. Si la tenemos aquí, es que aún no ha subido.
  if (!remote) {
    if (local !== null) markDirty(key, dirtyTs || preTs || Date.now());
    return false;
  }

  // ── ¿Manda lo local? ─────────────────────────────────────────────────────
  // 0) Si esta clave no cupo aquí, nuestra copia es incompleta o vieja: la nube
  //    manda sin discusión y jamás subimos nada de ella.
  if (blocked[key]) { delete dirty[key]; saveDirty(); }

  // 0 bis) Lo local es exactamente lo de la nube, pero comprimido. Mismo dato,
  //    menos espacio: gana lo local y se sube el comprimido.
  else if (compacted[key] && local !== null && !remote.del && compacted[key] === revOf(remote.v)) {
    markDirty(key, Math.max(remote.ts + 1, Date.now()));
    delete compacted[key]; writeMap(COMPACTED, compacted);
    return false;
  }

  // 1) Cambio local hecho justo encima de ESTA versión de la nube: es
  //    causalmente posterior, gana aunque el reloj de este equipo vaya atrasado.
  else if (dirtyTs !== undefined && localMeta && localMeta.rev === remote.rev) return false;

  // 2) O simplemente es más nuevo por marca de tiempo.
  else if (dirtyTs && dirtyTs > remote.ts) return false;

  // 2) Escritura previa a reconciliar: solo gana si este dispositivo ya tenía
  //    EXACTAMENTE la versión que hay en la nube y la editó encima. Si el rev
  //    no coincide, lo local es estado semilla/desconocido y NO debe ganar
  //    (ese era el origen de la pérdida de datos diaria).
  if (preTs !== undefined) {
    const editedOnTopOfCloud = localMeta && localMeta.rev === remote.rev && local !== null;
    if (editedOnTopOfCloud) { markDirty(key, preTs); return false; }
    // Gana la nube: guardamos lo local en la papelera antes de pisarlo.
    if (local !== null && local !== remote.v) await toTrash(uid, key, local, "sobrescrito-por-nube");
  }

  // ── Manda la nube ────────────────────────────────────────────────────────
  // Lo pendiente de subir queda anulado por una version mas nueva: si no se
  // limpiara, la proxima subida reenviaria el valor viejo con su ts antiguo.
  if (dirtyTs !== undefined) { delete dirty[key]; saveDirty(); }

  if (remote.del) {
    if (local === null) { meta[key] = { ts: remote.ts, rev: "del", n: 1 }; return false; }
    await toTrash(uid, key, local, "borrado-en-otro-dispositivo");
    try { origRemove(key); } catch {}
    meta[key] = { ts: remote.ts, rev: "del", n: 1 };
    return true;
  }

  if (local === remote.v) { meta[key] = { ts: remote.ts, rev: remote.rev, n: 1 }; return false; }

  // Sobrescribimos un valor distinto que no viene de la nube → a la papelera,
  // salvo que ya lo hayamos guardado arriba o sea la carga inicial de un valor
  // que este dispositivo nunca tuvo.
  if (local !== null && preTs === undefined && (!localMeta || localMeta.rev !== revOf(local))) {
    await toTrash(uid, key, local, "reemplazado-por-version-mas-nueva");
  }

  const ok = applyValue(key, remote.v);
  if (ok) {
    meta[key] = { ts: remote.ts, rev: remote.rev, n: 1 };
    if (compacted[key]) { delete compacted[key]; writeMap(COMPACTED, compacted); }
    if (blocked[key]) { delete blocked[key]; saveBlocked(); }
  } else {
    // No cabe aquí. La nube conserva la versión buena; este dispositivo queda
    // marcado para no poder subir esta clave nunca en ese estado.
    blocked[key] = Date.now(); saveBlocked();
    delete meta[key];
  }
  return ok;
}

async function reconcile(uid, remoteMap) {
  // Un solo reconcile a la vez. Si llega otra foto mientras estamos aplicando,
  // se espera: dos pasadas solapadas dejarian `applyingRemote` en false a mitad
  // y las escrituras de la nube se marcarian como ediciones tuyas.
  while (reconcileLock) await reconcileLock;
  let liberar;
  reconcileLock = new Promise(r => { liberar = r; });
  applyingRemote = true;
  let changed = false;

  // Congelamos la cola pre-reconciliacion: lo que la app escriba MIENTRAS
  // reconciliamos ya es una edicion posterior a conocer la nube, asi que
  // despues se promociona a "pendiente de subir" en vez de descartarse.
  const frozenPre = pre;
  pre = {}; savePre();

  const keys = new Set([...remoteMap.keys(), ...localKeys(), ...Object.keys(frozenPre), ...Object.keys(dirty)]);

  for (const key of keys) {
    if (skipKey(key)) continue;
    try {
      if (await reconcileKey(uid, key, remoteMap.get(key) || null, frozenPre[key])) changed = true;
    } catch (e) { console.warn("[sync] reconcile", key, e); }
  }

  // Escrituras llegadas durante la reconciliacion: son reales, se suben.
  for (const [k, ts] of Object.entries(pre)) markDirty(k, ts);
  pre = {}; savePre();

  saveMeta();
  applyingRemote = false;
  reconcileLock = null; liberar();
  return changed;
}

/* ══════════════════════════════════════════════════════════════════════════
   8. Subida
   ══════════════════════════════════════════════════════════════════════════ */

async function pushNow(uid) {
  if (!uid || !reconciled) return;
  if (pushInFlight) { pushPendingAfter = true; return; }
  const pending = Object.entries(dirty);
  if (!pending.length) { maybeBackup(uid); return; }

  pushInFlight = true;
  const done = [];
  try {
    await pool(pending, PUSH_CONCURRENCY, async ([key, ts]) => {
      if (skipKey(key)) { done.push(key); return; }
      if (blocked[key]) {
        // Copia local incompleta por falta de espacio: subirla recortaría los
        // datos buenos de la nube. Se descarta la subida y se avisa.
        console.warn("[sync] no se sube", key, "— no cabe entero en este dispositivo");
        done.push(key);
        return;
      }
      try {
        await pushKey(uid, key, ts || Date.now());
        done.push(key);
      } catch (e) {
        console.error("[sync] no se pudo subir", key, e);
        showPushErrorToast(e);
      }
    });

    // Solo se limpia lo que se confirmó. Lo que falló se reintenta (y sobrevive
    // a un refresco, porque `dirty` vive en localStorage).
    done.forEach(k => { if (dirty[k] && dirty[k] <= (meta[k]?.ts || Infinity)) delete dirty[k]; });
    saveDirty(); saveMeta();

    await setDoc(doc(db, "users", uid), {
      updatedAt: Date.now(), lastDevice: deviceId, origin: location.hostname, schema: "kv-v2",
    }, { merge: true }).catch(() => {});

    if (done.length) hidePushErrorToast();
    maybeBackup(uid);
  } finally {
    pushInFlight = false;
    if (pushPendingAfter) { pushPendingAfter = false; schedulePush(); }
  }
}

function schedulePush() {
  if (!currentUid || !reconciled) return;
  clearTimeout(pushTimer);
  pushTimer = setTimeout(() => pushNow(currentUid), PUSH_DEBOUNCE_MS);
}

/* ══════════════════════════════════════════════════════════════════════════
   9. Copias de seguridad diarias (red de seguridad final)
   ══════════════════════════════════════════════════════════════════════════ */

const dayKey = () => new Date().toISOString().slice(0, 10);

async function maybeBackup(uid) {
  if (backupDoneThisSession) return;
  if (origGet(BACKUP_DAY) === dayKey()) { backupDoneThisSession = true; return; }
  backupDoneThisSession = true;
  try {
    const data = {};
    for (const k of localKeys()) { const v = origGet(k); if (typeof v === "string") data[k] = v; }
    if (!Object.keys(data).length) return;

    const day = dayKey();
    const json = JSON.stringify(data);
    const parts = splitValue(json);
    const batchWrites = parts.map((v, i) =>
      setDoc(doc(db, "users", uid, "backups", day, "parts", String(i)), { i, n: parts.length, v }));
    await Promise.all(batchWrites);
    await setDoc(doc(db, "users", uid, "backups", day), {
      day, ts: Date.now(), dev: deviceId, n: parts.length, keys: Object.keys(data).length, bytes: json.length,
    });

    origSet(BACKUP_DAY, day);
    pruneBackups(uid);
  } catch (e) { console.warn("[sync] copia de seguridad", e?.message || e); }
}

async function pruneBackups(uid) {
  try {
    const snap = await getDocs(collection(db, "users", uid, "backups"));
    const cutoff = new Date(Date.now() - BACKUP_KEEP_DAYS * 86400000).toISOString().slice(0, 10);
    for (const d of snap.docs) {
      if (d.id >= cutoff) continue;
      const n = Number(d.data()?.n || 0);
      for (let i = 0; i < n; i++) await deleteDoc(doc(db, "users", uid, "backups", d.id, "parts", String(i))).catch(() => {});
      await deleteDoc(d.ref).catch(() => {});
    }
  } catch (e) { console.warn("[sync] limpieza de copias", e?.message || e); }
}

async function listBackups() {
  if (!currentUid) return [];
  const snap = await getDocs(collection(db, "users", currentUid, "backups"));
  return snap.docs.map(d => ({ day: d.id, ...(d.data() || {}) })).sort((a, b) => (a.day < b.day ? 1 : -1));
}

async function readBackup(day) {
  if (!currentUid) throw new Error("sin sesión");
  const head = await getDoc(doc(db, "users", currentUid, "backups", day));
  if (!head.exists()) throw new Error("no existe esa copia");
  const n = Math.max(1, Number(head.data()?.n || 1));
  let json = "";
  for (let i = 0; i < n; i++) {
    const p = await getDoc(doc(db, "users", currentUid, "backups", day, "parts", String(i)));
    if (!p.exists()) throw new Error("copia incompleta (falta la parte " + i + ")");
    json += String(p.data()?.v || "");
  }
  return JSON.parse(json);
}

/* Restaura una copia: escribe las claves en local y las marca para subir.
   No borra nada que la copia no tuviera — restaurar nunca puede quitar datos. */
async function restoreBackup(day) {
  if (!currentUid) throw new Error("sin sesión");
  const data = await readBackup(day);
  let n = 0;
  for (const [k, v] of Object.entries(data)) {
    if (skipKey(k) || typeof v !== "string") continue;
    if (origGet(k) === v) continue;
    const prev = origGet(k);
    if (prev !== null) await toTrash(currentUid, k, prev, "reemplazado-al-restaurar-" + day);
    if (applyValue(k, v)) { markDirty(k, Date.now()); n++; }
  }
  saveDirty();
  await pushNow(currentUid);
  return n;
}

/* ══════════════════════════════════════════════════════════════════════════
   10. Migración desde chunks-v1
   ══════════════════════════════════════════════════════════════════════════
   Se ejecuta UNA vez por dispositivo, ya con la foto de `kv` en la mano:

   · Lo que ya existe en `kv` MANDA. Nunca se sube un chunk viejo encima: ese
     era justo el error que borraba datos (el segundo dispositivo migraba su
     copia antigua encima de la buena).
   · Lo que solo estaba en los chunks y no está ni en `kv` ni en local se
     RECUPERA: se escribe en local y se marca para subir. Así no se pierde
     nada de lo que hubiera quedado atrapado en el formato viejo.
   · La colección `chunks` NO se borra: queda congelada como copia histórica.
   · Lo local que no esté en `kv` lo sube igualmente la regla general de
     reconcileKey ("si no está en la nube, no se borra: se sube").             */
async function migrateFromChunks(uid, remoteMap) {
  if (origGet(MIGRATED) === "1") return;
  try {
    const snap = await getDocs(collection(db, "users", uid, "chunks"));
    const old = {};
    snap.docs.forEach(d => {
      const x = d.data() || {};
      if (x.data && typeof x.data === "object") Object.assign(old, x.data);
    });

    // Formato aún más antiguo: users/{uid}.localStorage
    if (!Object.keys(old).length) {
      const legacy = await getDoc(doc(db, "users", uid)).catch(() => null);
      const ld = legacy?.exists() ? (legacy.data() || {}) : {};
      if (ld.localStorage && typeof ld.localStorage === "object") Object.assign(old, ld.localStorage);
    }

    let recovered = 0;
    for (const [k, v] of Object.entries(old)) {
      if (skipKey(k) || typeof v !== "string") continue;
      if (remoteMap.has(k)) continue;      // `kv` es la verdad, no la pisamos
      if (origGet(k) !== null) continue;   // ya está aquí; la regla general lo sube
      if (applyValue(k, v)) { markDirty(k, Date.now()); recovered++; }
    }

    origSet(MIGRATED, "1");
    if (recovered) console.info("[sync] recuperadas del formato antiguo:", recovered, "claves");
  } catch (e) { console.warn("[sync] migración", e?.message || e); }
}

/* ══════════════════════════════════════════════════════════════════════════
   11. Avisos en pantalla
   ══════════════════════════════════════════════════════════════════════════ */

function showSyncToast(msg) {
  const id = "__zonga_sync_toast__";
  document.getElementById(id)?.remove();
  const t = document.createElement("div");
  t.id = id;
  t.textContent = msg;
  Object.assign(t.style, {
    position: "fixed", left: "50%", top: "20px", transform: "translateX(-50%)",
    background: "#1a1a1a", color: "#fff", padding: "10px 18px", borderRadius: "999px",
    font: "600 13px 'DM Sans', system-ui, sans-serif", zIndex: 100002,
    boxShadow: "0 8px 24px rgba(0,0,0,0.25)", opacity: "0", transition: "opacity .25s ease"
  });
  document.body.appendChild(t);
  requestAnimationFrame(() => t.style.opacity = "1");
  setTimeout(() => { t.style.opacity = "0"; setTimeout(() => t.remove(), 300); }, 1800);
}

let pushErrorEl = null;
function showPushErrorToast(err) {
  const detail = String(err?.message || err || "Error desconocido");
  if (pushErrorEl) {
    const d = pushErrorEl.querySelector("[data-detail]");
    if (d) d.textContent = detail;
    return;
  }
  const el = document.createElement("div");
  el.id = "__zonga_sync_error__";
  Object.assign(el.style, {
    position: "fixed", right: "16px", bottom: "16px", maxWidth: "320px",
    background: "#7a1212", color: "#fff", padding: "12px 14px", borderRadius: "10px",
    font: "500 13px 'DM Sans', system-ui, sans-serif", zIndex: 100003, boxShadow: "0 8px 24px rgba(0,0,0,0.35)"
  });
  el.innerHTML = `
    <div style="font-weight:700;margin-bottom:4px">⚠ Sincronización pendiente</div>
    <div data-detail style="font-size:12px;opacity:.9;word-break:break-word"></div>
    <div style="font-size:11px;opacity:.75;margin-top:8px">
      Tus datos están guardados en este dispositivo y la cola de subida sobrevive a un refresco.
      Se reintentará solo.
    </div>
    <button data-retry style="margin-top:8px;background:#fff;color:#7a1212;border:0;padding:6px 10px;border-radius:6px;font:700 12px 'DM Sans',system-ui,sans-serif;cursor:pointer">
      Reintentar ahora
    </button>`;
  el.querySelector("[data-detail]").textContent = detail;
  el.querySelector("[data-retry]").addEventListener("click", () => currentUid && pushNow(currentUid));
  document.body.appendChild(el);
  pushErrorEl = el;
}
function hidePushErrorToast() { pushErrorEl?.remove(); pushErrorEl = null; }

/* ══════════════════════════════════════════════════════════════════════════
   12. Interceptar localStorage
   ══════════════════════════════════════════════════════════════════════════ */

function noteWrite(k, changed) {
  if (skipKey(k) || !changed || applyingRemote) return;
  const ts = Date.now();
  if (reconciled) { markDirty(k, ts); schedulePush(); }
  else { pre[k] = ts; savePre(); }   // aún no sabemos si esto es dato real o semilla
}

localStorage.setItem = function (k, v) {
  const changed = origGet(k) !== v;
  origSet(k, v);            // si revienta por cuota, que lo vea la app (ZongaLS lo gestiona)
  noteWrite(k, changed);
};
localStorage.removeItem = function (k) {
  const existed = origGet(k) !== null;
  origRemove(k);
  noteWrite(k, existed);
};
/* `clear()` borraría TODO en todos los dispositivos. Ninguna herramienta lo usa
   hoy, así que se bloquea la propagación: se limpia en local pero no se suben
   lápidas. Si algún día hace falta, que sea explícito y con confirmación. */
localStorage.clear = function () {
  console.warn("[sync] localStorage.clear() no se propaga a la nube por seguridad");
  origClear();
};

/* ══════════════════════════════════════════════════════════════════════════
   13. Arranque: auth + listener
   ══════════════════════════════════════════════════════════════════════════ */

onAuthStateChanged(auth, (user) => {
  if (unsubscribe) { unsubscribe(); unsubscribe = null; }
  currentUid = user ? user.uid : null;
  reconciled = false;
  if (!user) return;

  unsubscribe = onSnapshot(
    collection(db, "users", user.uid, "kv"),
    { includeMetadataChanges: true },
    async (snap) => {
      const fromCache = !!snap.metadata?.fromCache;

      // Nunca reconciliamos contra la caché fría: podría ser un "vacío" falso y
      // acabaríamos subiendo estado semilla encima de los datos buenos.
      if (!reconciled && fromCache) return;

      const remoteMap = groupRemote(snap.docs);

      if (!reconciled) {
        // La migración va ANTES de reconciliar y ya con `kv` delante, para que
        // el formato viejo solo pueda añadir lo que falte, nunca sobrescribir.
        await migrateFromChunks(user.uid, remoteMap);
        const changed = await reconcile(user.uid, remoteMap);
        reconciled = true;
        window.dispatchEvent(new CustomEvent("zonga:sync", { detail: { initial: true } }));
        pushNow(user.uid);
        // Rehidratar la app con lo que acaba de bajar de la nube.
        if (changed) setTimeout(() => location.reload(), 150);
        return;
      }

      // Cambios posteriores. Si vienen de este mismo dispositivo, nada que hacer.
      let foreign = false;
      remoteMap.forEach((r, k) => {
        if (r.dev !== deviceId && (meta[k]?.rev !== r.rev)) foreign = true;
      });
      if (!foreign) return;

      const changed = await reconcile(user.uid, remoteMap);
      if (changed) {
        window.dispatchEvent(new CustomEvent("zonga:sync", { detail: { initial: false } }));
        showSyncToast("☁ Datos actualizados desde otro dispositivo");
        setTimeout(() => location.reload(), 900);
      }
    },
    (err) => { console.warn("[sync] onSnapshot", err); showPushErrorToast(err); }
  );
});

// Al cerrar/refrescar: intentar vaciar la cola. Aunque no dé tiempo, `dirty`
// está en localStorage y se sube en la siguiente carga — nada se pierde.
window.addEventListener("beforeunload", () => { if (currentUid && reconciled) pushNow(currentUid); });
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden" && currentUid && reconciled) pushNow(currentUid);
});
window.addEventListener("online", () => currentUid && reconciled && pushNow(currentUid));

/* ══════════════════════════════════════════════════════════════════════════
   14. API pública
   ══════════════════════════════════════════════════════════════════════════ */

window.__zongaSync = {
  deviceId,
  schema: "kv-v2",
  forcePush: () => currentUid && reconciled && pushNow(currentUid),
  /* Guarda el valor actual de una clave en la papelera de la nube ANTES de que
     quien llama la borre o la modifique. Se usa en las limpiezas destructivas
     (zonga-cleanup.js) para que todo borrado siga siendo reversible desde
     /copias/. Espera a tener sesión para no perder la copia. */
  stash: async (key, motivo) => {
    for (let i = 0; i < 60 && !currentUid; i++) await new Promise(r => setTimeout(r, 250));
    if (!currentUid) throw new Error("sin sesión: no se pudo guardar la copia");
    const v = origGet(key);
    if (v === null) return false;
    await toTrash(currentUid, key, v, motivo || "copia-previa");
    return true;
  },
  listBackups,
  readBackup,
  restoreBackup,
  listTrash: async () => {
    if (!currentUid) return [];
    const snap = await getDocs(collection(db, "users", currentUid, "trash"));
    return snap.docs.map(d => ({ id: d.id, ...(d.data() || {}) })).sort((a, b) => b.ts - a.ts);
  },
  restoreTrash: async (id) => {
    if (!currentUid) throw new Error("sin sesión");
    const d = await getDoc(doc(db, "users", currentUid, "trash", id));
    if (!d.exists()) throw new Error("no existe");
    const { k, v } = d.data() || {};
    if (!k || typeof v !== "string") throw new Error("entrada inválida");
    const prev = origGet(k);
    if (prev !== null) await toTrash(currentUid, k, prev, "reemplazado-al-restaurar-papelera");
    if (!applyValue(k, v)) throw new Error("no cabe en este dispositivo");
    markDirty(k, Date.now());
    await pushNow(currentUid);
    return k;
  },
  inspect: () => ({
    deviceId, uid: currentUid, reconciled,
    pendientes: Object.keys(dirty),
    bloqueadasPorEspacio: Object.keys(blocked),
    prePull: Object.keys(pre),
    claves: [...localKeys()],
    bytes: [...localKeys()].reduce((n, k) => n + (origGet(k)?.length || 0), 0),
  }),
};
