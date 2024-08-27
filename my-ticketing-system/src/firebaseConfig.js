import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, setDoc, doc, getDocs, updateDoc, deleteDoc, getDoc } from "firebase/firestore";

// Tu configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyD3SntYBXMfTyomUvfIeunYA9341F081Ok",
  authDomain: "proyectoindustrialtaurel.firebaseapp.com",
  projectId: "proyectoindustrialtaurel",
  storageBucket: "proyectoindustrialtaurel.appspot.com",
  messagingSenderId: "797021083723",
  appId: "1:797021083723:web:60766602838b30773855ce",
  measurementId: "G-H843JF99Z1"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db, collection, addDoc, setDoc, doc, getDocs, updateDoc, deleteDoc, getDoc };
