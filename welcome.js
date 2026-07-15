const { sendDelayedReply } = require('./message_response'); // Apuntando al archivo de respuestas correcto
const { QuestionEmailFisrt, handleEmailFlow, QuestionEmail, confirmChangeEmail } = require('./change_email');
const { getUserContext, setUserContext, resetUserContext } = require('./users');
const { confirmChangePassword } = require('./change_password');
const { SearchEmail } = require('./search_email');
const { CoursesProblem } = require('./courses');
const { Personal } = require('./personal');
const { Laboral } = require('./laboral');
const { CoursesKey } = require('./key_course');
const { Constancias } = require('./constancias');
const { AccountMoodle } = require('./moodle_account');
const { videoCourses } = require('./video_courses');
const { consultarIA } = require('./ia_service');

const bootTime = Math.floor(Date.now() / 1000);

const welcome = async (client) => {
    console.log('📡 Registrando escuchador de mensajes entrantes...');

    client.on('message_create', async (message) => {
        try {
            // 1. Filtros de tiempo y origen
            if (message.timestamp < bootTime) return;
            if (message.fromMe || message.from === 'status@broadcast') return;

            // REGRESA AQUÍ LA SOLUCIÓN:
            // Validamos si es grupo basándonos puramente en la estructura del ID de WhatsApp.
            // Los grupos siempre terminan con '@g.us'. Evitamos llamar a message.getChat() para que no truene Puppeteer.
            const isGroup = message.from.endsWith('@g.us');
            if (isGroup) return;

            const userId = message.from;
            const texto = message.body ? message.body.trim() : "";
            const textoUpper = texto.toUpperCase();
            let context = getUserContext(userId);

            const MENU_TEXTO = `
            1️⃣ Problemas de acceso, recuperación de contraseña o "credenciales no existen".
            2️⃣ Problemas para entrar a los cursos (aunque tengas acceso).
            3️⃣ Olvido o consulta del correo electrónico registrado.
            4️⃣ Error en el progreso de cursos (el porcentaje no avanza).
            5️⃣ Actualizar o consultar datos personales (Nombre, CURP, etc).
            6️⃣ Consultar datos laborales.
            7️⃣ El curso solicita una "Clave de Inscripción".
            8️⃣ Descarga de constancias, certificados o diplomas.
            9️⃣ El video de un curso no esta disponible.`;

            // 1. Manejo de MENU y Saludos
            if (textoUpper === "MENU" || textoUpper === "MENÚ") {
                resetUserContext(userId);
                const respuestasMenu = [
                    "Hola, entendido. Te muestro las opciones principales del menú de SiESABI:",
                    "Claro, aquí tienes el menú principal con las opciones de asistencia de la plataforma:",
                    "A continuación tienes el listado de opciones disponibles para ayudarte:"
                ];
                const saludoFijo = respuestasMenu[Math.floor(Math.random() * respuestasMenu.length)];
                return await sendDelayedReply(client, message, `${saludoFijo}\n\n${MENU_TEXTO}\n\n💡 *Tip:* Solo escribe el número de la opción.`, 500);
            }

            const saludosComunes = ["HOLA", "BUENAS", "BUEN DIAS", "BUENAS TARDES", "BUENAS NOCHES", "SOPORTE", "AYUDA"];
            const esSaludo = saludosComunes.some(s => textoUpper === s || textoUpper.startsWith(s + " "));

            if (esSaludo && !context.flow) {
                // Obtenemos el contacto de forma segura envolviéndolo en try/catch
                let nombre = "Usuario";
                try {
                    const contact = await message.getContact();
                    nombre = contact.pushname || "Usuario";
                } catch (contactErr) {
                    console.error("No se pudo obtener el nombre del contacto:", contactErr.message);
                }

                const respuestaIA = await consultarIA(
                    `Saluda a ${nombre} de forma muy breve y pregúntale cuál es su duda con SiESABI. Máximo 10 palabras.`,
                    "Asistente SiESABI"
                );
                return await sendDelayedReply(client, message, respuestaIA, 500);
            }

            // 2. Controladores de Flujos Activos Estrictos
            if (context.flow) {
                if (context.flow === 'esperando_curp') return await QuestionEmailFisrt(client, message);
                if (context.flow === 'ask_email_change') return await handleEmailFlow(client, message);
                if (context.flow === 'ask_email') return await QuestionEmail(client, message);
                if (context.flow === 'confirm_email_change') return await confirmChangeEmail(client, message);
                if (context.flow === 'confirm_pass_change') return await confirmChangePassword(client, message);
                if (context.flow === 'esperando_curp_searh_email') return await SearchEmail(client, message);
                if (context.flow === 'esperando_curp_account_moodle') return await AccountMoodle(client, message);
                if (context.flow === 'esperando_nombre_curso') return await videoCourses(client, message);
                return;
            }

            // 3. Captura rápida de respuestas numéricas directas
            if (/^[1-9]$/.test(textoUpper)) {
                setUserContext(userId, { ...context, menuSent: true });
                switch (textoUpper) {
                    case '1': return await QuestionEmailFisrt(client, message);
                    case '2': return await AccountMoodle(client, message);
                    case '3': return await SearchEmail(client, message);
                    case '4': return await CoursesProblem(client, message);
                    case '5': return await Personal(client, message);
                    case '6': return await Laboral(client, message);
                    case '7': return await CoursesKey(client, message);
                    case '8': return await Constancias(client, message);
                    case '9': return await videoCourses(client, message);
                }
            }

            // 4. Filtro de Seguridad: CURP enviada de la nada
            const esEstructuraCurp = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/i.test(texto);
            if (esEstructuraCurp && !context.flow) {
                const saludoCurp = await consultarIA("Explica amablemente que para procesar sus datos o CURP, primero debe seleccionar una opción del MENU.");
                return await sendDelayedReply(client, message, saludoCurp, 500);
            }

            // 5. Clasificación Semántica Compleja
            const CONTEXTO_SIESABI = `
            Eres el NÚCLEO DE ENRUTAMIENTO del soporte técnico SiESABI. Clasifica la necesidad en un ID numérico.
            REGLA DE SALIDA: Responde ÚNICAMENTE el dígito del 1 al 9 si aplica. No expliques nada.

            Categorías:
            1: ACCESO / LOGIN (Contraseñas, cuentas, recuperar accesos).
            2: ENTRADA A CURSOS (Problemas al abrir módulos o sesiones internas).
            3: CONSULTA DE CORREO (Saber qué correo electrónico registró).
            4: PROGRESO / AVANCE (Porcentajes atascados o calificaciones).
            5: DATOS PERSONALES (Correcciones de Nombre/CURP).
            6: DATOS LABORALES (Lugar de adscripción o puestos).
            7: CLAVES (Solicitud de claves de inscripción).
            8: DOCUMENTACIÓN (Descarga de constancias o diplomas).
            9: VIDEOS DAÑADOS (Fallas de reproducción o pantallas en negro).

            Si es un agradecimiento desproporcionado, di una despedida breve de cortesía (máx 10 palabras).
            Si no se comprende en absoluto, solicita de forma atenta que escriba la palabra MENU para ver las opciones disponibles.`;

            const clasificacionIA = await consultarIA(`Mensaje del usuario: "${texto}"`, CONTEXTO_SIESABI);
            const clasificacionLimpia = clasificacionIA.replace(/[^1-9]/g, "").trim();

            if (clasificacionLimpia.length === 1) {
                setUserContext(userId, { ...context, menuSent: true });
                switch (clasificacionLimpia) {
                    case '1': return await QuestionEmailFisrt(client, message);
                    case '2': return await AccountMoodle(client, message);
                    case '3': return await SearchEmail(client, message);
                    case '4': return await CoursesProblem(client, message);
                    case '5': return await Personal(client, message);
                    case '6': return await Laboral(client, message);
                    case '7': return await CoursesKey(client, message);
                    case '8': return await Constancias(client, message);
                    case '9': return await videoCourses(client, message);
                }
            }

            return await sendDelayedReply(client, message, clasificacionIA, 500);
        } catch (err) {
            console.error('💥 Error procesando mensaje en welcome:', err);
        }
    });
};

module.exports = { welcome };