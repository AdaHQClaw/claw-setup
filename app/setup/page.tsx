import Link from "next/link";

export default function SetupPrepPage() {
  return (
    <main className="min-h-screen bg-gray-50 px-4 py-12">
      <div className="max-w-xl mx-auto">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="text-5xl mb-5">🚀</div>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-3">
            Two things before we start
          </h1>
          <p className="text-gray-500 text-base leading-relaxed">
            You need two free tokens — one for the AI brain, one for Telegram.
            Open both links below, grab them, then come back. Takes about 3 minutes.
          </p>
        </div>

        {/* Cards */}
        <div className="space-y-5 mb-8">

          {/* Card 1: Anthropic */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="bg-violet-600 px-6 py-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/20 text-white font-bold text-sm flex items-center justify-center shrink-0">1</div>
              <div>
                <h2 className="font-bold text-white text-base">Anthropic API key</h2>
                <p className="text-violet-200 text-xs">The AI brain that powers your assistant</p>
              </div>
              <span className="ml-auto text-2xl">🧠</span>
            </div>
            <div className="p-6 space-y-5">
              <div className="space-y-3">
                {[
                  <>Go to <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer" className="text-violet-600 font-semibold underline">console.anthropic.com/settings/keys</a></>,
                  <>Sign up or log in (it&apos;s free to join)</>,
                  <>Click <strong className="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono">Create Key</strong> — give it any name you like</>,
                  <>Copy the key — it starts with <code className="bg-violet-50 text-violet-700 px-2 py-0.5 rounded font-mono text-xs border border-violet-200">sk-ant-api03-...</code></>,
                ].map((step, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <span className="shrink-0 w-6 h-6 rounded-full bg-violet-100 text-violet-600 text-xs font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
                    <p className="text-sm text-gray-600 leading-relaxed">{step}</p>
                  </div>
                ))}
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-sm text-amber-800">
                  <strong>💰 Cost:</strong> Typically <strong>£1–5/month</strong> for personal use. You pay Anthropic directly — pay as you go, no subscription required.
                </p>
              </div>

              <a
                href="https://console.anthropic.com/settings/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
              >
                Open Anthropic Console →
              </a>
            </div>
          </div>

          {/* Card 2: Telegram */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="bg-[#229ED9] px-6 py-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/20 text-white font-bold text-sm flex items-center justify-center shrink-0">2</div>
              <div>
                <h2 className="font-bold text-white text-base">Telegram bot token</h2>
                <p className="text-blue-100 text-xs">How you&apos;ll chat with your assistant</p>
              </div>
              <span className="ml-auto text-2xl">✈️</span>
            </div>
            <div className="p-6 space-y-5">
              <div className="bg-[#229ED9]/10 border border-[#229ED9]/20 rounded-xl p-4">
                <p className="text-sm text-blue-900 font-medium mb-1">Open BotFather in Telegram</p>
                <p className="text-xs text-blue-700 mb-3">BotFather is Telegram&apos;s official bot creator. It takes 2 minutes.</p>
                <a
                  href="https://t.me/botfather"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-[#229ED9] hover:bg-[#1a8fc4] text-white font-semibold px-4 py-2.5 rounded-lg text-sm transition-colors"
                >
                  Open @BotFather in Telegram →
                </a>
              </div>

              <div className="space-y-3">
                {[
                  <>In BotFather, type <code className="bg-gray-100 px-2 py-0.5 rounded font-mono text-xs">/newbot</code> and press send</>,
                  <>Pick a display name (e.g. <em>My Assistant</em>)</>,
                  <>Pick a username — it <strong>must end in</strong> <code className="bg-gray-100 px-1.5 py-0.5 rounded font-mono text-xs">bot</code> (e.g. <em>myassistant_bot</em>)</>,
                  <>BotFather sends you a token that looks like <code className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-mono text-xs border border-blue-200">123456789:ABCdef...</code> — copy it</>,
                ].map((step, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <span className="shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
                    <p className="text-sm text-gray-600 leading-relaxed">{step}</p>
                  </div>
                ))}
              </div>

              <p className="text-xs text-gray-400 text-center">
                Don&apos;t have Telegram yet?{" "}
                <a href="https://telegram.org" target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">Download it free</a>
                {" "}— available on iOS, Android, Mac, Windows.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link
            href="/setup/wizard"
            className="inline-block bg-violet-600 hover:bg-violet-700 text-white font-bold text-lg px-10 py-4 rounded-2xl transition-all shadow-lg shadow-violet-200 hover:-translate-y-0.5"
          >
            I&apos;ve got both — let&apos;s go →
          </Link>
          <p className="text-xs text-gray-400 mt-3">You&apos;ll enter them in the next step</p>
        </div>

      </div>
    </main>
  );
}
