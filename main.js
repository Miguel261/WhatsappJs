const { Client, LocalAuth } = require('whatsapp-web.js');
const puppeteer = require('puppeteer');
const { welcome } = require('./welcome');
const cron = require('node-cron'); 
const { resetAllUsersContext } = require('./users');

const client = new Client({
    authStrategy: new LocalAuth({
        dataPath: './session_data'
    }),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox'
        ]
    }
});

client.on('qr', qr => {
    console.log('Escanea este QR con WhatsApp:');
    require('qrcode-terminal').generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('✅ Bot listo para recibir mensajes');
});

cron.schedule('0 0 * * *', () => {
    resetAllUsersContext();
    console.log('🕛 Limpieza automática ejecutada');
}, {
    timezone: "America/Mexico_City"
});

welcome(client);
client.initialize();