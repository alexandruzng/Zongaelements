import { auth, db } from "./firebase.js";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/12.12.1/firebase-auth.js";
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";

// ── Cloud sync (Firestore) ──
const SKIP_PREFIXES = ["__zonga", "firebase:", "__zonga_memory_meta__"];
const skipKey = (k) => SKIP_PREFIXES.some(p => k.startsWith(p));

async function pullFromCloud(uid) {
  try {
    const snap = await getDoc(doc(db, "users", uid));
    if (!snap.exists()) return false;
    const data = snap.data().localStorage || {};
    let count = 0;
    Object.keys(data).forEach(k => {
      try { localStorage.setItem(k, data[k]); count++; } catch {}
    });
    if (count > 0) console.log(`[zonga] Restauradas ${count} entradas desde la nube`);
    return true;
  } catch (e) { console.warn("pullFromCloud", e); return false; }
}

async function pushToCloud(uid) {
  try {
    const data = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (skipKey(k)) continue;
      data[k] = localStorage.getItem(k);
    }
    await setDoc(doc(db, "users", uid), {
      localStorage: data,
      updatedAt: Date.now(),
      origin: location.hostname
    }, { merge: true });
  } catch (e) { console.warn("pushToCloud", e); }
}

window.__zongaAuth = { user: null, db, pullFromCloud, pushToCloud };

// ── Overlay handling ──
const overlay = document.getElementById("authOverlay");
const errorEl = document.getElementById("authError");

const showErr = (msg, isOk = false) => {
  if (!errorEl) return;
  errorEl.textContent = msg;
  errorEl.classList.add("show");
  errorEl.classList.toggle("ok", isOk);
};
const clearErr = () => {
  if (!errorEl) return;
  errorEl.textContent = "";
  errorEl.classList.remove("show", "ok");
};

function setLoading(on) {
  document.querySelectorAll(".auth-btn, .auth-input").forEach(b => b.disabled = on);
  overlay?.classList.toggle("loading", on);
}

onAuthStateChanged(auth, async (user) => {
  window.__zongaAuth.user = user;
  if (user) {
    overlay?.classList.add("hidden");
    document.documentElement.classList.add("auth-ok");
    await pullFromCloud(user.uid);
    if (window.ZongaMemory?.onAuthChange) window.ZongaMemory.onAuthChange(user);
  } else {
    overlay?.classList.remove("hidden");
    document.documentElement.classList.remove("auth-ok");
    if (window.ZongaMemory?.onAuthChange) window.ZongaMemory.onAuthChange(null);
  }
});

// Periodic + on-storage push
window.addEventListener("storage", () => {
  const u = window.__zongaAuth.user;
  if (u) pushToCloud(u.uid);
});
setInterval(() => {
  const u = window.__zongaAuth.user;
  if (u) pushToCloud(u.uid);
}, 30000);
window.addEventListener("beforeunload", () => {
  const u = window.__zongaAuth.user;
  if (u) pushToCloud(u.uid);
});

// ── Tab switching ──
const tabLogin = document.getElementById("tabLogin");
const tabRegister = document.getElementById("tabRegister");
const formLogin = document.getElementById("formLogin");
const formRegister = document.getElementById("formRegister");

function showTab(which) {
  clearErr();
  if (which === "login") {
    tabLogin?.classList.add("active"); tabRegister?.classList.remove("active");
    formLogin?.classList.add("active"); formRegister?.classList.remove("active");
  } else {
    tabRegister?.classList.add("active"); tabLogin?.classList.remove("active");
    formRegister?.classList.add("active"); formLogin?.classList.remove("active");
  }
}
tabLogin?.addEventListener("click", () => showTab("login"));
tabRegister?.addEventListener("click", () => showTab("register"));

// ── Form submission ──
async function doLogin() {
  clearErr();
  const email = document.getElementById("emailInput").value.trim();
  const pass = document.getElementById("passInput").value;
  if (!email || !pass) return showErr("Introduce email y contraseña.");
  setLoading(true);
  try {
    await signInWithEmailAndPassword(auth, email, pass);
  } catch (e) {
    showErr(translateAuthError(e.code));
  } finally { setLoading(false); }
}

async function doRegister() {
  clearErr();
  const email = document.getElementById("emailInputReg").value.trim();
  const pass = document.getElementById("passInputReg").value;
  const pass2 = document.getElementById("passInputReg2").value;
  if (!email || !pass) return showErr("Introduce email y contraseña.");
  if (pass.length < 6) return showErr("La contraseña debe tener al menos 6 caracteres.");
  if (pass !== pass2) return showErr("Las contraseñas no coinciden.");
  setLoading(true);
  try {
    await createUserWithEmailAndPassword(auth, email, pass);
  } catch (e) {
    showErr(translateAuthError(e.code));
  } finally { setLoading(false); }
}

async function doGoogle() {
  clearErr();
  setLoading(true);
  try {
    await signInWithPopup(auth, new GoogleAuthProvider());
  } catch (e) {
    showErr(translateAuthError(e.code) || "Error al entrar con Google.");
  } finally { setLoading(false); }
}

document.getElementById("btnLogin")?.addEventListener("click", (e) => { e.preventDefault(); doLogin(); });
document.getElementById("btnRegister")?.addEventListener("click", (e) => { e.preventDefault(); doRegister(); });
document.getElementById("btnGoogle")?.addEventListener("click", (e) => { e.preventDefault(); doGoogle(); });
document.getElementById("btnGoogleReg")?.addEventListener("click", (e) => { e.preventDefault(); doGoogle(); });

// Submit on Enter
formLogin?.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); doLogin(); } });
formRegister?.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); doRegister(); } });

document.getElementById("btnReset")?.addEventListener("click", async (e) => {
  e.preventDefault(); clearErr();
  const email = document.getElementById("emailInput").value.trim();
  if (!email) return showErr("Introduce tu email primero para enviar el enlace de recuperación.");
  setLoading(true);
  try {
    await sendPasswordResetEmail(auth, email);
    showErr("Email de recuperación enviado. Revisa tu bandeja.", true);
  } catch (e) {
    showErr(translateAuthError(e.code));
  } finally { setLoading(false); }
});

// expose logout
window.zongaLogout = async () => {
  const u = window.__zongaAuth.user;
  if (u) await pushToCloud(u.uid);
  await signOut(auth);
};

function translateAuthError(code) {
  const map = {
    "auth/invalid-email": "Email no válido.",
    "auth/user-not-found": "No existe una cuenta con ese email.",
    "auth/wrong-password": "Contraseña incorrecta.",
    "auth/invalid-credential": "Email o contraseña incorrectos.",
    "auth/email-already-in-use": "Ya existe una cuenta con ese email. Inicia sesión.",
    "auth/weak-password": "La contraseña debe tener al menos 6 caracteres.",
    "auth/network-request-failed": "Sin conexión a internet.",
    "auth/popup-closed-by-user": "Cerraste la ventana antes de terminar.",
    "auth/popup-blocked": "El navegador bloqueó la ventana emergente. Permítela e inténtalo de nuevo.",
    "auth/too-many-requests": "Demasiados intentos. Espera unos minutos.",
    "auth/operation-not-allowed": "Este método de inicio de sesión no está habilitado en Firebase. Actívalo en la consola.",
    "auth/unauthorized-domain": "Dominio no autorizado en Firebase. Añade zongaelements.online en Authentication → Settings."
  };
  return map[code] || `Error: ${code}`;
}
