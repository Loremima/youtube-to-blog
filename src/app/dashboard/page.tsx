import Link from "next/link";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import { getSessionUser } from "@/lib/session";
import { db, usageLogs, styleProfiles } from "@/db";
import { PLAN_LIMITS } from "@/lib/plans";
import { currentPeriod } from "@/lib/quota";

export default async function DashboardHome() {
  const session = (await getSessionUser())!;
  const { start, end } = currentPeriod();
  const limits = PLAN_LIMITS[session.user.plan];

  const [usedRow] = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(usageLogs)
    .where(
      and(
        eq(usageLogs.userId, session.user.id),
        eq(usageLogs.status, "success"),
        gte(usageLogs.createdAt, start),
      ),
    );
  const used = usedRow?.value ?? 0;

  const profiles = await db
    .select()
    .from(styleProfiles)
    .where(eq(styleProfiles.userId, session.user.id))
    .orderBy(desc(styleProfiles.updatedAt))
    .limit(4);

  const recent = await db
    .select()
    .from(usageLogs)
    .where(eq(usageLogs.userId, session.user.id))
    .orderBy(desc(usageLogs.createdAt))
    .limit(10);

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-2xl font-semibold">Welcome back</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Plan <strong className="capitalize">{session.user.plan}</strong> · API key{" "}
          <code>{session.apiKeyPrefix}…</code>
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="card">
          <p className="text-sm font-medium text-neutral-500">Used this month</p>
          <p className="mt-2 text-3xl font-bold">
            {used}
            <span className="text-lg font-medium text-neutral-500">
              {" "}
              / {limits.monthlyArticles}
            </span>
          </p>
          <p className="mt-2 text-xs text-neutral-500">
            Resets on {end.toISOString().slice(0, 10)}.
          </p>
        </div>
        <div className="card">
          <p className="text-sm font-medium text-neutral-500">Style profiles</p>
          <p className="mt-2 text-3xl font-bold">
            {profiles.length}
            <span className="text-lg font-medium text-neutral-500">
              {" "}
              / {limits.maxStyleProfiles}
            </span>
          </p>
          <Link
            href="/dashboard/profiles"
            className="mt-3 inline-block text-sm text-brand hover:underline"
          >
            Manage profiles →
          </Link>
        </div>
        <div className="card">
          <p className="text-sm font-medium text-neutral-500">API</p>
          <p className="mt-2 text-3xl font-bold">
            {limits.apiAccess ? "Enabled" : "Upgrade"}
          </p>
          {limits.apiAccess ? (
            <p className="mt-2 text-xs text-neutral-500">
              Use header <code>Authorization: Bearer ytb_live_…</code>
            </p>
          ) : (
            <Link
              href="/#pricing"
              className="mt-3 inline-block text-sm text-brand hover:underline"
            >
              See plans →
            </Link>
          )}
        </div>
      </section>

      <section className="card">
        <h2 className="text-lg font-semibold">Recent generations</h2>
        {recent.length === 0 ? (
          <p className="mt-3 text-sm text-neutral-500">
            No articles yet.{" "}
            <Link href="/dashboard/try" className="text-brand hover:underline">
              Generate your first article →
            </Link>
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-neutral-100 text-sm">
            {recent.map((log) => (
              <li key={log.id} className="flex items-center justify-between py-3">
                <div className="min-w-0">
                  <a
                    href={log.youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block truncate font-medium hover:text-brand"
                  >
                    {log.youtubeUrl}
                  </a>
                  <p className="text-xs text-neutral-500">
                    {new Date(log.createdAt).toISOString().replace("T", " ").slice(0, 16)}
                    {" · "}
                    {log.status === "success"
                      ? `${log.wordCount ?? "?"} words · ${log.latencyMs ?? "?"}ms`
                      : `error: ${log.errorMessage?.slice(0, 60) ?? "unknown"}`}
                  </p>
                </div>
                <span
                  className={`ml-4 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                    log.status === "success"
                      ? "bg-green-50 text-green-700"
                      : "bg-red-50 text-red-700"
                  }`}
                >
                  {log.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
