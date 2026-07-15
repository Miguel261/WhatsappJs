const { Client, LocalAuth } = require('whatsapp-web.js');
const { welcome } = require('./welcome');
const cron = require('node-cron');
const { resetAllUsersContext } = require('./users');
const { consultarIA } = require('./ia_service');

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        browserWSEndpoint: null,
        headless: true,
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-extensions',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            // --- NUEVOS ARGUMENTOS DE CAMUFLAJE ---
            '--disable-blink-features=AutomationControlled',
            '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        ],
    },
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

    // 1. ESPERA INICIAL PROLONGADA
    console.log('⏳ Sincronizando base de datos local (60s)...');
    await new Promise(r => setTimeout(r, 60000));

    try {
        console.log('🔍 Buscando mensajes pendientes...');
        const chats = await client.pupPage.evaluate(async () => {
            // Validamos que la API interna de WWebJS exista en la página antes de llamarla
            if (!window.WWebJS) return [];
            try {
                const allChats = await window.WWebJS.getChats();
                return allChats.filter(chat => chat.unreadCount > 0 && !chat.isGroup);
            } catch (evalErr) {
                console.error("Error evaluando chats en el navegador:", evalErr);
                return [];
            }
        });

        console.log(`📊 Total de chats por atender: ${chats.length}`);

        if (chats.length === 0) return;

        let i = 1;
        for (const chatData of chats) {
            // Evitamos procesar si el ID de chat no es válido
            if (!chatData || !chatData.id || !chatData.id._serialized) continue;

            // --- LÓGICA DE FRAGMENTACIÓN (BATCHING) ---
            if (i > 1 && (i - 1) % 5 === 0) {
                const pausaLarga = Math.floor(Math.random() * (240000 - 120000 + 1)) + 120000;
                console.log(`☕ Pausa de seguridad (Batch de 5 completo). Esperando ${Math.round(pausaLarga / 1000)}s...`);
                await new Promise(r => setTimeout(r, pausaLarga));
            }

            // Delay entre mensajes individuales
            const delay = Math.floor(Math.random() * (25000 - 15000 + 1)) + 15000;
            await new Promise(r => setTimeout(r, delay));

            try {
                // ENVOLVEMOS getChatById EN SU PROPIO TRY/CATCH PARA EVITAR QUE ROMPA LA APLICACIÓN
                const chat = await client.getChatById(chatData.id._serialized).catch(err => {
                    console.error(`⚠️ No se pudo obtener el chat ${chatData.id._serialized}:`, err.message);
                    return null;
                });

                if (!chat) continue; // Si falló al obtener el chat, pasamos al siguiente

                const contact = await chat.getContact();
                const nombre = contact.pushname || "Usuario";

                // Usamos la IA para el saludo
                const saludoIA = await consultarIA(
                    `Saluda a ${nombre}, avisa que ya estás en línea (horario 9am-7pm). ` +
                    `Explica que eres el asistente de SiESABI. Sé breve y creativo. No envíes menús.`,
                    "Puesta al día"
                );

                // SIMULACIÓN DE ACTIVIDAD HUMANA
                await chat.sendSeen();
                await new Promise(r => setTimeout(r, 2000));

                await chat.sendStateTyping();

                const typingTime = (saludoIA.length * 70) + (Math.random() * 2000);
                await new Promise(r => setTimeout(r, typingTime));

                await chat.sendMessage(saludoIA);
                console.log(`[${i}/${chats.length}] ✅ Notificado: ${nombre}`);

                i++;
            } catch (err) {
                console.error(`❌ Error procesando el chat individual ${chatData.id.user}:`, err.message);
            }
        }
        console.log('✨ Puesta al día finalizada.');
    } catch (err) {
        console.error('💥 Error crítico general en proceso ready:', err);
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