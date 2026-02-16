import { GoogleGenAI } from "@google/genai";

const GEMINI_MODEL = "gemini-2.5-flash-preview-05-20";

let genaiClient: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (!genaiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not set");
    }
    genaiClient = new GoogleGenAI({ apiKey });
  }
  return genaiClient;
}

export interface EnhanceImageResult {
  imageBase64: string;
  mimeType: string;
}

export async function enhanceImage(
  imageBase64: string,
  mimeType: string,
  prompt: string,
): Promise<EnhanceImageResult> {
  const ai = getClient();

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: [
      {
        role: "user",
        parts: [
          { inlineData: { mimeType, data: imageBase64 } },
          { text: prompt },
        ],
      },
    ],
    config: {
      responseModalities: ["image", "text"],
    },
  });

  const candidate = response.candidates?.[0];
  if (!candidate?.content?.parts) {
    throw new Error("No response from Gemini image enhancement");
  }

  for (const part of candidate.content.parts) {
    if (part.inlineData?.data) {
      return {
        imageBase64: part.inlineData.data,
        mimeType: part.inlineData.mimeType ?? "image/png",
      };
    }
  }

  throw new Error("Gemini did not return an enhanced image");
}
