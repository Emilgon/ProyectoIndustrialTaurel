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