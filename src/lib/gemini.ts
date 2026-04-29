import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI((import.meta as any).env.VITE_GEMINI_API_KEY || "");

export async function performOcrAttempt(file: File, modelName = "gemini-2.0-flash") {
  const model = genAI.getGenerativeModel({ model: modelName });

  const base64Data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const prompt = `
    Analyze this vehicle document (Insurance, Registration Card, or Technical Control).
    Extract the following information in JSON format:
    {
      "documentType": "Assurance" | "Carte Grise" | "Contrôle Technique" | "Vignette",
      "plate": "String (e.g. 16 123-A-06)",
      "expiryDate": "YYYY-MM-DD",
      "marque": "String (e.g. VOLKSWAGEN, PEUGEOT, RENAULT)",
      "chassis": "String (e.g. VF1...)",
      "confidence": number (0-100)
    }
    If a field is not visible on the document, leave it as an empty string.
    Only return the JSON.
  `;

  try {
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType: file.type,
        },
      },
    ]);

    const response = await result.response;
    const text = response.text();
    const cleanedText = text.replace(/```json|```/g, "").trim();
    return JSON.parse(cleanedText);
  } catch (e: any) {
    console.error(`Gemini Error (${modelName}):`, e);
    throw e;
  }
}

export async function performOcr(file: File, retries = 2): Promise<any> {
  let lastError = null;
  for (let i = 0; i < retries; i++) {
    try {
      // consolidate on 2.0-flash for speed as requested
      return await performOcrAttempt(file, "gemini-2.5-flash");
    } catch (e: any) {
      lastError = e;
      if (i === retries - 1) break;
      // Faster retry for instantaneous feel
      await new Promise(res => setTimeout(res, 500)); 
    }
  }
  
  const errorMessage = lastError?.message || "Erreur inconnue";
  throw new Error(`AI Extraction Failed: ${errorMessage}`);
}
