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
  const consultaRef = doc(db, "Consults", consultaId);
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
    const fileName = fileReference.split('/').pop();

    const possiblePaths = [
      `archivos/${fileName}`,
      fileReference
    ];

    let urlFound = null;

    for (const path of possiblePaths) {
      try {
        const url = await getDownloadURL(ref(storage, path));
        urlFound = url;
        break;
      } catch (error) {
        continue;
      }
    }

    if (!urlFound) {
      throw new Error("No se pudo encontrar el archivo en ninguna ubicación");
    }

    return {
      url: urlFound,
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
    attachment: file ? file.name : null, // Solo el nombre del archivo
  };

  const docRef = await addDoc(collection(db, "Responses"), responseData);

  let downloadUrl = null;
  if (file) {
    // Normalizar el nombre del archivo (eliminar caracteres problemáticos)
    const normalizedFileName = file.name.replace(/[^\w.-]/g, '_');
    const storageRef = ref(storage, `archivos/${normalizedFileName}`);

    // Subir el archivo
    await uploadBytes(storageRef, file);
    downloadUrl = await getDownloadURL(storageRef);

    // Actualizar la respuesta con el nombre normalizado
    await updateDoc(docRef, {
      attachment: normalizedFileName
    });
  }

  return { id: docRef.id, downloadUrl };
};