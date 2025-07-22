import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  doc,
  getDoc,
  updateDoc
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage, auth } from "../firebaseConfig";

/**
 * Obtiene todas las respuestas de un asesor para una consulta específica.
 * @async
 * @param {string} consultaId - El ID de la consulta.
 * @returns {Promise<Array<object>>} Una promesa que se resuelve con un array de objetos de respuesta.
 */
export const fetchRespuestasByConsultaId = async (consultaId) => {
  const respuestasRef = query(
    collection(db, "Responses"),
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
 * Obtiene la URL de descarga para un archivo adjunto, probando varias rutas posibles.
 * @async
 * @param {string} fileReference - La referencia del archivo (puede ser una ruta completa o solo el nombre).
 * @param {string} consultaId - El ID de la consulta (actualmente no se usa directamente en la lógica de la URL).
 * @returns {Promise<{url: string|null, displayName: string}>} Una promesa que se resuelve con un objeto conteniendo la URL de descarga y el nombre del archivo.
 */
export const fetchDownloadUrls = async (fileReference, consultaId) => {
  try {
    // Extraer solo el nombre del archivo (última parte después del último /)
    const fileName = fileReference.split('/').pop();

    // Eliminar cualquier prefijo duplicado 'archivos/archivos/' en cualquier parte de la cadena
    const cleanReference = fileReference.replace(/archivos\/archivos\//g, 'archivos/');

    // Posibles patrones de ruta a probar en orden de prioridad
    const possiblePaths = [
      `archivos/${fileName}`,          // Ruta directa con nombre de archivo
      cleanReference,                  // Ruta original limpia
      fileReference,                   // Ruta original (por si acaso)
      fileName                         // Solo el nombre del archivo
    ];

    let downloadUrl = null;

    // Probar cada posible ruta hasta encontrar una que funcione
    for (const path of possiblePaths) {
      try {
        const storageRef = ref(storage, path);
        downloadUrl = await getDownloadURL(storageRef);
        break; // Si encontramos una URL válida, salimos del bucle
      } catch (error) {
        continue; // Si falla, probamos con el siguiente patrón
      }
    }

    if (!downloadUrl) {
      throw new Error("No se pudo encontrar el archivo en ninguna ubicación probada");
    }

    return {
      url: downloadUrl,
      displayName: fileName
    };
  } catch (error) {
    console.error(`Error al obtener URL para ${fileReference}:`, error);
    return {
      url: null,
      displayName: fileReference.split('/').pop()
    };
  }
};

/**
 * Agrega una nueva respuesta de asesor a una consulta.
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
    attachment: file ? file.name : null, // Solo el nombre, sin ruta
  };

  const docRef = await addDoc(collection(db, "responses"), responseData);

  let downloadUrl = null;
  if (file) {
    // Subir directamente a 'archivos/' sin prefijos adicionales
    const storageRef = ref(storage, `archivos/${file.name}`);
    await uploadBytes(storageRef, file);
    downloadUrl = await getDownloadURL(storageRef);
  }

  return { id: docRef.id, downloadUrl };
};