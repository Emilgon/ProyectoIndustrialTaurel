import config from './config';
import axios from 'axios';
import getAccessTokenAzure from './getAccessTokenAzure';

const sendEmail = async (message) => {
    const { azureGraphSendEmailUrl } = config.azure;
    const { emailSender } = config.email;

    const accessToken = await getAccessTokenAzure();

    await axios.post(azureGraphSendEmailUrl.replace("{emailSender}", emailSender),
        {
            message,
        },
        {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            }
        });
};

export default sendEmail;