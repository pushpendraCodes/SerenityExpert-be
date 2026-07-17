import OpenAI from "openai";
import { ValidationError } from "../utils/AppError.js";

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY.trim() })
  : null;

export interface ModerationResult {
  isFlagged: boolean;
  reason?: string;
  confidence: number;
}

/** Map OpenAI moderation category keys to readable labels */
const CATEGORY_LABELS: Record<string, string> = {
  hate: "hate speech",
  "hate/threatening": "threatening hate speech",
  harassment: "harassment",
  "harassment/threatening": "threatening harassment",
  self_harm: "self-harm",
  "self-harm/intent": "self-harm intent",
  "self-harm/instructions": "self-harm instructions",
  sexual: "sexual content",
  "sexual/minors": "sexual content involving minors",
  violence: "violence",
  "violence/graphic": "graphic violence",
  illicit: "illicit activity",
  "illicit/violent": "violent illicit activity",
};

/**
 * Moderate text with OpenAI Moderation API.
 * @param failOpen — if true, API errors return "not flagged" (used for user-facing posts so outages don't block posting)
 */
export async function moderateContent(
  text: string,
  { failOpen = false }: { failOpen?: boolean } = {}
): Promise<ModerationResult> {
  if (!openai) {
    console.warn("OPENAI_API_KEY not set — skipping AI moderation");
    return { isFlagged: false, confidence: 0 };
  }

  const input = text.trim();
  if (!input) {
    return { isFlagged: false, confidence: 0 };
  }

  try {
    const response = await openai.moderations.create({
      model: "omni-moderation-latest",
      input,
    });

    const result = response.results[0];
    if (!result) {
      return { isFlagged: false, confidence: 0 };
    }

    const flaggedCategories = Object.entries(result.categories)
      .filter(([, flagged]) => flagged)
      .map(([key]) => CATEGORY_LABELS[key] || key);

    const scores = Object.values(result.category_scores);
    const confidence = scores.length > 0 ? Math.max(...scores) : 0;

    return {
      isFlagged: result.flagged,
      reason: flaggedCategories.length > 0 ? flaggedCategories.join(", ") : undefined,
      confidence: Number(confidence.toFixed(3)),
    };
  } catch (err) {
    console.error("Moderation API error:", err);
    if (failOpen) {
      return { isFlagged: false, confidence: 0 };
    }
    const message =
      err instanceof Error ? err.message : "OpenAI moderation request failed";
    throw new ValidationError(`AI moderation failed: ${message}`);
  }
}

export async function ensureContentSafe(text: string, fieldName = "content"): Promise<void> {
  // Fail open on API errors so community posting isn't blocked by OpenAI outages
  const result = await moderateContent(text, { failOpen: true });
  if (result.isFlagged && result.confidence > 0.7) {
    throw new ValidationError(
      `${fieldName} violates community guidelines: ${result.reason || "inappropriate content"}`
    );
  }
}
