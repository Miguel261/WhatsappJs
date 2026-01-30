const { Client, LocalAuth } = require('whatsapp-web.js');
const puppeteer = require('puppeteer');
const { welcome } = require('./welcome');
const cron = require('node-cron');
const { resetAllUsersContext } = require('./users');

const client = new Client({
    authStrategy: new LocalAuth(), 
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-extensions'
        ],
    },

    webVersionCache: {
        type: 'remote',
        remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version-utils/main/versions/2.2412.54.json',
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