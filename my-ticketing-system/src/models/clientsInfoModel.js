import { collection, getDocs, query, where, orderBy, limit, doc, getDoc } from "firebase/firestore";
import { ref, getDownloadURL } from "firebase/storage";
import { db, storage } from "../firebaseConfig";

export const fetchClients = async () => {
  const querySnapshot = await getDocs(collection(db, "Clients"));
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

export const fetchClientById = async (clientId) => {
  const clientDocRef = doc(db, "Clients", clientId);
  const clientDoc = await getDoc(clientDocRef);
  if (!clientDoc.exists()) {
    throw new Error(`Client with ID ${clientId} not found`);
  }
  return { id: clientDoc.id, ...clientDoc.data() };
};

export const fetchConsultasByClientName = async (clientName, limitCount = 1) => {
  const consultasRef = query(
    collection(db, "Consults"),
    where("name", "==", clientName),
    orderBy("timestamp", "desc"),
    limit(limitCount)
  );
  const consultasSnapshot = await getDocs(consultasRef);
  return consultasSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

export const fetchDownloadUrls = async (attachments) => {
  const urls = {};
  if (!attachments) return urls;
  for (const fileName of attachments.split(", ")) {
    try {
      const storageRef = ref(storage, `attachments/${fileName}`);
      const url = await getDownloadURL(storageRef);
      urls[fileName] = url;
    } catch (error) {
      console.error("Error fetching download URL:", error);
    }
  }
  return urls;
};
