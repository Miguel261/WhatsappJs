const { sendDelayedReply } = require('./message_response');
const { consultarIA } = require('./ia_service');

const CoursesKey = async (client, msg) => {
    // Le pedimos a la IA que explique la situación de las claves de inscripción
    const respuestaIA = await consultarIA(
        "El usuario pregunta por una clave de inscripción para un curso presencial. " +
        "Explica que estas claves las entrega el personal encargado de la capacitación directamente. " +
        "Dile que contacte a su responsable de curso. " +
        "Menciona que para dudas técnicas escriba a siesabisoporte@imssbienestar.gob.mx. " +
        "Sé amable, profesional y termina invitando a escribir MENU. Máximo 60 palabras.",
        "Asistente de Capacitación SiESABI"
    );

    // Enviamos la respuesta única generada por la IA
    await sendDelayedReply(client, msg, respuestaIA, 1000);

    // Mensaje de cierre con el correo de soporte destacado
    await sendDelayedReply(client, msg, "📧 *siesabisoporte@imssbienestar.gob.mx*\n¡Mucho éxito en tu capacitación! 🤓", 1500);

    return;
}

module.exports = {
    CoursesKey
};