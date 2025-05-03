const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Endpoint de prueba
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Endpoint para enviar correos
app.post('/api/send-email', async (req, res) => {
  try {
    // Obtener token de Azure AD
    const tokenResponse = await axios.post(
      `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}/oauth2/v2.0/token`,
      new URLSearchParams({
        client_id: process.env.AZURE_CLIENT_ID,
        client_secret: process.env.AZURE_CLIENT_SECRET,
        scope: 'https://graph.microsoft.com/.default',
        grant_type: 'client_credentials'
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    // Enviar correo
    const emailResponse = await axios.post(
      `https://graph.microsoft.com/v1.0/users/${process.env.EMAIL_SENDER}/sendMail`,
      {
        message: {
          ...req.body.message,
          from: {
            emailAddress: {
              address: process.env.EMAIL_SENDER,
              name: req.body.senderName || "Taurel"
            }
          }
        },
        saveToSentItems: true
      },
      {
        headers: {
          Authorization: `Bearer ${tokenResponse.data.access_token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    res.json({ success: true, data: emailResponse.data });
  } catch (error) {
    console.error('Error completo:', {
      message: error.message,
      response: error.response?.data,
      config: error.config
    });
    res.status(500).json({ 
      error: 'Error al enviar el correo',
      details: error.response?.data || error.message 
    });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
});