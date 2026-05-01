import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-app.js";
import { getAuth, setPersistence, browserLocalPersistence } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";

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

setPersistence(auth, browserLocalPersistence).catch(() => {});

export default app;
