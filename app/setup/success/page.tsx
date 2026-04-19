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
  const [showIdeas, setShowIdeas] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem("claw_gateway_token");
    const storedDomain = sessionStorage.getItem("claw_domain");
    if (stored) setToken(stored);
    if (storedDomain) setDomain(storedDomain);
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

  const dashboardUrl = domain ? `https://${domain}/openclaw` : null;
  // Token is passed as a query param — the Control UI reads ?token= on load.
  // This matches the format used in the confirmation email sent by the provision route.
  const dashboardWithToken = dashboardUrl && token
    ? `${dashboardUrl}?token=${token}`
    : null;

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-16">
      <div className="max-w-lg mx-auto text-center">
        <div className="text-7xl mb-6">🎉</div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          {name} is deploying!
        </h1>
        <p className="text-xl text-gray-500 mb-10">
          Your AI assistant is being set up. Ready in about 2 minutes.
        </p>

        {/* Step 1: Telegram */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4 text-left">
          <div className="flex items-center gap-3 mb-3">
            <span className="w-7 h-7 rounded-full bg-indigo-600 text-white text-sm font-bold flex items-center justify-center shrink-0">1</span>
            <h2 className="font-bold text-gray-900">Open Telegram and say hello</h2>
          </div>
          {username ? (
            <p className="text-gray-600 text-sm ml-10">
              Search for <strong className="text-indigo-600">@{username}</strong> and tap <strong>Start</strong>. Wait ~2 minutes for the first startup, then just talk to it like you would a person.
            </p>
          ) : (
            <p className="text-gray-600 text-sm ml-10">Find your bot in Telegram and tap Start. Wait ~2 minutes for first startup.</p>
          )}
        </div>

        {/* Step 2: Gateway token — shown once */}
        {token && domain && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-4 text-left">
            <div className="flex items-center gap-3 mb-3">
              <span className="w-7 h-7 rounded-full bg-amber-500 text-white text-sm font-bold flex items-center justify-center shrink-0">2</span>
              <h2 className="font-bold text-amber-900">Save your dashboard access (optional)</h2>
            </div>
            <p className="text-sm text-amber-700 mb-4 ml-10">
              The web dashboard lets you see conversations, change settings, and configure your Claw from a browser.
              Your gateway token is shown <strong>once only</strong> — we don&apos;t store it. Save it somewhere safe like a notes app or password manager.
            </p>

            <div className="ml-10 space-y-4">

              {/* Step 1: Copy token */}
              <div className="bg-white border border-amber-200 rounded-xl p-4">
                <p className="text-xs font-bold text-amber-900 mb-2">Step 1 — Copy your gateway token</p>
                <div className="flex items-center gap-2">
                  <code className="text-xs bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg flex-1 break-all font-mono leading-relaxed">
                    {token}
                  </code>
                  <button onClick={copyToken}
                    className="shrink-0 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors">
                    {tokenCopied ? "✓ Copied!" : "Copy"}
                  </button>
                </div>
              </div>

              {/* Step 2: Open dashboard with token pre-filled */}
              <div className="bg-white border border-amber-200 rounded-xl p-4">
                <p className="text-xs font-bold text-amber-900 mb-2">Step 2 — Open your dashboard (token included)</p>
                {dashboardWithToken && (
                  <a href={dashboardWithToken} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-between gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-3 rounded-lg transition-colors">
                    <span>Open {name}&apos;s dashboard →</span>
                    <span className="text-indigo-200 text-xs truncate max-w-[160px]">{domain}</span>
                  </a>
                )}
                <p className="text-xs text-amber-700 mt-2">This link has your token built in — it will connect automatically. <strong>Bookmark it.</strong></p>
              </div>

              {/* Step 3: Bookmark */}
              <div className="bg-white border border-amber-200 rounded-xl p-4">
                <p className="text-xs font-bold text-amber-900 mb-1">Step 3 — Bookmark the page</p>
                <p className="text-xs text-amber-700">Once you&apos;re inside the dashboard, <strong>bookmark it in your browser</strong> so you can find it again. The token is only shown here once — if you lose it, you won&apos;t be able to access the dashboard. We also emailed the link to you if you provided an email address.</p>
              </div>

            </div>
          </div>
        )}

        {/* Startup note */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 mb-4 text-left">
          <div className="flex items-center gap-3">
            <span className="text-xl">⏱</span>
            <div>
              <p className="font-semibold text-blue-900 text-sm">First startup takes ~2 minutes</p>
              <p className="text-sm text-blue-700">{name} is installing on a fresh server. After this, every response is instant.</p>
            </div>
          </div>
        </div>

        {/* What to do next — ideas */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-6 text-left overflow-hidden">
          <button
            onClick={() => setShowIdeas(!showIdeas)}
            className="w-full p-6 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">💡</span>
              <div>
                <p className="font-bold text-gray-900">What can I do with {name}?</p>
                <p className="text-sm text-gray-500">Ideas from beginner to expert</p>
              </div>
            </div>
            <span className="text-gray-400 text-lg">{showIdeas ? "↑" : "↓"}</span>
          </button>

          {showIdeas && (
            <div className="px-6 pb-6 border-t border-gray-100 pt-5 space-y-6">

              {/* Beginner */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full">Beginner</span>
                  <span className="text-xs text-gray-400">Start here — just talk to it</span>
                </div>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex gap-2"><span>💬</span><span>Ask it anything — &quot;What&apos;s a good recipe for chicken tonight?&quot; or &quot;Summarise this article for me&quot;</span></li>
                  <li className="flex gap-2"><span>📝</span><span>Draft an email — &quot;Write a polite follow-up to a client who hasn&apos;t replied&quot;</span></li>
                  <li className="flex gap-2"><span>🤔</span><span>Think out loud — &quot;Help me decide between two job offers&quot;</span></li>
                  <li className="flex gap-2"><span>📚</span><span>Explain something — &quot;Explain how compound interest works like I&apos;m 10&quot;</span></li>
                  <li className="flex gap-2"><span>✅</span><span>Make a quick plan — &quot;Help me plan my week, I have these three big tasks...&quot;</span></li>
                </ul>
              </div>

              {/* Intermediate */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">Intermediate</span>
                  <span className="text-xs text-gray-400">Build a routine</span>
                </div>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex gap-2"><span>🌅</span><span>Morning briefing — message it &quot;Good morning&quot; and ask for a daily focus or checklist</span></li>
                  <li className="flex gap-2"><span>📊</span><span>Review your week — paste in your notes and ask it to spot patterns and wins</span></li>
                  <li className="flex gap-2"><span>✍️</span><span>Writing assistant — paste a draft and say &quot;Make this sharper and remove filler&quot;</span></li>
                  <li className="flex gap-2"><span>🧠</span><span>Research help — &quot;Give me 5 angles on [topic] I might not have considered&quot;</span></li>
                  <li className="flex gap-2"><span>💼</span><span>Meeting prep — &quot;I have a call with a new client in 30 mins, here&apos;s what I know about them...&quot;</span></li>
                </ul>
              </div>

              {/* Expert */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">Expert</span>
                  <span className="text-xs text-gray-400">Customise and automate</span>
                </div>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex gap-2"><span>🎭</span><span>Edit the SOUL.md file in your dashboard to give {name} deep knowledge about your life, business, and preferences</span></li>
                  <li className="flex gap-2"><span>🔗</span><span>Connect it to your tools — use the OpenClaw dashboard to add skills like web search or file access</span></li>
                  <li className="flex gap-2"><span>🤖</span><span>Build workflows — ask {name} to run a process every morning, like &quot;check my calendar and flag anything that needs prep&quot;</span></li>
                  <li className="flex gap-2"><span>👥</span><span>Add it to a Telegram group — {name} can assist your team, answer questions, and take notes in meetings</span></li>
                  <li className="flex gap-2"><span>🛠</span><span>Use the API — connect {name} to your own apps via the OpenClaw gateway API</span></li>
                </ul>
              </div>

              <p className="text-xs text-gray-400 pt-2 border-t border-gray-100">
                The more context you give {name} about yourself, the better it gets. Try telling it: &quot;Here&apos;s what I do and what I need help with most...&quot;
              </p>
            </div>
          )}
        </div>

        <div className="bg-indigo-50 rounded-2xl p-5 mb-8 text-left">
          <h3 className="font-semibold text-indigo-900 mb-2">🔒 Your privacy</h3>
          <ul className="space-y-1 text-sm text-indigo-700">
            <li>• {name} runs on its own private server — nobody else can access it</li>
            <li>• Your API keys are stored only inside your Claw — we never see them</li>
            <li>• AI costs go to your Anthropic account directly (usually a few pence/day)</li>
          </ul>
        </div>

        <div className="flex flex-col gap-3">
          <Link href="/setup"
            className="inline-block border-2 border-gray-200 hover:border-gray-300 text-gray-600 font-semibold px-6 py-3 rounded-xl transition-colors">
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
