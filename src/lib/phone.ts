// Matches src/content/validate.ts's INDIA_PHONE_RE intent (a valid Indian
// mobile in +91 international format) but tolerant of how a person actually
// types into a form field: optional +91/91 prefix, optional spaces, a
// 10-digit number starting 6-9. Normalized to '+91 XXXXX XXXXX' for the
// outgoing WhatsApp/email message regardless of how it was typed.
const PHONE_INPUT_RE = /^(?:\+?91[\s-]?)?([6-9]\d{4})[\s-]?(\d{5})$/;

export function normalizePhone(raw: string): string | null {
  const match = PHONE_INPUT_RE.exec(raw.trim());
  if (!match) return null;
  return `+91 ${match[1]} ${match[2]}`;
}
