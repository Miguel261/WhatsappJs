const { sendDelayedReply } = require('./message_response');
const { consultaCurpApi, updateEmail } = require('./api');
const { getUserContext, setUserContext, resetUserContext } = require('./users');
const { confirmChangePassword } = require('./change_password');

const QuestionEmailFisrt = async (client, msg) => {
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
            flow: 'esperando_curp',
            intentos: 0
        });
        return;
    }

    if (userObject.flow === 'esperando_curp') {
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


        if (userData.user){

            if (!userData.phone) {
                setUserContext(msg.from, {
                    ...userObject,
                    curp,
                    userData,
                    flow: null,
                    curpRequested: false,
                    intentos: 0
                });

                await sendDelayedReply(client, msg, `El correo registrado es: ${userData.user.email}`, 1000);
                await sendDelayedReply(client, msg, `Verifica que tu correo esté correctamente escrito...`, 1000);

                return handleEmailFlow(client, msg);
            }

            if (userData.phone){
                const digits = msg.from.replace(/\D/g, '');
                const numero = digits.slice(-10);

                if (numero === userData.phone) {
                    setUserContext(msg.from, {
                        ...userObject,
                        curp,
                        userData,
                        flow: null,
                        curpRequested: false,
                        intentos: 0
                    });

                    await sendDelayedReply(client, msg, `El correo registrado es: ${userData.user.email}`, 1000);
                    await sendDelayedReply(client, msg, `Verifica que tu correo esté correctamente escrito...`, 1000);

                    return handleEmailFlow(client, msg);
                } else {
                    await sendDelayedReply(client, msg, '❌ El número con el que estás enviando mensajes no coincide con el ' +
                        'número registrado para este usuario. Por seguridad, no podemos otorgarte información', 1000);
                    await sendDelayedReply(client, msg, 'Si extraviaste tu número o cambiaste, envía un correo a siesabisoporte@imssbienestar.gob.mx ' +
                        'o a educacion@imssbienestar.gob.mx', 1000);
                    await sendDelayedReply(client, msg, 'Con los siguientes datos: *Nombre, Correo y CURP*', 1000);
                    resetUserContext(msg.from);
                    return;
                }
            }

        }
        else{
            await sendDelayedReply(client, msg, '❌ Ocurrio un error intente de nuevo', 1000);
            resetUserContext(msg.from);
            return;
        }
    }
};

async function handleEmailFlow(client, msg) {
    const userObject = getUserContext(msg.from);
    const response = msg.body.toUpperCase().trim();
    const now = Date.now();

    if (userObject.blockedUntil && userObject.blockedUntil > now) {
        const minutes = Math.ceil((userObject.blockedUntil - now) / (60 * 1000));
        await sendDelayedReply(client, msg, `⛔ Has excedido el número de intentos. Intenta nuevamente en ${minutes} minutos.`, 1000);
        resetUserContext(msg.from);
        return;
    }

    if (userObject.flow === 'ask_email') {
        return QuestionEmail(message);
    }

    if (!userObject.flow) {
        await sendDelayedReply(client, msg, `¿Desea hacer cambio de correo? Conteste con *SI* o *NO* para continuar, si desea terminar la conversación escriba *CANCELAR*`, 0);
        setUserContext(msg.from, { flow: 'ask_email_change', intentos: 0 });
        return;
    }

    if (userObject.flow === 'ask_email_change') {
        if (['SI', 'NO', 'CANCELAR'].includes(response)) {
            if (response === 'SI') {
                setUserContext(msg.from, {
                    ...userObject,
                    flow: null,
                    intentos: 0
                });
                return QuestionEmail(client, msg);
            }

            if (response === 'NO') {
                setUserContext(msg.from, {
                    ...userObject,
                    flow: null,
                    intentos: 0
                });
                return confirmChangePassword(client, msg);
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

            setUserContext(msg.from, { intentos, flow: 'ask_email_change' });
            await sendDelayedReply(client, msg, `⚠️ Respuesta no válida. Por favor escriba *SI*, *NO* o *CANCELAR*. Intento ${intentos}/10`, 1000);
            return;
        }
    }
}


function esCorreoValido(correo) {
    const regex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return regex.test(correo);
}

const QuestionEmail = async (client, msg) => {
    const userObject = getUserContext(msg.from);
    const newEmail = msg.body.trim().toLowerCase();
    const now = Date.now();

    if (userObject.blockedUntil && userObject.blockedUntil > now) {
        const minutes = Math.ceil((userObject.blockedUntil - now) / (60 * 1000));
        await sendDelayedReply(client, msg, `⛔ Has excedido el número de intentos. Intenta nuevamente en ${minutes} minutos.`, 1000);
        return;
    }

    if (!userObject.flow) {
        await sendDelayedReply(client, msg, 'Por favor, proporcione el nuevo correo electrónico que desea registrar, ' +
            'asegurándose de que esté escrito completamente en minúsculas, escriba cancelar si se equivoco. ¡Gracias!', 0);
        setUserContext(msg.from, { flow: 'ask_email', intentos: 0 });
        return;
    }

    const emailOld = userObject.userData.user.email;

    if (userObject.flow == 'ask_email') {
        if (newEmail === 'cancelar'){
            await sendDelayedReply(client, msg, `Si quieres ver el menú escribe la palabra: *menu*`, 1500);
            await sendDelayedReply(client, msg, `Agradecemos que utilices nuestro servicio.`, 1500);
            await sendDelayedReply(client, msg, `Atentamente....`, 1500);
            await sendDelayedReply(client, msg, `Tu equipo SiESABI 🤓`, 1500);
            setUserContext(msg.from, { flow: null, intentos: 0 });
            return;
        }

        if (!esCorreoValido(newEmail)) {
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

            setUserContext(msg.from, { intentos, flow: 'ask_email' });
            await sendDelayedReply(client, msg, `⚠️ Correo no válido. Por favor escriba nuevamente su correo:`, 1000);
            return;
        } else {
            if (newEmail === emailOld) {
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

                setUserContext(msg.from, { intentos, flow: 'ask_email' });
                await sendDelayedReply(client, msg, `⚠️ El correo es el mismo al que esta registrado. Por favor escriba nuevamente su correo:`, 1000);
                return;
            }
            else {
                setUserContext(msg.from, {
                    ...userObject,
                    flow: null,
                    intentos: 0,
                    pendingEmail: newEmail
                });
            
                return confirmChangeEmail(client, msg);
            }
        }
    }
}

const confirmChangeEmail = async (client, msg) => {
    const userObject = getUserContext(msg.from);
    const response = msg.body.toUpperCase().trim();
    const now = Date.now();

    if (userObject.blockedUntil && userObject.blockedUntil > now) {
        const minutes = Math.ceil((userObject.blockedUntil - now) / (60 * 1000));
        await sendDelayedReply(client, msg, `⛔ Has excedido el número de intentos. Intenta nuevamente en ${minutes} minutos.`, 1000);
        return;

    }

    if (!userObject.flow) {
        await sendDelayedReply(client, msg, '¿Podrías confirmar si este correo es correcto? Responde con *SI* para confirmar, ' +
            '*NO* si no es correcto, o *CANCELAR* para finalizar la conversación. ¡Gracias!', 0);
        setUserContext(msg.from, { flow: 'confirm_email_change', intentos: 0 });
        return;
    }

    if (userObject.flow === 'confirm_email_change') {
        if (['SI', 'NO', 'CANCELAR'].includes(response)) {
            if (response === 'SI') {
                const newEmail = userObject.pendingEmail;
                const res = await updateEmail(userObject.userData.user, newEmail);

                if(!res){
                    await sendDelayedReply(client, msg, "⚠️ Hay un problema de conexión con el servidor. Intenta más tarde.", 1000);
                    setUserContext(msg.from, { flow: null, intentos: 0 });
                    return;
                }

                if (res == 500 || res == 404) {
                    await sendDelayedReply(client, msg, "Hubo un error al realizar esta acción ❌", 1000);
                    await sendDelayedReply(client, msg, "Contacte algún administrador, para que se pueda corregir este error, al correo: siesabisoporte@imssbienestar.gob.mx", 1000);
                    await sendDelayedReply(client, msg, "Se lo agradeceríamos mucho, para trabajar en mejorar nuestro servicio, el equipo SiESABI Te agredece 🤓", 1000);
                    setUserContext(msg.from, { flow: null, intentos: 0 });
                    return QuestionEmail(client, msg);
                }

                if (res == 409) {
                    await sendDelayedReply(client, msg, "El correo electrónico proporcionado ya está asociado a otra cuenta. Por favor, intente con uno diferente.", 1000);
                    setUserContext(msg.from, { flow: null, intentos: 0 });
                    return QuestionEmail(client, msg);
                }

                userObject.userData.user.email = res;

                await sendDelayedReply(client, msg, "Tu correo a sido actualizado ✅", 1000);
                await sendDelayedReply(client, msg, `Tu nuevo corrreo es: ${res}`, 1500);

               

                setUserContext(msg.from, {
                    ...userObject,
                    userData: {
                        ...userObject.userData,
                        user: {
                            ...userObject.userData.user,
                            email: res
                        }
                    },
                    flow: null,
                    intentos: 0
                });

                return confirmChangePassword(client, msg);

            }
            if (response === 'NO') {
                setUserContext(msg.from, {
                    ...userObject,
                    flow: null,
                    intentos: 0
                });

                return QuestionEmail(client, msg);
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

            setUserContext(msg.from, { intentos, flow: 'confirm_email_change' });
            await sendDelayedReply(client, msg, `⚠️ Respuesta no válida. Por favor escriba *SI*, *NO* o *CANCELAR*. Intento ${intentos}/10`, 1000);
            return;
        }
    }
}

module.exports = {
    QuestionEmailFisrt,
    handleEmailFlow,
    QuestionEmail,
    confirmChangeEmail
};