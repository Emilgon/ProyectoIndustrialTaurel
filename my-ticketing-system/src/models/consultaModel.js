import { collection, addDoc, getDocs } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage, auth } from "../firebaseConfig";

export const addConsulta = async (mensaje, archivo, affair) => {
  let attachmentURL = "";

  if (archivo) {
    const storageRef = ref(storage, `${archivo.name}`);
    await uploadBytes(storageRef, archivo);
    attachmentURL = await getDownloadURL(storageRef);
  }

  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  const userRef = collection(db, "Clients");
  const querySnapshot = await getDocs(userRef);
  const userData = querySnapshot.docs.find(
    (doc) => doc.data().email === user.email
  );

  if (!userData) throw new Error("User data not found");

  const company = userData.data().company;
  const name = userData.data().name;
  const clientId = userData.id;

  const docRef = await addDoc(collection(db, "Consults"), {
    name,
    company,
    type: null,
    star_date: new Date(),
    indicator: null,
    status: "Pendiente",
    email: user.email,
    messageContent: mensaje,
    attachment: attachmentURL,
    affair: affair,
    timestamp: new Date(),
    clientId,
    alertShown: false,
  });

  return docRef.id;
};
