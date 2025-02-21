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
  apiKey: "AIzaSyD3SntYBXMfTyomUvfIeunYA9341F081Ok",
  authDomain: "proyectoindustrialtaurel.firebaseapp.com",
  projectId: "proyectoindustrialtaurel",
  storageBucket: "proyectoindustrialtaurel.appspot.com",
  messagingSenderId: "797021083723",
  appId: "1:797021083723:web:60766602838b30773855ce",
  measurementId: "G-H843JF99Z1",
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
};