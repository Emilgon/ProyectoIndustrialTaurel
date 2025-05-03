import config from './config';
import sendMail from './sendMail';

export default async function sendResponseEmail(
  consultaId, 
  consultaName, 
  clientEmail, 
  replyContent, 
  fileName = null,
  fileUrl = null
) {
    const { emailSenderName, emailSender } = config.email;

    const htmlContentBody = `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2B5182; text-align: center;">Nueva respuesta a tu consulta</h2>
            
            <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin-top: 20px;">
                <p style="font-size: 16px; margin-bottom: 10px;">
                    <strong>Consulta:</strong> ${consultaName}
                </p>
                
                <div style="background-color: white; padding: 15px; border-left: 4px solid #2B5182; margin: 15px 0;">
                    <p style="margin: 0; font-size: 15px; line-height: 1.5;">${replyContent}</p>
                </div>

                ${fileName ? `
                <p style="margin-top: 15px; font-size: 14px;">
                    <strong>Archivo adjunto:</strong> 
                    <a href="${fileUrl || '#'}" target="_blank" style="color: #2B5182; text-decoration: none;">
                        ${fileName}
                    </a>
                </p>
                ` : ''}
            </div>
            
            <p style="text-align: center; margin-top: 30px; color: #666; font-size: 14px;">
                Este es un mensaje automático. Por favor no respondas directamente a este correo.
            </p>
            
            <p style="text-align: center; margin-top: 10px; color: #999; font-size: 12px;">
                Equipo de ${emailSenderName}
            </p>
        </div>
    `;

    const message = {
        subject: `Respuesta a tu consulta: ${consultaName}`,
        body: {
            contentType: "HTML",
            content: htmlContentBody,
        },
        toRecipients: [
            {
                emailAddress: {
                    address: clientEmail,
                },
            },
        ],
        from: {
            emailAddress: {
                address: emailSender,
                name: emailSenderName
            }
        }
    };

    try {
        await sendMail(message);
        console.log('Correo de respuesta enviado con éxito');
    } catch (error) {
        console.error('Error al enviar el correo de respuesta:', error);
        throw error;
    }
}