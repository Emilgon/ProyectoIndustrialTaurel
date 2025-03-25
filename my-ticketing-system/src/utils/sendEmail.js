import config from './config';
import axios from 'axios';
import getAccessTokenAzure from './utils/getAccessTokenAzure';

const sendEmail = async (message) => {
  try {
    const accessToken = await getAccessTokenAzure();

    await axios.post(
      config.azure.azureGraphSendEmailUrl.replace("{emailSender}", config.email.emailSender),
      {
        message,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        }
      }
    );

    return true;
  } catch (error) {
    console.error('Error al enviar correo:', error);
    throw error;
  }
};

export default sendEmail;
