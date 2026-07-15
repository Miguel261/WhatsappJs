const { MessageMedia } = require('whatsapp-web.js');
const fs = require('fs');

const sendDelayedReply = async (client, msg, text, delayMs = 0) => {
    try {
        if (!text || text.trim() === "") return;
        const chat = await msg.getChat();

        // 1. Simular lectura humana
        await chat.sendSeen();
        const readingTime = Math.random() * 1500 + 1000;
        await new Promise(resolve => setTimeout(resolve, readingTime));

        // 2. Activar simulación de escritura
        await chat.sendStateTyping();

        // 3. Calcular tiempo de tecleo (mínimo de 1.8 segundos para evitar ráfagas automáticas)
        let typingTextDelay = (text.length * 65) * (Math.random() * (1.1 - 0.9) + 0.9);
        if (typingTextDelay < 1800) typingTextDelay = 1800;

        await new Promise(resolve => setTimeout(resolve, typingTextDelay + delayMs));

        // 4. Enviar y limpiar estado del chat
        await client.sendMessage(msg.from, text);
        await chat.clearState();
    } catch (error) {
        console.error('Error al enviar mensaje humanizado:', error);
    }
};

const sendDelayedImage = async (client, msg, imageOptions, delayMs = 0) => {
    try {
        if (msg.from === 'status@broadcast') return;

        const chat = await msg.getChat();
        await chat.sendSeen();
        await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));

        let media;
        if (imageOptions.url || imageOptions.path) {
            const filePath = imageOptions.url || imageOptions.path;
            media = MessageMedia.fromFilePath(filePath);
        } else {
            throw new Error('No se proporcionó una ruta válida de imagen');
        }

        await chat.sendStateTyping();
        await new Promise(resolve => setTimeout(resolve, 2000 + delayMs));

        await client.sendMessage(msg.from, media, { caption: imageOptions.caption || '' });
        await chat.clearState();
    } catch (error) {
        console.error('Error al enviar imagen:', error);
    }
};

module.exports = {
    sendDelayedReply,
    sendDelayedImage
};