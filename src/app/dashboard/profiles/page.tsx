import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { getSessionUser } from "@/lib/session";
import { db, styleProfiles } from "@/db";
import { PLAN_LIMITS } from "@/lib/plans";

export default async function ProfilesPage() {
  const session = (await getSessionUser())!;
  const rows = await db
    .select()
    .from(styleProfiles)
    .where(eq(styleProfiles.userId, session.user.id))
    .orderBy(desc(styleProfiles.updatedAt));
  const max = PLAN_LIMITS[session.user.plan].maxStyleProfiles;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Style profiles</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Define a voice once, reuse it on every video.
          </p>
        </div>
        <Link
          href="/dashboard/profiles/new"
          className={`btn-primary ${rows.length >= max ? "pointer-events-none opacity-50" : ""}`}
        >
          New profile ({rows.length}/{max})
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="card text-sm text-neutral-600">
          You don't have any profile yet.{" "}
          <Link
            href="/dashboard/profiles/new"
            className="text-brand hover:underline"
          >
            Create your first one.
          </Link>
        </div>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {rows.map((p) => (
            <li key={p.id} className="card">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{p.name}</h3>
                  <p className="mt-1 text-xs text-neutral-500">
                    {p.tone} · {p.targetWordCount} words ·{" "}
                    {p.sectionsTemplate.length} sections
                  </p>
                </div>
                <Link
                  href={`/dashboard/profiles/${p.id}`}
                  className="text-sm text-brand hover:underline"
                >
                  Edit
                </Link>
              </div>
              {p.keywordsSeo.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {p.keywordsSeo.map((k) => (
                    <span
                      key={k}
                      className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs"
                    >
                      {k}
                    </span>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
