// Input sanitisation helpers

/** Escape a string for safe interpolation into an HTML context.
 *  Replaces the five HTML-special chars with their named entities. */
export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

export function sanitiseClawName(raw: string): string {
  return raw
    .trim()
    .replace(/[<>"'&]/g, "") // strip HTML/injection chars
    .slice(0, 30);           // hard length cap
}

export function sanitiseFirstName(raw: string): string {
  return raw
    .trim()
    .replace(/[<>"'&]/g, "")
    .slice(0, 50);
}

export function sanitiseTelegramUsername(raw: string): string {
  // Strip @ prefix if present, allow only alphanumeric + underscore
  return raw
    .replace(/^@/, "")
    .replace(/[^a-zA-Z0-9_]/g, "")
    .slice(0, 32);
}

/** Truncate personality fields — no HTML chars stripped (goes into SOUL.md not HTML),
 *  but length-capped to prevent payload bloat. */
export function sanitisePersonalityField(raw: string | undefined | null): string {
  if (!raw) return "";
  return String(raw).slice(0, 500);
}

export function sanitiseProjectName(clawName: string): string {
  return clawName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")     // collapse multiple dashes
    .replace(/^-|-$/g, "")   // strip leading/trailing dashes
    .slice(0, 20) || "claw"; // fallback if empty
}

export function isValidAnthropicKey(key: string): boolean {
  return typeof key === "string" && /^sk-ant-[a-zA-Z0-9_-]{20,}$/.test(key);
}

export function isValidTelegramToken(token: string): boolean {
  return typeof token === "string" && /^\d{8,12}:[A-Za-z0-9_-]{35}$/.test(token);
}

export function isValidEmail(email: string): boolean {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}
