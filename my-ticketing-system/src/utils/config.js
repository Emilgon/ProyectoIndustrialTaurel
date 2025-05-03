const getEnv = (key) => process.env[key];

const config = {
  azure: {
    azureLoginUrl: getEnv('REACT_APP_AZURE_LOGIN_URL'),
    azureClientId: getEnv('REACT_APP_AZURE_CLIENT_ID'),
    azureTenantId: getEnv('REACT_APP_AZURE_TENANT_ID'),
    azureGrantType: getEnv('REACT_APP_AZURE_GRANT_TYPE'),
    azureScope: getEnv('REACT_APP_AZURE_SCOPE'),
    azureGraphSendEmailUrl: getEnv('REACT_APP_AZURE_GRAPH_SEND_EMAIL_URL'),
  },
  email: {
    emailSender: getEnv('REACT_APP_EMAIL_SENDER'),
    emailSenderName: getEnv('REACT_APP_EMAIL_SENDER_NAME'),
  }
};

export default config;