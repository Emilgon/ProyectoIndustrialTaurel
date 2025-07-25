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
 * Agrega una nueva respuesta de cliente a una consulta.
 * @async
 * @param {string} consultaId - El ID de la consulta a la que se responde.
 * @param {string} content - El contenido del mensaje de la respuesta.
 * @param {File} file - El archivo adjunto a la respuesta (opcional).
 * @returns {Promise<{id: string, downloadUrl: string|null}>} Una promesa que se resuelve con el ID de la respuesta creada y la URL de descarga del archivo si existe.
 */
export const addRespuesta = async (consultaId, content, file) => {
  const responseData = {
    consultaId,
    content,
    timestamp: new Date(),
    userId: auth.currentUser.uid,
    attachment: file ? file.name : null, // Solo el nombre del archivo, sin ruta
  };

  const docRef = await addDoc(collection(db, "responsesclients"), responseData);

  let downloadUrl = null;
  if (file) {
    // Guardar siempre en 'archivos/' sin subcarpetas adicionales
    const storageRef = ref(storage, `archivos/${file.name}`);
    await uploadBytes(storageRef, file);
    downloadUrl = await getDownloadURL(storageRef);
  }

  return { id: docRef.id, downloadUrl };
};
