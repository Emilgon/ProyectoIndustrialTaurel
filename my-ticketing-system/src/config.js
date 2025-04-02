export default {
    email: {
        emailSender: process.env.EMAIL_SENDER,
        emailSenderName: process.env.EMAIL_SENDER_NAME,
        emailContact: process.env.EMAIL_CONTACT,
        emailContactName: process.env.EMAIL_CONTACT_NAME,
        emailContactPhone: process.env.EMAIL_CONTACT_PHONE,
        emailContactPhoneShow: process.env.EMAIL_CONTACT_PHONE_SHOW
    },
    azure: {
        azureClientId: process.env.AZURE_CLIENT_ID,
        azureClientSecret: process.env.AZURE_CLIENT_SECRET,
        azureTenantId: process.env.AZURE_TENANT_ID,
        azureGraphSendEmailUrl: process.env.AZURE_GRAPH_SEND_EMAIL_URL
    }
};
