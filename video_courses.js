const { sendDelayedReply } = require('./message_response');
const { consultarIA } = require('./ia_service');
const { getUserContext, setUserContext, resetUserContext } = require('./users');

// Función auxiliar para el delay entre envíos
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const videoCourses = async (client, msg) => {
    const userObject = getUserContext(msg.from);

    const equipoEdicion = [
        '5215545361921@c.us',
        '5215539118813@c.us',
        '5219871073725@c.us',
        '5217443380646@c.us',
    ];

    // 1. Primer contacto: Solicitar nombre del curso
    if (!userObject.flow || userObject.flow !== 'esperando_nombre_curso') {
        const pideCursoIA = await consultarIA(
            "Pide al usuario el nombre del curso donde el video no se ve. REGLA: NO SALUDES.",
            "### FLUJO: PEDIR_NOMBRE_CURSO"
        );

        await sendDelayedReply(client, msg, pideCursoIA, 500);

        setUserContext(msg.from, {
            ...userObject,
            flow: 'esperando_nombre_curso'
        });
        return; // Detenemos aquí para esperar la respuesta
    }

    // 2. Procesar la respuesta del usuario
    if (userObject.flow === 'esperando_nombre_curso') {
        const nombreCurso = msg.body.trim();

        // Respuesta confirmando al usuario (Sin saludo)
        const respuestaUsuarioIA = await consultarIA(
            `Confirma al usuario que el video del curso "${nombreCurso}" ha sido reportado al equipo de edición. ` +
            `REGLA DE ORO: Indícale que, por favor, intente visualizarlo nuevamente en un lapso de 24 horas. ` +
            `REGLA: NO SALUDES, sé profesional, empático y muy breve.`,
            "### FLUJO: CONFIRMACION_USUARIO"
        );

        await sendDelayedReply(client, msg, respuestaUsuarioIA, 500);

        // Generar mensaje para editores (Con saludo)
        const mensajeEquipoIA = await consultarIA(
            `Actúa como un integrante del equipo de soporte de SiESABI que se comunica con sus compañeros de edición. 
    
            INSTRUCCIONES DE ESTILO:
            1. SALUDA de forma muy cordial (ej. "Hola equipo", "Buen día compañeros").
            2. Notifica que un usuario nos contactó porque no puede visualizar el video del curso "${nombreCurso}".
            3. Pídeles de favor si pueden apoyarnos revisando el enlace o el archivo cuando tengan un espacio en su agenda.
            4. Despídete deseándoles un excelente día.
            
            REGLA CRÍTICA: El tono debe ser de colaboración y apoyo entre colegas, evita sonar como una alerta técnica o un comando de error.`,
            "### NOTIFICACION: APOYO_EQUIPO_EDICION"
        );

        // Envío con Delay entre cada número
        for (const numero of equipoEdicion) {
            try {
                await client.sendMessage(numero, `🔔 *AVISO DE SiESABI*\n\n${mensajeEquipoIA}`);
                console.log(`Notificación enviada a ${numero}`);
                await sleep(2000); // Espera 2 segundos entre cada envío para evitar bloqueos
            } catch (error) {
                console.error(`Error al notificar al número ${numero}:`, error.message);
            }
        }

        resetUserContext(msg.from);
        return;
    }
}

module.exports = {
    videoCourses
};