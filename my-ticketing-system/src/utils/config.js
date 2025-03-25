const getEnv = (key) => process.env[key];

const config = {
  azure: {
    azureLoginUrl: getEnv('NEXT_PUBLIC_AZURE_LOGIN_URL'),
    azureClientId: getEnv('NEXT_PUBLIC_AZURE_CLIENT_ID'),
    azureClientSecret: getEnv('NEXT_PUBLIC_AZURE_CLIENT_SECRET'),
    azureTenantId: getEnv('NEXT_PUBLIC_AZURE_TENANT_ID'),
    azureGrantType: getEnv('NEXT_PUBLIC_AZURE_GRANT_TYPE'),
    azureScope: getEnv('NEXT_PUBLIC_AZURE_SCOPE'),
    azureGraphSendEmailUrl: getEnv('NEXT_PUBLIC_AZURE_GRAPH_SEND_EMAIL_URL'),
  },
  email: {
    emailSender: getEnv('NEXT_PUBLIC_EMAIL_SENDER'),
    emailSenderName: getEnv('NEXT_PUBLIC_EMAIL_SENDER_NAME'),
  }
};

export default config;