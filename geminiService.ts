import { GoogleGenAI, type GenerateContentResponse, Type } from "@google/genai";
import type { ColorPalette, ExtractedColor } from "../types";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
if (!apiKey) {
    throw new Error("VITE_GEMINI_API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey });

const fileToGenerativePart = (base64Data: string, mimeType: string) => {
  return {
    inlineData: {
      data: base64Data,
      mimeType
    },
  };
};

const getLightingStyleDescription = (style: string): string => {
    switch (style) {
        case 'Cinematico':
            return 'Emulates cinematic lighting with high contrast and deep shadows for a dramatic look.';
        case 'Rembrandt':
            return 'Creates a classic Rembrandt-style portrait with a triangle of light on the cheek to add dimensionality.';
        case 'Contrasto Morbido':
            return 'Applies a dreamy and ethereal look with soft transitions between light and shadow.';
        case 'Drammatico':
            return 'Uses strong chiaroscuro for a bold image, pushing highlights and shadows to their extremes.';
        case 'Standard':
        default:
            return 'Applies a balanced enhancement to naturally increase dimensionality.';
    }
};

const getIntensityWord = (val: number): string => {
    if (val < 20) return "very subtle";
    if (val < 40) return "subtle";
    if (val < 60) return "moderate";
    if (val < 80) return "strong";
    return "very strong";
};

const handleApiResponse = (response: GenerateContentResponse): string => {
    const firstCandidate = response.candidates?.[0];
    
    // Iterate through parts to find the image
    for (const part of firstCandidate?.content?.parts || []) {
        if (part && 'inlineData' in part && part.inlineData?.mimeType.startsWith('image/')) {
            const base64ImageBytes: string = part.inlineData.data;
            const responseMimeType: string = part.inlineData.mimeType;
            return `data:${responseMimeType};base64,${base64ImageBytes}`;
        }
    }

    // If no image part is found, construct a detailed error
    let errorMessage = "L'API non ha restituito un'immagine.";
    if (response.promptFeedback?.blockReason) {
        errorMessage += ` Motivo del blocco: ${response.promptFeedback.blockReason}.`;
    } else if (firstCandidate?.finishReason && firstCandidate.finishReason !== 'STOP') {
        errorMessage += ` Motivo interruzione: ${firstCandidate.finishReason}.`;
    } else if (response.text) {
         errorMessage += ` Risposta del modello: "${response.text}"`;
    } else {
        errorMessage += " La risposta del modello era vuota o non conteneva un'immagine. Il prompt potrebbe essere troppo restrittivo o il modello potrebbe aver attivato un filtro di sicurezza interno senza fornire dettagli.";
    }

    console.error("API did not return an image part as expected.", { response });
    throw new Error(`La generazione dell'immagine è fallita: ${errorMessage}`);
};

export const generateEnhancedImage = async (
    base64Data: string,
    mimeType: string,
    dodge: number,
    burn: number,
    lightingStyle: string,
    creativePrompt: string
): Promise<string> => {
    try {
        const imagePart = fileToGenerativePart(base64Data, mimeType);
        
        const prompt = `You are a world-class photo retoucher. Your task is to perform a non-destructive "Dodge & Burn" enhancement on the provided image to increase its dimensionality and impact.

- **Objective:** Apply dodging (brightening highlights) and burning (darkening shadows) based on the following creative direction.
- **Dodge Intensity:** ${getIntensityWord(dodge)}
- **Burn Intensity:** ${getIntensityWord(burn)}
- **Lighting Style:** ${lightingStyle}. (${getLightingStyleDescription(lightingStyle)})
${creativePrompt ? `- **User Guidance:** "${creativePrompt}"` : `- **User Guidance:** Use your expert artistic judgment to naturally enhance the image, guiding the viewer's eye and improving the overall mood.`}

**Critical Rule: Your output MUST be the processed image ONLY. Do not output any text, JSON, or explanation. Just the image.**`;
        
        const textPart = { text: prompt };

        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, textPart] },
            config: {
                // This is the critical fix: explicitly request an IMAGE modality in the response.
                responseModalities: ['TEXT', 'IMAGE']
            }
        });

        return handleApiResponse(response);

    } catch (error) {
        console.error("Error generating enhanced image:", error);
        if (error instanceof Error) {
            return Promise.reject(new Error(`Impossibile migliorare l'immagine: ${error.message}`));
        }
        return Promise.reject(new Error("Si è verificato un errore sconosciuto durante il miglioramento dell'immagine."));
    }
};

export const extractColorsFromImage = async (
    base64Data: string,
    mimeType: string,
    count: number
): Promise<ColorPalette> => {
    try {
        const imagePart = fileToGenerativePart(base64Data, mimeType);
        const prompt = `Analyze this reference image and identify the ${count} most dominant and representative colors that define its overall mood and aesthetic. For each color, provide its HEX code, a creative name, and a brief semantic description. IMPORTANT: The 'name' and 'semantic' fields in the JSON response MUST be in Italian.`;
        
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: { parts: [imagePart, { text: prompt }] },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        colors: {
                            type: Type.ARRAY,
                            description: "An array of the extracted colors.",
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    hex: {
                                        type: Type.STRING,
                                        description: "The color in hexadecimal format (e.g., '#RRGGBB')."
                                    },
                                    name: {
                                        type: Type.STRING,
                                        description: "A creative name for the color, in Italian."
                                    },
                                    semantic: {
                                        type: Type.STRING,
                                        description: "A brief semantic description of the color's role in the image, in Italian."
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        const jsonText = response.text.trim();
        const parsedJson = JSON.parse(jsonText);
        
        if (parsedJson && Array.isArray(parsedJson.colors)) {
             return parsedJson as ColorPalette;
        } else {
            throw new Error("La risposta dell'API non conteneva un array di colori valido.");
        }

    } catch (error) {
        console.error("Error extracting colors:", error);
        if (error instanceof Error) {
            return Promise.reject(new Error(`Impossibile estrarre i colori: ${error.message}`));
        }
        return Promise.reject(new Error("Si è verificato un errore sconosciuto durante l'estrazione dei colori."));
    }
};

export const applyColorTransfer = async (
    base64Data: string,
    mimeType: string,
    colors: ExtractedColor[]
): Promise<string> => {
    try {
        const imagePart = fileToGenerativePart(base64Data, mimeType);
        const colorList = colors.map(c => `- ${c.name} (${c.hex}): ${c.semantic}`).join('\n');

        const prompt = `You are an expert colorist. Your task is to creatively re-grade the provided image to match the mood of a specific color palette.

- **Source Image:** The user has provided an image that has already been retouched for light and shadow.
- **Target Palette:** Harmonize the image's colors with the following palette:\n${colorList}
- **Objective:** The final image should feel as if it belongs to the same world as the reference palette. Adjust midtones, highlights, and shadows subtly to incorporate these colors. Do not just tint the image; perform a professional-grade color transfer.

**Critical Rule: Your output MUST be the processed image ONLY. Do not output any text, JSON, or explanation. Just the image.**`;

        const textPart = { text: prompt };

        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, textPart] },
            config: {
                // This is the critical fix: explicitly request an IMAGE modality in the response.
                responseModalities: ['TEXT', 'IMAGE']
            }
        });

        return handleApiResponse(response);
    } catch (error) {
        console.error("Error applying color transfer:", error);
        if (error instanceof Error) {
            return Promise.reject(new Error(`Impossibile armonizzare i colori: ${error.message}`));
        }
        return Promise.reject(new Error("Si è verificato un errore sconosciuto durante l'armonizzazione dei colori."));
    }
};