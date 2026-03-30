const { sendDelayedReply } = require('./message_response');
const { consultaCurpApi, updateEmail } = require('./api');
const { getUserContext, setUserContext, resetUserContext } = require('./users');
const { confirmChangePassword } = require('./change_password');
const { consultarIA } = require('./ia_service');

const QuestionEmailFisrt = async (client, msg) => {
    const userObject = getUserContext(msg.from);
    const now = Date.now();

    if (userObject.blockedUntil && userObject.blockedUntil > now) {
        const minutes = Math.ceil((userObject.blockedUntil - now) / (60 * 1000));
        const avisoIA = await consultarIA(`Informa al usuario de forma amable que ha excedido los intentos y debe esperar ${minutes} minutos. NO SALUDES.`);
        await sendDelayedReply(client, msg, avisoIA, 1000);
        return;
    }

    if (!userObject.curpRequested) {
        await sendDelayedReply(client, msg, `Para verificar su información, escriba su *CURP*:`, 600);

        setUserContext(msg.from, {
            ...userObject,
            curpRequested: true,
            flow: 'esperando_curp',
            intentos: 0
        });
        return;
    }

    if (userObject.flow === 'esperando_curp') {
        const curp = msg.body.toUpperCase().trim();
        const userData = await consultaCurpApi(curp);

        if (userData === 404 || userData === 500) {
            const intentos = (userObject.intentos || 0) + 1;
            setUserContext(msg.from, { ...userObject, intentos });

            const errorCurpIA = await consultarIA(
                "Informa al usuario que su CURP no fue localizada. " +
                "Pídele que verifique los 18 caracteres y la escriba de nuevo. " +
                "REGLA: NO SALUDES, sé empático y breve.",
                "### ESTADO: CURP_404"
            );
            return await sendDelayedReply(client, msg, errorCurpIA, 1000);
        }

        if (!userData.phone) {
            const msgIncompleto = await consultarIA(
                `Informa que la CURP fue localizada pero el registro está incompleto. 
                REGLA: Debe enviar correo a siesabisoporte@imssbienestar.gob.mx con CURP, NOMBRE y EMAIL. Asunto: "NO COMPLETE MI REGISTRO".
                NO SALUDES, ve directo a la información técnica necesaria.`,
                "### ESTADO: REGISTRO_INCOMPLETO"
            );
            await sendDelayedReply(client, msg, msgIncompleto, 1000);
            resetUserContext(msg.from);
            return;
        }

        if (userData.user) {
            const contact = await msg.getContact();
            const numeroWA = contact.number.replace(/\D/g, '').slice(-10);
            const numeroBD = userData.phone ? String(userData.phone).replace(/\D/g, '').slice(-10) : null;

            if (!numeroBD || numeroWA === numeroBD) {
                setUserContext(msg.from, {
                    ...userObject,
                    curp,
                    userData,
                    flow: null,
                    curpRequested: false,
                    intentos: 0
                });

                const infoIA = await consultarIA(
                    `El correo en el sistema es: ${userData.user.email}

                    INSTRUCCIÓN DE DINAMISMO:
                    - No respondas siempre igual. Varía la frase inicial (ej: El correo registrado es, Tu email es, Hemos localizado este correo).

                    REGLAS TÉCNICAS (ESTRICTAS):
                    1. PROHIBIDO usar HTML, asteriscos (*) o negritas. Solo texto plano.
                    2. PROHIBIDO SALUDAR (No digas Hola ni Bienvenido).
                    3. Muestra el correo sin puntos finales: ${userData.user.email}
                    4. Usa un emoji (📧, 📩) al inicio.

                    CONTENIDO DEL MENSAJE (MÁXIMO 20 PALABRAS):
                    - Indica el correo asociado.
                    - Pregunta directamente: ¿Es correcto?.`,
                    "### INFO: CONSULTA_EMAIL_LIMPIO"
                );
                await sendDelayedReply(client, msg, infoIA, 1000);

                return handleEmailFlow(client, msg);
            } else {
                const msgErrorTel = await consultarIA(
                    `Informa al usuario que, por políticas de seguridad de SiESABI, no podemos mostrar su información porque el número de WhatsApp desde el que escribe no coincide con el teléfono registrado en su cuenta.
    
                    INSTRUCCIÓN DE SALIDA:
                    1. Explica brevemente esta falta de coincidencia de números.
                    2. Indica que para recuperar su acceso debe enviar un correo a **siesabisoporte@imssbienestar.gob.mx**.
                    3. Menciona que incluya su NOMBRE, CURP y EMAIL con el asunto: "NO TENGO MIS DATOS DE ACCESO".
                    
                    REGLAS:
                    - NO uses listas de viñetas (bullet points).
                    - Usa un tono profesional y protector.
                    - Escribe el correo y el asunto en **negritas**.
                    - Sé muy breve y varía siempre tu redacción.`,
                    "### SEGURIDAD: ERROR_VALIDACION_TELEFONO"
                );
                
                await sendDelayedReply(client, msg, `❌ ${msgErrorTel}`, 1500);
                resetUserContext(msg.from);
                return;
            }
        }
    }
};

async function handleEmailFlow(client, msg) {
    const userObject = getUserContext(msg.from);
    const response = msg.body.toUpperCase().trim();

    if (userObject.flow === 'ask_email') return QuestionEmail(client, msg);

    if (!userObject.flow || userObject.flow === 'esperando_curp') {
        const preguntaIA = await consultarIA(
            "Pregunta si desea actualizar su correo. " +
            "REGLA OBLIGATORIA: Responder con 'SÍ' para iniciar, 'NO' para mantener el actual o 'CANCELAR'. " +
            "REGLA DE SALUDO: NO SALUDES, ya nos saludamos antes. Ve directo a la pregunta.",
            "### FLUJO: INVITACION_EMAIL"
        );
        await sendDelayedReply(client, msg, preguntaIA, 1000);
        setUserContext(msg.from, { ...userObject, flow: 'ask_email_change', intentos: 0 });
        return;
    }

    if (userObject.flow === 'ask_email_change') {
        if (response.includes('SI')) {
            setUserContext(msg.from, { ...userObject, flow: null });
            return QuestionEmail(client, msg);
        } else if (response.includes('NO')) {
            setUserContext(msg.from, { ...userObject, flow: null });
            return confirmChangePassword(client, msg);
        } else if (response.includes('CANCELAR')) {
            const adiosIA = await consultarIA(
                "Despedida cordial y breve. Éxito en la capacitación. " +
                "REGLA: NO SALUDES, solo despídete.",
                "### FLUJO: CIERRE"
            );
            await sendDelayedReply(client, msg, adiosIA, 1000);
            resetUserContext(msg.from);
            return;
        } else {
            const reintentoIA = await consultarIA(
                "Respuesta confusa. Pide responder: **SÍ**, **NO** o **CANCELAR**. NO SALUDES.",
                "### FLUJO: REINTENTO"
            );
            await sendDelayedReply(client, msg, reintentoIA, 1000);
        }
    }
}

const QuestionEmail = async (client, msg) => {
    const userObject = getUserContext(msg.from);
    const newEmail = msg.body.trim().toLowerCase();

    if (!userObject.flow || userObject.flow !== 'ask_email') {
        const pideEmailIA = await consultarIA(
            "Pide al usuario su nueva dirección de correo. " +
            "REGLA: Minúsculas, sin espacios. Emoji 📧. PROHIBIDO SALUDAR.",
            "### FLUJO: CAPTURA_EMAIL"
        );
        await sendDelayedReply(client, msg, pideEmailIA, 1000);
        setUserContext(msg.from, { ...userObject, flow: 'ask_email', intentos: 0 });
        return;
    }

    if (newEmail === 'cancelar') {
        const cancelaIA = await consultarIA(
            "Confirma cancelación del cambio de correo. " +
            "REGLA: NO SALUDES, sé breve y amable.",
            "### FLUJO: CANCELACION"
        );
        await sendDelayedReply(client, msg, cancelaIA, 1000);
        resetUserContext(msg.from);
        return;
    }

    const regex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!regex.test(newEmail)) {
        const errorEmailIA = await consultarIA(
            "Correo inválido. Pídelo de nuevo explicando el formato (@ y dominio). NO SALUDES.",
            "### FLUJO: ERROR_EMAIL"
        );
        return await sendDelayedReply(client, msg, errorEmailIA, 1000);
    }

    setUserContext(msg.from, { ...userObject, flow: null, pendingEmail: newEmail });
    return confirmChangeEmail(client, msg);
};

const confirmChangeEmail = async (client, msg) => {
    const userObject = getUserContext(msg.from);
    const response = msg.body.toUpperCase().trim();
    const now = Date.now();

    if (userObject.blockedUntil && userObject.blockedUntil > now) {
        const minutes = Math.ceil((userObject.blockedUntil - now) / (60 * 1000));
        await sendDelayedReply(client, msg, `⛔ Intentos excedidos. Espera ${minutes} min.`, 1000);
        return;
    }

    if (!userObject.flow || userObject.flow !== 'confirm_email_change') {
        const confirmaIA = await consultarIA(
            `El usuario quiere registrar el correo: **${userObject.pendingEmail}**. 
            Tu tarea es pedirle que confirme si es correcto para continuar. 

            REGLAS DE FORMATO (ESTRICTAS):
            1. PROHIBIDO usar cualquier etiqueta HTML (como <ul>, <li>, <p>, <b>).
            2. Usa ÚNICAMENTE texto plano y Markdown de WhatsApp (asteriscos para negritas).
            3. PROHIBIDO SALUDAR: Ve directo a la validación.

            DINAMISMO Y ESTILO:
            - No repitas siempre la misma frase. Varía tu redacción en cada consulta.
            - Ejemplos: "¿Es correcta esta dirección?", "¿Confirmas que este es tu correo?", "¿Está bien escrito el email?", etc.
            - Usa emojis de forma variada (✉️, ✅, 📧).

            INSTRUCCIÓN OBLIGATORIA:
            - Indica claramente que debe responder con un **SÍ** para confirmar o un **NO** para corregir el dato.
            - Sé muy breve (máximo 20 palabras) y mantén un tono profesional.`,
            "### FLUJO: VALIDACION_DATOS_DINAMICO"
        );
        await sendDelayedReply(client, msg, confirmaIA, 1000);
        setUserContext(msg.from, { ...userObject, flow: 'confirm_email_change', intentos: 0 });
        return;
    }

    if (userObject.flow === 'confirm_email_change') {
        if (response.includes('CANCELAR')) {
            const cancelaIA = await consultarIA("Cancelación confirmada. Breve, cordial, NO SALUDES.", "### FLUJO: CANCEL");
            await sendDelayedReply(client, msg, cancelaIA, 1000);
            resetUserContext(msg.from);
            return;
        }

        if (response.includes('SI')) {
            const res = await updateEmail(userObject.userData.user, userObject.pendingEmail);

            if (!res || res == 500 || res == 404) {
                const errorIA = await consultarIA("Error técnico. Contactar soporte. NO SALUDES.");
                await sendDelayedReply(client, msg, errorIA, 1000);
                setUserContext(msg.from, { flow: null, intentos: 0 });
                return QuestionEmail(client, msg);
            }

            if (res == 409) {
                const avisoIA = await consultarIA("El correo ya existe. Pide otro. NO SALUDES.");
                await sendDelayedReply(client, msg, `⚠️ ${avisoIA}`, 500);
                setUserContext(msg.from, { flow: null, intentos: 0 });
                return QuestionEmail(client, msg);
            }

            const exitoIA = await consultarIA(
                `Actualización exitosa a **${res}**. Usar este para acceder. NO SALUDES.`,
                "### FLUJO: EXITO"
            );
            await sendDelayedReply(client, msg, exitoIA, 1000);

            userObject.userData.user.email = res;
            setUserContext(msg.from, {
                ...userObject,
                userData: { ...userObject.userData, user: { ...userObject.userData.user, email: res } },
                flow: null,
                intentos: 0
            });

            return confirmChangePassword(client, msg);
        }

        if (response.includes('NO')) {
            const noIA = await consultarIA("Correo incorrecto. Pedir de nuevo. NO SALUDES.", "### FLUJO: REINTENTO");
            await sendDelayedReply(client, msg, noIA, 1000);
            setUserContext(msg.from, { ...userObject, flow: null, intentos: 0 });
            return QuestionEmail(client, msg);
        }

        const intentos = (userObject.intentos || 0) + 1;
        if (intentos >= 5) {
            await sendDelayedReply(client, msg, "⛔ Demasiados intentos. Espera 10 min.", 1000);
            setUserContext(msg.from, { ...userObject, blockedUntil: now + 10 * 60 * 1000 });
            resetUserContext(msg.from);
        } else {
            const dudaIA = await consultarIA(`No entendí "${response}". Confirmar con SI o NO. NO SALUDES.`);
            await sendDelayedReply(client, msg, dudaIA, 1000);
            setUserContext(msg.from, { ...userObject, intentos });
        }
    }
};

module.exports = { QuestionEmailFisrt, handleEmailFlow, QuestionEmail, confirmChangeEmail };