const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");
const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

// Configurar Nodemailer con Gmail
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "tucorreo@gmail.com", // Tu correo de Gmail
    pass: "tucontraseña", // Tu contraseña de Gmail
  },
});

// Ruta para enviar correos
app.post("/enviar-correo", (req, res) => {
  const { destinatario, asunto, mensaje } = req.body;

  const mailOptions = {
    from: "tucorreo@gmail.com", // Remitente
    to: destinatario, // Destinatario (correo del cliente)
    subject: asunto, // Asunto del correo
    text: mensaje, // Cuerpo del correo
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Error al enviar el correo:", error);
      res.status(500).send("Error al enviar el correo");
    } else {
      console.log("Correo enviado:", info.response);
      res.status(200).send("Correo enviado con éxito");
    }
  });
});

app.listen(port, () => {
  console.log(`Servidor backend corriendo en http://localhost:${port}`);
});