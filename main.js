const { Client, LocalAuth } = require('whatsapp-web.js');
const { welcome } = require('./welcome');
const cron = require('node-cron');
const { resetAllUsersContext } = require('./users');
const { consultarIA } = require('./ia_service');

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-extensions',
            '--disable-dev-shm-usage',
            '--disable-gpu'
        ],
    },
    // webVersionCache: {
    //     type: 'remote',
    //     remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version-utils/main/versions/2.3000.1018919747-alpha.json',
    // }
});

client.on('auth_failure', msg => console.error('❌ Falla de autenticación:', msg));
client.on('disconnected', (reason) => console.log('⚠️ El cliente se desconectó:', reason));

client.on('qr', qr => {
    console.log('Escanea este QR con WhatsApp:');
    require('qrcode-terminal').generate(qr, { small: true });
});

client.on('call', async (call) => {
    console.log('📞 Llamada detectada de:', call.from);
    await call.reject();

    return await client.sendMessage(call.from,
        `⚠️ *AVISO AUTOMÁTICO* ⚠️\n\n` +
        `🤖 Hola, soy el asistente virtual de SIESABI.\n\n` +
        `❌ No puedo atender llamadas, mensajes de voz o contestar preguntas.\n\n` +
        `✅ Por favor, escribe *MENU* para ver las opciones disponibles y continúa con el flujo de la conversación.`
    );
    
});

client.on('ready', async () => {
    console.log('✅ Bot en línea y vinculado.');

    // 1. ESPERA INICIAL DE SINCRONIZACIÓN (45s) - CRÍTICO PARA 200 CHATS
    console.log('⏳ Sincronizando base de datos local (45s)...');
    await new Promise(r => setTimeout(r, 45000));

    try {
        // 2. INYECCIÓN DE FUERZA BRUTA (WWebJS Internals)
        // Esto obliga a WhatsApp a cargar TODOS los chats que tengan mensajes sin leer
        // directamente desde el Store de JavaScript, saltándose el renderizado HTML.
        console.log('🔍 Forzando carga profunda de Store para 200+ chats...');
        const chats = await client.pupPage.evaluate(async () => {
            // Obtenemos todos los chats que el Store conoce
            const allChats = await window.WWebJS.getChats();
            // Filtramos solo los que tienen mensajes sin leer (unreadCount > 0)
            return allChats.filter(chat => chat.unreadCount > 0 && !chat.isGroup);
        });

        // 3. PROCESAR CHATS DETECTADOS
        // La IA usará estos IDs para enviar los mensajes.
        console.log(`📊 Chats con actividad detectada: ${chats.length}`);

        if (chats.length === 0) {
            console.log('📝 No se detectaron mensajes pendientes reales.');
            return;
        }

        let i = 1;
        for (const chatData of chats) {
            // Delay anti-ban estricto (Entre 6 y 12 segundos)
            const delay = Math.floor(Math.random() * (12000 - 6000 + 1)) + 6000;
            await new Promise(r => setTimeout(r, delay));

            try {
                // Obtenemos el objeto Chat real usando el ID que sacamos del Store
                const chat = await client.getChatById(chatData.id._serialized);
                const contact = await chat.getContact();
                const nombre = contact.pushname || "Usuario";

                // Usamos la IA para el saludo
                const saludoIA = await consultarIA(
                    `Saluda al usuario, notificale que no estabas en linea, se breve y amable, dile que el horario de atención es de 9 AM a 7 PM,
                    ademas dile que eres un asistente automatico que le ayudara con los problemas que pueda tener con su cuenta de SiESABI,
                    se creativo con esta notificación para que ninguna de las que respondas sea igual, no envies nigun menu, solo saluda y explica`,
                    "Puesta al día"
                );

                await chat.sendStateTyping();

                const readingTime = Math.random() * 2000 + 1000;
                await new Promise(resolve => setTimeout(resolve, readingTime));

                await chat.sendMessage(saludoIA);
                await chat.sendSeen(); // Esto limpia la notificación
                console.log(`[${i}/${chats.length}] ✅ Notificado: ${nombre}`);
                i++;
            } catch (err) {
                console.error(`❌ Error en chat ${chatData.id.user}:`, err.message);
            }
        }
        console.log('✨ Puesta al día finalizada.');
    } catch (err) {
        console.error('💥 Error crítico en ready:', err);
    }
});

cron.schedule('0 0 * * *', () => {
    resetAllUsersContext();
    console.log('🕛 Limpieza automática ejecutada');
}, {
    timezone: "America/Mexico_City"
});

welcome(client);

client.initialize().catch(err => {
    console.error('💥 Error al inicializar el cliente:', err.message);
});