import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase";
import { loginAction } from "./actions";

interface Claw {
  id: string;
  claw_name: string;
  email: string | null;
  first_name: string | null;
  telegram_username: string | null;
  railway_domain: string | null;
  status: string | null;
  created_at: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  });
}

async function isAuthed(): Promise<boolean> {
  const expected = process.env.ADMIN_SECRET;
  if (!expected) return false;
  const cookieStore = await cookies();
  const cookie = cookieStore.get("admin_secret");
  return cookie?.value === expected;
}

function LoginPage({ error }: { error: boolean }) {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-sm">
        <div className="text-center mb-6">
          <span className="text-4xl">🔒</span>
          <h1 className="text-xl font-bold text-gray-900 mt-3">Admin access</h1>
          <p className="text-sm text-gray-500 mt-1">claw-setup dashboard</p>
        </div>
        <form action={loginAction} className="space-y-4">
          <div>
            <label htmlFor="secret" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="secret"
              name="secret"
              type="password"
              required
              autoFocus
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Enter admin password"
            />
          </div>
          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
              Incorrect password. Try again.
            </p>
          )}
          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
          >
            Sign in →
          </button>
        </form>
      </div>
    </main>
  );
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const authed = await isAuthed();

  if (!authed) {
    return <LoginPage error={params.error === "1"} />;
  }

  // Fetch all claws
  const { data: claws, error } = await supabaseAdmin
    .from("claws")
    .select("id, claw_name, email, first_name, telegram_username, railway_domain, status, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-red-500">Failed to load data: {error.message}</p>
      </main>
    );
  }

  const rows = (claws ?? []) as Claw[];
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentCount = rows.filter((r) => new Date(r.created_at) > sevenDaysAgo).length;
  const withEmail = rows.filter((r) => r.email).length;

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">🦞 Claw Admin</h1>
          <p className="text-sm text-gray-500 mt-1">All provisioned instances</p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-3xl font-bold text-indigo-600">{rows.length}</p>
            <p className="text-sm text-gray-500 mt-1">Total claws</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-3xl font-bold text-indigo-600">{recentCount}</p>
            <p className="text-sm text-gray-500 mt-1">Last 7 days</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-3xl font-bold text-indigo-600">{withEmail}</p>
            <p className="text-sm text-gray-500 mt-1">With email</p>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {rows.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p className="text-4xl mb-3">🦗</p>
              <p className="text-sm">No claws provisioned yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-5 py-3 font-semibold text-gray-600">Name</th>
                    <th className="text-left px-5 py-3 font-semibold text-gray-600">Person</th>
                    <th className="text-left px-5 py-3 font-semibold text-gray-600">Email</th>
                    <th className="text-left px-5 py-3 font-semibold text-gray-600">Telegram</th>
                    <th className="text-left px-5 py-3 font-semibold text-gray-600">Status</th>
                    <th className="text-left px-5 py-3 font-semibold text-gray-600">Domain</th>
                    <th className="text-left px-5 py-3 font-semibold text-gray-600">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((claw, i) => (
                    <tr
                      key={claw.id}
                      className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                        i % 2 === 0 ? "" : "bg-gray-50/30"
                      }`}
                    >
                      <td className="px-5 py-3 font-semibold text-gray-900">{claw.claw_name}</td>
                      <td className="px-5 py-3 text-gray-600">{claw.first_name ?? <span className="text-gray-300">—</span>}</td>
                      <td className="px-5 py-3 text-gray-600">
                        {claw.email ? (
                          <a href={`mailto:${claw.email}`} className="text-indigo-600 hover:underline">
                            {claw.email}
                          </a>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-gray-600">
                        {claw.telegram_username ? `@${claw.telegram_username}` : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            claw.status === "provisioning"
                              ? "bg-yellow-100 text-yellow-700"
                              : claw.status === "active"
                              ? "bg-green-100 text-green-700"
                              : claw.status === "pending_setup"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {claw.status ?? "unknown"}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        {claw.railway_domain ? (
                          <a
                            href={`https://${claw.railway_domain}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:underline text-xs font-mono"
                          >
                            {claw.railway_domain}
                          </a>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-gray-500 text-xs whitespace-nowrap">
                        {formatDate(claw.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
