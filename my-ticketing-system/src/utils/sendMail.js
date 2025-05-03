import axios from 'axios';
import getAccessTokenAzure from './getAccessTokenAzure';
import config from './config';

const sendEmail = async (message) => {
    const { azureGraphSendEmailUrl } = config.azure;
    const { emailSender } = config.email;

    const accessToken = await getAccessTokenAzure();

    // Estructura correcta para Microsoft Graph API
    const emailData = {
        message: {
            ...message,
            // Asegurar que el remitente está correctamente formateado
            from: message.from || {
                emailAddress: {
                    address: emailSender,
                    name: config.email.emailSenderName
                }
            }
        },
        saveToSentItems: true
    };

    try {
        const response = await axios.post(
            azureGraphSendEmailUrl.replace("{emailSender}", emailSender),
            emailData,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        return response.data;
    } catch (error) {
        console.error('Error detallado al enviar email:', error.response?.data || error.message);
        throw error;
    }
};

export default sendEmail;