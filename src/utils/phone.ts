/**
 * Normalize phone to E.164-style Indian format: +91XXXXXXXXXX
 * Accepts: 9200000001 | 919200000001 | +919200000001 | 9200000001 with spaces
 */
export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `+91${digits}`;
  if (digits.startsWith("91") && digits.length === 12) return `+${digits}`;
  if (phone.startsWith("+") && digits.length >= 10) return `+${digits}`;
  return digits ? `+${digits}` : phone.trim();
}

/** Last 10 digits — common storage format in seeds / older records */
export function phoneLocal10(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.slice(-10);
}

/** All common variants for DB $or lookups */
export function phoneLookupVariants(phone: string): string[] {
  const normalized = normalizePhone(phone);
  const digits = phone.replace(/\D/g, "");
  const local = phoneLocal10(phone);
  const variants = new Set<string>([
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
