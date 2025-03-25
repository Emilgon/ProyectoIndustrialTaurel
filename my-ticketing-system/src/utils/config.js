const config = {
  azure: {
    azureLoginUrl: 'https://login.microsoftonline.com/{tenantId}/oauth2/v2.0/token',
    azureClientId: process.env.REACT_APP_AZURE_CLIENT_ID,
    azureClientSecret: process.env.REACT_APP_AZURE_CLIENT_SECRET,
    azureTenantId: process.env.REACT_APP_AZURE_TENANT_ID,
    azureGrantType: 'client_credentials',
    azureScope: 'https://graph.microsoft.com/.default',
    azureGraphSendEmailUrl: 'https://graph.microsoft.com/v1.0/users/{emailSender}/sendMail',
  },
  email: {
    emailSender: 'cotizaciones@taurel.com',
    emailSenderName: 'Soporte Taurel',
    emailContact: 'cotizaciones@taurel.com',
    emailContactName: 'Soporte Taurel',
    emailContactPhone: '+58-212-1234567',
    emailContactPhoneShow: '+58-212-1234567'
  }
};

export default config;
