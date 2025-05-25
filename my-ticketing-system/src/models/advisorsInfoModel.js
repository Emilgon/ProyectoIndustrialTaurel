import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { ref, getDownloadURL } from "firebase/storage";
import { db, storage } from "../firebaseConfig";

export const fetchAdvisors = async () => {
  const querySnapshot = await getDocs(collection(db, "Advisors"));
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};

export const fetchAdvisorById = async (clientId) => {
  const advisorDocRef = doc(db, "Advisors", clientId);
  const advisorDoc = await getDoc(advisorDocRef);
  if (!advisorDoc.exists()) {
    throw new Error(`Advisor with ID ${clientId} not found`);
  }
  return { id: advisorDoc.id, ...advisorDoc.data() };
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
