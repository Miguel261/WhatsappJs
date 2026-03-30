const { sendDelayedReply } = require('./message_response');
const { consultarIA } = require('./ia_service'); // Importamos la IA

const CoursesProblem = async (client, msg) => {
    // Le pedimos a la IA que redacte la derivación a soporte técnico
    const respuestaIA = await consultarIA(
        "El usuario tiene un problema con el avance de sus cursos que el bot no puede resolver. " +
        "Explícale amablemente que requiere atención personalizada de un administrador. " +
        "Indícale que debe escribir a siesabisoporte@imssbienestar.gob.mx detallando su caso. " +
        "Termina invitándolo a escribir MENU si necesita otra cosa. Sé breve y profesional.",
        "Soporte Técnico SiESABI"
    );

    // Enviamos la respuesta generada por la IA
    await sendDelayedReply(client, msg, respuestaIA, 1000);

    return;
}

module.exports = {
    CoursesProblem
};