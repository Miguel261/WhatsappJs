const { sendDelayedReply, sendDelayedImage } = require('./message_response');
const { consultarIA } = require('./ia_service');
const path = require('path');

const Constancias = async (client, msg) => {
    // 1. Definición de rutas de imágenes
    const inicioMoodle = path.join(__dirname, 'images', 'inicio_moodle.jpg');
    const misCertificados = path.join(__dirname, 'images', 'mis_certificados.jpg');
    const descarga = path.join(__dirname, 'images', 'descarga_const.png');

    // 2. IA genera la introducción y el primer paso
    const introConstancias = await consultarIA(
        "El usuario quiere descargar sus constancias o certificados en SiESABI. " +
        "Dile que lo guiarás paso a paso. Paso 1: Iniciar sesión y entrar a la sección de cursos. " +
        "Sé amable y usa emojis de éxito, No pidas ningun dato",
        "Guía de Certificación SiESABI"
    );

    // 3. IA genera los captions para cada imagen técnica
    const captionPerfil = await consultarIA(
        "Explica que en la ventana principal debe ir a su icono de usuario (arriba a la derecha) y seleccionar 'Perfil'. Máximo 20 palabras.",
        "Instrucción Perfil"
    );

    const captionCertificados = await consultarIA(
        "Explica que dentro del perfil debe bajar hasta encontrar 'Mis certificados'. Máximo 20 palabras.",
        "Instrucción Certificados"
    );

    const captionDescarga = await consultarIA(
        "Explica que verá una tabla con sus cursos aprobados y debe hacer clic en el botón de la columna 'Archivo' para descargar. Termina invitando a escribir MENU. Máximo 30 palabras.",
        "Instrucción Descarga"
    );

    // --- Ejecución de envíos ---

    // Introducción
    await sendDelayedReply(client, msg, introConstancias, 1000);

    // Imagen 1: Ir a Perfil
    await sendDelayedImage(client, msg, {
        url: inicioMoodle,
        caption: `👤 ${captionPerfil}`
    }, 1500);

    // Imagen 2: Sección Mis Certificados
    await sendDelayedImage(client, msg, {
        url: misCertificados,
        caption: `📜 ${captionCertificados}`
    }, 1500);

    // Imagen 3: Botón de descarga final
    await sendDelayedImage(client, msg, {
        url: descarga,
        caption: `📥 ${captionDescarga}`
    }, 1500);

    return;
}

module.exports = { Constancias };