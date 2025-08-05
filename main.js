const { Client, LocalAuth } = require('whatsapp-web.js');
const puppeteer = require('puppeteer');
const { welcome } = require('./welcome');

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


welcome(client);


client.initialize();