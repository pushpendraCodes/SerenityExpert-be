"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizePhone = normalizePhone;
exports.phoneLocal10 = phoneLocal10;
exports.phoneLookupVariants = phoneLookupVariants;
/**
 * Normalize phone to E.164-style Indian format: +91XXXXXXXXXX
 * Accepts: 9200000001 | 919200000001 | +919200000001 | 9200000001 with spaces
 */
function normalizePhone(phone) {
    const digits = phone.replace(/\D/g, "");
    if (digits.length === 10)
        return `+91${digits}`;
    if (digits.startsWith("91") && digits.length === 12)
        return `+${digits}`;
    if (phone.startsWith("+") && digits.length >= 10)
        return `+${digits}`;
    return digits ? `+${digits}` : phone.trim();
}
/** Last 10 digits — common storage format in seeds / older records */
function phoneLocal10(phone) {
    const digits = phone.replace(/\D/g, "");
    return digits.slice(-10);
}
/** All common variants for DB $or lookups */
function phoneLookupVariants(phone) {
    const normalized = normalizePhone(phone);
    const digits = phone.replace(/\D/g, "");
    const local = phoneLocal10(phone);
    const variants = new Set([
        phone.trim(),
        normalized,
        digits,
        local,
        `+${digits}`,
        `91${local}`,
        `+91${local}`,
    ]);
    return [...variants].filter(Boolean);
}
//# sourceMappingURL=phone.js.map