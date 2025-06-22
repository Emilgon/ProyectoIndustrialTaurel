import { collection, getDocs, updateDoc, doc, query, where } from "firebase/firestore";
import { ref, getDownloadURL } from "firebase/storage";
import { db, storage } from "../firebaseConfig";

export const fetchConsultas = async () => {
  const querySnapshot = await getDocs(collection(db, "Consults"));
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

export const updateConsultaStatus = async (id, status) => {
  const consultaRef = doc(db, "Consults", id);
  await updateDoc(consultaRef, { status });
};

export const fetchRespuestasByConsultaId = async (consultaId) => {
  const respuestasRef = query(collection(db, "Responses"), where("consultaId", "==", consultaId));
  const respuestasSnapshot = await getDocs(respuestasRef);
  return respuestasSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

export const fetchDownloadUrls = async (attachments) => {
  const urls = {};
  if (!attachments) return urls;
  for (const fileName of attachments.split(", ")) {
    try {
      const storageRef = ref(storage, `archivos/${fileName}`);
      const url = await getDownloadURL(storageRef);
      urls[fileName] = url;
    } catch (error) {
      console.error("Error fetching download URL:", error);
    }
  }
  return urls;
};

export const updateConsulta = async (id, updateData) => {
  const consultaRef = doc(db, "Consults", id);
  await updateDoc(consultaRef, updateData);
};
