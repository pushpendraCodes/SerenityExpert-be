"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.slugify = slugify;
exports.generateQuestionSlug = generateQuestionSlug;
exports.parseSlugIdSuffix = parseSlugIdSuffix;
/** Convert text to URL-safe slug segment */
function slugify(text) {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_]+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 72);
}
/** Quora-style slug: question-title-abc123 (suffix from id for uniqueness) */
function generateQuestionSlug(title, id) {
    const base = slugify(title) || "question";
    const suffix = id.slice(-6).toLowerCase();
    return `${base}-${suffix}`;
}
/** Last 6 hex chars from slug URL (e.g. how-to-cope-abc123 → abc123) */
function parseSlugIdSuffix(slug) {
    const match = slug.match(/-([a-f0-9]{6})$/i);
    return match ? match[1].toLowerCase() : null;
}
//# sourceMappingURL=slug.js.map