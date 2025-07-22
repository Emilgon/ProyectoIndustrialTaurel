import { collection, getDocs, query, where, orderBy, limit, doc, getDoc } from "firebase/firestore";
import { ref, getDownloadURL } from "firebase/storage";
import { db, storage } from "../firebaseConfig";

/**
 * Obtiene todos los usuarios de la base de datos.
 * @async
 * @returns {Promise<Array<object>>} Una promesa que se resuelve con un array de objetos de usuario.
 */
export const fetchUsers = async () => {
  const querySnapshot = await getDocs(collection(db, "users"));
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

/**
 * Obtiene un usuario específico por su ID.
 * @async
 * @param {string} userId - El ID del usuario a obtener.
 * @returns {Promise<object>} Una promesa que se resuelve con el objeto del usuario.
 * @throws {Error} Si el usuario con el ID especificado no se encuentra.
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
 * Obtiene las consultas de un usuario específico por su nombre.
 * @async
 * @param {string} userName - El nombre del usuario.
 * @param {number} [limitCount=1] - El número máximo de consultas a obtener.
 * @returns {Promise<Array<object>>} Una promesa que se resuelve con un array de objetos de consulta.
 */
export const fetchConsultasByUserName = async (userName, limitCount = 1) => {
  const consultasRef = query(
    collection(db, "consults"),
    where("name", "==", userName),
    orderBy("timestamp", "desc"),
    limit(limitCount)
  );
  const consultasSnapshot = await getDocs(consultasRef);
  return consultasSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
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
