import Link from "next/link";

const FAQS = [
  {
    q: "Do I need to know how to code?",
    a: "Not at all. The whole setup takes about 5 minutes and we walk you through every step. If you can follow instructions, you can do this.",
  },
  {
    q: "What does it actually cost?",
    a: "Setting up your Claw is free. You pay Anthropic directly for AI usage — typically £1–5 per month for everyday personal use. You're charged per message, not a flat fee.",
  },
  {
    q: "Is my data private?",
    a: "Yes. Your Claw runs on its own private server. We never see your messages, your API keys, or your conversations. Everything stays between you and Anthropic.",
  },
  {
    q: "What can I actually use it for?",
    a: "Writing emails, research, summarising documents, planning your week, drafting social posts, answering questions — anything you'd ask a smart assistant. And because it's always in Telegram, it's always in your pocket.",
  },
  {
    q: "What if I already have Telegram?",
    a: "Perfect — you're halfway there. You just need to create a free bot via @BotFather (takes 2 minutes) and connect it during setup.",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen">

      {/* ── Hero ── */}
      <section className="bg-[#0f0f13] text-white">
        <div className="max-w-3xl mx-auto px-5 pt-20 pb-24 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 text-violet-300 text-xs font-semibold px-3 py-1.5 rounded-full mb-8">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            Now available — set up yours in 5 minutes
          </div>

          <h1 className="text-5xl sm:text-6xl font-extrabold leading-[1.05] tracking-tight mb-6">
            Your own AI assistant.{" "}
            <span className="text-violet-400">In your pocket.</span>
          </h1>

          <p className="text-lg sm:text-xl text-white/60 max-w-xl mx-auto leading-relaxed mb-10">
            A personal AI that lives in Telegram and works for you 24/7 — answering questions, writing emails, helping you think. Private, instant, completely yours.
          </p>

          <Link
            href="/setup"
            className="inline-block bg-violet-600 hover:bg-violet-500 text-white font-bold text-lg px-10 py-4 rounded-2xl transition-all shadow-lg shadow-violet-900/50 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-violet-900/50"
          >
            Get my free AI assistant →
          </Link>

          <p className="mt-5 text-sm text-white/30">
            5 minutes to set up · No credit card · Your data stays yours
          </p>

          {/* Social proof bar */}
          <div className="mt-14 flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-white/40">
            <span>🔒 End-to-end private</span>
            <span className="hidden sm:block">·</span>
            <span>⚡ Live in under 5 minutes</span>
            <span className="hidden sm:block">·</span>
            <span>🌍 Works anywhere you have Telegram</span>
          </div>
        </div>
      </section>

      {/* ── What you get ── */}
      <section className="bg-white py-20">
        <div className="max-w-4xl mx-auto px-5">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold text-violet-600 uppercase tracking-widest mb-3">What you get</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
              Not a chatbot. <em>Your</em> assistant.
            </h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">
              The difference between a shared AI tool and one that actually knows you and works for you.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                icon: "🔒",
                title: "Completely private",
                body: "Your conversations never go through anyone else's servers. Your Claw runs on a private server — yours alone.",
              },
              {
                icon: "⚡",
                title: "Always in Telegram",
                body: "Just send a message, like you would a friend. Available on your phone, tablet, or desktop. Always-on.",
              },
              {
                icon: "🎨",
                title: "Truly yours",
                body: "Give it a name, a personality, a purpose. Tell it about your life. It learns you over time.",
              },
            ].map((item) => (
              <div key={item.title} className="bg-gray-50 rounded-2xl p-7 border border-gray-100">
                <div className="text-3xl mb-4">{item.icon}</div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-3xl mx-auto px-5">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold text-violet-600 uppercase tracking-widest mb-3">How it works</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
              Three steps. Five minutes.
            </h2>
          </div>

          <div className="space-y-6">
            {[
              {
                num: "01",
                title: "Get your keys",
                body: "You'll need a free Anthropic API key (the AI brain) and a Telegram bot token. We show you exactly how to get both — step by step.",
              },
              {
                num: "02",
                title: "Name your assistant",
                body: "Pick a name, a personality, and tell it what you do. This takes 2 minutes and makes it feel like yours from day one.",
              },
              {
                num: "03",
                title: "Start talking",
                body: "We spin up your private server and send you the link. Open Telegram, find your bot, say hello. That's it.",
              },
            ].map((step) => (
              <div key={step.num} className="bg-white rounded-2xl border border-gray-100 p-6 flex gap-6 items-start shadow-sm">
                <div className="w-12 h-12 shrink-0 rounded-xl bg-violet-600 text-white font-extrabold text-sm flex items-center justify-center">
                  {step.num}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg mb-1">{step.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{step.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Use cases ── */}
      <section className="bg-white py-20">
        <div className="max-w-4xl mx-auto px-5">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold text-violet-600 uppercase tracking-widest mb-3">What people use it for</p>
            <h2 className="text-3xl font-extrabold text-gray-900">
              A smarter day, starting tomorrow
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { emoji: "✍️", text: "Draft emails and messages in seconds" },
              { emoji: "🔍", text: "Research anything without leaving the app" },
              { emoji: "📋", text: "Summarise long documents instantly" },
              { emoji: "📅", text: "Plan your week and set priorities" },
              { emoji: "💡", text: "Brainstorm ideas for projects and content" },
              { emoji: "🧾", text: "Explain contracts, invoices, and jargon" },
            ].map((item) => (
              <div key={item.text} className="flex items-start gap-3 bg-gray-50 rounded-xl p-4 border border-gray-100">
                <span className="text-xl shrink-0">{item.emoji}</span>
                <span className="text-sm text-gray-700 font-medium leading-snug">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-2xl mx-auto px-5">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold text-violet-600 uppercase tracking-widest mb-3">FAQ</p>
            <h2 className="text-3xl font-extrabold text-gray-900">
              Questions answered
            </h2>
          </div>

          <div className="space-y-4">
            {FAQS.map((faq) => (
              <div key={faq.q} className="bg-white rounded-2xl border border-gray-100 p-6">
                <h3 className="font-bold text-gray-900 mb-2">{faq.q}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="bg-[#0f0f13] text-white py-20">
        <div className="max-w-2xl mx-auto px-5 text-center">
          <div className="text-5xl mb-6 animate-float">🤖</div>
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">
            Ready to meet your assistant?
          </h2>
          <p className="text-white/50 text-lg mb-10 max-w-md mx-auto">
            Five minutes from now you could have a personal AI that knows you and works for you. Let&apos;s do it.
          </p>
          <Link
            href="/setup"
            className="inline-block bg-violet-600 hover:bg-violet-500 text-white font-bold text-lg px-10 py-4 rounded-2xl transition-all shadow-lg shadow-violet-900/50 hover:-translate-y-0.5"
          >
            Get started — it&apos;s free →
          </Link>
          <p className="mt-4 text-xs text-white/25">
            Built on OpenClaw (open source) · Powered by Anthropic Claude · adahq.ai
          </p>
        </div>
      </section>

    </div>
  );
}
