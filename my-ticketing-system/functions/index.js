const functions = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");

admin.initializeApp();
const db = admin.firestore();

const transporter = nodemailer.createTransport({
  host: "smtp.office365.com",
  port: 587,
  secure: false,
  auth: {
    user: functions.config().outlook.email,
    pass: functions.config().outlook.password,
  },
  tls: {
    ciphers: "SSLv3",
    rejectUnauthorized: false
  }
});

exports.sendResponseEmail = functions.https.onCall(async (data, context) => {
  try {
    // Validar datos requeridos
    if (!data.consultaId || !data.reply || !data.clientId || !data.advisorEmail || !data.clientEmail) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Datos incompletos para enviar el correo"
      );
    }

    // Usar clientEmail directamente
    const clientEmail = data.clientEmail;

    if (!clientEmail) {
      functions.logger.error("Cliente sin email registrado", {
        clientId: data.clientId,
        clientEmail
      });
      throw new functions.https.HttpsError(
        "failed-precondition",
        "El cliente no tiene un email registrado"
      );
    }

    // Configuración del correo
    const mailOptions = {
      from: `"Consultas TCCS" <consultastccs@taurel.com>`,
      replyTo: data.advisorEmail,
      to: clientEmail,
      subject: `Respuesta a consulta #${data.consultaId}`,
      text: [
        `Hola,\n\n${data.advisorEmail} ha respondido a su consulta:`,
        `\n\n${data.reply}\n\n`,
        data.downloadUrl ? `Archivo adjunto: ${data.downloadUrl}\n\n` : "",
        "Saludos,\nEquipo de Consultas TCCS"
      ].join(""),
      headers: {
        'X-Consulta-ID': data.consultaId
      }
    };

    // Enviar correo con logging
    functions.logger.log("Enviando correo con opciones:", mailOptions);
    const info = await transporter.sendMail(mailOptions);

    return {
      success: true,
      messageId: info.messageId
    };

  } catch (error) {
    functions.logger.error("Error en sendResponseEmail:", {
      message: error.message,
      stack: error.stack,
      inputData: data
    });

    throw new functions.https.HttpsError(
      "internal",
      error.message,
      {
        technicalDetails: "Revise los logs para más información",
        clientId: data.clientId
      }
    );
  }
});
