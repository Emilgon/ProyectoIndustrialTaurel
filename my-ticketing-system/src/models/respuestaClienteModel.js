import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  doc,
  getDoc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage, auth } from "../firebaseConfig";

/**
 * Obtiene todas las respuestas de un cliente para una consulta específica.
 * @async
 * @param {string} consultaId - El ID de la consulta.
 * @returns {Promise<Array<object>>} Una promesa que se resuelve con un array de objetos de respuesta.
 */
export const fetchRespuestasByConsultaId = async (consultaId) => {
  const respuestasRef = query(
    collection(db, "responsesclients"),
    where("consultaId", "==", consultaId)
  );
  const respuestasSnapshot = await getDocs(respuestasRef);
  return respuestasSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};

/**
 * Obtiene los datos de una consulta específica por su ID.
 * @async
 * @param {string} consultaId - El ID de la consulta.
 * @returns {Promise<object|null>} Una promesa que se resuelve con el objeto de la consulta o null si no se encuentra.
 */
export const fetchConsultaById = async (consultaId) => {
  const consultaRef = doc(db, "consults", consultaId);
  const consultaDoc = await getDoc(consultaRef);
  if (consultaDoc.exists()) {
    return consultaDoc.data();
  }
  return null;
};

/**
 * Obtiene las URLs de descarga para una lista de archivos adjuntos asociados a una consulta.
 * @async
 * @param {string} attachments - Una cadena de nombres de archivo separados por coma.
 * @param {string} consultaId - El ID de la consulta (actualmente no se usa directamente en la lógica de la URL, pero podría ser útil para una estructura de carpetas más específica).
 * @returns {Promise<object>} Una promesa que se resuelve con un objeto donde las claves son los nombres de archivo y los valores son las URLs de descarga.
 */
export const fetchDownloadUrls = async (attachments, consultaId) => {
  const urls = {};
  if (!attachments) return urls;

  // Convertir attachments a array si es una cadena
  const files = typeof attachments === 'string' ?
    attachments.split(", ") :
    Array.isArray(attachments) ? attachments : [];

  for (const fileReference of files) {
    try {
      // Limpiar la ruta - eliminar cualquier prefijo duplicado 'archivos/'
      const cleanPath = fileReference.replace(/^archivos\//, '').replace(/^archivos\//, '');

      // Construir la ruta correcta
      const storagePath = `archivos/${cleanPath}`;

      const storageRef = ref(storage, storagePath);
      const url = await getDownloadURL(storageRef);
      urls[fileReference] = {
        url: url,
        displayName: cleanPath.split('/').pop() // Nombre del archivo sin ruta
      };
    } catch (error) {
      console.error("Error fetching download URL for:", fileReference, error);
      urls[fileReference] = {
        url: null,
        displayName: fileReference.split('/').pop()
      };
    }
  }
  return urls;
};

/**
 * Adds a new client response to a query.
 * @async
 * @param {string} consultaId - The ID of the query being answered.
 * @param {string} content - The message content of the response.
 * @param {File} file - The file attached to the response (optional).
 * @returns {Promise<{id: string, downloadUrl: string|null}>} A promise that resolves with the ID of the created response and the file's download URL if it exists.
 */
export const addRespuesta = async (consultaId, content, file) => {
  let downloadUrl = null;
  if (file) {
    // Always save to 'archivos/' without additional subfolders
    const storageRef = ref(storage, `archivos/${file.name}`);
    await uploadBytes(storageRef, file);
    downloadUrl = await getDownloadURL(storageRef);
  }

  const responseData = {
    consultaId,
    content,
    timestamp: new Date(),
    userId: auth.currentUser.uid,
    attachment: downloadUrl, // Save the full download URL
  };

  const docRef = await addDoc(collection(db, "responsesclients"), responseData);

  return { id: docRef.id, downloadUrl };
};
