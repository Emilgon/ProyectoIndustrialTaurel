import { collection, getDocs, updateDoc, doc, query, where } from "firebase/firestore";
import { ref, getDownloadURL } from "firebase/storage";
import { db, storage } from "../firebaseConfig";

/**
 * Obtiene todas las consultas de la base de datos.
 * @async
 * @returns {Promise<Array<object>>} Una promesa que se resuelve con un array de objetos de consulta.
 */
export const fetchConsultas = async () => {
  const querySnapshot = await getDocs(collection(db, "consults"));
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

/**
 * Actualiza el estado de una consulta específica.
 * @async
 * @param {string} id - El ID de la consulta a actualizar.
 * @param {string} status - El nuevo estado de la consulta.
 * @returns {Promise<void>}
 */
export const updateConsultaStatus = async (id, status) => {
  const consultaRef = doc(db, "consults", id);
  await updateDoc(consultaRef, { status });
};

/**
 * Obtiene todas las respuestas para una consulta específica.
 * @async
 * @param {string} consultaId - El ID de la consulta.
 * @returns {Promise<Array<object>>} Una promesa que se resuelve con un array de objetos de respuesta.
 */
export const fetchRespuestasByConsultaId = async (consultaId) => {
  const respuestasRef = query(collection(db, "responses"), where("consultaId", "==", consultaId));
  const respuestasSnapshot = await getDocs(respuestasRef);
  return respuestasSnapshot.docs.map(doc => ({
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
      const storageRef = ref(storage, `archivos/${fileName}`);
      const url = await getDownloadURL(storageRef);
      urls[fileName] = url;
    } catch (error) {
      console.error("Error fetching download URL:", error);
    }
  }
  return urls;
};

/**
 * Actualiza los datos de una consulta específica.
 * @async
 * @param {string} id - El ID de la consulta a actualizar.
 * @param {object} updateData - Un objeto con los campos a actualizar en la consulta.
 * @returns {Promise<void>}
 */
export const updateConsulta = async (id, updateData) => {
  const consultaRef = doc(db, "consults", id);
  await updateDoc(consultaRef, updateData);
};
