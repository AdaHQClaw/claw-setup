import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, cleanStore } from "@/lib/ratelimit";
import { isValidTelegramToken } from "@/lib/sanitise";

function getClientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim() || req.headers.get("x-real-ip") || "unknown";
}

export async function POST(req: NextRequest) {
  cleanStore();
  const { allowed } = checkRateLimit(`validate-telegram:${getClientIp(req)}`);
  if (!allowed) {
    return NextResponse.json({ valid: false, error: "Too many attempts. Please wait before trying again." }, { status: 429 });
  }

  try {
    const { botToken } = await req.json();
    if (!botToken || !isValidTelegramToken(botToken)) {
      return NextResponse.json({ valid: false, error: "Invalid bot token format. Copy it directly from @BotFather." }, { status: 400 });
    }

    const res = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
    const data = await res.json();

    if (data.ok) {
      return NextResponse.json({
        valid: true,
        username: data.result.username,
        firstName: data.result.first_name,
      });
    }

    return NextResponse.json({
      valid: false,
      error: "Invalid bot token. Go back to @BotFather and copy the token it gave you.",
    });
  } catch {
    return NextResponse.json({ valid: false, error: "Network error. Please try again." }, { status: 500 });
  }
}
