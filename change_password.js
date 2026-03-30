const { sendDelayedReply } = require('./message_response');
const { funtionApi } = require('./api');
const { getUserContext, setUserContext, resetUserContext } = require('./users');
const { consultarIA } = require('./ia_service');

const confirmChangePassword = async (client, msg) => {
    const userObject = getUserContext(msg.from);
    const now = Date.now();

    // 1. Verificación de bloqueo por intentos
    if (userObject.blockedUntil && userObject.blockedUntil > now) {
        const minutes = Math.ceil((userObject.blockedUntil - now) / (60 * 1000));
        const avisoBloqueo = await consultarIA(
            `Dile al usuario que ha excedido los intentos y debe esperar ${minutes} minutos por seguridad. PROHIBIDO SALUDAR.`,
            "Seguridad SiESABI"
        );
        await sendDelayedReply(client, msg, avisoBloqueo, 1000);
        return;
    }

    // 2. Inicio del flujo: Preguntar si desea cambiar contraseña
    if (!userObject.flow) {
        const preguntaIA = await consultarIA(
            "Actúa como el asistente de seguridad de SiESABI. Pregunta si el usuario desea proceder con el cambio de su contraseña ahora mismo. " +
            "REGLA OBLIGATORIA: Indica claramente que debe responder con un 'SÍ' para continuar o un 'NO' para declinar. " +
            "REGLA DE SALUDO: NO SALUDES, ve directo a la pregunta de seguridad.",
            "### FLUJO: INVITACION_PASSWORD"
        );
        await sendDelayedReply(client, msg, preguntaIA, 0);
        setUserContext(msg.from, { ...userObject, flow: 'confirm_pass_change', intentos: 0 });
        return;
    }

    // 3. Procesamiento de la respuesta
    if (userObject.flow === 'confirm_pass_change') {

        // Normalización para evitar fallos de lectura
        const userResponse = msg.body.toLowerCase()
            .trim()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");

        if (userResponse === 'si' || userResponse === 's') {
            const res = await funtionApi(userObject.userData.user, 1);

            if (!res) {
                const errorConexion = await consultarIA("Explica que hay un problema de conexión con el servidor. PROHIBIDO SALUDAR.");
                await sendDelayedReply(client, msg, errorConexion, 1000);
                setUserContext(msg.from, { flow: null, intentos: 0 });
                return;
            }

            if (res == 500 || res == 404) {
                const errorTecnico = await consultarIA(
                    "Error en el servidor al resetear contraseña. Contactar a siesabisoporte@imssbienestar.gob.mx. NO SALUDES.",
                    "Error 404/500"
                );
                await sendDelayedReply(client, msg, errorTecnico, 1000);
                setUserContext(msg.from, { flow: null, intentos: 0 });
                return;
            }

            if (res.status == 200) {
                const exitoIA = await consultarIA(
                    `ACTÚA COMO UN SISTEMA DE ENTREGA DE DATOS SEGUROS.

                    VALORES A ENTREGAR (OBLIGATORIO):
                    Correo: ${userObject.userData.user.email}
                    Contraseña Temporal: ${res.data.password}

                    REGLAS DE FORMATO (ESTRICTAS):
                    1. PROHIBIDO usar asteriscos (*), negritas o cualquier símbolo de formato.
                    2. PROHIBIDO poner puntos (.) al final de la contraseña o del correo.
                    3. Entrega los datos en líneas separadas, sin viñetas ni puntos de lista.
                    4. PROHIBIDO SALUDAR.

                    CONTENIDO:
                    - Comienza con una frase muy corta de éxito (ej: Acceso listo o Datos generados).
                    - Muestra el Correo y la Contraseña en su propia línea cada uno.
                    - Termina con una instrucción breve: Por seguridad cambia tu clave al entrar
                    - No uses etiquetas HTML.`,
                    "### FLUJO: ENTREGA_DATOS_LIMPIOS"
                );

                await sendDelayedReply(client, msg, exitoIA, 1000);

                const instruccionesIA = await consultarIA(
                    `Guía técnica breve: 
                    1. Ve a **Datos Personales** (⚙️).
                    2. Activa **¿Desea actualizar su contraseña?**.
                    3. Guarda cambios.
                    REGLAS: NO SALUDES, usa negritas, ve directo al paso 1.`,
                    "### INSTRUCCIÓN: MANUAL_PASSWORD"
                );

                await sendDelayedReply(client, msg, instruccionesIA, 1500);

                const despedida = await consultarIA(
                    "Despedida breve con este link: https://educacion.imssbienestar.gob.mx/. PROHIBIDO SALUDAR.",
                    "### CONTEXTO: CIERRE"
                );
                await sendDelayedReply(client, msg, despedida, 2000);

                resetUserContext(msg.from);
                return;
            }

        } else if (userResponse === 'no' || userResponse === 'cancelar' || userResponse === 'n') {
            const cancelado = await consultarIA(
                "El usuario canceló el cambio de contraseña. Confirma que no hay problema y su seguridad es primero. " +
                "Incluye link: https://educacion.imssbienestar.gob.mx/ " +
                "REGLA: NO SALUDES, sé muy breve.",
                "### CONTEXTO: CIERRE_CANCELADO"
            );
            await sendDelayedReply(client, msg, cancelado, 1000);
            resetUserContext(msg.from);
            return;

        } else {
            const intentos = (userObject.intentos || 0) + 1;

            if (intentos >= 10) {
                setUserContext(msg.from, {
                    ...userObject,
                    blockedUntil: now + 10 * 60 * 1000,
                    intentos
                });
                const msgBloqueo = await consultarIA("Ha fallado demasiados intentos. Esperar 10 min. NO SALUDES.");
                await sendDelayedReply(client, msg, msgBloqueo, 1000);
                resetUserContext(msg.from);
                return;
            }

            setUserContext(msg.from, { ...userObject, intentos });
            const errorResp = await consultarIA(
                `Respuesta "${msg.body}" no válida. Pide responder "SÍ", "NO" o "CANCELAR". ` +
                `REGLA: NO SALUDES, sé muy breve.`,
                "### VALIDACIÓN: REINTENTO"
            );
            await sendDelayedReply(client, msg, `⚠️ Intento ${intentos}/10\n${errorResp}`, 1000);
            return;
        }
    }
}

module.exports = {
    confirmChangePassword
};