import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { generateSoul } from "@/lib/soul";
import { provisionClaw } from "@/lib/railway";
import { ensureMigration } from "@/lib/migrate";
import { checkRateLimit, cleanStore } from "@/lib/ratelimit";
import { sanitiseClawName, sanitiseTelegramUsername, sanitisePersonalityField, escapeHtml, isValidAnthropicKey, isValidTelegramToken, isValidEmail } from "@/lib/sanitise";
import { notifyNewClaw } from "@/lib/slack";

// Tell Vercel this function can run up to 60 seconds (Pro plan max for serverless).
// Railway provisioning takes 10–45s. Without this, Vercel cuts us at 10s default.
export const maxDuration = 60;

// Hard cap on active Railway projects under this account.
// Railway provisions one project per user under a shared account.
// Once this limit is reached, new signups are logged as waitlist.
// Increase once we move to per-user Railway accounts.
const MAX_ACTIVE_CLAWS = 50;

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

function buildEmailHtml(params: {
  clawName: string;
  firstName: string;
  telegramUsername: string;
  dashboardUrl: string;
}): string {
  const { clawName, firstName, telegramUsername, dashboardUrl } = params;
  const safeClawName = escapeHtml(clawName);
  const safeFirstName = escapeHtml(firstName);
  const safeTelegramUsername = escapeHtml(telegramUsername);

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f5f3ff;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif">
<div style="max-width:600px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.10)">
  <div style="background:linear-gradient(135deg,#7c3aed,#6d28d9);padding:28px 40px">
    <h1 style="margin:0;color:#fff;font-size:22px;font-weight:800">${safeClawName} is deploying! 🎉</h1>
    <p style="margin:6px 0 0;color:#ddd6fe;font-size:13px">Your personal AI assistant — powered by OpenClaw</p>
  </div>
  <div style="padding:36px 40px">
    <p style="font-size:15px;color:#374151;line-height:1.8">Hi${safeFirstName ? ` ${safeFirstName}` : ""},</p>
    <p style="font-size:15px;color:#374151;line-height:1.8">${safeClawName} is being set up right now. It&apos;ll be ready in about 2 minutes.</p>
    <p style="font-size:15px;color:#374151;line-height:1.8"><strong>Step 1 — Open Telegram and say hello:</strong></p>
    ${safeTelegramUsername ? `<p style="font-size:15px;color:#374151;line-height:1.8;background:#f0fdf4;border-radius:8px;padding:12px 16px;margin:8px 0">Search for <strong>@${safeTelegramUsername}</strong> in Telegram and tap Start. Wait ~2 minutes then send any message.</p>` : ""}
    <p style="font-size:15px;color:#374151;line-height:1.8;margin-top:20px"><strong>Step 2 — Bookmark your dashboard (optional):</strong></p>
    <div style="text-align:center;margin:16px 0 8px">
      <a href="${dashboardUrl}" style="background:linear-gradient(135deg,#7c3aed,#6d28d9);color:#fff;text-decoration:none;padding:14px 28px;border-radius:10px;font-size:15px;font-weight:700;display:inline-block">Open ${safeClawName}&apos;s Dashboard &rarr;</a>
    </div>
    <p style="font-size:12px;color:#9ca3af;text-align:center;word-break:break-all"><a href="${dashboardUrl}" style="color:#7c3aed">${dashboardUrl}</a></p>
    <p style="font-size:13px;color:#6b7280;line-height:1.7;background:#f9fafb;border-radius:8px;padding:12px 16px;margin:16px 0">This link has your access token built in. <strong>Bookmark it</strong> — if you lose it you&apos;ll need to contact support.</p>
    <p style="font-size:13px;color:#9ca3af;line-height:1.6;margin-top:24px">— The AdaHQ team &middot; <a href="https://adahq.ai" style="color:#7c3aed;text-decoration:none">adahq.ai</a></p>
  </div>
  <div style="background:#fafafa;border-top:1px solid #ede9fe;padding:16px 40px;text-align:center">
    <p style="margin:0;color:#9ca3af;font-size:12px">Sent by AdaHQ &middot; adahq.ai</p>
  </div>
</div>
</body></html>`;
}

async function sendConfirmationEmail(params: {
  to: string;
  clawName: string;
  firstName: string;
  telegramUsername: string;
  dashboardUrl: string;
}): Promise<void> {
  const { to, clawName, firstName, telegramUsername, dashboardUrl } = params;
  const html = buildEmailHtml({ clawName, firstName, telegramUsername, dashboardUrl });
  const text = `Hi${firstName ? ` ${firstName}` : ""},\n\n${clawName} is deploying and will be ready in ~2 minutes.\n\n1. Open Telegram and search for @${telegramUsername || "your bot"}. Tap Start and wait ~2 minutes.\n\n2. Your dashboard link (bookmark this):\n${dashboardUrl}\n\nThis link has your access token built in — bookmark it.\n\n— The AdaHQ team\nadahq.ai`;

  await fetch("https://adahq.ai/api/internal/send-email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-internal-secret": process.env.INTERNAL_API_SECRET ?? "",
    },
    body: JSON.stringify({
      to,
      subject: `${clawName} is deploying — here's your access link`,
      html,
      text,
    }),
  });
}

export async function POST(req: NextRequest) {
  // --- Rate limiting ---
  cleanStore();
  const ip = getClientIp(req);
  const { allowed, retryAfterSeconds } = checkRateLimit(ip);
  if (!allowed) {
    return NextResponse.json(
      { success: false, error: `Too many requests. Try again in ${Math.ceil(retryAfterSeconds / 60)} minutes.` },
      { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
    );
  }

  try {
    const body = await req.json();
    const {
      clawName: rawClawName,
      firstName: rawFirstName,
      anthropicKey,
      telegramToken,
      openaiKey,
      telegramUsername: rawTelegramUsername,
      personality,
      email,
    } = body;

    // --- Server-side sanitisation (client-side limits are bypass-able) ---
    const firstName = (rawFirstName ?? "").toString().trim().replace(/[<>"'&]/g, "").slice(0, 50);
    const clawName = sanitiseClawName(rawClawName ?? "");
    const telegramUsername = sanitiseTelegramUsername((rawTelegramUsername ?? "").toString());
    const sanitisedPersonality = {
      purpose: sanitisePersonalityField(personality?.purpose),
      tone: typeof personality?.tone === "string" ? personality.tone : "friendly",
      context: sanitisePersonalityField(personality?.context),
    };

    // --- Input validation ---
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

    // --- Duplicate Telegram bot detection ---
    // A bot token can only be polled by one gateway at a time.
    // If two Claws use the same token, the second one silently never receives messages.
    if (telegramUsername) {
      const { data: existingBot } = await supabaseAdmin
        .from("claws")
        .select("id, status")
        .eq("telegram_username", telegramUsername)
        .neq("status", "failed")
        .maybeSingle();

      if (existingBot) {
        return NextResponse.json({
          success: false,
          error: `This Telegram bot (@${telegramUsername}) is already connected to a Claw. Each bot can only be used once. Create a new bot via @BotFather and try again.`,
        }, { status: 409 });
      }
    }

    // --- Active Claw cap ---
    // Prevents unbounded Railway project creation under a shared account.
    const { count } = await supabaseAdmin
      .from("claws")
      .select("id", { count: "exact", head: true })
      .neq("status", "failed");

    if ((count ?? 0) >= MAX_ACTIVE_CLAWS) {
      // Log as waitlist
      await supabaseAdmin.from("claws").insert({
        claw_name: clawName,
        first_name: firstName || null,
        email: email ?? null,
        telegram_username: telegramUsername || null,
        status: "waitlist",
      });

      // Notify Jamie
      notifyNewClaw({ clawName, email, firstName, telegramUsername, domain: "WAITLISTED" }).catch(() => {});

      return NextResponse.json({
        success: false,
        error: "We've hit our capacity limit for this week. We've added you to the waitlist and will email you as soon as a spot opens up.",
        waitlist: true,
      }, { status: 503 });
    }

    // --- Railway token check ---
    if (!process.env.RAILWAY_API_TOKEN) {
      await supabaseAdmin.from("claws").insert({
        claw_name: clawName,
        first_name: firstName || null,
        email: email ?? null,
        telegram_username: telegramUsername || null,
        status: "pending_setup",
      });
      return NextResponse.json(
        { success: false, error: "Provisioning is not configured. Please contact support@adahq.ai." },
        { status: 503 }
      );
    }

    // --- Generate SOUL.md ---
    const soulContent = generateSoul({
      clawName,
      purpose: sanitisedPersonality.purpose,
      tone: sanitisedPersonality.tone,
      context: sanitisedPersonality.context,
    });

    // --- Provision on Railway ---
    // maxDuration = 60s is set at the top of this file.
    // Railway typically responds in 10–20s. We wait up to 55s before giving up.
    const PROVISION_TIMEOUT_MS = 55_000;
    const provisionPromise = provisionClaw({
      clawName,
      anthropicKey,
      telegramToken,
      openaiKey,
      soulContent,
    });
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Provisioning is taking longer than expected. We've saved your details — check your email in a few minutes.")), PROVISION_TIMEOUT_MS)
    );

    const { projectId, serviceId, domain, gatewayToken } = await Promise.race([
      provisionPromise,
      timeoutPromise,
    ]);

    // --- Store metadata ---
    // API keys are NOT stored. Only hashed gateway token for support purposes.
    const { createHash } = await import("crypto");
    const gatewayTokenHash = createHash("sha256").update(gatewayToken).digest("hex");

    await supabaseAdmin.from("claws").insert({
      claw_name: clawName,
      first_name: firstName || null,
      email: email ?? null,
      telegram_username: telegramUsername || null,
      railway_project_id: projectId,
      railway_service_id: serviceId,
      railway_domain: domain,
      gateway_token_hash: gatewayTokenHash,
      status: "provisioning",
    }).throwOnError();

    // --- Slack notification (fire-and-forget) ---
    notifyNewClaw({ clawName, email, firstName, telegramUsername, domain }).catch(() => {});

    // --- Confirmation email (fire-and-forget) ---
    if (email) {
      const dashboardUrl = `https://${domain}/openclaw?token=${gatewayToken}`;
      sendConfirmationEmail({
        to: email,
        clawName,
        firstName,
        telegramUsername,
        dashboardUrl,
      }).catch(() => {});
    }

    // --- Return to client ---
    // gatewayToken is shown once on the success page. We don't store it in plaintext.
    return NextResponse.json({
      success: true,
      domain,
      gatewayToken,
      botUsername: telegramUsername,
    });

  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    // Truncate to avoid leaking any key fragments in logs
    console.error("Provision error:", message.slice(0, 200));
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
