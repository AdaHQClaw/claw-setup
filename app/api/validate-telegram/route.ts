import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { botToken } = await req.json();
    if (!botToken || typeof botToken !== "string") {
      return NextResponse.json({ valid: false, error: "No token provided" }, { status: 400 });
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
