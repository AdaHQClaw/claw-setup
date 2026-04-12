import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, cleanStore } from "@/lib/ratelimit";
import { isValidAnthropicKey } from "@/lib/sanitise";

function getClientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim() || req.headers.get("x-real-ip") || "unknown";
}

export async function POST(req: NextRequest) {
  cleanStore();
  const { allowed } = checkRateLimit(`validate-anthropic:${getClientIp(req)}`);
  if (!allowed) {
    return NextResponse.json({ valid: false, error: "Too many attempts. Please wait before trying again." }, { status: 429 });
  }

  try {
    const { apiKey } = await req.json();
    if (!apiKey || !isValidAnthropicKey(apiKey)) {
      return NextResponse.json({ valid: false, error: "Invalid API key format. Anthropic keys start with sk-ant-" }, { status: 400 });
    }

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5",
        max_tokens: 1,
        messages: [{ role: "user", content: "hi" }],
      }),
    });

    if (res.status === 200 || res.status === 400) {
      return NextResponse.json({ valid: true });
    }
    if (res.status === 401) {
      return NextResponse.json({ valid: false, error: "Invalid API key — please check and try again." });
    }

    return NextResponse.json({ valid: false, error: "Could not verify key. Please try again." });
  } catch {
    return NextResponse.json({ valid: false, error: "Network error. Please try again." }, { status: 500 });
  }
}
