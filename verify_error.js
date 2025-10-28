const { sendDelayedReply } = require('./message_response');

const VerifyError = async (client, msg) => {
    await sendDelayedReply(client, msg, "Estimado usuario, actualmente el servicio de verificación se encuentra saturado debido al alto número de solicitudes.", 1500);

    await sendDelayedReply(client, msg, "Le pedimos por favor intentarlo nuevamente más tarde.", 1500);

    await sendDelayedReply(client, msg, "Agradecemos su comprensión y paciencia.", 1500);

    await sendDelayedReply(client, msg, `Si quieres ver el menú escribe la palabra: *menu*`, 1500);
    await sendDelayedReply(client, msg, `Agradecemos que utilices nuestro servicio.`, 1500);
    await sendDelayedReply(client, msg, `Atentamente....`, 1500);
    await sendDelayedReply(client, msg, `Tu equipo SiESABI 🤓`, 1500);
    return;
}

module.exports = {
    VerifyError
};