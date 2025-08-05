const { sendDelayedReply, sendDelayedImage } = require('./message_response');
const path = require('path');

const Personal = async (client, msg) => {
    const imagePersonal = path.join(__dirname, 'images', 'datos_personales.png');
    const pestanaPersonal = path.join(__dirname, 'images', 'pestaña_personales.png');

    await sendDelayedReply(client, msg, "🌟 *Actualización de Datos Personales* 🌟\n\nPara mantener tu información actualizada en nuestro sistema, " +
        "por favor sigue esta guía paso a paso:", 1000);

    await sendDelayedReply(client, msg, "1️⃣ Accede a tu cuenta con tus credenciales actuales.", 1000);

    await sendDelayedReply(client, msg, "2️⃣ Una vez dentro, dirígete a la sección de 'Datos Personales' y localiza el icono de configuración ⚙️", 1000);

    await sendDelayedImage(client, msg, {
        url: imagePersonal,
        caption: '3️⃣ Haz clic en el icono de engrane ⚙️ para abrir las opciones de configuración'
    }, 1000);

    await sendDelayedImage(client, msg, {
        url: pestanaPersonal,
        caption: '4️⃣ Se abrirá una nueva pestaña donde podrás:\n• Cambiar tu correo electrónico y actualizar tu contraseña\n• Modificar otros datos personales\n\n ' +
        '*Haz clic en "Actualizar información personal"*\n\n💡 *Recomendación importante*:\n' +
        'Mantén siempre actualizado tu número celular registrado\n.'+
        'Esto te permitirá recuperar el acceso a tu cuenta en caso de olvidar tus credenciales.'
    }, 1000);

    await sendDelayedReply(client, msg, `Si quieres ver el menú escribe la palabra: *menu*`, 1500);
    await sendDelayedReply(client, msg, `Agradecemos que utilices nuestro servicio.`, 1500);
    await sendDelayedReply(client, msg, `Atentamente....`, 1500);
    await sendDelayedReply(client, msg, `Tu equipo SiESABI 🤓`, 1500);

    return;
}

module.exports = {
    Personal
};