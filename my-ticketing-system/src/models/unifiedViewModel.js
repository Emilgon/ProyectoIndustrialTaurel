import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  Timestamp,
} from "firebase/firestore";
import { db, storage } from "../firebaseConfig";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export const fetchConsultaById = async (consultaId) => {
  const q = query(
    collection(db, "consultas"),
    where("id", "==", consultaId)
  );
  const querySnapshot = await getDocs(q);
  if (!querySnapshot.empty) {
    const doc = querySnapshot.docs[0];
    return { ...doc.data(), docId: doc.id };
  }
  return null;
};

export const fetchRespuestasByConsultaId = async (consultaId) => {
  const responsesRef = collection(db, "responses");
  const responsesQuery = query(responsesRef, where("consultaId", "==", consultaId));
  const responsesSnapshot = await getDocs(responsesQuery);
  const responses = responsesSnapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id, sender: "Tú" }));

  const responsesClientsRef = collection(db, "responsesClients");
  const responsesClientsQuery = query(responsesClientsRef, where("consultaId", "==", consultaId));
  const responsesClientsSnapshot = await getDocs(responsesClientsQuery);
  const responsesClients = responsesClientsSnapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id, sender: "Cliente" }));

  const allResponses = [...responses, ...responsesClients];

  allResponses.sort((a, b) => a.timestamp.seconds - b.timestamp.seconds);

  return allResponses;
};

export const addRespuesta = async (consultaId, content, file, userType) => {
  let downloadUrl = null;
  if (file) {
    const storageRef = ref(storage, `archivos/${file.name}`);
    await uploadBytes(storageRef, file);
    downloadUrl = await getDownloadURL(storageRef);
  }

  const collectionName = userType === 'advisor' ? 'responses' : 'responsesClients';

  const newRespuesta = {
    consultaId,
    content,
    timestamp: Timestamp.now(),
    attachment: downloadUrl,
  };

  await addDoc(collection(db, collectionName), newRespuesta);
  return { downloadUrl };
};

export const fetchDownloadUrls = async (storagePath) => {
  if (!storagePath) {
    return {};
  }
  const urlMap = {};
  try {
    const url = await getDownloadURL(ref(storage, storagePath));
    const displayName = storagePath.split("/").pop();
    urlMap[displayName] = url;
  } catch (error) {
    console.error(`Error al obtener URL para ${storagePath}:`, error);
  }
  return urlMap;
};
