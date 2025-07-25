const functions = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
const cors = require("cors")({ origin: true });

admin.initializeApp();
const db = admin.firestore();

const transporter = nodemailer.createTransport({
  host: "smtp.office365.com",
  port: 587,
  secure: false,
  auth: {
    user: "",
    pass: "",
  },
  tls: {
    ciphers: "SSLv3",
    rejectUnauthorized: false,
  },
});

exports.sendResponseEmail = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    const data = req.body;

    try {
      // Validar datos requeridos
      if (
        !data.consultaId ||
        !data.reply ||
        !data.clientId ||
        !data.advisorEmail ||
        !data.clientEmail
      ) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          "Datos incompletos para enviar el correo"
        );
      }

      const clientEmail = data.clientEmail;

      if (!clientEmail) {
        functions.logger.error("Cliente sin email registrado", {
          clientId: data.clientId,
          clientEmail,
        });
        throw new functions.https.HttpsError(
          "failed-precondition",
          "El cliente no tiene un email registrado"
        );
      }

      // Configuración del correo
      const mailOptions = {
        from: `"Consultas Técnicas Taurel" <consultastccs@taurel.com>`,
        replyTo: `${data.consultaId}.${data.clientId}@reply.taurel.com`, // Mantenemos el formato para tracking
        to: clientEmail,
        subject: `Respuesta a su consulta: "${data.affair}"`, // Usamos el asunto en lugar del ID
        text: [
          `Estimado/a cliente,\n\n`,
          `En relación a su consulta sobre "${data.affair}", nuestro equipo técnico le informa:\n\n`,
          `----------------------------------------\n`,
          `${data.reply}\n`,
          `----------------------------------------\n\n`,
          data.downloadUrl ? `📌 Archivo adjunto: ${data.downloadUrl}\n\n` : "",
          `**Puede responder directamente a este correo para cualquier aclaratoria.**\n\n`,
          `Atentamente,\n`,
          `Equipo de Operaciones Taurel\n`,
          `Teléfono: [Inserte teléfono]\n`,
          `Sitio web: [Inserte URL]`,
        ].join(""),
        html: [
          `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0;">`,
          `  <div style="background-color: #1B5C94; padding: 15px 20px; color: white;">`,
          `    <h2 style="margin: 0;">Consultas Técnicas Taurel</h2>`,
          `  </div>`,
          `  <div style="padding: 20px;">`,
          `    <p>Estimado/a cliente,</p>`,
          `    <p>En relación a su consulta sobre <strong>"${data.affair}"</strong>, nuestro equipo técnico le informa:</p>`,
          `    <div style="background-color: #f8f9fa; padding: 15px; border-left: 3px solid #1B5C94; margin: 15px 0;">`,
          `      <p style="white-space: pre-line; margin: 0;">${data.reply}</p>`,
          `    </div>`,
          data.downloadUrl
            ? `    <p>📌 <strong>Archivo adjunto:</strong> <a href="${data.downloadUrl}" style="color: #1B5C94;">Descargar documento</a></p>`
            : "",
          `    <p style="margin-top: 25px; font-weight: bold;">Puede responder directamente a este correo para cualquier aclaratoria.</p>`,
          `    <p>Atentamente,</p>`,
          `    <p style="color: #1B5C94; font-weight: bold;">Equipo de Operaciones Taurel</p>`,
          `    <div style="margin-top: 20px; font-size: 0.85em; color: #666; border-top: 1px solid #eee; padding-top: 10px;">`,
          `      <p>Teléfono: [Inserte teléfono]</p>`,
          `      <p>Sitio web: [Inserte URL]</p>`,
          `    </div>`,
          `  </div>`,
          `</div>`,
        ].join(""),
        headers: {
          "X-Consulta-ID": data.consultaId,
          "X-Consulta-Asunto": data.affair, // Nuevo header para tracking
          "Message-ID": `<${data.consultaId}@taurel.com>`,
        },
      };

      // Enviar correo con logging
      functions.logger.log("Enviando correo con opciones:", mailOptions);
      const info = await transporter.sendMail(mailOptions);

      res.status(200).send({
        success: true,
        messageId: info.messageId,
      });
    } catch (error) {
      functions.logger.error("Error en sendResponseEmail:", {
        message: error.message,
        stack: error.stack,
        inputData: data,
      });

      res.status(500).send({
        error: {
          message: error.message,
          technicalDetails: "Revise los logs para más información",
          clientId: data.clientId,
        },
      });
    }
  });
});