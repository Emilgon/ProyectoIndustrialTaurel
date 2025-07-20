import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { ref, getDownloadURL } from "firebase/storage";
import { db, storage } from "../firebaseConfig";

/**
 * Obtiene todos los asesores de la base de datos.
 * @async
 * @returns {Promise<Array<object>>} Una promesa que se resuelve con un array de objetos de asesor.
 */
export const fetchUsers = async () => {
  const querySnapshot = await getDocs(collection(db, "users"));
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};

/**
 * Obtiene un asesor específico por su ID.
 * @async
 * @param {string} clientId - El ID del asesor a obtener.
 * @returns {Promise<object>} Una promesa que se resuelve con el objeto del asesor.
 * @throws {Error} Si el asesor con el ID especificado no se encuentra.
 */
export const fetchUserById = async (userId) => {
  const userDocRef = doc(db, "users", userId);
  const userDoc = await getDoc(userDocRef);
  if (!userDoc.exists()) {
    throw new Error(`User with ID ${userId} not found`);
  }
  return { id: userDoc.id, ...userDoc.data() };
};

/**
 * Obtiene las URLs de descarga para una lista de archivos adjuntos.
 * @async
 * @param {string} attachments - Una cadena de nombres de archivo separados por coma.
 * @returns {Promise<object>} Una promesa que se resuelve con un objeto donde las claves son los nombres de archivo y los valores son las URLs de descarga.
 */
export const fetchDownloadUrls = async (attachments) => {
  const urls = {};
  if (!attachments) return urls;
  for (const fileName of attachments.split(", ")) {
    try {
      const storageRef = ref(storage, `attachments/${fileName}`);
      const url = await getDownloadURL(storageRef);
      urls[fileName] = url;
    } catch (error) {
      console.error("Error fetching download URL:", error);
    }
  }
  return urls;
};
