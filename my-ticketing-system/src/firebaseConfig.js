import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  setDoc,
  doc,
  getDocs,
  updateDoc,
  deleteDoc,
  getDoc,
  onSnapshot,
  query, // Añadir query
  where, // Añadir where
} from "firebase/firestore";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCxP9YE9KCo72qNvObiBZsGl1TICT9-7ac",
  authDomain: "taurel-prod.firebaseapp.com",
  projectId: "taurel-prod",
  storageBucket: "taurel-prod.firebasestorage.app",
  messagingSenderId: "8159792865",
  appId: "1:8159792865:web:bcaaade923a61e377731a0",
  measurementId: "G-R0X1311N4K"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);

// Obtén las instancias de los servicios de Firebase
const db = getFirestore(app);
const auth = getAuth(app);
const analytics = getAnalytics(app);
const storage = getStorage(app);

// Exporta las funciones y servicios necesarios
export {
  db,
  auth,
  storage,
  collection,
  addDoc,
  setDoc,
  doc,
  getDocs,
  updateDoc,
  deleteDoc,
  getDoc,
  onSnapshot,
  query, // Exportar query
  where, // Exportar where
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  getFirestore
};