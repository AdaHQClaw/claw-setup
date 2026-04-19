"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type WizardData = {
  firstName: string;
  email: string;
  clawName: string;
  anthropicKey: string;
  anthropicValid: boolean;
  telegramToken: string;
  telegramUsername: string;
  telegramValid: boolean;
  openaiKey: string;
  personality: {
    purpose: string;
    tone: string;
    context: string;
  };
};

const TOTAL_STEPS = 6;
const NAME_SUGGESTIONS = ["Max", "Nova", "Aria", "Scout", "Sage", "Zara"];

const STEP_LABELS = ["You", "Name", "AI Key", "Telegram", "Personality", "Launch"];

const TONES = [
  { value: "friendly", label: "Friendly", emoji: "😊", sub: "Warm & casual" },
  { value: "professional", label: "Professional", emoji: "💼", sub: "Sharp & clear" },
  { value: "concise", label: "Concise", emoji: "⚡", sub: "Short & direct" },
  { value: "funny", label: "Funny", emoji: "😄", sub: "Witty & playful" },
];

export default function WizardPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<WizardData>({
    firstName: "",
    email: "",
    clawName: "",
    anthropicKey: "",
    anthropicValid: false,
    telegramToken: "",
    telegramUsername: "",
    telegramValid: false,
    openaiKey: "",
    personality: { purpose: "", tone: "friendly", context: "" },
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [provisioning, setProvisioning] = useState(false);
  const [provisionStep, setProvisionStep] = useState(0);

  const go = (n: number) => { setError(""); setStep(n); };
  const next = () => go(step + 1);
  const back = () => go(step - 1);

  const validateAnthropic = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/validate-anthropic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: data.anthropicKey }),
      });
      const result = await res.json();
      if (result.valid) {
        setData((d) => ({ ...d, anthropicValid: true }));
        setError("");
      } else {
        setError(result.error ?? "That key didn't work. Double-check and try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    }
    setLoading(false);
  };

  const validateTelegram = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/validate-telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ botToken: data.telegramToken }),
      });
      const result = await res.json();
      if (result.valid) {
        setData((d) => ({ ...d, telegramValid: true, telegramUsername: result.username }));
        setError("");
      } else {
        setError(result.error ?? "That token didn't work. Copy it directly from BotFather.");
      }
    } catch {
      setError("Network error. Please try again.");
    }
    setLoading(false);
  };

  const launch = async () => {
    setProvisioning(true);
    setError("");
    const steps = ["Creating your server...", "Connecting your AI brain...", "Linking Telegram...", "Almost ready..."];
    for (let i = 0; i < steps.length - 1; i++) {
      setProvisionStep(i);
      await new Promise((r) => setTimeout(r, 1800));
    }
    setProvisionStep(steps.length - 1);

    try {
      const res = await fetch("/api/provision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clawName: data.clawName,
          firstName: data.firstName,
          email: data.email,
          anthropicKey: data.anthropicKey,
          telegramToken: data.telegramToken,
          telegramUsername: data.telegramUsername,
          openaiKey: data.openaiKey || undefined,
          personality: data.personality,
        }),
      });
      const result = await res.json();
      if (result.success) {
        if (typeof window !== "undefined" && result.gatewayToken) {
          sessionStorage.setItem("claw_gateway_token", result.gatewayToken);
          sessionStorage.setItem("claw_domain", result.domain ?? "");
        }
        router.push(
          `/setup/success?name=${encodeURIComponent(data.clawName)}&username=${encodeURIComponent(data.telegramUsername)}&domain=${encodeURIComponent(result.domain ?? "")}&email=${encodeURIComponent(data.email)}`
        );
      } else {
        setError(result.error ?? "Something went wrong. Please try again.");
        setProvisioning(false);
      }
    } catch {
      setError("Network error during launch. Please try again.");
      setProvisioning(false);
    }
  };

  const provisionSteps = ["Creating your server...", "Connecting your AI brain...", "Linking Telegram...", "Almost ready..."];
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email);

  // ── Provisioning overlay ──
  if (provisioning) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="text-7xl mb-8 animate-bounce">🚀</div>
          <h2 className="text-2xl font-extrabold text-gray-900 mb-2">
            Launching {data.clawName}...
          </h2>
          <p className="text-gray-500 text-sm mb-10">This takes about 2 minutes. Don&apos;t close this tab.</p>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            {provisionSteps.map((s, i) => (
              <div key={i} className={`flex items-center gap-4 text-sm transition-opacity duration-500 ${i <= provisionStep ? "opacity-100" : "opacity-25"}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold transition-all
                  ${i < provisionStep ? "bg-green-500 text-white" : i === provisionStep ? "bg-violet-600 text-white animate-pulse" : "bg-gray-100 text-gray-400"}`}>
                  {i < provisionStep ? "✓" : i + 1}
                </div>
                <span className={i <= provisionStep ? "text-gray-700 font-medium" : "text-gray-400"}>{s}</span>
              </div>
            ))}
          </div>
          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              {error}
            </div>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="max-w-lg mx-auto">

        {/* ── Progress dots ── */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((s) => (
            <div key={s} className="flex flex-col items-center gap-1">
              <div className={`rounded-full transition-all duration-300 
                ${s < step ? "w-6 h-6 bg-violet-600 text-white text-xs font-bold flex items-center justify-center"
                  : s === step ? "w-8 h-8 bg-violet-600 text-white text-xs font-bold flex items-center justify-center ring-4 ring-violet-100"
                  : "w-6 h-6 bg-gray-200"}`}>
                {s < step ? "✓" : s === step ? s : ""}
              </div>
            </div>
          ))}
        </div>
        <p className="text-center text-xs text-gray-400 mb-8">
          Step {step} of {TOTAL_STEPS} — {STEP_LABELS[step - 1]}
        </p>

        {/* ── Card ── */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">

          {/* Step 1: Details */}
          {step === 1 && (
            <div className="animate-fade-up">
              <StepHead emoji="👋" title={`First, let's put a name to your face`} />
              <p className="text-gray-500 text-sm mb-6">We&apos;ll personalise your assistant and send your dashboard link here.</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Your first name</label>
                  <input
                    type="text"
                    value={data.firstName}
                    onChange={(e) => setData((d) => ({ ...d, firstName: e.target.value }))}
                    placeholder="e.g. Jamie"
                    className="w-full border-2 border-gray-200 focus:border-violet-500 outline-none rounded-2xl px-5 py-4 text-base transition-colors"
                    maxLength={50}
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email address</label>
                  <input
                    type="email"
                    value={data.email}
                    onChange={(e) => setData((d) => ({ ...d, email: e.target.value }))}
                    placeholder="you@example.com"
                    className="w-full border-2 border-gray-200 focus:border-violet-500 outline-none rounded-2xl px-5 py-4 text-base transition-colors"
                    maxLength={254}
                  />
                  <p className="text-xs text-gray-400 mt-2">We&apos;ll send your dashboard access link here. Nothing else, ever.</p>
                </div>
              </div>
              <NavBar onNext={next} nextDisabled={data.firstName.trim().length < 1 || !emailValid} showBack={false} />
            </div>
          )}

          {/* Step 2: Name */}
          {step === 2 && (
            <div className="animate-fade-up">
              <StepHead emoji="🤖" title={`Hi ${data.firstName}! What should we call your assistant?`} />
              <p className="text-gray-500 text-sm mb-6">Pick something you&apos;ll actually enjoy saying. This is who you&apos;ll talk to every day.</p>
              <input
                type="text"
                value={data.clawName}
                onChange={(e) => setData((d) => ({ ...d, clawName: e.target.value }))}
                placeholder="e.g. Nova, Max, Aria..."
                className="w-full text-2xl font-bold border-2 border-gray-200 focus:border-violet-500 outline-none rounded-2xl px-5 py-4 transition-colors mb-4"
                maxLength={30}
                autoFocus
              />
              <div className="flex gap-2 flex-wrap">
                {NAME_SUGGESTIONS.map((name) => (
                  <button
                    key={name}
                    onClick={() => setData((d) => ({ ...d, clawName: name }))}
                    className={`px-4 py-2 rounded-full text-sm font-medium border-2 transition-all
                      ${data.clawName === name
                        ? "border-violet-500 bg-violet-50 text-violet-700"
                        : "border-gray-200 text-gray-600 hover:border-violet-300 hover:text-violet-600"}`}
                  >
                    {name}
                  </button>
                ))}
              </div>
              <NavBar onNext={next} onBack={back} nextDisabled={data.clawName.trim().length < 2} />
            </div>
          )}

          {/* Step 3: Anthropic */}
          {step === 3 && (
            <div className="animate-fade-up">
              <StepHead emoji="🧠" title="Your AI brain" />
              <p className="text-gray-500 text-sm mb-5">This is what makes {data.clawName} intelligent. Paste your Anthropic API key below.</p>

              {!data.anthropicValid ? (
                <>
                  <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 mb-5">
                    <p className="text-sm text-violet-800 font-medium mb-1">Don&apos;t have one yet?</p>
                    <p className="text-xs text-violet-600 mb-3">Go to Anthropic&apos;s site, sign up free, and create an API key. Takes 2 minutes.</p>
                    <a
                      href="https://console.anthropic.com/settings/keys"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block text-xs font-bold text-violet-700 underline"
                    >
                      Get your Anthropic key → console.anthropic.com/settings/keys
                    </a>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Paste your API key
                    </label>
                    <input
                      type="password"
                      value={data.anthropicKey}
                      onChange={(e) => { setData((d) => ({ ...d, anthropicKey: e.target.value, anthropicValid: false })); setError(""); }}
                      placeholder="sk-ant-api03-..."
                      className={`w-full border-2 ${error ? "border-red-300" : "border-gray-200"} focus:border-violet-500 outline-none rounded-2xl px-5 py-4 font-mono text-sm transition-colors`}
                      autoFocus
                    />
                    <p className="text-xs text-gray-400 mt-2">Starts with <code className="bg-gray-100 px-1 rounded">sk-ant-</code> · Your key never leaves your private server</p>
                  </div>

                  {error && <ErrorMsg>{error} <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer" className="underline">Get a key →</a></ErrorMsg>}

                  <button
                    onClick={validateAnthropic}
                    disabled={loading || data.anthropicKey.length < 10}
                    className="w-full bg-violet-600 hover:bg-violet-700 disabled:bg-gray-100 disabled:text-gray-400 text-white font-bold py-4 rounded-2xl transition-colors mb-4"
                  >
                    {loading ? "Checking key..." : "Verify key →"}
                  </button>

                  <div className="bg-gray-50 rounded-xl p-4 text-center">
                    <p className="text-xs text-gray-500">💰 <strong>Typical cost:</strong> £1–5/month for everyday use. You pay Anthropic directly — no surprise bills.</p>
                  </div>
                </>
              ) : (
                <div className="animate-pop">
                  <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-6 text-center mb-6">
                    <div className="text-4xl mb-3">✅</div>
                    <p className="font-bold text-green-800 text-lg">Key verified!</p>
                    <p className="text-green-600 text-sm mt-1">Your Anthropic key is connected and working.</p>
                  </div>
                </div>
              )}

              <NavBar onNext={next} onBack={back} nextDisabled={!data.anthropicValid} />
            </div>
          )}

          {/* Step 4: Telegram */}
          {step === 4 && (
            <div className="animate-fade-up">
              <StepHead emoji="✈️" title="Connect Telegram" />
              <p className="text-gray-500 text-sm mb-5">This is how you&apos;ll talk to {data.clawName} — just like messaging a friend.</p>

              {!data.telegramValid ? (
                <>
                  <div className="bg-[#229ED9]/10 border border-[#229ED9]/30 rounded-xl p-5 mb-5">
                    <p className="text-sm font-bold text-blue-900 mb-2">Step 1 — Create your bot in Telegram</p>
                    <ol className="text-sm text-blue-800 space-y-1.5 mb-4">
                      <li>1. <a href="https://t.me/botfather" target="_blank" rel="noopener noreferrer" className="font-bold underline">Open @BotFather in Telegram</a></li>
                      <li>2. Send <code className="bg-white/60 px-1.5 py-0.5 rounded font-mono text-xs">/newbot</code></li>
                      <li>3. Pick a display name (anything you like)</li>
                      <li>4. Pick a username — it <strong>must end in</strong> <code className="bg-white/60 px-1 rounded text-xs">bot</code></li>
                      <li>5. Copy the token BotFather sends you</li>
                    </ol>
                    <a
                      href="https://t.me/botfather"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-[#229ED9] text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-all hover:bg-[#1a8fc4]"
                    >
                      Open @BotFather →
                    </a>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Paste your bot token</label>
                    <input
                      type="text"
                      value={data.telegramToken}
                      onChange={(e) => { setData((d) => ({ ...d, telegramToken: e.target.value, telegramValid: false, telegramUsername: "" })); setError(""); }}
                      placeholder="123456789:ABCdefGHI..."
                      className={`w-full border-2 ${error ? "border-red-300" : "border-gray-200"} focus:border-violet-500 outline-none rounded-2xl px-5 py-4 font-mono text-sm transition-colors`}
                      autoFocus
                    />
                  </div>

                  {error && <ErrorMsg>{error}</ErrorMsg>}

                  <button
                    onClick={validateTelegram}
                    disabled={loading || data.telegramToken.length < 10}
                    className="w-full bg-violet-600 hover:bg-violet-700 disabled:bg-gray-100 disabled:text-gray-400 text-white font-bold py-4 rounded-2xl transition-colors"
                  >
                    {loading ? "Testing connection..." : "Connect Telegram →"}
                  </button>
                </>
              ) : (
                <div className="animate-pop">
                  <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-6 text-center mb-6">
                    <div className="text-4xl mb-3">✅</div>
                    <p className="font-bold text-green-800 text-lg">Telegram connected!</p>
                    <p className="text-green-600 text-sm mt-1">
                      Your bot <strong>@{data.telegramUsername}</strong> is ready to go.
                    </p>
                  </div>
                </div>
              )}

              <NavBar onNext={next} onBack={back} nextDisabled={!data.telegramValid} />
            </div>
          )}

          {/* Step 5: Personality */}
          {step === 5 && (
            <div className="animate-fade-up">
              <StepHead emoji="✨" title={`Make ${data.clawName} yours`} />
              <p className="text-gray-500 text-sm mb-6">All optional — but the more you share, the more useful {data.clawName} will be from day one.</p>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">What&apos;s it mainly for?</label>
                  <input
                    type="text"
                    value={data.personality.purpose}
                    onChange={(e) => setData((d) => ({ ...d, personality: { ...d.personality, purpose: e.target.value } }))}
                    placeholder="e.g. Managing my emails, research, writing..."
                    className="w-full border-2 border-gray-200 focus:border-violet-500 outline-none rounded-2xl px-5 py-4 text-sm transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">How should it talk to you?</label>
                  <div className="grid grid-cols-2 gap-3">
                    {TONES.map(({ value, label, emoji, sub }) => (
                      <button
                        key={value}
                        onClick={() => setData((d) => ({ ...d, personality: { ...d.personality, tone: value } }))}
                        className={`py-4 px-4 rounded-2xl border-2 text-left transition-all
                          ${data.personality.tone === value
                            ? "border-violet-500 bg-violet-50"
                            : "border-gray-200 hover:border-gray-300"}`}
                      >
                        <span className="text-xl block mb-1">{emoji}</span>
                        <span className={`font-bold text-sm block ${data.personality.tone === value ? "text-violet-700" : "text-gray-700"}`}>{label}</span>
                        <span className="text-xs text-gray-400">{sub}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Anything {data.clawName} should always know about you?</label>
                  <textarea
                    value={data.personality.context}
                    onChange={(e) => setData((d) => ({ ...d, personality: { ...d.personality, context: e.target.value } }))}
                    placeholder="e.g. I'm a freelance designer in London. I prefer short answers. I run a small business."
                    rows={3}
                    className="w-full border-2 border-gray-200 focus:border-violet-500 outline-none rounded-2xl px-5 py-4 text-sm resize-none transition-colors"
                  />
                  <p className="text-xs text-gray-400 mt-1">This becomes {data.clawName}&apos;s permanent context — you can update it later.</p>
                </div>
              </div>

              <NavBar onNext={next} onBack={back} />
            </div>
          )}

          {/* Step 6: Launch */}
          {step === 6 && (
            <div className="animate-fade-up">
              <StepHead emoji="🚀" title="You're all set. Ready to launch?" />
              <p className="text-gray-500 text-sm mb-6">Everything looks good. Hit the button and {data.clawName} will be live in about 2 minutes.</p>

              {/* Summary */}
              <div className="bg-gray-50 rounded-2xl p-5 mb-6 space-y-3">
                {[
                  { label: "Your name", value: data.firstName },
                  { label: "Email", value: data.email },
                  { label: "Assistant name", value: data.clawName },
                  { label: "Telegram bot", value: `@${data.telegramUsername}` },
                  { label: "AI key", value: `${data.anthropicKey.slice(0, 10)}••••` },
                  { label: "Tone", value: TONES.find(t => t.value === data.personality.tone)?.label ?? data.personality.tone },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-center text-sm">
                    <span className="text-gray-400 font-medium">{label}</span>
                    <span className="text-gray-800 font-semibold text-right max-w-[55%] truncate">{value}</span>
                  </div>
                ))}
              </div>

              {error && <ErrorMsg>{error}</ErrorMsg>}

              <button
                onClick={launch}
                className="w-full bg-violet-600 hover:bg-violet-700 text-white font-extrabold text-lg py-4 rounded-2xl transition-colors shadow-lg shadow-violet-200 mb-3"
              >
                Launch {data.clawName} →
              </button>
              <p className="text-xs text-gray-400 text-center">Takes ~2 minutes · We&apos;ll email you the dashboard link</p>

              <button onClick={back} className="w-full text-sm text-gray-400 hover:text-gray-600 mt-4 py-2">
                ← Change something
              </button>
            </div>
          )}
        </div>

      </div>
    </main>
  );
}

// ── Shared components ──

function StepHead({ emoji, title }: { emoji: string; title: string }) {
  return (
    <div className="mb-6">
      <div className="text-4xl mb-3">{emoji}</div>
      <h2 className="text-2xl font-extrabold text-gray-900 leading-snug">{title}</h2>
    </div>
  );
}

function ErrorMsg({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 leading-relaxed">
      {children}
    </div>
  );
}

function NavBar({
  onNext,
  onBack,
  nextDisabled = false,
  showBack = true,
}: {
  onNext?: () => void;
  onBack?: () => void;
  nextDisabled?: boolean;
  showBack?: boolean;
}) {
  return (
    <div className="mt-8 space-y-2">
      {onNext && (
        <button
          onClick={onNext}
          disabled={nextDisabled}
          className="w-full bg-violet-600 hover:bg-violet-700 disabled:bg-gray-100 disabled:text-gray-400 text-white font-bold py-4 rounded-2xl transition-colors"
        >
          Continue →
        </button>
      )}
      {showBack && onBack && (
        <button onClick={onBack} className="w-full text-sm text-gray-400 hover:text-gray-600 py-2">
          ← Go back
        </button>
      )}
    </div>
  );
}
