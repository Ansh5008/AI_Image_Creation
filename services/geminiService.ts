
import { GoogleGenAI, Modality, GenerateContentResponse } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

interface EditResult {
  image: string | null;
  mimeType: string | null;
  text: string | null;
}

export const editImageWithGemini = async (base64ImageData: string, mimeType: string, prompt: string): Promise<EditResult> => {
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image-preview',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64ImageData,
              mimeType: mimeType,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
        // This model can output both images and text, so we specify both modalities.
        responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });
    
    let editedImage: string | null = null;
    let imageMimeType: string | null = null;
    let generatedText: string | null = null;

    if (response.candidates && response.candidates[0] && response.candidates[0].content && response.candidates[0].content.parts) {
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                editedImage = part.inlineData.data;
                imageMimeType = part.inlineData.mimeType;
            } else if (part.text) {
                generatedText = part.text;
            }
        }
    }
    
    if (!editedImage && !generatedText) {
        throw new Error("API response did not contain an image or text. The prompt may have been blocked.");
    }

    return { image: editedImage, mimeType: imageMimeType, text: generatedText };
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error) {
        throw new Error(`Gemini API Error: ${error.message}`);
    }
    throw new Error("An unknown error occurred while communicating with the Gemini API.");
  }
};
