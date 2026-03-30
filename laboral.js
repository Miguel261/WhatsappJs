const { sendDelayedReply, sendDelayedImage } = require('./message_response');
const { consultarIA } = require('./ia_service');
const path = require('path');

const Laboral = async (client, msg) => {
    // Definimos las rutas de las imágenes fijas
    const imageLaboral = path.join(__dirname, 'images', 'datos_laborales.png');
    const pestanaLaboral = path.join(__dirname, 'images', 'pestaña_laborales.png');

    // 1. IA redacta la introducción y los primeros pasos técnicos
    const introLaboral = await consultarIA(
        "El usuario necesita actualizar sus datos laborales en SiESABI. " +
        "Redacta una introducción breve y los pasos 1 y 2: " +
        "1. Loguearse. 2. Buscar la sección 'Datos Laborales' y el icono de engrane ⚙️. " +
        "Sé profesional y usa emojis de oficina.",
        "Asistente SiESABI"
    );

    // 2. IA redacta el caption para la primera imagen (engrane)
    const captionEngrane = await consultarIA(
        "Indica brevemente que deben presionar el icono de configuración ⚙️ en la sección laboral. Máximo 12 palabras.",
        "Instrucción Técnica"
    );

    // 3. IA redacta la explicación de la pestaña laboral y la importancia de la adscripción
    const cierreLaboral = await consultarIA(
        "Explica que en la nueva pestaña pueden actualizar su unidad, adscripción e información profesional. " +
        "Menciona que es importante para el seguimiento administrativo. " +
        "Termina invitando a escribir MENU. Sé muy conciso.",
        "Soporte Administrativo"
    );

    // --- Ejecución de envíos con los tiempos controlados ---

    // Introducción y primeros pasos
    await sendDelayedReply(client, msg, introLaboral, 1000);

    // Primera imagen (Sección laboral)
    await sendDelayedImage(client, msg, {
        url: imageLaboral,
        caption: `3️⃣ ${captionEngrane}`
    }, 1200);

    // Segunda imagen (Pestaña de edición)
    await sendDelayedImage(client, msg, {
        url: pestanaLaboral,
        caption: `4️⃣ ${cierreLaboral}`
    }, 1500);

    return;
}

module.exports = { Laboral };