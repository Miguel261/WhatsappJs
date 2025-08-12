const { sendDelayedReply } = require('./message_response');
const { consultaCurpApi, funtionApi } = require('./api');
const { getUserContext, setUserContext, resetUserContext } = require('./users');

const AccountMoodle = async (client, msg) => {
    const userObject = getUserContext(msg.from);
    const now = Date.now();

    if (userObject.blockedUntil && userObject.blockedUntil > now) {
        const minutes = Math.ceil((userObject.blockedUntil - now) / (60 * 1000));
        await sendDelayedReply(client, msg, `⛔ Has excedido el número de intentos. Intenta nuevamente en ${minutes} minutos.`, 1000);
        return;
    }

    if (!userObject.curpRequested) {
        await sendDelayedReply(client, msg, 'Por motivos de calidad y seguridad de la información, le informamos que esta conversación ' +
            'será almacenada. Su información será tratada de acuerdo con nuestras políticas de privacidad y únicamente se utilizará' +
            'para mejorar nuestros servicios y garantizar la seguridad de los datos.', 1500);
        await sendDelayedReply(client, msg, `Para verificar su información, escriba su *CURP*:`, 600);

        setUserContext(msg.from, {
            ...userObject,
            curpRequested: true,
            flow: 'esperando_curp_account_moodle',
            intentos: 0
        });
        return;
    }

    if (userObject.flow === 'esperando_curp_account_moodle') {
        const curp = msg.body.toUpperCase().trim();
        const userData = await consultaCurpApi(curp);

        if (!userData) {
            await sendDelayedReply(client, msg, "⚠️ Hay un problema de conexión con el servidor. Intenta más tarde.", 1000);
            return;
        }

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
                return
            }

            setUserContext(msg.from, {
                ...userObject,
                intentos
            });

            await sendDelayedReply(client, msg, '❌ No se encontraron datos con esa CURP. Verifica tu información. Intenta de nuevo:', 1000);
            return;
        }


        if (userData.phone) {
            const digits = msg.from.replace(/\D/g, '');
            const numero = digits.slice(-10);

            if (numero === userData.phone) {
                await sendDelayedReply(client, msg, '⚠️ Consultando información', 500);

                const res = await funtionApi(userObject.userData.user, 2);

                if (!res) {
                    await sendDelayedReply(client, msg, "⚠️ Hay un problema de conexión con el servidor. Intenta más tarde.", 1000);
                    setUserContext(msg.from, { flow: null });
                    return;
                }

                if (res == 500 || res == 404) {
                    await sendDelayedReply(client, msg, "Hubo un error al realizar esta acción ❌", 1000);
                    await sendDelayedReply(client, msg, "Contacte algún administrador, para que se pueda corregir este error, al correo: siesabisoporte@imssbienestar.gob.mx", 1000);
                    await sendDelayedReply(client, msg, "Se lo agradeceríamos mucho, para trabajar en mejorar nuestro servicio, el equipo SiESABI Te agredece 🤓", 1000);
                    setUserContext(msg.from, { flow: null});
                    return;
                }

                if (res.status == 200) {
                    await sendDelayedReply(client, msg, "El problema con tu cuenta ha sido corregido! ✅", 1000);

                    await sendDelayedReply(client, msg, "Liga para iniciar sesión", 1500);
                    await sendDelayedReply(client, msg, "https://educacion.imssbienestar.gob.mx/", 1500);
                    await sendDelayedReply(client, msg, "Hasta pronto, Tu equipo SiESABI te desea excelente día 🤓", 1500);
                    resetUserContext(msg.from);
                    return;
                }else{
                    await sendDelayedReply(client, msg, "No existe problema con tu cuenta! ❌", 1000);

                    await sendDelayedReply(client, msg, "Liga para iniciar sesión", 1500);
                    await sendDelayedReply(client, msg, "https://educacion.imssbienestar.gob.mx/", 1500);
                    await sendDelayedReply(client, msg, "Hasta pronto, Tu equipo SiESABI te desea excelente día 🤓", 1500);
                    resetUserContext(msg.from);
                    return;
                }

            }
            else {
                await sendDelayedReply(client, msg, '❌ El número con el que estás enviando mensajes no coincide con el ' +
                    'número registrado para este usuario. Por seguridad, no podemos otorgarte información', 1000);
                await sendDelayedReply(client, msg, 'Si extraviaste tu número o cambiaste, envía un correo a siesabisoporte@imssbienestar.gob.mx\n' +
                    'Con los siguientes datos: *Nombre, Correo y CURP*', 2000);
                resetUserContext(msg.from);
                return;
            }
        }
    }
    else {
        await sendDelayedReply(client, msg, '❌ Ocurrio un error intente de nuevo', 1000);
        resetUserContext(msg.from);
        return;
    }
}

module.exports = {
    AccountMoodle
};