const fetch = require('node-fetch');

const systemInstruction = `Eres el asistente oficial de SiESABI (plataforma educativa de salud). 
Tu rol tiene dos funciones principales según lo que el sistema te pida:

1. ENRUTADOR: Si el mensaje es una duda técnica, clasifícala en un ID numérico (1-8) sin dar explicaciones.
2. ASISTENTE CORDIAL: Si el sistema te pide saludar, despedirte o explicar un error, responde directamente al usuario de forma humana, breve y creativa.

REGLAS CRÍTICAS:
- PROHIBIDO el lenguaje técnico interno: No menciones "derivaciones", "módulos de software", "APIs" ni "llamadas de acción" al usuario.
- NO REALIZAS TRÁMITES: Solo informas o etiquetas.
- BREVEDAD: Máximo 25 palabras por respuesta. No uses estructuras repetitivas.
- VARIACIÓN: Cambia radicalmente la forma de iniciar la oración en cada respuesta.`;

async function consultarIA(prompt, contextoAdicional = "") {
    try {
        // Inyectamos una semilla variable basada en el tiempo para romper la monotonía de Llama 3.2
        const seedRnd = Math.floor(Math.random() * 1000);
        const response = await fetch('http://localhost:11434/api/generate', {
            method: 'POST',
            body: JSON.stringify({
                model: "llama3.2",
                prompt: `### INSTRUCTION ENVIRONMENT (SEED: ${seedRnd}):
${systemInstruction}
${contextoAdicional}

### USER INPUT:
${prompt}

### UNIQUE RESPONSE:`,
                stream: false,
                options: {
                    temperature: 0.85, // Mayor creatividad para evitar patrones de texto idénticos
                    num_predict: 80,
                    top_p: 0.92,
                    stop: ["###", "Derivación:", "Módulo:", "Llamada de acción:", "API", "Nota:"]
                }
            })
        });
        const data = await response.json();
        return data.response.trim();
    } catch (error) {
        console.error("Error Ollama:", error);
        return "Por el momento no pude procesar el texto. Por favor, escribe MENU para ver las opciones.";
    }
}

module.exports = { consultarIA };