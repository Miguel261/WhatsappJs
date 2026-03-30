const { sendDelayedReply, sendDelayedImage } = require('./message_response');
const { consultarIA } = require('./ia_service');
const path = require('path');

const Personal = async (client, msg) => {
    // Definimos las rutas de las imágenes (esto es fijo)
    const imagePersonal = path.join(__dirname, 'images', 'datos_personales.png');
    const pestanaPersonal = path.join(__dirname, 'images', 'pestaña_personales.png');

    // 1. Pedimos a la IA una introducción y los primeros 2 pasos
    const introPasos = await consultarIA(
        "El usuario quiere actualizar sus datos personales en SiESABI. " +
        "Redacta una introducción breve y los primeros 2 pasos: " +
        "1. Iniciar sesión. 2. Ir a sección Datos Personales y buscar el engrane ⚙️. " +
        "Sé amable y usa emojis.",
        "Guía SiESABI"
    );

    // 2. Pedimos a la IA el texto para la primera imagen (Paso 3)
    const captionImagen1 = await consultarIA(
        "Genera una instrucción muy corta (máximo 15 palabras) que diga que deben hacer clic en el engrane ⚙️.",
        "Instrucción Visual"
    );

    // 3. Pedimos a la IA el texto final y recomendaciones (Paso 4)
    const finalGuia = await consultarIA(
        "Explica que se abrirá una pestaña para cambiar correo, contraseña y datos. " +
        "Recomienda mantener el celular actualizado para recuperar la cuenta. " +
        "Termina invitando a escribir MENU si terminó. Máximo 50 palabras.",
        "Guía SiESABI"
    );

    // --- Ejecución de envíos ---

    // Envío de introducción y primeros pasos
    await sendDelayedReply(client, msg, introPasos, 1000);

    // Envío de primera imagen con su caption de la IA
    await sendDelayedImage(client, msg, {
        url: imagePersonal,
        caption: `3️⃣ ${captionImagen1}`
    }, 1200);

    // Envío de segunda imagen con el cierre de la IA
    await sendDelayedImage(client, msg, {
        url: pestanaPersonal,
        caption: `4️⃣ ${finalGuia}`
    }, 1500);

    return;
}

module.exports = { Personal };