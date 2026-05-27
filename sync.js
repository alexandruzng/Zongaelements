/* Zonga Sync — sincronización en tiempo real entre dispositivos
   Cárgalo en cualquier herramienta:  <script type="module" src="/sync.js"></script>
   Requiere que el usuario esté autenticado (auth se hace en index.html).

   Estrategia de almacenamiento:
   - El snapshot del localStorage se parte en "chunks" y cada chunk se guarda
     en un documento dentro de la subcolección `users/{uid}/chunks`.
   - Esto evita el límite duro de 1 MiB por documento de Firestore, que
     antes hacía que los pushes fallaran en silencio cuando los datos crecían.
   - Se mantiene compatibilidad con el formato antiguo (`users/{uid}.localStorage`):
     si existe y la subcolección está vacía, se migra al primer arranque.
*/
import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-auth.js";
import {
  doc, collection, setDoc, deleteDoc, getDoc, getDocs, onSnapshot
} from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";

const SKIP_PREFIXES = ["__zonga", "firebase:"];
const skipKey = (k) => !k || SKIP_PREFIXES.some(p => k.startsWith(p));

const DEVICE_KEY = "__zonga_device_id__";
const LOCAL_TS_KEY = "__zonga_local_ts__";
const REMOTE_KEYS_KEY = "__zonga_remote_keys__";
const PUSH_DEBOUNCE_MS = 800;

// Margen por debajo del límite real (~1 MiB) para dejar sitio a metadatos.
const CHUNK_MAX_BYTES = 700_000;

// ── Device ID estable por navegador ──
let deviceId = localStorage.getItem(DEVICE_KEY);
if (!deviceId) {
  deviceId = (crypto.randomUUID?.() || String(Date.now()) + Math.random().toString(36).slice(2));
  localStorage.setItem(DEVICE_KEY, deviceId);
}

let currentUid = null;
let unsubscribe = null;
let pushTimer = null;
let suppressPush = false;
let initialPullDone = false;
let pushInFlight = false;
let pushPendingAfter = false;

const origSet = localStorage.setItem.bind(localStorage);
const origRemove = localStorage.removeItem.bind(localStorage);
const origClear = localStorage.clear.bind(localStorage);

// ── Snapshot de localStorage filtrado ──
function snapshot() {
  const data = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (skipKey(k)) continue;
    data[k] = localStorage.getItem(k);
  }
  return data;
}

// ── Reparto en chunks que respeten el límite de Firestore ──
function buildChunks(data) {
  const chunks = [{}];
  let curSize = 2; // {}
  const entries = Object.entries(data);
  // Ordenar por tamaño descendente para empaquetar mejor las claves grandes.
  entries.sort((a, b) => (b[1]?.length || 0) - (a[1]?.length || 0));

  for (const [k, v] of entries) {
    if (typeof v !== "string") continue;
    const pieceSize = JSON.stringify(k).length + JSON.stringify(v).length + 2; // "k":"v",
    if (pieceSize > CHUNK_MAX_BYTES) {
      // Una sola clave es más grande que un chunk completo: no se puede
      // sincronizar entera. La metemos sola en su propio chunk para no
      // bloquear el resto y avisamos al usuario.
      const lone = {};
      lone[k] = v;
      chunks.push(lone);
      chunks.push({});
      curSize = 2;
      showPushErrorToast(new Error(`La clave "${k}" (${Math.round(v.length / 1024)} KB) supera el límite de un documento de Firestore. Se intentará sincronizar igual.`));
      continue;
    }
    if (curSize + pieceSize > CHUNK_MAX_BYTES) {
      chunks.push({});
      curSize = 2;
    }
    chunks[chunks.length - 1][k] = v;
    curSize += pieceSize;
  }
  // Quitar chunks vacíos al final
  while (chunks.length > 1 && Object.keys(chunks[chunks.length - 1]).length === 0) chunks.pop();
  return chunks;
}

// ── Push a Firestore (subcolección de chunks) ──
async function pushNow(uid) {
  if (pushInFlight) { pushPendingAfter = true; return; }
  pushInFlight = true;
  try {
    const chunks = buildChunks(snapshot());
    const ts = Date.now();

    await Promise.all(chunks.map((data, i) =>
      setDoc(doc(db, "users", uid, "chunks", String(i)), {
        data,
        index: i,
        totalChunks: chunks.length,
        updatedAt: ts,
        lastDevice: deviceId,
      })
    ));

    // Metadatos en el doc raíz (útil para depurar y para apps externas).
    await setDoc(doc(db, "users", uid), {
      updatedAt: ts,
      origin: location.hostname,
      lastDevice: deviceId,
      totalChunks: chunks.length,
      schema: "chunks-v1",
    }, { merge: true });

    // Borrar chunks sobrantes si esta vez ocupamos menos.
    try {
      const existing = await getDocs(collection(db, "users", uid, "chunks"));
      await Promise.all(
        existing.docs
          .filter(d => {
            const n = Number(d.id);
            return Number.isFinite(n) && n >= chunks.length;
          })
          .map(d => deleteDoc(d.ref))
      );
    } catch (e) { console.warn("[sync] cleanup chunks", e); }

    hidePushErrorToast();
  } catch (e) {
    console.error("[sync] push failed", e);
    showPushErrorToast(e);
  } finally {
    pushInFlight = false;
    if (pushPendingAfter) {
      pushPendingAfter = false;
      schedulePush();
    }
  }
}

function schedulePush() {
  if (!currentUid || suppressPush) return;
  clearTimeout(pushTimer);
  pushTimer = setTimeout(() => pushNow(currentUid), PUSH_DEBOUNCE_MS);
}

// ── Aplicar datos remotos al localStorage local ──
function applyRemote(remoteData) {
  if (!remoteData || typeof remoteData !== "object") return false;
  suppressPush = true;
  let changed = false;

  const prevRemoteKeys = (() => {
    try { return new Set(JSON.parse(localStorage.getItem(REMOTE_KEYS_KEY) || "[]")); }
    catch { return new Set(); }
  })();

  const localKeys = new Set();
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (!skipKey(k)) localKeys.add(k);
  }

  // Crear / actualizar
  Object.keys(remoteData).forEach(k => {
    if (skipKey(k)) return;
    const v = remoteData[k];
    if (typeof v !== "string") return;
    if (localStorage.getItem(k) !== v) {
      try { origSet(k, v); changed = true; } catch {}
    }
    localKeys.delete(k);
  });

  // Borrar SOLO las claves que existían en el remoto anterior y ya no están:
  // significa que otro dispositivo las eliminó de verdad. Las claves locales
  // que nunca llegaron al remoto (p. ej. porque el push falló) se conservan,
  // así un pull no destruye trabajo no sincronizado.
  localKeys.forEach(k => {
    if (prevRemoteKeys.has(k)) {
      try { origRemove(k); changed = true; } catch {}
    }
  });

  // Persistir el conjunto de claves del remoto para la próxima comparación.
  try {
    const remoteKeyList = Object.keys(remoteData).filter(k => !skipKey(k));
    origSet(REMOTE_KEYS_KEY, JSON.stringify(remoteKeyList));
  } catch {}

  suppressPush = false;
  return changed;
}

// ── Toasts ──
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
    boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
    opacity: "0", transition: "opacity .25s ease"
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
    font: "500 13px 'DM Sans', system-ui, sans-serif", zIndex: 100003,
    boxShadow: "0 8px 24px rgba(0,0,0,0.35)", cursor: "default"
  });
  el.innerHTML = `
    <div style="font-weight:700;margin-bottom:4px">⚠ Sincronización fallida</div>
    <div data-detail style="font-size:12px;opacity:.9;word-break:break-word"></div>
    <div style="font-size:11px;opacity:.75;margin-top:8px">
      Tus datos están a salvo en este dispositivo pero NO se están subiendo a la nube.
      Se reintentará automáticamente.
    </div>
    <button data-retry style="margin-top:8px;background:#fff;color:#7a1212;border:0;padding:6px 10px;border-radius:6px;font:700 12px 'DM Sans',system-ui,sans-serif;cursor:pointer">
      Reintentar ahora
    </button>
  `;
  el.querySelector("[data-detail]").textContent = detail;
  el.querySelector("[data-retry]").addEventListener("click", () => {
    if (currentUid) pushNow(currentUid);
  });
  document.body.appendChild(el);
  pushErrorEl = el;
}
function hidePushErrorToast() {
  if (pushErrorEl) { pushErrorEl.remove(); pushErrorEl = null; }
}

// ── Patch de localStorage para detectar escrituras y empujar ──
function bumpLocalTs() { try { origSet(LOCAL_TS_KEY, String(Date.now())); } catch {} }

localStorage.setItem = function (k, v) {
  origSet(k, v);
  if (!skipKey(k)) { bumpLocalTs(); schedulePush(); }
};
localStorage.removeItem = function (k) {
  origRemove(k);
  if (!skipKey(k)) { bumpLocalTs(); schedulePush(); }
};
localStorage.clear = function () {
  origClear();
  bumpLocalTs();
  schedulePush();
};

// ── Agregar chunks remotos en un solo objeto + metadata ──
function aggregateChunks(docs) {
  const remote = {};
  let latestTs = 0;
  let lastDev = null;
  docs.forEach(d => {
    const x = d.data() || {};
    if (x.data && typeof x.data === "object") Object.assign(remote, x.data);
    const ts = Number(x.updatedAt || 0);
    if (ts > latestTs) { latestTs = ts; lastDev = x.lastDevice || null; }
  });
  return { remote, latestTs, lastDev };
}

// ── Listener auth + onSnapshot ──
onAuthStateChanged(auth, (user) => {
  if (unsubscribe) { unsubscribe(); unsubscribe = null; }
  currentUid = user ? user.uid : null;
  initialPullDone = false;

  if (!user) return;

  unsubscribe = onSnapshot(
    collection(db, "users", user.uid, "chunks"),
    async (snap) => {
      let { remote, latestTs, lastDev } = aggregateChunks(snap.docs);

      // Sin chunks: o es un usuario nuevo o tiene datos en el formato antiguo.
      if (snap.empty) {
        try {
          const legacy = await getDoc(doc(db, "users", user.uid));
          const ld = legacy.exists() ? (legacy.data() || {}) : {};
          if (ld.localStorage && typeof ld.localStorage === "object") {
            remote = ld.localStorage;
            latestTs = Number(ld.updatedAt || 0);
            lastDev = ld.lastDevice || null;
          } else {
            // Primera vez del usuario: subir lo que haya local.
            if (!initialPullDone) { initialPullDone = true; pushNow(user.uid); }
            return;
          }
        } catch (e) {
          console.warn("[sync] legacy read", e);
          return;
        }
      }

      // Ignorar el snapshot si fue causado por este mismo dispositivo
      // (excepto la primera carga, donde sí queremos aplicar).
      if (initialPullDone && lastDev === deviceId) return;

      // Si lo local es más reciente que lo remoto, NO sobrescribimos: subimos local.
      const localTs = Number(localStorage.getItem(LOCAL_TS_KEY) || 0);
      if (localTs > latestTs) {
        initialPullDone = true;
        pushNow(user.uid);
        return;
      }

      const changed = applyRemote(remote);
      const wasInitial = !initialPullDone;
      initialPullDone = true;

      if (changed) {
        window.dispatchEvent(new CustomEvent("zonga:sync", {
          detail: { initial: wasInitial, fromDevice: lastDev }
        }));

        if (!wasInitial) {
          showSyncToast("☁ Datos actualizados desde otro dispositivo");
          setTimeout(() => location.reload(), 900);
        }
      }
    },
    (err) => {
      console.warn("[sync] onSnapshot", err);
      showPushErrorToast(err);
    }
  );
});

// Forzar push antes de cerrar
window.addEventListener("beforeunload", () => {
  if (currentUid) pushNow(currentUid);
});

// API mínima
window.__zongaSync = {
  forcePush: () => currentUid && pushNow(currentUid),
  deviceId,
  // Útil para depurar desde la consola.
  inspect: () => ({
    deviceId,
    uid: currentUid,
    localKeys: Object.keys(snapshot()),
    totalBytes: JSON.stringify(snapshot()).length,
  }),
};
