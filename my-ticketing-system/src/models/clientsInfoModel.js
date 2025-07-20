import { collection, getDocs, query, where, orderBy, limit, doc, getDoc } from "firebase/firestore";
import { ref, getDownloadURL } from "firebase/storage";
import { db, storage } from "../firebaseConfig";

/**
 * Obtiene todos los clientes de la base de datos.
 * @async
 * @returns {Promise<Array<object>>} Una promesa que se resuelve con un array de objetos de cliente.
 */
export const fetchClients = async () => {
  const querySnapshot = await getDocs(collection(db, "Clients"));
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

/**
 * Obtiene un cliente específico por su ID.
 * @async
 * @param {string} clientId - El ID del cliente a obtener.
 * @returns {Promise<object>} Una promesa que se resuelve con el objeto del cliente.
 * @throws {Error} Si el cliente con el ID especificado no se encuentra.
 */
export const fetchClientById = async (clientId) => {
  const clientDocRef = doc(db, "Clients", clientId);
  const clientDoc = await getDoc(clientDocRef);
  if (!clientDoc.exists()) {
    throw new Error(`Client with ID ${clientId} not found`);
  }
  return { id: clientDoc.id, ...clientDoc.data() };
};

/**
 * Obtiene las consultas de un cliente específico por su nombre.
 * @async
 * @param {string} clientName - El nombre del cliente.
 * @param {number} [limitCount=1] - El número máximo de consultas a obtener.
 * @returns {Promise<Array<object>>} Una promesa que se resuelve con un array de objetos de consulta.
 */
export const fetchConsultasByClientName = async (clientName, limitCount = 1) => {
  const consultasRef = query(
    collection(db, "consults"),
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

/**
 * Obtiene las URLs de descarga para una lista de archivos adjuntos.
 * @async
 * @param {string} attachments - Una cadena de nombres de archivo separados por coma.
 * @returns {Promise<object>} Una promesa que se resuelve con un objeto donde las claves son los nombres de archivo y los valores son las URLs de descarga.
 */
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
