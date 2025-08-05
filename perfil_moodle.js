const { sendDelayedReply } = require('./message_response');

const Moodle = async (client, msg) => {
    await sendDelayedReply(client, msg, "A continuación te guiaré paso a paso para actualizar tu información personal en la plataforma:", 1500);

    await sendDelayedReply(client, msg, '1. Inicia sesión en la plataforma con tu usuario y contraseña');

    await sendDelayedReply(client, msg, '2. Una vez dentro, dirígete a la página de bienvenida principal');

    await sendDelayedReply(client, msg, '3. En la sección de datos personales, busca el icono de configuración (tiene forma de engrane ⚙️)');

    await sendDelayedReply(client, msg, '4. Haz clic en el icono de engrane ⚙️ para abrir el menú de configuración');

    await sendDelayedReply(client, msg, '5. Se abrirá una nueva ventana con opciones de configuración');

    await sendDelayedReply(client, msg, '6. Verás dos pestañas disponibles:\n- Actualizar correo y contraseña\n- Actualizar información personal');

    await sendDelayedReply(client, msg, '7. Selecciona la pestaña que dice "Actualizar información personal"');

    await sendDelayedReply(client, msg, '8. Dentro de esta sección, simplemente haz clic en el botón "Actualizar datos"');

    await sendDelayedReply(client, msg, '¡Listo! Con estos pasos habrás actualizado tu información personal correctamente.');

    await sendDelayedReply(client, msg, 'Intenta acceder nuevamente a los cursos!.');

    await sendDelayedReply(client, msg, "Si tienes alguna dificultad o necesitas asistencia adicional, puedes contactarnos al correo siesabisoporte@imssbienestar.gob.mx");

    await sendDelayedReply(client, msg, `Si quieres ver el menú escribe la palabra: *menu*`, 1500);
    await sendDelayedReply(client, msg, `Agradecemos que utilices nuestro servicio.`, 1500);
    await sendDelayedReply(client, msg, `Atentamente....`, 1500);
    await sendDelayedReply(client, msg, `Tu equipo SiESABI 🤓`, 1500);
    return;
}

module.exports = {
    Moodle
};