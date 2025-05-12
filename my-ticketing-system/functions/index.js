const functions = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");

admin.initializeApp();

const db = admin.firestore();

// Configure the email transport using the default SMTP transport and Gmail
// Make sure to enable "less secure apps" or use an app password for Gmail account
const transporter = nodemailer.createTransport({
  host: "smtp.office365.com",
  port: 587,
  secure: false, // STARTTLS
  auth: {
    user: functions.config().outlook.email, // consultastccs@taurel.com
    pass: functions.config().outlook.apppassword, // App Password
  },
  tls: {
    ciphers: "SSLv3", // Necesario para Office 365
  },
});

exports.sendResponseEmail = functions.https.onCall(async (data, context) => {
  const { consultaId, reply, downloadUrl, clientId, advisorEmail } = data;

  if (!clientId) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "El clientId es requerido"
    );
  }

  if (!advisorEmail) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "El email del asesor es requerido"
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
      from: functions.config().outlook.email,
      replyTo: advisorEmail,
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
