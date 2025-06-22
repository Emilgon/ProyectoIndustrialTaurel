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
        storagePath = `respuestas/${consultaId}/${fileReference}`;
      } else {
        storagePath = `consultas/${fileReference}`; // Cambiado de 'archivos/' a 'consultas/'
      }
      displayName = fileReference;
    }

    const url = await getDownloadURL(ref(storage, storagePath));
    return { url, displayName };
  } catch (error) {
    console.error(`Error al obtener URL para ${fileReference}:`, error);
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
  if (file) {
    const storageRef = ref(storage, `respuestas/${consultaId}/${file.name}`);
    await uploadBytes(storageRef, file);
    downloadUrl = await getDownloadURL(storageRef);
  }

  return { id: docRef.id, downloadUrl };
};
