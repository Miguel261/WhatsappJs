const { sendDelayedReply } = require('./message_response');
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
    client.on('message_create', async (message) => {
        if (message.timestamp < bootTime) return;
        if (message.fromMe || message.from === 'status@broadcast') return;
        if (message.from === '15517868414@c.us') return;
        const isGroup = message.from.endsWith('@g.us') || (await message.getChat()).isGroup;
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

        // 1. Manejo de Saludos y Menú (Corrección de detección precisa)
        const saludosComunes = ["HOLA", "BUENAS", "BUEN", "DIAS", "TARDES", "NOCHES", "SOPORTE"];
        const esSaludo = saludosComunes.some(s => textoUpper === s || textoUpper.startsWith(s + " "));

        if (esSaludo && !context.flow) {
            const contact = await message.getContact();
            const nombre = contact.pushname || "Usuario";
            const respuestaIA = await consultarIA(
                `Saluda a ${nombre} de forma breve y pregúntale en qué puedes ayudarle. Máximo 10 palabras.`,
                "Asistente SiESABI"
            );
            return await sendDelayedReply(client, message, respuestaIA, 1000);
        }

        if (textoUpper === "MENU") {
            resetUserContext(userId);
            const contact = await message.getContact();
            const nombre = contact.pushname || "Usuario";
            const saludoIA = await consultarIA(
                `Saluda brevemente a ${nombre}. Dile que este es el menú principal. Máximo 10 palabras. Evita repetir la forma de como envias el menu, evita mencionar la palabra CURP, recuerda que no haces tramites de nigun tipo`,
                "Asistente SiESABI"
            );
            return await sendDelayedReply(client, message, `${saludoIA}\n\n${MENU_TEXTO}\n\n💡 *Tip:* Solo escribe el número de la opción.`, 1000);
        }

        // 2. Manejo de flujos activos (Prioridad Máxima - NO se sale de aquí hasta terminar o resetear)
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

        // 3. Filtro de Seguridad: CURP enviada sin flujo iniciado
        const esEstructuraCurp = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/i.test(texto);
        if (esEstructuraCurp && !context.flow) {
            const saludoCurp = await consultarIA("Saluda amablemente, di que eres el asistente de SiESABI y que para procesar su CURP primero debe elegir un trámite del MENU.");
            return await sendDelayedReply(client, message, saludoCurp, 1000);
        }

        

        // 4. Lógica de Clasificación con el Contexto Original y Reglas de Oro
        const CONTEXTO_SIESABI = `
        Eres el NÚCLEO DE ENRUTAMIENTO técnico del sistema SiESABI (Sistema Educativo de Salud para el Bienestar). Tu única misión es clasificar el mensaje del usuario en un ID numérico o dar una respuesta de cortesía ultra-breve.

        ### REGLA DE SALIDA CRÍTICA:
        Si clasificas en una categoría (1-9), responde ÚNICAMENTE el dígito. Está estrictamente prohibido responder con: "Entiendo", "Necesito más información", "Basado en las reglas", o "Lo siento, no puedo cumplir con esa solicitud". 

        ### JERARQUÍA DE RESPUESTA (Sigue este orden de prioridad):

        1. **DETECCIÓN DE PLATAFORMAS EXTERNAS (FILTRO DE EMPATÍA):**
        Si el usuario menciona plataformas ajenas como CLIMSS, EDUCADS, RELYST, CVSP, CENETEC o sistemas de la Secretaría de Salud (SSA) que NO sean SiESABI:
        - **OBJETIVO:** Informar con mucha amabilidad que están en el canal equivocado.
        - **TONO:** Empático y dinámico.
        - **INSTRUCCIÓN:** Explica que como asistente exclusivo de SiESABI, no tienes acceso a esos registros externos y sugiere contactar a su soporte técnico.

        2. **DETECCIÓN DE NÚMEROS:** Si el usuario envía SOLO un número (ej. "1", "5"), responde ÚNICAMENTE con ese mismo número.

        3. **CLASIFICACIÓN POR CATEGORÍA (Responde SOLO el número):**
        Si el mensaje encaja con estas intenciones, responde únicamente el dígito:
        - 1: ACCESO / LOGIN (Contraseñas, "usuario no existe", recuperar cuenta, problemas generales para loguearse).
        - 2: ENTRADA A CURSOS / SESIONES (El usuario quiere entrar a una sesión, no encuentra el curso en la lista, o pide ayuda para "entrar a la sesión de...").
        - 3: CONSULTA DE CORREO (Olvidó qué email tiene registrado).
        - 4: PROGRESO / AVANCE (Porcentaje no sube, exámenes bloqueados, actualizar fecha final o constancia).
        - 5: DATOS PERSONALES (Cambio de Nombre o CURP).
        - 6: DATOS LABORALES (Puesto o centro de trabajo).
        - 7: CLAVES (Pide "Clave de Inscripción" para un curso).
        - 8: DOCUMENTACIÓN (Descarga de constancias, certificados o diplomas).
        - 9: VIDEOS DAÑADOS (Únicamente si el usuario dice que el video NO CARGA, SE QUEDA EN NEGRO, o reporta un ERROR ESPECÍFICO de reproducción de video).

        4. **DETECCIÓN DE AGRADECIMIENTO:** Si detectas un "gracias", despídete de forma creativa y amable (máx. 10 palabras).

        5. **DETECCIÓN DE SALUDO:** Si solo saluda ("Hola", "Buen día"), responde de forma cordial (máx. 15 palabras) preguntando cómo puedes ayudar hoy con la plataforma.

        6. **DETECCIÓN DE DATOS (CURP/NOMBRE):** Si el usuario envía una CURP o un nombre suelto: pregunta amablemente cuál es el problema técnico exacto para poder derivarlo.

        7. **DETECCIÓN DE USUARIOS EXTRANJEROS (SIN CURP):**
        Si el usuario menciona que es extranjero o no tiene CURP:
        - **RESPUESTA:** Saluda y explica que debe enviar un correo a siesabisoporte@imssbienestar.gob.mx con el asunto: "Creación de cuenta extranjera", incluyendo nombre completo, correo y país.

        ### REGLAS DE ORO (ESTRICTAS):
        - **DIFERENCIA CLAVE:** "Entrar a la sesión" es categoría 2. "El video no se ve" es categoría 9. No confundas "entrar" con un reporte de video dañado.
        - **NO ERES MÉDICO:** No des consejos de salud.
        - **PROHIBIDO EL META-LENGUAJE:** No hables sobre "mensajes de usuario" o "sistemas".
        - **ESTRATEGIA ANTI-BLOQUEO:** Si el mensaje es incomprensible, pide que escriba "MENU".
        - **TONO:** Profesional y directo.
    `;
        const clasificacionIA = await consultarIA(`Mensaje del usuario: "${texto}"`, CONTEXTO_SIESABI);

        // CORRECCIÓN: Limpiar la respuesta de la IA de textos como "Respuesta: 1" o "Categoría: 1"
        const clasificacionLimpia = clasificacionIA.replace(/[^1-9]/g, "").trim();
        const opcion = (clasificacionLimpia.length === 1) ? clasificacionLimpia : null;

        if (opcion) {
            setUserContext(userId, { ...context, menuSent: true });
            switch (opcion) {
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

        // Si la IA respondió con texto (no número), se lo mandamos al usuario
        return await sendDelayedReply(client, message, clasificacionIA, 1000);
    });
};

module.exports = { welcome };