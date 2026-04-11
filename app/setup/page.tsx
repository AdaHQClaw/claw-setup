"use client";

import { useState } from "react";
import Link from "next/link";

type CheckState = {
  anthropic: boolean;
  telegram: boolean;
  openai: boolean;
};

type OpenState = {
  anthropic: boolean;
  telegram: boolean;
  openai: boolean;
};

export default function SetupPrepPage() {
  const [checked, setChecked] = useState<CheckState>({ anthropic: false, telegram: false, openai: false });
  const [open, setOpen] = useState<OpenState>({ anthropic: false, telegram: false, openai: false });

  const canProceed = checked.anthropic && checked.telegram;

  const toggle = (key: keyof OpenState) => setOpen((o) => ({ ...o, [key]: !o[key] }));
  const check = (key: keyof CheckState, value: boolean) => setChecked((c) => ({ ...c, [key]: value }));

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-12">
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="text-5xl mb-4">🤖</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Let&apos;s set up your AI assistant
          </h1>
          <p className="text-lg text-gray-500">
            Before we start, you&apos;ll need 3 things. We&apos;ll show you exactly how to get each one — it only takes a few minutes.
          </p>
        </div>

        {/* Cards */}
        <div className="space-y-4">

          {/* Anthropic */}
          <PrepCard
            number={1}
            emoji="🧠"
            title="Anthropic API key"
            subtitle="This powers your assistant's brain"
            required
            isOpen={open.anthropic}
            isChecked={checked.anthropic}
            onToggle={() => toggle("anthropic")}
            onCheck={(v) => check("anthropic", v)}
            checkLabel="I've got my Anthropic key ✓"
          >
            <ol className="space-y-3 text-sm text-gray-600">
              <li className="flex gap-3"><span className="font-bold text-indigo-600 shrink-0">1.</span><span>Go to <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline">console.anthropic.com</a> and sign up or log in</span></li>
              <li className="flex gap-3"><span className="font-bold text-indigo-600 shrink-0">2.</span><span>Click <strong>&quot;API Keys&quot;</strong> in the left-hand menu</span></li>
              <li className="flex gap-3"><span className="font-bold text-indigo-600 shrink-0">3.</span><span>Click <strong>&quot;Create Key&quot;</strong> — give it any name you like</span></li>
              <li className="flex gap-3"><span className="font-bold text-indigo-600 shrink-0">4.</span><span>Copy the key (it starts with <code className="bg-gray-100 px-1 rounded text-xs">sk-ant-</code>) and keep it safe</span></li>
            </ol>
            <p className="text-xs text-gray-400 mt-4">💡 Anthropic charges based on usage. Most personal assistants cost a few pence per day.</p>
          </PrepCard>

          {/* Telegram */}
          <PrepCard
            number={2}
            emoji="✈️"
            title="Telegram bot token"
            subtitle="Connects your assistant to Telegram so you can chat with it"
            required
            isOpen={open.telegram}
            isChecked={checked.telegram}
            onToggle={() => toggle("telegram")}
            onCheck={(v) => check("telegram", v)}
            checkLabel="I've got my Telegram token ✓"
          >
            <ol className="space-y-3 text-sm text-gray-600">
              <li className="flex gap-3"><span className="font-bold text-indigo-600 shrink-0">1.</span><span>Open Telegram on your phone or computer</span></li>
              <li className="flex gap-3"><span className="font-bold text-indigo-600 shrink-0">2.</span><span>Search for <strong>@BotFather</strong> and open that chat</span></li>
              <li className="flex gap-3"><span className="font-bold text-indigo-600 shrink-0">3.</span><span>Type <code className="bg-gray-100 px-1 rounded text-xs">/newbot</code> and press send</span></li>
              <li className="flex gap-3"><span className="font-bold text-indigo-600 shrink-0">4.</span><span>Follow the prompts — pick a display name and a username (must end in <code className="bg-gray-100 px-1 rounded text-xs">bot</code>)</span></li>
              <li className="flex gap-3"><span className="font-bold text-indigo-600 shrink-0">5.</span><span>BotFather will give you a token that looks like <code className="bg-gray-100 px-1 rounded text-xs">123456:ABCdef...</code> — copy that</span></li>
            </ol>
            <p className="text-xs text-gray-400 mt-4">💡 Don&apos;t have Telegram? Download it free from the App Store or Google Play.</p>
          </PrepCard>

          {/* OpenAI */}
          <PrepCard
            number={3}
            emoji="⚡"
            title="OpenAI API key"
            subtitle="Optional — gives your assistant access to GPT models too"
            required={false}
            isOpen={open.openai}
            isChecked={checked.openai}
            onToggle={() => toggle("openai")}
            onCheck={(v) => check("openai", v)}
            checkLabel="I've got my OpenAI key (optional)"
          >
            <ol className="space-y-3 text-sm text-gray-600">
              <li className="flex gap-3"><span className="font-bold text-indigo-600 shrink-0">1.</span><span>Go to <a href="https://platform.openai.com" target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline">platform.openai.com</a> and sign in</span></li>
              <li className="flex gap-3"><span className="font-bold text-indigo-600 shrink-0">2.</span><span>Click <strong>API Keys</strong> in the left menu</span></li>
              <li className="flex gap-3"><span className="font-bold text-indigo-600 shrink-0">3.</span><span>Click <strong>&quot;Create new secret key&quot;</strong> — name it anything</span></li>
              <li className="flex gap-3"><span className="font-bold text-indigo-600 shrink-0">4.</span><span>Copy the key (starts with <code className="bg-gray-100 px-1 rounded text-xs">sk-</code>)</span></li>
            </ol>
          </PrepCard>
        </div>

        {/* CTA */}
        <div className="mt-8 text-center">
          {canProceed ? (
            <Link
              href="/setup/wizard"
              className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white text-lg font-semibold px-8 py-4 rounded-2xl transition-colors shadow-lg"
            >
              I&apos;m ready — let&apos;s set up my Claw →
            </Link>
          ) : (
            <div>
              <button
                disabled
                className="bg-gray-200 text-gray-400 text-lg font-semibold px-8 py-4 rounded-2xl cursor-not-allowed"
              >
                I&apos;m ready — let&apos;s set up my Claw →
              </button>
              <p className="text-sm text-gray-400 mt-3">
                Tick the two required checkboxes above to continue
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function PrepCard({
  number,
  emoji,
  title,
  subtitle,
  required,
  isOpen,
  isChecked,
  onToggle,
  onCheck,
  checkLabel,
  children,
}: {
  number: number;
  emoji: string;
  title: string;
  subtitle: string;
  required: boolean;
  isOpen: boolean;
  isChecked: boolean;
  onToggle: () => void;
  onCheck: (v: boolean) => void;
  checkLabel: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`bg-white rounded-2xl shadow-sm border-2 transition-colors ${isChecked ? "border-green-200" : "border-gray-100"}`}>
      <button
        className="w-full flex items-center gap-4 p-5 text-left"
        onClick={onToggle}
      >
        <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 font-bold text-sm flex items-center justify-center shrink-0">
          {number}
        </div>
        <div className="text-2xl">{emoji}</div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900">{title}</span>
            {required ? (
              <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">Required</span>
            ) : (
              <span className="text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">Optional</span>
            )}
            {isChecked && <span className="text-green-500">✓</span>}
          </div>
          <div className="text-sm text-gray-400">{subtitle}</div>
        </div>
        <div className="text-gray-300 text-lg">{isOpen ? "▲" : "▼"}</div>
      </button>

      {isOpen && (
        <div className="px-5 pb-5 border-t border-gray-50 pt-4">
          {children}
          <label className="flex items-center gap-3 mt-5 cursor-pointer">
            <input
              type="checkbox"
              checked={isChecked}
              onChange={(e) => onCheck(e.target.checked)}
              className="w-5 h-5 accent-indigo-600 rounded"
            />
            <span className="text-sm font-medium text-gray-700">{checkLabel}</span>
          </label>
        </div>
      )}
    </div>
  );
}
