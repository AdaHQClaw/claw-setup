import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { generateSoul } from "@/lib/soul";
import { provisionClaw } from "@/lib/railway";
import { ensureMigration } from "@/lib/migrate";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { clawName, anthropicKey, telegramToken, openaiKey, telegramUsername, personality } = body;

    if (!clawName || !anthropicKey || !telegramToken) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    // Ensure the database table exists
    await ensureMigration();

    // Generate SOUL.md
    const soulContent = generateSoul({
      clawName,
      purpose: personality?.purpose,
      tone: personality?.tone,
      context: personality?.context,
    });

    if (!process.env.RAILWAY_API_TOKEN) {
      // Store in pending state and inform user
      await supabaseAdmin.from("claws").insert({
        claw_name: clawName,
        telegram_username: telegramUsername,
        status: "pending_setup",
      }).throwOnError();

      return NextResponse.json({
        success: false,
        error: "Railway provisioning is not yet configured. Please contact support.",
      }, { status: 503 });
    }

    // Provision on Railway
    const { projectId, serviceId, domain, gatewayToken } = await provisionClaw({
      clawName,
      anthropicKey,
      telegramToken,
      openaiKey,
      soulContent,
    });

    // Store in Supabase — no API keys stored here, only metadata
    await supabaseAdmin.from("claws").insert({
      claw_name: clawName,
      telegram_username: telegramUsername,
      railway_project_id: projectId,
      railway_service_id: serviceId,
      railway_domain: domain,
      gateway_token: gatewayToken,
      status: "provisioning",
    }).throwOnError();

    return NextResponse.json({
      success: true,
      domain,
      botUsername: telegramUsername,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Provision error:", message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
