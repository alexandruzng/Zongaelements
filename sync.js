/* Zonga Sync — sincronización en tiempo real entre dispositivos
   Cárgalo en cualquier herramienta:  <script type="module" src="/sync.js"></script>
   Requiere que el usuario esté autenticado (auth se hace en index.html).
*/
import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-auth.js";
import { doc, setDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";

const SKIP_PREFIXES = ["__zonga", "firebase:"];
const skipKey = (k) => !k || SKIP_PREFIXES.some(p => k.startsWith(p));

const DEVICE_KEY = "__zonga_device_id__";
const PUSH_DEBOUNCE_MS = 800;

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

// ── Push a Firestore (debounced) ──
async function pushNow(uid) {
  try {
    await setDoc(doc(db, "users", uid), {
      localStorage: snapshot(),
      updatedAt: Date.now(),
      origin: location.hostname,
      lastDevice: deviceId
    }, { merge: true });
  } catch (e) { console.warn("[sync] push", e); }
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

  // Claves locales actuales (sin las que se omiten)
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

  // Borrar las que ya no existen en remoto (otro dispositivo las eliminó)
  localKeys.forEach(k => {
    try { origRemove(k); changed = true; } catch {}
  });

  suppressPush = false;
  return changed;
}

// ── Aviso visual breve cuando llega un cambio remoto ──
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

// ── Patch de localStorage para detectar escrituras y empujar ──
localStorage.setItem = function (k, v) {
  origSet(k, v);
  if (!skipKey(k)) schedulePush();
};
localStorage.removeItem = function (k) {
  origRemove(k);
  if (!skipKey(k)) schedulePush();
};
localStorage.clear = function () {
  origClear();
  schedulePush();
};

// ── Listener auth + onSnapshot ──
onAuthStateChanged(auth, (user) => {
  if (unsubscribe) { unsubscribe(); unsubscribe = null; }
  currentUid = user ? user.uid : null;
  initialPullDone = false;

  if (!user) return;

  unsubscribe = onSnapshot(
    doc(db, "users", user.uid),
    (snap) => {
      if (!snap.exists()) {
        // Primera vez: subir lo que haya local
        if (!initialPullDone) { initialPullDone = true; pushNow(user.uid); }
        return;
      }
      const data = snap.data() || {};

      // Ignorar el snapshot si fue causado por este mismo dispositivo
      // (excepto la primera carga, donde sí queremos aplicar)
      if (initialPullDone && data.lastDevice === deviceId) return;

      const changed = applyRemote(data.localStorage || {});
      const wasInitial = !initialPullDone;
      initialPullDone = true;

      if (changed) {
        // Notificar a la app — algunas herramientas escuchan este evento
        window.dispatchEvent(new CustomEvent("zonga:sync", {
          detail: { initial: wasInitial, fromDevice: data.lastDevice }
        }));

        // Si NO es la carga inicial, recargar para que la UI refleje el nuevo estado.
        // (En la inicial, la app aún no ha leído del localStorage y se renderizará bien.)
        if (!wasInitial) {
          showSyncToast("☁ Datos actualizados desde otro dispositivo");
          // Pequeño retraso para que se vea el toast
          setTimeout(() => location.reload(), 900);
        }
      } else if (!wasInitial) {
        // Nada que hacer
      }
    },
    (err) => console.warn("[sync] onSnapshot", err)
  );
});

// Forzar push antes de cerrar
window.addEventListener("beforeunload", () => {
  if (currentUid) {
    // setDoc es async pero el navegador suele dejar terminar la petición pendiente
    pushNow(currentUid);
  }
});

// API mínima
window.__zongaSync = {
  forcePush: () => currentUid && pushNow(currentUid),
  deviceId
};
