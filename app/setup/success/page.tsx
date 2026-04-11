import Link from "next/link";

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ name?: string; username?: string }>;
}) {
  const params = await searchParams;
  const name = params.name ?? "Your Claw";
  const username = params.username ?? "";

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-16">
      <div className="max-w-lg mx-auto text-center">
        <div className="text-7xl mb-6">🎉</div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          {name} is live!
        </h1>
        <p className="text-xl text-gray-500 mb-10">
          Your AI assistant is up and running. Time to say hello.
        </p>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8 text-left">
          <h2 className="font-bold text-gray-900 text-lg mb-4">👇 Next step</h2>
          {username ? (
            <div className="space-y-3 text-gray-600">
              <p>Open Telegram and search for <strong className="text-indigo-600">@{username}</strong></p>
              <p>Tap <strong>Start</strong> and send a message — {name} is ready to chat.</p>
            </div>
          ) : (
            <p className="text-gray-600">Open Telegram, find the bot you created with @BotFather, tap Start, and send a message.</p>
          )}
        </div>

        <div className="bg-indigo-50 rounded-2xl p-6 mb-8 text-left">
          <h3 className="font-semibold text-indigo-900 mb-2">💡 Good to know</h3>
          <ul className="space-y-2 text-sm text-indigo-700">
            <li>• {name} is running on Railway — it&apos;s always on, 24/7</li>
            <li>• AI costs come directly from your Anthropic account (usually a few pence per day)</li>
            <li>• Your API keys are stored securely inside your Claw only</li>
          </ul>
        </div>

        <div className="flex flex-col gap-3">
          <Link
            href="/setup"
            className="inline-block border-2 border-gray-200 hover:border-gray-300 text-gray-600 font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            Set up another Claw
          </Link>
          <Link
            href="/"
            className="text-sm text-gray-400 hover:text-gray-600"
          >
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
