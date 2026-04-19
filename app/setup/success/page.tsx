"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

const STARTERS = [
  "Hi! What can you help me with?",
  "Help me write a professional email to...",
  "Summarise this for me: [paste text]",
  "Help me plan my week — here's what I've got on...",
  "Explain [thing] in simple terms",
];

function SuccessContent() {
  const searchParams = useSearchParams();
  const name = searchParams.get("name") ?? "Your assistant";
  const username = searchParams.get("username") ?? "";
  const domainFromParam = searchParams.get("domain") ?? "";
  const email = searchParams.get("email") ?? "";

  const [token, setToken] = useState<string | null>(null);
  const [domain, setDomain] = useState(domainFromParam);
  const [tokenCopied, setTokenCopied] = useState(false);
  const [copiedStarter, setCopiedStarter] = useState<number | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("claw_gateway_token");
    const storedDomain = sessionStorage.getItem("claw_domain");
    if (stored) setToken(stored);
    if (storedDomain) setDomain(storedDomain);
    sessionStorage.removeItem("claw_gateway_token");
    sessionStorage.removeItem("claw_domain");
  }, []);

  const dashboardWithToken = domain && token
    ? `https://${domain}/openclaw?token=${token}`
    : null;

  const copyToken = () => {
    if (!token) return;
    navigator.clipboard.writeText(token).then(() => {
      setTokenCopied(true);
      setTimeout(() => setTokenCopied(false), 2000);
    });
  };

  const copyStarter = (i: number, text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedStarter(i);
      setTimeout(() => setCopiedStarter(null), 1500);
    });
  };

  return (
    <main className="min-h-screen bg-gray-50">

      {/* ── Hero celebration ── */}
      <div className="bg-gradient-to-b from-violet-600 to-violet-700 text-white py-16 px-4 text-center">
        <div className="text-7xl mb-5 animate-pop inline-block">&nbsp;🎉&nbsp;</div>
        <h1 className="text-4xl font-extrabold mb-3">
          {name} is live!
        </h1>
        <p className="text-violet-200 text-lg max-w-sm mx-auto">
          Your AI assistant is booting up right now. Ready in about 2 minutes.
        </p>
        {email && (
          <p className="mt-4 text-violet-300 text-sm">
            We&apos;ve sent the dashboard link to <strong className="text-white">{email}</strong>
          </p>
        )}
      </div>

      <div className="max-w-lg mx-auto px-4 py-10 space-y-5">

        {/* ── Step 1: Telegram ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 p-5 border-b border-gray-50">
            <div className="w-8 h-8 rounded-full bg-[#229ED9] text-white text-sm font-bold flex items-center justify-center shrink-0">1</div>
            <div>
              <h2 className="font-bold text-gray-900">Open Telegram and say hello</h2>
              <p className="text-xs text-gray-500">This is where you&apos;ll chat with {name}</p>
            </div>
          </div>
          <div className="p-5">
            {username ? (
              <>
                <p className="text-sm text-gray-600 mb-4">
                  In Telegram, search for <strong className="text-[#229ED9]">@{username}</strong> and tap <strong>Start</strong>.
                  Send any message — {name} will reply once it&apos;s finished booting (~2 minutes).
                </p>
                <a
                  href={`https://t.me/${username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full bg-[#229ED9] hover:bg-[#1a8fc4] text-white font-bold py-3.5 rounded-xl text-sm transition-colors"
                >
                  Open @{username} in Telegram →
                </a>
              </>
            ) : (
              <p className="text-sm text-gray-600">Find your bot in Telegram and tap Start. It&apos;ll be ready in ~2 minutes.</p>
            )}
          </div>
        </div>

        {/* ── Step 2: Dashboard (only if token exists) ── */}
        {token && domain && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl overflow-hidden">
            <div className="flex items-center gap-3 p-5 border-b border-amber-100">
              <div className="w-8 h-8 rounded-full bg-amber-500 text-white text-sm font-bold flex items-center justify-center shrink-0">2</div>
              <div>
                <h2 className="font-bold text-amber-900">Save your dashboard access</h2>
                <p className="text-xs text-amber-700">Optional — lets you configure {name} from a browser</p>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-white border border-amber-200 rounded-xl p-4">
                <p className="text-xs font-bold text-amber-800 mb-2">Your gateway token — shown once only</p>
                <div className="flex items-center gap-2">
                  <code className="text-xs font-mono bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg flex-1 break-all leading-relaxed text-amber-900 select-all">
                    {token}
                  </code>
                  <button
                    onClick={copyToken}
                    className="shrink-0 px-3 py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-lg transition-colors"
                  >
                    {tokenCopied ? "✓" : "Copy"}
                  </button>
                </div>
                <p className="text-xs text-amber-700 mt-2">⚠️ Save this somewhere safe. We don&apos;t store it — if you lose it, you can&apos;t access the dashboard.</p>
              </div>

              {dashboardWithToken && (
                <a
                  href={dashboardWithToken}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-3 w-full bg-violet-600 hover:bg-violet-700 text-white font-bold px-5 py-3.5 rounded-xl text-sm transition-colors"
                >
                  <span>Open {name}&apos;s dashboard →</span>
                  <span className="text-violet-300 text-xs truncate max-w-[140px]">{domain}</span>
                </a>
              )}

              <p className="text-xs text-amber-700 text-center">
                We also emailed this link to {email || "you"}. Bookmark it once you&apos;re inside.
              </p>
            </div>
          </div>
        )}

        {/* ── Startup note ── */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 flex gap-4 items-start">
          <span className="text-2xl shrink-0">⏱</span>
          <div>
            <p className="font-bold text-blue-900 text-sm">First startup takes ~2 minutes</p>
            <p className="text-sm text-blue-700 mt-0.5">
              {name} is installing on a fresh server right now. After this first start, every response is instant.
            </p>
          </div>
        </div>

        {/* ── Conversation starters ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-bold text-gray-900 mb-1">What to say first 💬</h3>
          <p className="text-sm text-gray-500 mb-4">Tap to copy any of these and paste into Telegram</p>
          <div className="space-y-2">
            {STARTERS.map((s, i) => (
              <button
                key={i}
                onClick={() => copyStarter(i, s)}
                className={`w-full text-left text-sm px-4 py-3 rounded-xl border-2 transition-all
                  ${copiedStarter === i
                    ? "border-green-300 bg-green-50 text-green-800"
                    : "border-gray-100 hover:border-violet-200 hover:bg-violet-50 text-gray-600"}`}
              >
                <span className="mr-2">{copiedStarter === i ? "✓" : "📋"}</span>
                {copiedStarter === i ? "Copied!" : s}
              </button>
            ))}
          </div>
        </div>

        {/* ── Privacy reminder ── */}
        <div className="bg-gray-50 rounded-2xl border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-700 text-sm mb-3">🔒 Your privacy</h3>
          <ul className="space-y-2 text-sm text-gray-500">
            <li>• {name} runs on its own private server — nobody else can access it</li>
            <li>• Your API keys live only inside your Claw — we never see them</li>
            <li>• AI costs go straight to your Anthropic account (typically £1–5/month)</li>
          </ul>
        </div>

        {/* ── Footer ── */}
        <div className="text-center pt-2 pb-4">
          <Link
            href="/setup"
            className="text-sm text-gray-400 hover:text-violet-600 transition-colors"
          >
            Set up another Claw
          </Link>
          <span className="mx-3 text-gray-200">·</span>
          <Link href="/" className="text-sm text-gray-400 hover:text-violet-600 transition-colors">
            Back to home
          </Link>
        </div>

      </div>
    </main>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">🎉</div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
