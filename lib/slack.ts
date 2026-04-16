/**
 * Slack notifications for claw-setup events.
 * Requires SLACK_WEBHOOK_URL env var (incoming webhook URL).
 * If not set, all calls are silent no-ops.
 */

interface NewClawData {
  clawName: string;
  email?: string | null;
  firstName?: string | null;
  telegramUsername?: string | null;
  domain: string;
}

export async function notifyNewClaw(data: NewClawData): Promise<void> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl || webhookUrl === "pending") return;

  const { clawName, email, firstName, telegramUsername, domain } = data;
  const now = new Date().toUTCString();

  const body = {
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: "🎉 New Claw provisioned!",
          emoji: true,
        },
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*Name*\n${clawName}`,
          },
          {
            type: "mrkdwn",
            text: `*Person*\n${firstName || "not provided"}`,
          },
          {
            type: "mrkdwn",
            text: `*Email*\n${email || "not provided"}`,
          },
          {
            type: "mrkdwn",
            text: `*Telegram*\n${telegramUsername ? `@${telegramUsername}` : "not provided"}`,
          },
          {
            type: "mrkdwn",
            text: `*Railway domain*\n<https://${domain}|${domain}>`,
          },
          {
            type: "mrkdwn",
            text: `*Time*\n${now}`,
          },
        ],
      },
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: "via claw-setup · <https://claw-setup-sigma.vercel.app/admin|Admin dashboard>",
          },
        ],
      },
    ],
  };

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    // Fire-and-forget — never break the provision flow
  }
}
