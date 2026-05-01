import { auth } from "./firebase.js";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup
} from "https://www.gstatic.com/firebasejs/12.12.1/firebase-auth.js";

const overlay = document.getElementById("authOverlay");
const errorEl = document.getElementById("authError");

// Muestra el overlay si no hay sesión
onAuthStateChanged(auth, (user) => {
  overlay.style.display = user ? "none" : "flex";
});

document.getElementById("btnLogin").addEventListener("click", async () => {
  const email = document.getElementById("emailInput").value;
  const pass = document.getElementById("passInput").value;
  try {
    await signInWithEmailAndPassword(auth, email, pass);
  } catch (e) {
    errorEl.textContent = "Email o contraseña incorrectos.";
  }
});

document.getElementById("btnRegister").addEventListener("click", async () => {
  const email = document.getElementById("emailInput").value;
  const pass = document.getElementById("passInput").value;
  try {
    await createUserWithEmailAndPassword(auth, email, pass);
  } catch (e) {
    errorEl.textContent = e.message;
  }
});

document.getElementById("btnGoogle").addEventListener("click", async () => {
  try {
    await signInWithPopup(auth, new GoogleAuthProvider());
  } catch (e) {
    errorEl.textContent = "Error al entrar con Google.";
  }
});