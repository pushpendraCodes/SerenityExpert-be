"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.moderateContent = moderateContent;
exports.ensureContentSafe = ensureContentSafe;
const generative_ai_1 = require("@google/generative-ai");
const AppError_js_1 = require("../utils/AppError.js");
const genAI = process.env.GEMINI_API_KEY
    ? new generative_ai_1.GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    : null;
async function moderateContent(text) {
    if (!genAI) {
        return { isFlagged: false, confidence: 0 };
    }
    try {
        const model = genAI.getGenerativeModel({ model: "Gemini 2 Flash" });
        const prompt = `Analyze the following text for abusive, spam, hate speech, or inappropriate content.
Respond ONLY with JSON: {"isFlagged": boolean, "reason": string|null, "confidence": number 0-1}

Text: "${text.replace(/"/g, '\\"')}"`;
        const result = await model.generateContent(prompt);
        console.log(result,'result');
        const response = result.response.text();
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return parsed;
        }
    }
    catch (err) {
        console.error("Moderation API error:", err);
    }
    return { isFlagged: false, confidence: 0 };
}
async function ensureContentSafe(text, fieldName = "content") {
    const result = await moderateContent(text);
    if (result.isFlagged && result.confidence > 0.7) {
        throw new AppError_js_1.ValidationError(`${fieldName} violates community guidelines: ${result.reason || "inappropriate content"}`);
    }
}
//# sourceMappingURL=moderation.service.js.map