const { sendDelayedReply } = require('./message_response');

const VerifyError = async (client, msg) => {
    await sendDelayedReply(client, msg, "Queremos informarles que nuestro equipo de desarrollo ya se encuentra trabajando activamente para " +
        "resolver el problema que se ha presentado.", 1500);

    await sendDelayedReply(client, msg, "Por el momento, la función de verificación no está disponible, " +
        "por lo cual no hay ningún inconveniente para que aceda a realizar los cursos.", 1500);

    await sendDelayedReply(client, msg, "Si tiene alguna duda o necesita asistencia adicional, no dude en contactarnos al correo a " +
        "siesabisoporte@imssbienestar.gob.mx Estamos aquí para ayudarle.", 1500);

    await sendDelayedReply(client, msg, `Si quieres ver el menú escribe la palabra: *menu*`, 1500);
    await sendDelayedReply(client, msg, `Agradecemos que utilices nuestro servicio.`, 1500);
    await sendDelayedReply(client, msg, `Atentamente....`, 1500);
    await sendDelayedReply(client, msg, `Tu equipo SiESABI 🤓`, 1500);
    return;
}

module.exports = {
    VerifyError
};