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
    collection(db, "ResponsesClients"),
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
  const consultaRef = doc(db, "Consults", consultaId);
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

  for (const fileReference of attachments.split(", ")) {
    try {
      // Extraer solo el nombre del archivo (última parte después del último /)
      // y decodificarlo por si tiene caracteres especiales URI-encoded.
      let fileName = decodeURIComponent(fileReference.split('/').pop());

      // Limpiar la referencia original en caso de que se use directamente.
      // Reemplaza 'archivos/archivos/' con 'archivos/' para corregir duplicaciones.
      const cleanFileReference = decodeURIComponent(fileReference.replace(/archivos\/archivos\//g, 'archivos/'));

      // Prioritize using the cleaned file name with the standard 'archivos/' prefix.
      // This handles cases where 'attachments' might store 'fileName.ext' or 'archivos/fileName.ext'.
      let pathForStorage = `archivos/${fileName}`;
      let url = null;

      // Attempt 1: Standard path (archivos/fileName.ext)
      // This should work if `fileName` is just the base name e.g., "EXCE_TFG.xlsx"
      // or if `fileReference` was "archivos/EXCE_TFG.xlsx" (fileName becomes "EXCE_TFG.xlsx")
      try {
        const storageRef = ref(storage, pathForStorage);
        url = await getDownloadURL(storageRef);
      } catch (error) {
        // Attempt 2: Use the cleaned file reference directly.
        // This handles cases where `fileReference` might be a correct full path already
        // like "archivos/somefolder/fileName.ext" or a cleaned "archivos/fileName.ext"
        // or if `fileName` itself was a full path due to unusual naming.
        console.warn(`Failed to fetch with 'archivos/${fileName}', trying '${cleanFileReference}'`, error);
        try {
          const storageRefClean = ref(storage, cleanFileReference);
          url = await getDownloadURL(storageRefClean);
          // If successful with cleanFileReference, update fileName to be the key in urls object
          fileName = decodeURIComponent(cleanFileReference.split('/').pop());
        } catch (errorDeep) {
          console.error(`Error fetching download URL for '${fileReference}' with all fallbacks:`, errorDeep);
          continue; // Skip to next fileReference if all attempts fail
        }
      }

      // Store the URL with the most accurate fileName as key
      urls[fileName] = url;

    } catch (error) {
      // This outer catch is for unexpected errors in the loop logic itself.
      console.error("General error in fetchDownloadUrls loop for fileReference:", fileReference, error);
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
    attachment: file ? file.name : null,
  };

  const docRef = await addDoc(collection(db, "ResponsesClients"), responseData);

  let downloadUrl = null;
  if (file) {
    const storageRef = ref(storage, `archivos/${file.name}`);
    await uploadBytes(storageRef, file);
    downloadUrl = await getDownloadURL(storageRef);
  }

  return { id: docRef.id, downloadUrl };
};
