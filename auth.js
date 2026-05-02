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

// La sincronización con Firestore (pull/push/onSnapshot real-time) está en sync.js
window.__zongaAuth = { user: null, db };

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
    if (window.__zongaAuth.onAuthEnter) {
      try { await window.__zongaAuth.onAuthEnter(user); } catch (e) { console.warn(e); }
    }
    if (window.ZongaMemory?.onAuthChange) window.ZongaMemory.onAuthChange(user);
  } else {
    overlay?.classList.remove("hidden");
    document.documentElement.classList.remove("auth-ok");
    if (window.ZongaMemory?.onAuthChange) window.ZongaMemory.onAuthChange(null);
  }
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
  try { window.__zongaSync?.forcePush?.(); } catch {}
  await signOut(auth);
};

// ═══════════════════════════════════════════
// PROFILE WIDGET
// ═══════════════════════════════════════════
const profileWidget = document.getElementById("profileWidget");
const profileAvatar = document.getElementById("profileAvatar");
const profileAvatarText = document.getElementById("profileAvatarText");
const profileMenuAvatar = document.getElementById("profileMenuAvatar");
const profileMenuAvatarText = document.getElementById("profileMenuAvatarText");
const profileMenuName = document.getElementById("profileMenuName");
const profileMenuEmail = document.getElementById("profileMenuEmail");

let currentProfile = { name: "", photo: "" };

function initials(name, email) {
  const src = (name || email || "").trim();
  if (!src) return "?";
  const parts = src.split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return src.slice(0, 2).toUpperCase();
}

function renderAvatar(el, textEl, profile, email) {
  if (profile.photo) {
    el.style.backgroundImage = `url(${profile.photo})`;
    textEl.textContent = "";
  } else {
    el.style.backgroundImage = "";
    textEl.textContent = initials(profile.name, email);
  }
}

function renderProfile(user) {
  if (!user || !profileWidget) return;
  renderAvatar(profileAvatar, profileAvatarText, currentProfile, user.email);
  renderAvatar(profileMenuAvatar, profileMenuAvatarText, currentProfile, user.email);
  profileMenuName.textContent = currentProfile.name || user.displayName || (user.email ? user.email.split("@")[0] : "Usuario");
  profileMenuEmail.textContent = user.email || "";
}

async function loadProfile(uid) {
  try {
    const snap = await getDoc(doc(db, "users", uid));
    if (snap.exists()) {
      const p = snap.data().profile || {};
      currentProfile = { name: p.name || "", photo: p.photo || "" };
    } else {
      currentProfile = { name: "", photo: "" };
    }
  } catch (e) { console.warn("loadProfile", e); }
}

async function saveProfile(uid, profile) {
  try {
    await setDoc(doc(db, "users", uid), {
      profile: { name: profile.name || "", photo: profile.photo || "" },
      updatedAt: Date.now()
    }, { merge: true });
    currentProfile = { ...profile };
  } catch (e) { console.warn("saveProfile", e); throw e; }
}

// Toggle menu
profileAvatar?.addEventListener("click", (e) => {
  e.stopPropagation();
  profileWidget.classList.toggle("open");
});
document.addEventListener("click", (e) => {
  if (profileWidget && !profileWidget.contains(e.target)) {
    profileWidget.classList.remove("open");
  }
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") profileWidget?.classList.remove("open");
});

// Logout
document.getElementById("profileLogout")?.addEventListener("click", async () => {
  profileWidget.classList.remove("open");
  await window.zongaLogout();
});

// ── Profile edit modal ──
const profileModal = document.getElementById("profileModal");
const profileModalTitle = document.getElementById("profileModalTitle");
const profileModalSub = document.getElementById("profileModalSub");
const profileNameField = document.getElementById("profileNameField");
const profileNameInput = document.getElementById("profileNameInput");
const profilePhotoArea = document.getElementById("profilePhotoArea");
const profilePhotoPreview = document.getElementById("profilePhotoPreview");
const profilePhotoText = document.getElementById("profilePhotoText");
const profilePhotoInput = document.getElementById("profilePhotoInput");
const profileSaveBtn = document.getElementById("profileSave");

let modalDraft = { name: "", photo: "" };
let modalMode = "all"; // 'name' | 'photo' | 'all'

function openProfileModal(mode) {
  modalMode = mode;
  modalDraft = { ...currentProfile };
  profileNameInput.value = modalDraft.name || "";
  renderAvatar(profilePhotoPreview, profilePhotoText, modalDraft, window.__zongaAuth.user?.email);

  // Show/hide fields by mode
  if (mode === "name") {
    profileModalTitle.textContent = "Cambiar nombre";
    profileModalSub.textContent = "Este es el nombre que verás en tu perfil";
    profilePhotoArea.style.display = "none";
    profileNameField.style.display = "block";
  } else if (mode === "photo") {
    profileModalTitle.textContent = "Cambiar foto de perfil";
    profileModalSub.textContent = "Sube una imagen — aparecerá en el círculo superior";
    profilePhotoArea.style.display = "flex";
    profileNameField.style.display = "none";
  } else {
    profileModalTitle.textContent = "Editar perfil";
    profileModalSub.textContent = "Cambia tu nombre y foto de perfil";
    profilePhotoArea.style.display = "flex";
    profileNameField.style.display = "block";
  }

  profileModal.classList.remove("hidden");
  profileWidget.classList.remove("open");
  if (mode !== "photo") setTimeout(() => profileNameInput.focus(), 50);
}

function closeProfileModal() { profileModal.classList.add("hidden"); }

document.getElementById("profileEditName")?.addEventListener("click", () => openProfileModal("name"));
document.getElementById("profileEditPhoto")?.addEventListener("click", () => openProfileModal("photo"));
document.getElementById("profileCancel")?.addEventListener("click", closeProfileModal);
profileModal?.addEventListener("click", (e) => { if (e.target === profileModal) closeProfileModal(); });

// Resize image client-side to keep doc small
function resizeImage(file, maxSize = 320) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > height) { if (width > maxSize) { height *= maxSize / width; width = maxSize; } }
        else { if (height > maxSize) { width *= maxSize / height; height = maxSize; } }
        const canvas = document.createElement("canvas");
        canvas.width = width; canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

document.getElementById("profilePhotoUpload")?.addEventListener("click", () => profilePhotoInput.click());
profilePhotoInput?.addEventListener("change", async () => {
  const file = profilePhotoInput.files[0];
  if (!file) return;
  if (file.size > 8 * 1024 * 1024) { alert("La imagen pesa más de 8 MB. Elige otra más pequeña."); return; }
  try {
    const dataUrl = await resizeImage(file, 320);
    modalDraft.photo = dataUrl;
    renderAvatar(profilePhotoPreview, profilePhotoText, modalDraft, window.__zongaAuth.user?.email);
  } catch (e) {
    alert("No se pudo procesar la imagen.");
  }
  profilePhotoInput.value = "";
});

document.getElementById("profilePhotoRemove")?.addEventListener("click", () => {
  modalDraft.photo = "";
  renderAvatar(profilePhotoPreview, profilePhotoText, modalDraft, window.__zongaAuth.user?.email);
});

profileSaveBtn?.addEventListener("click", async () => {
  const u = window.__zongaAuth.user;
  if (!u) return;
  const newName = profileNameInput.value.trim();
  if (modalMode !== "photo") modalDraft.name = newName;
  profileSaveBtn.disabled = true;
  try {
    await saveProfile(u.uid, modalDraft);
    renderProfile(u);
    closeProfileModal();
  } catch (e) {
    alert("No se pudo guardar el perfil. Revisa tu conexión.");
  } finally { profileSaveBtn.disabled = false; }
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !profileModal.classList.contains("hidden")) closeProfileModal();
});

// Hook into auth state
async function onAuthEnter(user) {
  await loadProfile(user.uid);
  renderProfile(user);
}

// Patch the existing onAuthStateChanged to also load profile
const _origZonga = window.__zongaAuth;
_origZonga.loadProfile = async (uid) => { await loadProfile(uid); renderProfile(window.__zongaAuth.user); };
_origZonga.onAuthEnter = onAuthEnter;

// Trigger profile load when user is already set
if (window.__zongaAuth.user) onAuthEnter(window.__zongaAuth.user);

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
