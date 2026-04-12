import Link from "next/link";

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ name?: string; username?: string; domain?: string; token?: string }>;
}) {
  const params = await searchParams;
  const name = params.name ?? "Your Claw";
  const username = params.username ?? "";
  const domain = params.domain ?? "";
  const token = params.token ?? "";

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-16">
      <div className="max-w-lg mx-auto text-center">
        <div className="text-7xl mb-6">🎉</div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          {name} is deploying!
        </h1>
        <p className="text-xl text-gray-500 mb-10">
          Your AI assistant is being set up. It'll be ready in about 2 minutes.
        </p>

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

        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 mb-6 text-left">
          <h3 className="font-semibold text-amber-900 mb-2">⏱ First startup takes ~2 minutes</h3>
          <p className="text-sm text-amber-700">
            {name} is being installed on a fresh server. After the first startup, responses are instant.
          </p>
        </div>

        {domain && token && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6 text-left">
            <h3 className="font-semibold text-gray-900 mb-3">🖥️ Control dashboard (optional)</h3>
            <p className="text-sm text-gray-500 mb-3">You can manage {name} from the web dashboard. Keep your token safe — it&apos;s your password.</p>
            <div className="space-y-2">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Dashboard URL</p>
                <a href={`https://${domain}/openclaw`} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-600 underline break-all">https://{domain}/openclaw</a>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Gateway token</p>
                <code className="text-sm bg-gray-100 px-3 py-2 rounded-lg block break-all font-mono">{token}</code>
              </div>
            </div>
          </div>
        )}

        <div className="bg-indigo-50 rounded-2xl p-6 mb-8 text-left">
          <h3 className="font-semibold text-indigo-900 mb-2">💡 Good to know</h3>
          <ul className="space-y-2 text-sm text-indigo-700">
            <li>• {name} runs 24/7 on Railway — always on</li>
            <li>• AI costs come from your Anthropic account (a few pence/day)</li>
            <li>• Your API keys are stored inside your Claw only — fully isolated</li>
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
