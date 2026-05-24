import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-app.js";
import { getAuth, setPersistence, browserLocalPersistence, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyDxWfswAK0Pxg3atZ7GU9zui1zKpoSuMiE",
  authDomain: "zongaelements.firebaseapp.com",
  projectId: "zongaelements",
  storageBucket: "zongaelements.firebasestorage.app",
  messagingSenderId: "378131677813",
  appId: "1:378131677813:web:7577d9a2fda38835b46e3c",
  measurementId: "G-BRZKV7EYNE"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

setPersistence(auth, browserLocalPersistence).catch(() => {});

// ── API expuesta al diario (script Babel sin módulos) ──
const uidPromise = new Promise((resolve) => {
  if (auth.currentUser) { resolve(auth.currentUser.uid); return; }
  const unsub = onAuthStateChanged(auth, (u) => { if (u) { unsub(); resolve(u.uid); } });
});

window.__zongaStorage = {
  uid: () => uidPromise,
  upload: async (path, blob) => {
    const r = storageRef(storage, path);
    await uploadBytes(r, blob, blob.type ? { contentType: blob.type } : undefined);
    return await getDownloadURL(r);
  },
  getUrl: async (path) => await getDownloadURL(storageRef(storage, path)),
  del: async (path) => { try { await deleteObject(storageRef(storage, path)); } catch (e) { /* ignora si ya no existe */ } },
};
window.dispatchEvent(new Event("zonga:storageReady"));

export default app;
