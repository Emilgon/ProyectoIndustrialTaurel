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
    // Todos los archivos están en 'archivos/'
    const storagePath = `archivos/${fileReference}`;
    const displayName = fileReference.split('/').pop();
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
    // Cambiado para subir a 'archivos/' en lugar de 'respuestas/'
    const storageRef = ref(storage, `archivos/${file.name}`);
    await uploadBytes(storageRef, file);
    downloadUrl = await getDownloadURL(storageRef);
  }

  return { id: docRef.id, downloadUrl };
};
