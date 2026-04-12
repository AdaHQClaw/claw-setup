"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function SuccessContent() {
  const searchParams = useSearchParams();
  const name = searchParams.get("name") ?? "Your Claw";
  const username = searchParams.get("username") ?? "";
  const domainFromParam = searchParams.get("domain") ?? "";

  const [token, setToken] = useState<string | null>(null);
  const [domain, setDomain] = useState(domainFromParam);
  const [tokenCopied, setTokenCopied] = useState(false);

  useEffect(() => {
    // Read token from sessionStorage — never from URL params.
    // sessionStorage is tab-scoped and never sent to servers.
    const stored = sessionStorage.getItem("claw_gateway_token");
    const storedDomain = sessionStorage.getItem("claw_domain");
    if (stored) setToken(stored);
    if (storedDomain) setDomain(storedDomain);
    // Clear after reading — show once, then gone
    // (user should save it; we don't store plaintext on our side)
    sessionStorage.removeItem("claw_gateway_token");
    sessionStorage.removeItem("claw_domain");
  }, []);

  const copyToken = () => {
    if (!token) return;
    navigator.clipboard.writeText(token).then(() => {
      setTokenCopied(true);
      setTimeout(() => setTokenCopied(false), 2000);
    });
  };

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-16">
      <div className="max-w-lg mx-auto text-center">
        <div className="text-7xl mb-6">🎉</div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          {name} is deploying!
        </h1>
        <p className="text-xl text-gray-500 mb-10">
          Your AI assistant is being set up. It&apos;ll be ready in about 2 minutes.
        </p>

        {/* Primary action: Telegram */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-6 text-left">
          <h2 className="font-bold text-gray-900 text-lg mb-4">👇 Next step</h2>
          {username ? (
            <div className="space-y-3 text-gray-600">
              <p>Open Telegram and search for <strong className="text-indigo-600">@{username}</strong></p>
              <p>Wait ~2 minutes for the first startup, then tap <strong>Start</strong> and say hello.</p>
            </div>
          ) : (
            <p className="text-gray-600">Open Telegram, find the bot you created with @BotFather, wait ~2 minutes for startup, then tap Start.</p>
          )}
        </div>

        {/* Gateway token — shown once, read from sessionStorage */}
        {token && domain && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-6 text-left">
            <h3 className="font-semibold text-amber-900 mb-1">🔑 Save your dashboard token</h3>
            <p className="text-sm text-amber-700 mb-4">
              This is shown <strong>once only</strong> — we don&apos;t store it. Save it somewhere safe if you want to access your dashboard later.
            </p>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-amber-600 uppercase tracking-wide mb-1">Dashboard URL</p>
                <a
                  href={`https://${domain}/openclaw`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-indigo-600 underline break-all"
                >
                  https://{domain}/openclaw
                </a>
              </div>
              <div>
                <p className="text-xs text-amber-600 uppercase tracking-wide mb-1">Gateway token</p>
                <div className="flex items-center gap-2">
                  <code className="text-xs bg-white border border-amber-200 px-3 py-2 rounded-lg flex-1 break-all font-mono">
                    {token}
                  </code>
                  <button
                    onClick={copyToken}
                    className="shrink-0 px-3 py-2 bg-amber-100 hover:bg-amber-200 text-amber-800 text-xs font-medium rounded-lg transition-colors"
                  >
                    {tokenCopied ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 mb-6 text-left">
          <h3 className="font-semibold text-amber-900 mb-2">⏱ First startup takes ~2 minutes</h3>
          <p className="text-sm text-amber-700">
            {name} is being installed on a fresh server. After the first startup, responses are instant.
          </p>
        </div>

        <div className="bg-indigo-50 rounded-2xl p-6 mb-8 text-left">
          <h3 className="font-semibold text-indigo-900 mb-2">💡 Good to know</h3>
          <ul className="space-y-2 text-sm text-indigo-700">
            <li>• {name} runs 24/7 on Railway — always on</li>
            <li>• AI costs come from your Anthropic account (a few pence/day)</li>
            <li>• Your API keys are stored inside your Claw only — we never see them</li>
          </ul>
        </div>

        <div className="flex flex-col gap-3">
          <Link
            href="/setup"
            className="inline-block border-2 border-gray-200 hover:border-gray-300 text-gray-600 font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            Set up another Claw
          </Link>
          <Link href="/" className="text-sm text-gray-400 hover:text-gray-600">
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><p className="text-gray-400">Loading...</p></div>}>
      <SuccessContent />
    </Suspense>
  );
}
