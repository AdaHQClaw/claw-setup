import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-16">
      <div className="max-w-xl w-full text-center">
        <div className="text-6xl mb-6">🤖</div>
        <h1 className="text-4xl font-bold mb-4 text-gray-900">
          Get your own AI assistant
        </h1>
        <p className="text-xl text-gray-500 mb-10">
          Set up a personal AI that lives in Telegram and works for you 24/7 — no technical skills needed.
        </p>
        <Link
          href="/setup"
          className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white text-lg font-semibold px-8 py-4 rounded-2xl transition-colors shadow-lg"
        >
          Get started →
        </Link>
        <p className="mt-6 text-sm text-gray-400">
          Takes about 5 minutes · Your API keys never leave your Claw
        </p>
      </div>
    </main>
  );
}
