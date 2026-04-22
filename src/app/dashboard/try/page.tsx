import { desc, eq } from "drizzle-orm";
import { getSessionUser } from "@/lib/session";
import { db, styleProfiles } from "@/db";
import TryGenerator from "./TryGenerator";

export default async function TryPage() {
  const session = (await getSessionUser())!;
  const profiles = await db
    .select({
      id: styleProfiles.id,
      name: styleProfiles.name,
    })
    .from(styleProfiles)
    .where(eq(styleProfiles.userId, session.user.id))
    .orderBy(desc(styleProfiles.updatedAt));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Try it</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Paste a YouTube URL, pick a style profile, generate an article.
        </p>
      </div>
      <TryGenerator profiles={profiles} />
    </div>
  );
}
