const functions = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");

admin.initializeApp();

const db = admin.firestore();

// Configure the email transport using the default SMTP transport and Gmail
// Make sure to enable "less secure apps" or use an app password for Gmail account
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: functions.config().gmail.email,
    pass: functions.config().gmail.password,
  },
});

exports.sendResponseEmail = functions.https.onCall(async (data, context) => {
  const { consultaId, reply, downloadUrl, clientId } = data;

  if (!clientId) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "El clientId es requerido"
    );
  }

  try {
    // Get client email from Firestore
    const clientDoc = await db.collection("Clients").doc(clientId).get();
    if (!clientDoc.exists) {
      throw new functions.https.HttpsError(
        "not-found",
        "Cliente no encontrado"
      );
    }
    const clientData = clientDoc.data();
    const clientEmail = clientData.email;
    if (!clientEmail) {
      throw new functions.https.HttpsError(
        "failed-precondition",
        "El cliente no tiene un email registrado"
      );
    }

    // Compose email
    let mailOptions = {
      from: functions.config().gmail.email,
      to: clientEmail,
      subject: `Respuesta a su consulta #${consultaId}`,
      text: `Hola,\n\nHa recibido una nueva respuesta a su consulta:\n\n${reply}\n\n`,
    };

    if (downloadUrl) {
      mailOptions.text += `Adjunto encontrará un archivo relacionado: ${downloadUrl}\n\n`;
    }

    mailOptions.text += "Saludos,\nSu equipo de soporte";

    // Send email
    await transporter.sendMail(mailOptions);

    return { success: true };
  } catch (error) {
    console.error("Error enviando correo:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});
