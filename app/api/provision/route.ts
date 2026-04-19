import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { generateSoul } from "@/lib/soul";
import { provisionClaw } from "@/lib/railway";
import { ensureMigration } from "@/lib/migrate";
import { checkRateLimit, cleanStore } from "@/lib/ratelimit";
import { sanitiseClawName, sanitiseTelegramUsername, sanitisePersonalityField, escapeHtml, isValidAnthropicKey, isValidTelegramToken, isValidEmail } from "@/lib/sanitise";
import { notifyNewClaw } from "@/lib/slack";

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
    const { clawName: rawClawName, firstName: rawFirstName, anthropicKey, telegramToken, openaiKey, telegramUsername: rawTelegramUsername, personality, email } = body;

    // --- Sanitise all user inputs server-side (client-side limits are bypass-able) ---
    const firstName = (rawFirstName ?? "").toString().trim().replace(/[<>"'&]/g, "").slice(0, 50);
    const clawName = sanitiseClawName(rawClawName ?? "");
    // telegramUsername comes from the client (originally from getMe, but could be tampered)
    const telegramUsername = sanitiseTelegramUsername((rawTelegramUsername ?? "").toString());
    // Personality fields go into SOUL.md — cap length to prevent payload bloat
    const sanitisedPersonality = {
      purpose: sanitisePersonalityField(personality?.purpose),
      tone: typeof personality?.tone === "string" ? personality.tone : "friendly",
      context: sanitisePersonalityField(personality?.context),
    };

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
      purpose: sanitisedPersonality.purpose,
      tone: sanitisedPersonality.tone,
      context: sanitisedPersonality.context,
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

    // --- Slack notification (fire-and-forget) ---
    notifyNewClaw({ clawName, email, firstName, telegramUsername, domain }).catch(() => {});

    // --- Send confirmation email with tokenized dashboard link (fire-and-forget) ---
    if (email) {
      const dashboardUrl = `https://${domain}/openclaw?token=${gatewayToken}`;
      // Escape all user-controlled values before inserting into HTML to prevent XSS.
      // clawName and firstName come from sanitiseClawName / sanitiseFirstName (strips <>"'&)
      // but we apply escapeHtml as a belt-and-suspenders layer.
      const safeClawName = escapeHtml(clawName);
      const safeFirstName = escapeHtml(firstName);
      const safeTelegramUsername = escapeHtml(telegramUsername);
      // dashboardUrl is constructed from our own domain + a cryptographically random token —
      // no user input in the URL except via the Railway domain we created, which is safe.
      const emailHtml = `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f5f3ff;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif">
<div style="max-width:600px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.10)">
  <div style="background:linear-gradient(135deg,#7c3aed,#6d28d9);padding:28px 40px">
    <h1 style="margin:0;color:#fff;font-size:22px;font-weight:800">${safeClawName} is deploying! 🎉</h1>
    <p style="margin:6px 0 0;color:#ddd6fe;font-size:13px">Your personal AI assistant — powered by OpenClaw</p>
  </div>
  <div style="padding:36px 40px">
    <p style="font-size:15px;color:#374151;line-height:1.8">Hi${safeFirstName ? ` ${safeFirstName}` : ""},</p>
    <p style="font-size:15px;color:#374151;line-height:1.8">${safeClawName} is being set up on your private server right now. It'll be ready in about 2 minutes.</p>
    <p style="font-size:15px;color:#374151;line-height:1.8"><strong>Your dashboard link (bookmark this):</strong></p>
    <div style="text-align:center;margin:24px 0">
      <a href="${dashboardUrl}" style="background:linear-gradient(135deg,#7c3aed,#6d28d9);color:#fff;text-decoration:none;padding:14px 28px;border-radius:10px;font-size:16px;font-weight:700;display:inline-block">Open ${safeClawName}&apos;s Dashboard &rarr;</a>
    </div>
    <p style="font-size:13px;color:#9ca3af;line-height:1.6;word-break:break-all">Or copy this link: <a href="${dashboardUrl}" style="color:#7c3aed">${dashboardUrl}</a></p>
    <p style="font-size:14px;color:#6b7280;line-height:1.7;background:#f9fafb;border-radius:8px;padding:12px 16px;margin:20px 0">This link has your access token built in. Click it and you're connected — no manual entry needed. <strong>Save it somewhere safe.</strong></p>
    ${safeTelegramUsername ? `<p style="font-size:15px;color:#374151;line-height:1.8">You can also chat with ${safeClawName} directly on Telegram: <strong>@${safeTelegramUsername}</strong></p>` : ""}
    <p style="font-size:15px;color:#374151;line-height:1.8;margin-top:28px">— The AdaHQ team<br>
    <span style="color:#9ca3af;font-size:13px"><a href="https://adahq.ai" style="color:#7c3aed;text-decoration:none">adahq.ai</a></span></p>
  </div>
  <div style="background:#fafafa;border-top:1px solid #ede9fe;padding:16px 40px;text-align:center">
    <p style="margin:0;color:#9ca3af;font-size:12px">Sent by AdaHQ · adahq.ai</p>
  </div>
</div>
</body></html>`;

      const emailText = `Hi${firstName ? ` ${firstName}` : ""},\n\n${clawName} is deploying and will be ready in ~2 minutes.\n\nYour dashboard link (bookmark this):\n${dashboardUrl}\n\nThis link has your access token built in — just click it to connect, no manual entry needed. Save it somewhere safe.\n${telegramUsername ? `\nYou can also chat with ${clawName} on Telegram: @${telegramUsername}\n` : ""}\n— The AdaHQ team\nadahq.ai`;

      fetch("https://adahq.ai/api/internal/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-internal-secret": process.env.INTERNAL_API_SECRET ?? "",
        },
        body: JSON.stringify({
          to: email,
          subject: `${clawName} is deploying — here's your dashboard link`,
          html: emailHtml,
          text: emailText,
        }),
      }).catch(() => {});
    }

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
