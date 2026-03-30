const { sendDelayedReply } = require('./message_response');
const { consultaCurpApi, funtionApi } = require('./api');
const { getUserContext, setUserContext, resetUserContext } = require('./users');
const { consultarIA } = require('./ia_service');

const AccountMoodle = async (client, msg) => {
    const userObject = getUserContext(msg.from);
    const now = Date.now();

    // 1. Verificación de bloqueo por intentos
    if (userObject.blockedUntil && userObject.blockedUntil > now) {
        const minutes = Math.ceil((userObject.blockedUntil - now) / (60 * 1000));
        await sendDelayedReply(client, msg, `⛔ Has excedido los intentos. Prueba en ${minutes} min.`, 1000);
        return;
    }

    // 2. Primer contacto: Pedir la CURP
    if (!userObject.curpRequested) {
        await sendDelayedReply(client, msg, `Para verificar su información, escriba su *CURP*:`, 600);

        setUserContext(msg.from, {
            ...userObject,
            curpRequested: true,
            flow: 'esperando_curp_account_moodle',
            intentos: 0
        });
        return;
    }

    // 3. Procesamiento de la CURP
    if (userObject.flow === 'esperando_curp_account_moodle') {
        const curp = msg.body.toUpperCase().trim();
        const userData = await consultaCurpApi(curp);

        // Error de conexión
        if (!userData) {
            const msgError = await consultarIA("Dile al usuario que hay un error de conexión. PROHIBIDO SALUDAR.", "Asistente breve");
            await sendDelayedReply(client, msg, msgError, 1000);
            return;
        }

        // CURP no encontrada
        if (userData === 404 || userData === 500) {
            const intentos = (userObject.intentos || 0) + 1;
            if (intentos >= 10) {
                resetUserContext(msg.from);
                await sendDelayedReply(client, msg, "⛔ Demasiados intentos. Bloqueado por 10 min.", 1000);
                return;
            }

            setUserContext(msg.from, { ...userObject, intentos });
            const errorCurpIA = await consultarIA(
                "Informa al usuario que su CURP no fue localizada. " +
                "Pídele que verifique los 18 caracteres y la escriba de nuevo. " +
                "REGLA: NO SALUDES, sé empático y muy breve.",
                "### ESTADO: CURP_404"
            );
            return await sendDelayedReply(client, msg, errorCurpIA, 1000);
        }

        // Registro incompleto (Sin datos mínimos)
        if (!userData.phone) {
            const msgIncompleto = await consultarIA(
                `Informa que la CURP fue localizada pero el registro está incompleto. 
                REGLA: Debe enviar correo a **siesabisoporte@imssbienestar.gob.mx** con CURP, NOMBRE y EMAIL. 
                Asunto: **NO COMPLETE MI REGISTRO**. PROHIBIDO SALUDAR.`,
                "### ESTADO: REGISTRO_INCOMPLETO"
            );
            await sendDelayedReply(client, msg, msgIncompleto, 1000);
            resetUserContext(msg.from);
            return;
        }

        // Validación de número de teléfono
        const contact = await msg.getContact();
        const digits = contact.number.replace(/\D/g, '');
        const numero = digits.slice(-10);
        const numeroBD = String(userData.phone).replace(/\D/g, '').slice(-10);

        if (numero === numeroBD) {
            await sendDelayedReply(client, msg, '⏳ Procesando tu solicitud...', 500);

            const res = await funtionApi(userData.user, 2); // Opción 2: Moodle Account

            if (res && res.status == 200) {
                const msgExito = await consultarIA(
                    "Informa al usuario que su acceso a la plataforma de cursos (Moodle) ha sido habilitado correctamente. " +
                    "REGLAS: NO SALUDES. Dile que ya puede entrar. Usa un emoji (🎓). Sé muy directo.",
                    "### FLUJO: ACCESO_MOODLE_EXITO"
                );
                await sendDelayedReply(client, msg, `✅ ${msgExito}`, 1000);
                await sendDelayedReply(client, msg, "🔗 https://educacion.imssbienestar.gob.mx/", 1500);
            } else {
                const msgSinProblema = await consultarIA(
                    "Informa al usuario que su cuenta de cursos (Moodle) no tiene fallas. " +
                    "REGLA: Si su problema es el acceso general a SiESABI, debe escribir el número **1**. " +
                    "PROHIBIDO SALUDAR. Sé muy claro con la diferencia entre plataformas.",
                    "### FLUJO: REDIRECCION_ACCESO"
                );
                await sendDelayedReply(client, msg, msgSinProblema, 1000);
            }
            resetUserContext(msg.from);
            return;
        } else {
            // Teléfono no coincide
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
    } else {
        resetUserContext(msg.from);
        return;
    }
}

module.exports = { AccountMoodle };