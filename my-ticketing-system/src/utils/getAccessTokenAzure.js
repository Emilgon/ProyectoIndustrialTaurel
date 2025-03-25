import config from './config';
import axios from 'axios';

const getAccessTokenAzure = async () => {
    const { azureClientId, azureClientSecret, azureGrantType, azureLoginUrl, azureScope, azureTenantId } = config.azure;

    const response = await axios.post(azureLoginUrl.replace("{tenantId}", azureTenantId), {
        client_id: azureClientId,
        client_secret: azureClientSecret,
        grant_type: azureGrantType,
        scope: azureScope,
    }, {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        }
    });

    return response.data.access_token;
}

export default getAccessTokenAzure;