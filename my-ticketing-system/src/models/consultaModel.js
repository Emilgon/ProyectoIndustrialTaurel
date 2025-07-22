import { collection, addDoc, getDocs } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage, auth } from "../firebaseConfig";

/**
 * Agrega una nueva consulta a la base de datos.
 * @async
 * @param {string} mensaje - El contenido del mensaje de la consulta.
 * @param {File} archivo - El archivo adjunto a la consulta (opcional).
 * @param {string} affair - El asunto de la consulta.
 * @returns {Promise<string>} Una promesa que se resuelve con el ID de la consulta creada.
 * @throws {Error} Si el usuario no está autenticado o no se encuentran los datos del usuario.
 */
export const addConsulta = async (mensaje, archivo, affair) => {
  let attachmentURL = "";

  if (archivo) {
    const storageRef = ref(storage, `${archivo.name}`);
    await uploadBytes(storageRef, archivo);
    attachmentURL = await getDownloadURL(storageRef);
  }

  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  const userRef = collection(db, "users");
  const querySnapshot = await getDocs(userRef);
  const userData = querySnapshot.docs.find(
    (doc) => doc.data().email === user.email
  );

  if (!userData) throw new Error("User data not found");

  const companyName = userData.data().companyName;
  const name = userData.data().name;
  const clientId = userData.id;

  const docRef = await addDoc(collection(db, "consults"), {
    name,
    companyName: companyName,
    type: null,
    start_date: new Date(),
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
