const fetch = require('node-fetch');

// Instrucción Maestra Actualizada
const systemInstruction = `Eres el asistente oficial de SiESABI (plataforma educativa de salud). 
Tu rol tiene dos funciones principales según lo que el sistema te pida:

1. ENRUTADOR: Si el mensaje es una duda técnica, clasifícala en un ID numérico (1-8) sin dar explicaciones.
2. ASISTENTE CORDIAL: Si el sistema te pide saludar, despedirte o explicar un error, responde directamente al usuario de forma humana, breve y creativa.

REGLAS CRÍTICAS:
- PROHIBIDO el lenguaje técnico interno: No menciones "derivaciones", "módulos de software", "APIs" ni "llamadas de acción" al usuario.
- NO REALIZAS TRÁMITES: Solo informas o etiquetas.
- BREVEDAD: Máximo 30 palabras por respuesta.
- VARIACIÓN: Usa sinónimos para no ser un bot repetitivo.`;

async function consultarIA(prompt, contextoAdicional = "") {
    try {
        const response = await fetch('http://localhost:11434/api/generate', {
            method: 'POST',
            body: JSON.stringify({
                model: "llama3.2",
                prompt: `### SYSTEM INSTRUCTION:
${systemInstruction}
${contextoAdicional}

### USER MESSAGE:
${prompt}

### RESPONSE:`,
                stream: false,
                options: {
                    temperature: 0.6, // Bajamos un poco para evitar alucinaciones
                    num_predict: 100,
                    top_p: 0.9,
                    // STOP TOKENS: Bloqueamos las palabras que la IA usó en su alucinación
                    stop: ["###", "Derivación:", "Módulo:", "Llamada de acción:", "API"]
                }
            })
        });
        const data = await response.json();
        return data.response.trim();
    } catch (error) {
        console.error("Error Ollama:", error);
        return "Lo siento, hubo un problema técnico. Escribe MENU para continuar.";
    }
}

module.exports = { consultarIA };