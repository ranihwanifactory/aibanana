import { GoogleGenAI } from "@google/genai";

const MODEL_NAME = 'gemini-2.5-flash-image';

// Initialize the client
// API Key is injected via process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generates an image based on a text prompt.
 * If a sourceImageBase64 is provided, it acts as an image editing/transformation request.
 */
export const generateOrEditImage = async (
  prompt: string,
  sourceImageBase64?: string,
  sourceMimeType?: string
): Promise<string> => {
  try {
    const parts: any[] = [];

    // If source image exists, add it to the parts (Editing Mode)
    if (sourceImageBase64 && sourceMimeType) {
      // Remove data URL prefix if present for the API call data
      const base64Data = sourceImageBase64.split(',')[1] || sourceImageBase64;
      
      parts.push({
        inlineData: {
          mimeType: sourceMimeType,
          data: base64Data,
        },
      });
    }

    // Add the text prompt
    parts.push({
      text: prompt,
    });

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: parts,
      },
      // Note: gemini-2.5-flash-image does not support responseMimeType or systemInstruction for image generation tasks
      // in the same way text models do, and often returns mixed content.
    });

    // Parse response to find the image part
    const candidates = response.candidates;
    const responseParts = candidates?.[0]?.content?.parts;

    if (responseParts) {
      for (const part of responseParts) {
        if (part.inlineData && part.inlineData.data) {
          const mimeType = part.inlineData.mimeType || 'image/png';
          return `data:${mimeType};base64,${part.inlineData.data}`;
        }
      }
    }

    throw new Error("No image data found in the response.");
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};