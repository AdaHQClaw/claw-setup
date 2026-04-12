import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { generateSoul } from "@/lib/soul";
import { provisionClaw } from "@/lib/railway";
import { ensureMigration } from "@/lib/migrate";
import { checkRateLimit, cleanStore } from "@/lib/ratelimit";
import { sanitiseClawName, isValidAnthropicKey, isValidTelegramToken, isValidEmail } from "@/lib/sanitise";

// Provision timeout: 45 seconds. Railway usually responds in ~10s but can be slow.
const PROVISION_TIMEOUT_MS = 45_000;

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function POST(req: NextRequest) {
  // --- Rate limiting ---
  cleanStore();
  const ip = getClientIp(req);
  const { allowed, retryAfterSeconds } = checkRateLimit(ip);
  if (!allowed) {
    return NextResponse.json(
      { success: false, error: `Too many requests. Try again in ${Math.ceil(retryAfterSeconds / 60)} minutes.` },
      {
        status: 429,
        headers: { "Retry-After": String(retryAfterSeconds) },
      }
    );
  }

  try {
    const body = await req.json();
    const { clawName: rawClawName, firstName: rawFirstName, anthropicKey, telegramToken, openaiKey, telegramUsername, personality, email } = body;
    const firstName = (rawFirstName ?? "").toString().trim().replace(/[<>"'&]/g, "").slice(0, 50);

    // --- Input validation ---
    const clawName = sanitiseClawName(rawClawName ?? "");

    if (!clawName || clawName.length < 2) {
      return NextResponse.json({ success: false, error: "Name must be at least 2 characters." }, { status: 400 });
    }
    if (!anthropicKey || !isValidAnthropicKey(anthropicKey)) {
      return NextResponse.json({ success: false, error: "Invalid Anthropic API key format." }, { status: 400 });
    }
    if (!telegramToken || !isValidTelegramToken(telegramToken)) {
      return NextResponse.json({ success: false, error: "Invalid Telegram bot token format." }, { status: 400 });
    }
    if (email && !isValidEmail(email)) {
      return NextResponse.json({ success: false, error: "Invalid email address." }, { status: 400 });
    }

    // --- DB check ---
    await ensureMigration();

    // --- Generate SOUL.md ---
    const soulContent = generateSoul({
      clawName,
      purpose: personality?.purpose,
      tone: personality?.tone,
      context: personality?.context,
    });

    if (!process.env.RAILWAY_API_TOKEN) {
      await supabaseAdmin.from("claws").insert({
        claw_name: clawName,
        first_name: firstName || null,
        email: email ?? null,
        telegram_username: telegramUsername ?? null,
        status: "pending_setup",
      }).throwOnError();

      return NextResponse.json(
        { success: false, error: "Provisioning is not yet configured. Please contact support." },
        { status: 503 }
      );
    }

    // --- Provision on Railway with timeout ---
    const provisionPromise = provisionClaw({
      clawName,
      anthropicKey,
      telegramToken,
      openaiKey,
      soulContent,
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Provisioning timed out. Please try again.")), PROVISION_TIMEOUT_MS)
    );

    const { projectId, serviceId, domain, gatewayToken } = await Promise.race([
      provisionPromise,
      timeoutPromise,
    ]);

    // --- Store metadata in Supabase ---
    // NOTE: API keys are NOT stored here. They live only inside the user's Railway project.
    // gateway_token is stored hashed (sha256) — we never need to recover the plaintext,
    // only verify it if needed for support.
    const { createHash } = await import("crypto");
    const gatewayTokenHash = createHash("sha256").update(gatewayToken).digest("hex");

    await supabaseAdmin.from("claws").insert({
      claw_name: clawName,
      first_name: firstName || null,
      email: email ?? null,
      telegram_username: telegramUsername ?? null,
      railway_project_id: projectId,
      railway_service_id: serviceId,
      railway_domain: domain,
      gateway_token_hash: gatewayTokenHash,
      status: "provisioning",
    }).throwOnError();

    // --- Return token to client ---
    // Token is returned once here so the user can save it.
    // It is NOT stored in plaintext anywhere on our side.
    return NextResponse.json({
      success: true,
      domain,
      gatewayToken, // shown once on success screen — user must save it
      botUsername: telegramUsername,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    // Don't log the full error in case it contains key fragments
    console.error("Provision error:", message.slice(0, 200));
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
