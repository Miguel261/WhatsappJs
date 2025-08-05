const { sendDelayedReply } = require('./message_response');

const CoursesKey = async (client, msg) => {
    await sendDelayedReply(client, msg, "El curso se llevará a cabo de manera presencial, por lo que necesitarás una clave de inscripción para participar. ", 1500);
    await sendDelayedReply(client, msg, "Si te han solicitado asistir a este curso, la información necesaria debe ser proporcionada " +
        "por el personal encargado de la capacitación.", 1500);

    await sendDelayedReply(client, msg, "Te recomendamos que te pongas en contacto con la persona responsable para obtener más detalles.", 1500);
    await sendDelayedReply(client, msg, "Si tiene alguna duda o necesita asistencia adicional, no dude en contactarnos al correo a " +
        "siesabisoporte@imssbienestar.gob.mx Estamos aquí para ayudarle.", 1500);

    await sendDelayedReply(client, msg, `Si quieres ver el menú escribe la palabra: *menu*`, 1500);
    await sendDelayedReply(client, msg, `Agradecemos que utilices nuestro servicio.`, 1500);
    await sendDelayedReply(client, msg, `Atentamente....`, 1500);
    await sendDelayedReply(client, msg, `Tu equipo SiESABI 🤓`, 1500);
    return;
}

module.exports = {
    CoursesKey
};