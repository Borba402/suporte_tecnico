import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Configuração do Firebase suportando injeção via variáveis de ambiente ou fallback padrão
const firebaseConfig = {
  apiKey: typeof process !== "undefined" && process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyCkIq3bjPck-UUT2tWZm8nEAHNQd_bWS7I",
  authDomain: typeof process !== "undefined" && process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "suportetecnico-825a7.firebaseapp.com",
  projectId: typeof process !== "undefined" && process.env.REACT_APP_FIREBASE_PROJECT_ID || "suportetecnico-825a7",
  storageBucket: typeof process !== "undefined" && process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "suportetecnico-825a7.firebasestorage.app",
  messagingSenderId: typeof process !== "undefined" && process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "637253682693",
  appId: typeof process !== "undefined" && process.env.REACT_APP_FIREBASE_APP_ID || "1:637253682693:web:66523be6ed2edb7c67be6c",
  measurementId: typeof process !== "undefined" && process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || "G-HSYS661N0X"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Inicializa os Serviços e exporta
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
