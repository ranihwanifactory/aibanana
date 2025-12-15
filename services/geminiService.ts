import { GoogleGenAI } from "@google/genai";

const MODEL_NAME = 'gemini-2.5-flash-image';

// Initialize the client
// API Key is injected via process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Generates an image based on a text prompt.
 * If a sourceImageBase64 is provided, it acts as an image editing/transformation request.
 * Includes retry logic for rate limits.
 */
export const generateOrEditImage = async (
  prompt: string,
  sourceImageBase64?: string,
  sourceMimeType?: string
): Promise<string> => {
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

  // Retry configuration: 5 retries with exponential backoff starting at 5 seconds.
  // 5s -> 10s -> 20s -> 40s -> 80s. 
  // This covers the generic "45s" or longer delays often seen with the Free Tier.
  let retries = 5;
  let delay = 5000;

  while (true) {
    try {
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: {
          parts: parts,
        },
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

    } catch (error: any) {
      // Check for rate limit (429) or service overload (503) or generic quota messages
      // error.status might be present, or check the message content
      const errorMessage = error.message || JSON.stringify(error);
      const isRateLimit = error.status === 429 || errorMessage.includes('429') || errorMessage.includes('Quota exceeded') || errorMessage.includes('RESOURCE_EXHAUSTED');
      const isServerOverload = error.status === 503;

      if (retries > 0 && (isRateLimit || isServerOverload)) {
        console.warn(`Rate limit hit. Retrying in ${delay}ms... (Attempts left: ${retries})`);
        await sleep(delay);
        retries--;
        delay *= 2; // Exponential backoff
        continue;
      }

      console.error("Gemini API Error:", error);
      throw error;
    }
  }
};