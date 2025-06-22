import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  doc,
  getDoc,
  updateDoc, // Asegúrate de importar updateDoc
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage, auth } from "../firebaseConfig";

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

export const fetchConsultaById = async (consultaId) => {
  const consultaRef = doc(db, "Consults", consultaId);
  const consultaDoc = await getDoc(consultaRef);
  if (consultaDoc.exists()) {
    return consultaDoc.data();
  }
  return null;
};

export const fetchDownloadUrls = async (fileReference, consultaId) => {
  try {
    let storagePath;
    let displayName;

    // Si es una URL completa de Firebase Storage
    if (fileReference.includes('firebasestorage.googleapis.com')) {
      const urlObj = new URL(fileReference);
      storagePath = decodeURIComponent(urlObj.pathname
        .replace('/v0/b/proyectoindustrialtaurel.firebasestorage.app/o/', '')
        .replace(/%2F/g, '/')
        .split('?')[0]); // Eliminar parámetros de consulta
      displayName = storagePath.split('/').pop();
    }
    // Si es una ruta de storage
    else if (fileReference.startsWith('consultas/') || fileReference.startsWith('respuestas/')) {
      storagePath = fileReference;
      displayName = fileReference.split('/').pop();
    }
    // Si es solo un nombre de archivo
    else {
      // Primero intentamos con la ruta de respuestas si tenemos consultaId
      if (consultaId) {
        // Para respuestas, la estructura es respuestas/consultaId/nombreArchivo
        storagePath = `respuestas/${consultaId}/${fileReference.split('/').pop()}`;
      } else {
        // Para archivos de consulta (sin consultaId específico en este contexto, o adjuntos generales)
        // Se asume que la ruta es archivos/nombreArchivo o consultas/nombreArchivo
        // Damos prioridad a 'archivos/' según el requerimiento
        if (fileReference.startsWith('consultas/')) {
            storagePath = fileReference;
        } else {
            storagePath = `archivos/${fileReference.split('/').pop()}`;
        }
      }
      displayName = fileReference.split('/').pop();
    }

    const url = await getDownloadURL(ref(storage, storagePath));
    return { url, displayName };
  } catch (error) {
    return {
      url: null,
      displayName: fileReference.includes('/')
        ? fileReference.split('/').pop()
        : fileReference
    };
  }
};

export const addRespuesta = async (consultaId, content, file) => {
  const responseData = {
    consultaId,
    content,
    timestamp: new Date(),
    userId: auth.currentUser.uid,
    attachment: file ? file.name : null,
  };

  const docRef = await addDoc(collection(db, "Responses"), responseData);

  let downloadUrl = null;
  let attachmentPath = null; // Guardaremos la ruta relativa también
  if (file) {
    const filePath = `archivos/${file.name}`; // Nueva ruta para todos los archivos de respuesta
    const storageRef = ref(storage, filePath);
    await uploadBytes(storageRef, file);
    downloadUrl = await getDownloadURL(storageRef);
    attachmentPath = filePath; // Guardar la ruta relativa
  }

  // Actualizar el documento de respuesta con la ruta del adjunto si existe
  if (attachmentPath) {
    await updateDoc(doc(db, "Responses", docRef.id), {
      attachment: attachmentPath, // Guardar la ruta relativa, no solo el nombre
      attachmentURL: downloadUrl // Opcional: guardar también la URL completa si se necesita directamente
    });
  } else {
     await updateDoc(doc(db, "Responses", docRef.id), {
      attachment: null,
      attachmentURL: null
    });
  }


  return { id: docRef.id, downloadUrl, attachmentPath };
};
