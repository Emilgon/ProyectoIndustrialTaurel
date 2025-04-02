import config from './config';
import sendMail from './sendMail';

export default async function sendResponseEmail(consultaId, consultaName, clientEmail, replyContent, fileName = null) {
    const { emailContact, emailContactName, emailContactPhone, emailContactPhoneShow } = config.email;

    // Formatear fecha actual
    const currentDate = new Date().toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit'
    });

    const htmlContentBody = `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 5px; background-color: #f9f9f9;">
            <h3 style="color: #2B5182;">Estimado(a) Cliente,</h3>
            
            <p style="color: #555;">Hemos recibido tu consulta y estamos trabajando en ella.</p>
            
            <h4 style="color: #2B5182;">Respuesta a tu Consulta:</h4>
            <ul style="color: #555; list-style-type: none; padding: 0;">
                <li><strong>Consulta:</strong> ${consultaName}</li>
                <li><strong>Fecha de Respuesta:</strong> ${currentDate}</li>
            </ul>
            
            <div style="background-color: white; padding: 15px; border-left: 4px solid #2B5182; margin: 15px 0;">
                <p style="margin: 0; font-size: 15px; line-height: 1.5;">${replyContent}</p>
            </div>

            ${fileName ? `
            <p style="margin-top: 15px; font-size: 14px;">
                <strong>Archivo adjunto:</strong> ${fileName}
            </p>
            ` : ''}

            <h4 style="color: #2B5182;">Contacto:</h4>
            <p style="color: #555;">Si necesitas más información o tienes alguna pregunta, puedes contactarnos a través de:</p>
            <ul style="color: #555; list-style-type: none; padding: 0;">
                <li>
                    <strong style="color: #2B5182;">Email:</strong> 
                    <a href="mailto:${emailContact}" style="color: #2B5182; text-decoration: none; font-weight: bold;">${emailContactName}</a>
                </li>
                <li style="margin-bottom: 10px;">
                    <strong style="color: #2B5182;">Teléfono:</strong> 
                    <a href="tel:${emailContactPhone}" style="color: #2B5182; text-decoration: none; font-weight: bold;">${emailContactPhoneShow}</a>
                </li>
            </ul>    
            
            <p style="color: #999;">Saludos,<br>El equipo de Taurel</p>    
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
    };

    try {
        await sendMail(message);
    } catch (error) {
        console.error('Error al enviar el correo de respuesta:', error);
        throw error;
    }
}