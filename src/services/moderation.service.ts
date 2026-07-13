import { GoogleGenerativeAI } from "@google/generative-ai";
import { ValidationError } from "../utils/AppError.js";

const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

export interface ModerationResult {
  isFlagged: boolean;
  reason?: string;
  confidence: number;
}

export async function moderateContent(text: string): Promise<ModerationResult> {
  if (!genAI) {
    return { isFlagged: false, confidence: 0 };
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const prompt = `Analyze the following text for abusive, spam, hate speech, or inappropriate content.
Respond ONLY with JSON: {"isFlagged": boolean, "reason": string|null, "confidence": number 0-1}

Text: "${text.replace(/"/g, '\\"')}"`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();
    const jsonMatch = response.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as ModerationResult;
      return parsed;
    }
  } catch (err) {
    console.error("Moderation API error:", err);
  }

  return { isFlagged: false, confidence: 0 };
}

export async function ensureContentSafe(text: string, fieldName = "content"): Promise<void> {
  const result = await moderateContent(text);
  if (result.isFlagged && result.confidence > 0.7) {
    throw new ValidationError(`${fieldName} violates community guidelines: ${result.reason || "inappropriate content"}`);
  }
}
