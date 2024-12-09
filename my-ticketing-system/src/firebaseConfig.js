import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, setDoc, doc, getDocs, updateDoc, deleteDoc, getDoc } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
import { getStorage } from "firebase/storage";

//configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyD3SntYBXMfTyomUvfIeunYA9341F081Ok",
  authDomain: "proyectoindustrialtaurel.firebaseapp.com",
  projectId: "proyectoindustrialtaurel",
  storageBucket: "proyectoindustrialtaurel.firebasestorage.app",
  messagingSenderId: "797021083723",
  appId: "1:797021083723:web:60766602838b30773855ce",
  measurementId: "G-H843JF99Z1"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const analytics = getAnalytics(app);

export const storage = getStorage(app);
export { db, collection, addDoc, setDoc, doc, getDocs, updateDoc, deleteDoc, getDoc };


