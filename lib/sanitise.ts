// Input sanitisation helpers

export function sanitiseClawName(raw: string): string {
  return raw
    .trim()
    .replace(/[<>"'&]/g, "") // strip HTML/injection chars
    .slice(0, 30);           // hard length cap
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
