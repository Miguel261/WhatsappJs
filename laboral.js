const { sendDelayedReply, sendDelayedImage } = require('./message_response');
const path = require('path');

const Laboral = async (client, msg) => {
    const imageLaboral= path.join(__dirname, 'images', 'datos_laborales.png');
    const pestanaLaboral = path.join(__dirname, 'images', 'pestaña_laborales.png');

    await sendDelayedReply(client, msg, "🌟 *Actualización de Datos Laborales* 🌟\n\nPara mantener tu información actualizada en nuestro sistema, " +
        "por favor sigue esta guía paso a paso:", 1000);

    await sendDelayedReply(client, msg, "1️⃣ Accede a tu cuenta con tus credenciales actuales.", 1000);

    await sendDelayedReply(client, msg, "2️⃣ Una vez dentro, dirígete a la sección de 'Datos Laborales' y localiza el icono de configuración ⚙️", 1000);

    await sendDelayedImage(client, msg, {
        url: imageLaboral,
        caption: '3️⃣ Haz clic en el icono de engrane ⚙️ para abrir las opciones de configuración'
    }, 1000);

    await sendDelayedImage(client, msg, {
        url: pestanaLaboral,
        caption: `4️⃣ Se abrirá una nueva sección donde podrás:\n\n• Actualizar tus datos laborales actuales\n• Verificar tu unidad/adscripción\n• Completar o 
        modificar tu información profesional\n\n📌 *Importante*:\nMantener esta información actualizada nos permite:\n- Identificar correctamente tu unidad 
        administrativa\n- Brindarte un mejor seguimiento laboral\n Por favor verifica que todos 
        los datos sean precisos y estén completos.`
    }, 1000);

    await sendDelayedReply(client, msg, `Si quieres ver el menú escribe la palabra: *menu*`, 1500);
    await sendDelayedReply(client, msg, `Agradecemos que utilices nuestro servicio.`, 1500);
    await sendDelayedReply(client, msg, `Atentamente....`, 1500);
    await sendDelayedReply(client, msg, `Tu equipo SiESABI 🤓`, 1500);

    return;
}

module.exports = {
    Laboral
};