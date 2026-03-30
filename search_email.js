const { sendDelayedReply } = require('./message_response');
const { consultaCurpApi } = require('./api');
const { getUserContext, setUserContext, resetUserContext } = require('./users');
const { consultarIA } = require('./ia_service'); // Importamos la IA

const SearchEmail = async (client, msg) => {
    const userObject = getUserContext(msg.from);
    const now = Date.now();

    // 1. Verificación de bloqueo
    if (userObject.blockedUntil && userObject.blockedUntil > now) {
        const minutes = Math.ceil((userObject.blockedUntil - now) / (60 * 1000));
        await sendDelayedReply(client, msg, `⛔ Has excedido el número de intentos. Intenta nuevamente en ${minutes} minutos.`, 1000);
        return;
    }

    // 2. Primer contacto: Solicitar CURP vía IA
    if (!userObject.curpRequested) {
        await sendDelayedReply(client, msg, `Para verificar su información, escriba su *CURP*:`, 600);

        setUserContext(msg.from, {
            ...userObject,
            curpRequested: true,
            flow: 'esperando_curp_searh_email',
            intentos: 0
        });
        return;
    }

    // 3. Procesamiento de la CURP
    if (userObject.flow === 'esperando_curp_searh_email') {
        const curp = msg.body.toUpperCase().trim();
        const userData = await consultaCurpApi(curp);

        // Error de conexión con el servidor
        if (!userData) {
            const msgErrorConexion = await consultarIA("Dile al usuario que hay una falla de conexión temporal.", "Asistente breve");
            await sendDelayedReply(client, msg, `⚠️ ${msgErrorConexion}`, 1000);
            return;
        }
        
        // CURP no encontrada o error de servidor
        if (userData === 404 || userData === 500) {
            const intentos = (userObject.intentos || 0) + 1;

            if (intentos >= 10) {
                await sendDelayedReply(client, msg, "⛔ Has excedido el número de intentos. Intenta nuevamente en 10 minutos.", 1000);
                setUserContext(msg.from, {
                    ...userObject,
                    blockedUntil: now + 10 * 60 * 1000,
                    intentos
                });
                resetUserContext(msg.from);
                return;
            }

            setUserContext(msg.from, { ...userObject, intentos });
            const errorCurpIA = await consultarIA(
                "Informa al usuario que su CURP no fue localizada en los registros de SiESABI. " +
                "Pídele amablemente que verifique los 18 caracteres y la escriba de nuevo. " +
                "REGLA: Sé creativo, empático y breve. No menciones errores de programación ni APIs.",
                "### ESTADO_SISTEMA: CURP_NO_ENCONTRADA_404"
            );
            return await sendDelayedReply(client, msg, errorCurpIA, 1000);
        }

        if (!userData.phone) {
            const msgIncompleto = await consultarIA(
                `Informa al usuario que su CURP fue localizada pero su registro en SiESABI está incompleto. 
                REGLA DE ORO: Debe enviar un correo a siesabisoporte@imssbienestar.gob.mx incluyendo:
                - CURP
                - NOMBRE COMPLETO
                - EMAIL
                - ASUNTO: "NO COMPLETE MI REGISTRO Y NO TENGO ACCESO A MI CUENTA"
                
                Usa negritas para el correo y el asunto. Sé amable y profesional, pero muy claro con los datos requeridos.`,
                "### ESTADO: REGISTRO_PARCIAL_SIN_FOLIO"
            );
            await sendDelayedReply(client, msg, msgIncompleto, 1000);
            resetUserContext(msg.from);
            return;
        }


        // Validación de número de teléfono
        if (userData.phone) {
            const contact = await msg.getContact();
            const digits = contact.number.replace(/\D/g, '');
            const numero = digits.slice(-10);
            const numeroBD = String(userData.phone).replace(/\D/g, '').slice(-10);

            if (numero === numeroBD) {
                // ÉXITO: Mostramos el correo
                const msgExito = await consultarIA(
                    `Informa al usuario que el correo electrónico que tiene registrado actualmente en SiESABI es: **${userData.user.email}**. 
    
                    REGLAS DE SALIDA:
                    1. Muestra el correo en **negritas** para que resalte.
                    2. Indica claramente que si desea cambiarlo, debe escribir el número **1**.
                    3. Menciona que si desea ver otras opciones, debe escribir la palabra **MENU**.
                    4. Sé muy amable, breve y usa un emoji de información o sobre (📧, ℹ️).
                    5. Varía el saludo para que sea una respuesta humana y fresca.`,
                    "### INFO_USUARIO: CONSULTA_EMAIL_CON_ACCIONES"
                );

                setUserContext(msg.from, {
                    ...userObject,
                    curp,
                    userData,
                    flow: null,
                    curpRequested: false,
                    intentos: 0
                });

                await sendDelayedReply(client, msg, `📧 ${msgExito}`, 1000);
                return;
            }
            else {
                // El número de WhatsApp no coincide con el de la base de datos
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
    } else {
        const msgErrorGeneral = await consultarIA("Dile al usuario que hubo un error y que intente de nuevo escribiendo MENU.", "Asistente breve");
        await sendDelayedReply(client, msg, `❌ ${msgErrorGeneral}`, 1000);
        resetUserContext(msg.from);
        return;
    }
};

module.exports = { SearchEmail };