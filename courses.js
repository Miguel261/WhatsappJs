const { sendDelayedReply } = require('./message_response');

const CoursesProblem = async (client, msg) =>{
    await sendDelayedReply(client, msg, "La opción que ha seleccionado corresponde a un problema más específico " +
        "que requiere atención personalizada. Le invitamos a ponerse en contacto con los administradores para brindarle "+
        "asistencia directa.", 1500);

    await sendDelayedReply(client, msg, "Por favor, escriba a siesabisoporte@imssbienestar.gob.mx detallando su situación, y " +
        "con gusto le ayudaremos a resolverlo a la brevedad posible.", 1500);

    await sendDelayedReply(client, msg, `Para ver todas las opciones disponibles, escribe: *menu*`, 1500);
    await sendDelayedReply(client, msg, `O si prefieres ir directamente a una opción específica, escribe su número correspondiente.`, 1500);
    await sendDelayedReply(client, msg, `Agradecemos que utilices nuestro servicio.`, 1500);
    await sendDelayedReply(client, msg, `Atentamente....`, 1500);
    await sendDelayedReply(client, msg, `Tu equipo SiESABI 🤓`, 1500);
    return;
}

module.exports = {
    CoursesProblem
};