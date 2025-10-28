const { sendDelayedReply, sendDelayedImage } = require('./message_response');
const path = require('path');

const Constancias = async (client, msg) => {

    const inicioMoodle = path.join(__dirname, 'images', 'inicio_moodle.jpg');
    const misCertificados = path.join(__dirname, 'images', 'mis_certificados.jpg');
    const descarga = path.join(__dirname, 'images', 'descarga_const.png');
    
    await sendDelayedReply(client, msg, "A continuación te guiaré paso a paso para descargar las constancias de los cursos que hayas aprobado:", 1500);

    await sendDelayedReply(client, msg, "Inicia sesión, despúes accede a los cursos, en la sección de *Ir a cursos*.", 1500);

    await sendDelayedImage(client, msg, {
        url: inicioMoodle,
        caption: `En la ventana principal de los cursos, haz clic sobre el ícono de tu usuario, ubicado en la parte superior derecha. 
        Al desplegarse el menú, selecciona la opción *Perfil*`
    }, 1000);

    await sendDelayedImage(client, msg, {
        url: misCertificados,
        caption: `Dentro de tu perfil, desplázate hacia la parte inferior hasta encontrar la sección *Mis certificados*. 
        Haz clic en esa opción para ver tus constancias disponibles.`
    }, 1000);

    await sendDelayedImage(client, msg, {
        url: descarga,
        caption: `Finalmente, se mostrará una tabla con los cursos que has aprobado. 
        En la columna *Archivo*, encontrarás el botón para descargar tu constancia correspondiente.`
    }, 1000);


    await sendDelayedReply(client, msg, `Si deseas regresar al menú principal, escribe la palabra: *menu*`, 1500);
    await sendDelayedReply(client, msg, `Agradecemos que utilices nuestro servicio.`, 1500);
    await sendDelayedReply(client, msg, `Atentamente....`, 1500);
    await sendDelayedReply(client, msg, `Tu equipo SiESABI 🤓`, 1500);
    return;
}

module.exports = {
    Constancias
};