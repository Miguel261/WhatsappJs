const { MessageMedia } = require('whatsapp-web.js');
const fs = require('fs');

const sendDelayedReply = async (client, msg, text, delayMs = 0) => {
    try {
        const chat = await msg.getChat();

        await chat.sendSeen();

        const readingTime = Math.random() * 2000 + 1000;
        await new Promise(resolve => setTimeout(resolve, readingTime));

        await chat.sendStateTyping();

        const typingTextDelay = Math.min(text.length * 50, 5000);
        await new Promise(resolve => setTimeout(resolve, typingTextDelay + delayMs));

        await client.sendMessage(msg.from, text);

        await chat.clearState();
    } catch (error) {
        console.error('Error al enviar mensaje humanizado:', error);
    }
};

const sendDelayedImage = async (client, msg, imageOptions, delayMs = 0) => {
    try {
        await new Promise(resolve => setTimeout(resolve, delayMs));

        if (msg.from === 'status@broadcast') {
            console.log('Ignorando mensaje de broadcast');
            return;
        }

        let media;

        if (imageOptions.url || imageOptions.path) {
            const filePath = imageOptions.url || imageOptions.path;
            media = MessageMedia.fromFilePath(filePath);
        } else {
            throw new Error('No se proporcionó una ruta válida de imagen');
        }

        await client.sendMessage(msg.from, media, { caption: imageOptions.caption || '' });

    } catch (error) {
        console.error('Error al enviar imagen:', error);
    }
};

module.exports = {
    sendDelayedReply,
    sendDelayedImage
};