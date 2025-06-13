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
    collection(db, "ResponsesClients"),
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

export async function fetchDownloadUrls(filePath) {
  try {
    // Primero extraemos la ruta real del archivo si es una URL completa
    const actualPath = extractStoragePath(filePath);

    // Obtenemos referencia al archivo
    const storageRef = ref(storage, actualPath);

    // Obtenemos la URL de descarga
    const url = await getDownloadURL(storageRef);
    return url;
  } catch (error) {
    console.error('Error fetching download URL:', error);
    throw error;
  }
}

// Función auxiliar para extraer la ruta correcta
function extractStoragePath(fullPath) {
  // Si es una URL completa, extraemos la parte importante
  if (fullPath.includes('firebasestorage.googleapis.com')) {
    const match = fullPath.match(/\/o\/(.+?)(\?|$)/);
    if (match) {
      return decodeURIComponent(match[1].replace('%2F', '/'));
    }
  }
  // Si no, asumimos que ya es la ruta correcta
  return fullPath;
}

export const addRespuesta = async (consultaId, content, file) => {
  const responseData = {
    consultaId,
    content,
    timestamp: new Date(),
    userId: auth.currentUser.uid,
    attachment: file ? file.name : null,
  };

  const docRef = await addDoc(collection(db, "ResponsesClients"), responseData);

  if (file) {
    const storageRef = ref(storage, `consultas/${consultaId}/${file.name}`);
    await uploadBytes(storageRef, file);
  }

  return { id: docRef.id };
};