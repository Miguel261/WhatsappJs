const { sendDelayedReply } = require('./message_response');
const { QuestionEmailFisrt, handleEmailFlow, QuestionEmail, confirmChangeEmail } = require('./change_email');
const { getUserContext, setUserContext } = require('./users');
const { confirmChangePassword } = require('./change_password');
const { SearchEmail } = require('./search_email');
const { CoursesProblem } = require('./courses');
const { Personal } = require('./personal');
const { Laboral } = require('./laboral');
const { CoursesKey } = require('./key_course');
const { VerifyError } = require('./verify_error');
const { Constancias } = require('./constancias');
const { AccountMoodle } = require('./moodle_account');

const welcome = async (client) => {
    client.on('message_create', async (message) => {
        if (message.fromMe || message.from === 'status@broadcast' || await message.isGroupMsg) return;
        
        // Ignorar numeros (IA de WhatsAPP)
        if (message.from === '15517868414@c.us') return;

        const userObjetc = message.from;
        const texto = message.body.toUpperCase().trim();

        const context = getUserContext(message.getContact());

        // ✅ Evitar procesar el mismo mensaje más de una vez
        if (context.lastMessageId === message.id) {
            return;
        }
        setUserContext(userObjetc, { lastMessageId: message.id });

        // Flujos activos
        if (context.flow === 'esperando_curp') return QuestionEmailFisrt(client, message);
        if (context.flow === 'ask_email_change') return handleEmailFlow(client, message);
        if (context.flow === 'ask_email') return QuestionEmail(client, message);
        if (context.flow === 'confirm_email_change') return confirmChangeEmail(client, message);
        if (context.flow === 'confirm_pass_change') return confirmChangePassword(client, message);
        if (context.flow === 'esperando_curp_searh_email') return SearchEmail(client, message);
        if (context.flow === 'esperando_curp_account_moodle') return AccountMoodle(client, message);

        // Texto MENÚ
        if (texto === 'MENU' || texto === 'MENÚ') {
            await sendDelayedReply(client, message,
                `Hola, Bienvenido al ChatBotSiESABI 🤖\n\n` +
                `❇️ Escribe el número de la opción que necesitas\n\n` +
                `*Menú de opciones:*\n` +
                `✅ 1. Credenciales no coinciden (Cambio de correo/contraseña)\n` +
                `✅ 2. Puedo iniciar sesión, pero no puedo acceder a los cursos\n` +
                `✅ 3. Consulta de correo electrónico\n` +
                `✅ 4. Problemas con avance de cursos\n` +
                `✅ 5. Actualización de datos personales\n` +
                `✅ 6. Actualización de datos laborales\n` +
                `✅ 7. Curso con clave\n` +
                `✅ 8. Error en verificación de correo\n` +
                `✅ 9. "Descargar la constancia de un curso"\n\n` +
                `📄 *Aviso de privacidad:* https://educacion.imssbienestar.gob.mx\n` +
                `*Nota:* Si el bot no responde, escribe *MENU* nuevamente\n` +
                `AVISO ⚠️:
Actualmente experimentamos problemas de conexión con nuestro servicio automático. Nuestro equipo de desarrollo ya está trabajando en una solución y está implementando alternativas para normalizar el servicio lo antes posible.\n` +
                `⚠️ *ASISTENTE AUTOMÁTICO* - No atiende llamadas/comentarios`,
                0
            );
            return;
        }

        if (!context.menuSent) {
            console.log("Nuevo chat, enviando menú a:", userObjetc);

            setUserContext(userObjetc, { menuSent: true });

            await sendDelayedReply(client, message,
                `Hola, Bienvenido al ChatBotSiESABI 🤖\n\n` +
                `❇️ Escribe el número de la opción que necesitas\n\n` +
                `*Menú de opciones:*\n` +
                `✅ 1. Credenciales no coinciden (Cambio de correo/contraseña)\n` +
                `✅ 2. Puedo iniciar sesión, pero no puedo acceder a los cursos\n` +
                `✅ 3. Consulta de correo electrónico\n` +
                `✅ 4. Problemas con avance de cursos\n` +
                `✅ 5. Actualización de datos personales\n` +
                `✅ 6. Actualización de datos laborales\n` +
                `✅ 7. Curso con clave\n` +
                `✅ 8. Error en verificación de correo\n` +
                `✅ 9. "Descargar la constancia de un curso"\n\n` +
                `📄 *Aviso de privacidad:* https://educacion.imssbienestar.gob.mx\n` +
                `*Nota:* Si el bot no responde, escribe *MENU* nuevamente\n` +
                `AVISO ⚠️:
Actualmente experimentamos problemas de conexión con nuestro servicio automático. Nuestro equipo de desarrollo ya está trabajando en una solución y está implementando alternativas para normalizar el servicio lo antes posible.\n` +
                `⚠️ *ASISTENTE AUTOMÁTICO* - No atiende llamadas/comentarios`,
                0
            );

            return;
        }

        // ✅ Si ya se envió el menú, procesar opciones
        switch (texto) {
            case '1': return QuestionEmailFisrt(client, message);
            case '2': return AccountMoodle(client, message)
            case '3': return SearchEmail(client, message);
            case '4': return CoursesProblem(client, message);
            case '5': return Personal(client, message);
            case '6': return Laboral(client, message);
            case '7': return CoursesKey(client, message);
            case '8': return VerifyError(client, message);
            case '9': return Constancias(client, message);
            default:
                await sendDelayedReply(client, message,
                    `⚠️ *Opción no válida.*\n\n` +
                    `Envía solo el número de la opción (ej: 1).`, 1500);
                return;
        }
    });
};

module.exports = {
    welcome
};