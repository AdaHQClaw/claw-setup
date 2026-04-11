import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { apiKey } = await req.json();
    if (!apiKey || typeof apiKey !== "string") {
      return NextResponse.json({ valid: false, error: "No key provided" }, { status: 400 });
    }

    // Make a minimal Anthropic API call to verify the key
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

    // 200 = valid, 401 = bad key, 400 = bad request (key format ok but params wrong — still valid key)
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
