const { sendDelayedReply } = require('./message_response');
const { funtionApi } = require('./api');
const { getUserContext, setUserContext, resetUserContext } = require('./users');

const confirmChangePassword = async (client, msg) => {
    const userObject = getUserContext(msg.from);
    const response = msg.body.toUpperCase().trim();
    const now = Date.now();

    if (userObject.blockedUntil && userObject.blockedUntil > now) {
        const minutes = Math.ceil((userObject.blockedUntil - now) / (60 * 1000));
        await sendDelayedReply(client, msg, `⛔ Has excedido el número de intentos. Intenta nuevamente en ${minutes} minutos.`, 1000);
        return;
    }

    if (!userObject.flow) {
        await sendDelayedReply(client, msg, '¿Desea cambiar su contraseña? Conteste con *SI* o *NO* para continuar, si desea terminar la conversación escriba *Cancelar*', 0);
        setUserContext(msg.from, { flow: 'confirm_pass_change', intentos: 0 });
        return;
    }

    if (userObject.flow === 'confirm_pass_change') {
        if (['SI', 'NO', 'CANCELAR'].includes(response)) {
            if (response === 'SI') {
                const res = await funtionApi(userObject.userData.user, 1);

                if (!res) {
                    await sendDelayedReply(client, msg, "⚠️ Hay un problema de conexión con el servidor. Intenta más tarde.", 1000);
                    setUserContext(msg.from, { flow: null, intentos: 0 });
                    return;
                }

                if (res == 500 || res == 404) {
                    await sendDelayedReply(client, msg, "Hubo un error al realizar esta acción ❌", 1000);
                    await sendDelayedReply(client, msg, "Contacte algún administrador, para que se pueda corregir este error, al correo: siesabisoporte@imssbienestar.gob.mx", 1000);
                    await sendDelayedReply(client, msg, "Se lo agradeceríamos mucho, para trabajar en mejorar nuestro servicio, el equipo SiESABI Te agredece 🤓", 1000);
                    setUserContext(msg.from, { flow: null, intentos: 0 });
                    return;
                }

                if (res.status == 200) {
                    await sendDelayedReply(client, msg, "Tu contraseña a sido actualizada ✅", 1000);
                    await sendDelayedReply(client, msg, "Para acceder a tu cuenta utilizarás los siguientes datos:", 1500);
                    await sendDelayedReply(client, msg, `*Correo*: ${userObject.userData.user.email}\n\n`
                        + `*Contraseña temporal*: ${res.data.password}`, 1000);

                    await sendDelayedReply(client, msg, "Deberás actualizar tu contraseña, ingresando al apartado de ajustes una vez " +
                        "que hayas iniciado sesión, siguiendo estos pasos:", 1500);
                    await sendDelayedReply(client, msg, "1. Ve a la sección de Datos Personales y localiza el icono de configuración (⚙️)", 1500);
                    await sendDelayedReply(client, msg, "2. Haz clic en el engrane (⚙️) para abrir el menú de ajustes.", 1500);
                    await sendDelayedReply(client, msg, "3. Se desplegará una ventana con las opciones de configuración.", 1500);
                    await sendDelayedReply(client, msg, '4. Busca la pregunta "¿Desea actualizar su contraseña?" y activa el interruptor.', 1500);
                    await sendDelayedReply(client, msg, "5. Ingresa tu nueva contraseña y confírmala para guardar los cambios.", 1500);
                    await sendDelayedReply(client, msg, "Para su conveniencia, le recomendamos copiar y pegar las credenciales que se le han " +
                        "proporcionado para evitar errores al ingresarlas. Asimismo, le invitamos cordialmente a guardar esta información " +
                        "en un lugar seguro, ya que será necesaria para acceder a su cuenta en el futuro.", 2500);
                    await sendDelayedReply(client, msg, "Liga para iniciar sesión", 1500);
                    await sendDelayedReply(client, msg, "https://educacion.imssbienestar.gob.mx/", 1500);
                    await sendDelayedReply(client, msg, "Hasta pronto, Tu equipo SiESABI te desea excelente día 🤓", 1500);
                    resetUserContext(msg.from);
                    return;
                }

            }
            if (response === 'NO') {
                await sendDelayedReply(client, msg, "Liga para iniciar sesión", 1500);
                await sendDelayedReply(client, msg, "https://educacion.imssbienestar.gob.mx/", 1500);
                await sendDelayedReply(client, msg, "Hasta pronto, Tu equipo SiESABI te desea excelente día 🤓", 1500);
                resetUserContext(msg.from);
                return;
            }

            if (response === 'CANCELAR') {
                await sendDelayedReply(client, msg, "Liga para iniciar sesión", 1500);
                await sendDelayedReply(client, msg, "https://educacion.imssbienestar.gob.mx/", 1500);
                await sendDelayedReply(client, msg, "Hasta pronto, Tu equipo SiESABI te desea excelente día 🤓", 1500);

                resetUserContext(msg.from);
                return;
            }
        } else {
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

            setUserContext(msg.from, { intentos, flow: 'confirm_pass_change' });
            await sendDelayedReply(client, msg, `⚠️ Respuesta no válida. Por favor escriba *SI*, *NO* o *CANCELAR*. Intento ${intentos}/10`, 1000);
            return;
        }
    }
}

module.exports = {
    confirmChangePassword
};