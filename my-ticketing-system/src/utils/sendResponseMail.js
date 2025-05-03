import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "../firebaseConfig"; // Assuming firebaseConfig exports initialized app

const functions = getFunctions(app);

const sendResponseEmail = async (consultaId, reply, downloadUrl, clientId) => {
  const sendEmail = httpsCallable(functions, "sendResponseEmail");
  try {
    const result = await sendEmail({ consultaId, reply, downloadUrl, clientId });
    return result.data;
  } catch (error) {
    console.error("Error sending response email:", error);
    throw error;
  }
};

export default sendResponseEmail;
