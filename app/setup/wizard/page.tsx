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

const NAME_SUGGESTIONS = ["Max", "Nova", "Aria", "Scout"];

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

  const next = () => { setError(""); setStep((s) => s + 1); };
  const back = () => { setError(""); setStep((s) => s - 1); };

  // Step 2: Validate Anthropic key
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
      } else {
        setError(result.error ?? "Key validation failed.");
      }
    } catch {
      setError("Network error. Please try again.");
    }
    setLoading(false);
  };

  // Step 3: Validate Telegram token
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
      } else {
        setError(result.error ?? "Token validation failed.");
      }
    } catch {
      setError("Network error. Please try again.");
    }
    setLoading(false);
  };

  // Step 5: Launch
  const launch = async () => {
    setProvisioning(true);
    setError("");

    const steps = [
      "Creating your Claw...",
      "Connecting to Telegram...",
      "Setting up your AI brain...",
      "Almost there...",
    ];

    // Animate through steps
    for (let i = 0; i < steps.length - 1; i++) {
      setProvisionStep(i);
      await new Promise((r) => setTimeout(r, 1500));
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
        const domain = result.domain ?? "";
        const gatewayToken = result.gatewayToken ?? "";
        // Store token in sessionStorage, NOT in the URL.
        // URLs are logged by browsers, servers, analytics tools, and Referer headers.
        // sessionStorage is tab-scoped, never sent to the server, and cleared when tab closes.
        if (typeof window !== "undefined" && gatewayToken) {
          sessionStorage.setItem("claw_gateway_token", gatewayToken);
          sessionStorage.setItem("claw_domain", domain);
        }
        router.push(`/setup/success?name=${encodeURIComponent(data.clawName)}&username=${encodeURIComponent(data.telegramUsername)}&domain=${encodeURIComponent(domain)}`);
      } else {
        setError(result.error ?? "Something went wrong. Please try again.");
        setProvisioning(false);
      }
    } catch {
      setError("Network error during launch. Please try again.");
      setProvisioning(false);
    }
  };

  const provisionSteps = [
    "Creating your Claw...",
    "Connecting to Telegram...",
    "Setting up your AI brain...",
    "Almost there...",
  ];

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-12">
      <div className="max-w-lg mx-auto">

        {/* Progress bar */}
        <div className="mb-10">
          <div className="flex justify-between text-xs text-gray-400 mb-2">
            <span>Step {step} of {TOTAL_STEPS}</span>
            <span>{Math.round((step / TOTAL_STEPS) * 100)}% done</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
            />
          </div>
        </div>

        {/* Provisioning overlay */}
        {provisioning && (
          <div className="text-center py-12">
            <div className="text-5xl mb-6 animate-bounce">🚀</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Launching {data.clawName}...</h2>
            <div className="space-y-3">
              {provisionSteps.map((s, i) => (
                <div key={i} className={`flex items-center gap-3 justify-center text-sm transition-opacity ${i <= provisionStep ? "opacity-100" : "opacity-30"}`}>
                  {i < provisionStep ? (
                    <span className="text-green-500">✓</span>
                  ) : i === provisionStep ? (
                    <span className="animate-spin">⏳</span>
                  ) : (
                    <span className="text-gray-300">○</span>
                  )}
                  <span className={i <= provisionStep ? "text-gray-700" : "text-gray-400"}>{s}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {!provisioning && (
          <>
            {/* Step 1: Your details */}
            {step === 1 && (
              <StepCard>
                <StepHeading emoji="👋" title="Let's get started" />
                <p className="text-gray-500 mb-6">We just need your name and email so we can keep you updated.</p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">First name</label>
                    <input
                      type="text"
                      value={data.firstName}
                      onChange={(e) => setData((d) => ({ ...d, firstName: e.target.value }))}
                      placeholder="e.g. Jamie"
                      className="w-full border-2 border-gray-200 focus:border-indigo-500 rounded-xl px-5 py-4 outline-none transition-colors"
                      maxLength={50}
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email address</label>
                    <input
                      type="email"
                      value={data.email}
                      onChange={(e) => setData((d) => ({ ...d, email: e.target.value }))}
                      placeholder="you@example.com"
                      className="w-full border-2 border-gray-200 focus:border-indigo-500 rounded-xl px-5 py-4 outline-none transition-colors"
                      maxLength={254}
                    />
                    <p className="text-xs text-gray-400 mt-2">We won&apos;t spam you. Used for support only.</p>
                  </div>
                </div>
                <NavButtons
                  onNext={next}
                  nextDisabled={data.firstName.trim().length < 1 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)}
                  showBack={false}
                />
              </StepCard>
            )}

            {/* Step 2: Claw name */}
            {step === 2 && (
              <StepCard>
                <StepHeading emoji="🤖" title={`Hi ${data.firstName}! What should we call your AI assistant?`} />
                <p className="text-gray-500 mb-6">Pick something you like — you can always change it later.</p>
                <input
                  type="text"
                  value={data.clawName}
                  onChange={(e) => setData((d) => ({ ...d, clawName: e.target.value }))}
                  placeholder="e.g. Max, Nova, Aria..."
                  className="w-full text-2xl border-2 border-gray-200 focus:border-indigo-500 rounded-xl px-5 py-4 outline-none transition-colors"
                  maxLength={30}
                  autoFocus
                />
                <div className="flex gap-2 mt-4 flex-wrap">
                  {NAME_SUGGESTIONS.map((name) => (
                    <button
                      key={name}
                      onClick={() => setData((d) => ({ ...d, clawName: name }))}
                      className="px-4 py-2 rounded-full border border-gray-200 text-sm text-gray-600 hover:border-indigo-300 hover:text-indigo-600 transition-colors"
                    >
                      {name}
                    </button>
                  ))}
                </div>
                <NavButtons
                  onNext={next}
                  onBack={back}
                  nextDisabled={data.clawName.trim().length < 2}
                />
              </StepCard>
            )}

            {/* Step 3: Anthropic Key */}
            {step === 3 && (
              <StepCard>
                <StepHeading emoji="🧠" title={`Paste your Anthropic API key`} />
                <p className="text-gray-500 mb-6">This is the AI engine that powers {data.clawName}. It&apos;s never stored anywhere except inside your Claw.</p>
                <input
                  type="password"
                  value={data.anthropicKey}
                  onChange={(e) => {
                    setData((d) => ({ ...d, anthropicKey: e.target.value, anthropicValid: false }));
                    setError("");
                  }}
                  placeholder="sk-ant-..."
                  className="w-full border-2 border-gray-200 focus:border-indigo-500 rounded-xl px-5 py-4 outline-none transition-colors font-mono text-sm"
                  autoFocus
                />
                <p className="text-xs text-gray-400 mt-2">Starts with <code className="bg-gray-100 px-1 rounded">sk-ant-</code></p>
                {!data.anthropicValid && (
                  <button onClick={validateAnthropic} disabled={loading || data.anthropicKey.length < 10}
                    className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-3 rounded-xl transition-colors">
                    {loading ? "Verifying..." : "Validate key →"}
                  </button>
                )}
                {data.anthropicValid && <div className="mt-4 flex items-center gap-2 text-green-600 font-medium"><span>✅</span><span>Key verified</span></div>}
                {error && <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">{error} <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer" className="underline">Get a new key →</a></div>}
                <NavButtons onNext={next} onBack={back} nextDisabled={!data.anthropicValid} />
              </StepCard>
            )}

            {/* Step 4: Telegram */}
            {step === 4 && (
              <StepCard>
                <StepHeading emoji="✈️" title="Connect Telegram" />
                <p className="text-gray-500 mb-6">Paste the token you got from @BotFather. This is how you&apos;ll chat with {data.clawName}.</p>
                <input
                  type="text"
                  value={data.telegramToken}
                  onChange={(e) => { setData((d) => ({ ...d, telegramToken: e.target.value, telegramValid: false, telegramUsername: "" })); setError(""); }}
                  placeholder="123456789:ABCdefGHI..."
                  className="w-full border-2 border-gray-200 focus:border-indigo-500 rounded-xl px-5 py-4 outline-none transition-colors font-mono text-sm"
                  autoFocus
                />
                <p className="text-xs text-gray-400 mt-2">From @BotFather in Telegram</p>
                {!data.telegramValid && (
                  <button onClick={validateTelegram} disabled={loading || data.telegramToken.length < 10}
                    className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-3 rounded-xl transition-colors">
                    {loading ? "Testing connection..." : "Test connection →"}
                  </button>
                )}
                {data.telegramValid && <div className="mt-4 flex items-center gap-2 text-green-600 font-medium"><span>✅</span><span>Connected to @{data.telegramUsername}</span></div>}
                {error && <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">{error}</div>}
                <NavButtons onNext={next} onBack={back} nextDisabled={!data.telegramValid} />
              </StepCard>
            )}

            {/* Step 5: Personality */}
            {step === 5 && (
              <StepCard>
                <StepHeading emoji="✨" title={`Give ${data.clawName} a personality`} />
                <p className="text-gray-500 mb-6">All optional — but the more you tell us, the more useful {data.clawName} will be from day one.</p>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">What&apos;s it mainly for?</label>
                    <input
                      type="text"
                      value={data.personality.purpose}
                      onChange={(e) => setData((d) => ({ ...d, personality: { ...d.personality, purpose: e.target.value } }))}
                      placeholder="e.g. Managing my emails, reminders, answering questions..."
                      className="w-full border-2 border-gray-200 focus:border-indigo-500 rounded-xl px-4 py-3 outline-none transition-colors text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">How should it talk to you?</label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { value: "friendly", label: "😊 Friendly & casual" },
                        { value: "professional", label: "💼 Professional" },
                        { value: "concise", label: "⚡ Concise & direct" },
                        { value: "funny", label: "😄 Funny" },
                      ].map(({ value, label }) => (
                        <button
                          key={value}
                          onClick={() => setData((d) => ({ ...d, personality: { ...d.personality, tone: value } }))}
                          className={`py-3 px-4 rounded-xl border-2 text-sm font-medium transition-colors text-left ${
                            data.personality.tone === value
                              ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                              : "border-gray-200 text-gray-600 hover:border-gray-300"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Anything it should always know about you?</label>
                    <textarea
                      value={data.personality.context}
                      onChange={(e) => setData((d) => ({ ...d, personality: { ...d.personality, context: e.target.value } }))}
                      placeholder="e.g. I'm a freelance designer in London. I have a small team of 3. I prefer short answers..."
                      rows={3}
                      className="w-full border-2 border-gray-200 focus:border-indigo-500 rounded-xl px-4 py-3 outline-none transition-colors text-sm resize-none"
                    />
                  </div>
                </div>

                <NavButtons onNext={next} onBack={back} />
              </StepCard>
            )}

            {/* Step 6: Launch */}
            {step === 6 && (
              <StepCard>
                <StepHeading emoji="🚀" title="Everything&apos;s ready. Let&apos;s launch." />

                <div className="bg-gray-50 rounded-xl p-5 space-y-3 mb-6">
                  <SummaryRow label="Your name" value={data.firstName} />
                  <SummaryRow label="Email" value={data.email} />
                  <SummaryRow label="Claw name" value={data.clawName} />
                  <SummaryRow label="Telegram bot" value={`@${data.telegramUsername}`} />
                  <SummaryRow label="Anthropic key" value={`${data.anthropicKey.slice(0, 8)}••••••••`} />
                  <SummaryRow label="Tone" value={{ friendly: "Friendly & casual", professional: "Professional", concise: "Concise & direct", funny: "Funny" }[data.personality.tone] ?? data.personality.tone} />
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
                    {error}
                  </div>
                )}

                <button
                  onClick={launch}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-lg font-bold py-4 rounded-2xl transition-colors shadow-lg"
                >
                  Launch {data.clawName} →
                </button>
                <button onClick={back} className="w-full text-sm text-gray-400 hover:text-gray-600 mt-3 py-2">← Go back</button>
              </StepCard>
            )}
          </>
        )}
      </div>
    </main>
  );
}

function StepCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
      {children}
    </div>
  );
}

function StepHeading({ emoji, title }: { emoji: string; title: string }) {
  return (
    <div className="mb-6">
      <div className="text-4xl mb-3">{emoji}</div>
      <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
    </div>
  );
}

function NavButtons({
  onNext,
  onBack,
  nextDisabled = false,
  showBack = true,
  nextLabel = "Next →",
}: {
  onNext?: () => void;
  onBack?: () => void;
  nextDisabled?: boolean;
  showBack?: boolean;
  nextLabel?: string;
}) {
  return (
    <div className="mt-8 flex flex-col gap-3">
      {onNext && (
        <button
          onClick={onNext}
          disabled={nextDisabled}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-3 rounded-xl transition-colors"
        >
          {nextLabel}
        </button>
      )}
      {showBack && onBack && (
        <button onClick={onBack} className="text-sm text-gray-400 hover:text-gray-600 py-2">
          ← Go back
        </button>
      )}
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  );
}
