import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, setDoc, doc, getDocs, updateDoc, deleteDoc, getDoc, onSnapshot } from "firebase/firestore";
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
  measurementId: "G-H843JF99Z1"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const analytics = getAnalytics(app);
const storage = getStorage(app);

export { db, getFirestore, collection, addDoc, setDoc, doc, getDocs, updateDoc, deleteDoc, getDoc, auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onSnapshot };