
import { GoogleGenAI } from "@google/genai";

export const generateIncidentSummary = async (description: string): Promise<string> => {
    if (!process.env.API_KEY) {
        return "La función de IA está deshabilitada. Configure la variable de entorno API_KEY.";
    }
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const prompt = `Analiza el siguiente informe de incidente laboral y proporciona un resumen breve y profesional adecuado para una descripción general de la gerencia. Concéntrate en los eventos clave, las posibles causas y las acciones inmediatas tomadas. El resumen debe estar en español.
---
INFORME DE INCIDENTE:
${description}
---
RESUMEN PROFESIONAL:`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                temperature: 0.5,
                topP: 1,
                topK: 32
            }
        });

        return response.text;
    } catch (error) {
        console.error("Error generating incident summary:", error);
        return "No se pudo generar el resumen del incidente. Por favor, inténtelo de nuevo más tarde.";
    }
};

export const generateCapaSuggestions = async (problemDescription: string): Promise<string> => {
    if (!process.env.API_KEY) {
        return "La función de IA está deshabilitada. Configure la variable de entorno API_KEY.";
    }
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const prompt = `Realiza un análisis de causa raíz para el siguiente problema reportado en un entorno industrial/de oficina. Utiliza el método de los "5 Porqués" para profundizar en las causas. Luego, sugiere un Plan de Acción con al menos 3 acciones concretas (correctivas o preventivas). Formatea la respuesta en español de manera clara, usando markdown.

---
PROBLEMA REPORTADO:
"${problemDescription}"
---

ANÁLISIS DE CAUSA RAÍZ Y PLAN DE ACCIÓN SUGERIDO:`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
             config: {
                temperature: 0.7,
                topP: 1,
                topK: 40
            }
        });
        
        return response.text;

    } catch (error) {
        console.error("Error generating CAPA suggestions:", error);
        return "No se pudieron generar las sugerencias. Por favor, revise la consola o inténtelo de nuevo.";
    }
};