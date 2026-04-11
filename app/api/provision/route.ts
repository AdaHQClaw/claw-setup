import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { generateSoul } from "@/lib/soul";
import { provisionClaw } from "@/lib/railway";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { clawName, anthropicKey, telegramToken, openaiKey, telegramUsername, personality } = body;

    if (!clawName || !anthropicKey || !telegramToken) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    // Generate SOUL.md
    const soulContent = generateSoul({
      clawName,
      purpose: personality?.purpose,
      tone: personality?.tone,
      context: personality?.context,
    });

    // Check if Railway token is configured
    if (!process.env.RAILWAY_API_TOKEN) {
      // Store the record in pending state
      const { error: dbError } = await supabaseAdmin.from("claws").insert({
        claw_name: clawName,
        telegram_username: telegramUsername,
        status: "pending_railway",
      });
      if (dbError) console.error("Supabase error:", dbError);

      return NextResponse.json({
        success: true,
        pending: true,
        message: "Your Claw has been queued. Railway setup is pending.",
      });
    }

    // Provision on Railway
    const { projectId, serviceId } = await provisionClaw({
      clawName,
      anthropicKey,
      telegramToken,
      openaiKey,
      soulContent,
    });

    // Store in Supabase
    const { error: dbError } = await supabaseAdmin.from("claws").insert({
      claw_name: clawName,
      telegram_username: telegramUsername,
      railway_project_id: projectId,
      railway_service_id: serviceId,
      status: "provisioning",
    });
    if (dbError) console.error("Supabase error:", dbError);

    return NextResponse.json({ success: true, projectId, serviceId });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Provision error:", message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
