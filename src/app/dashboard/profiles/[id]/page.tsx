import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { getSessionUser } from "@/lib/session";
import { db, styleProfiles } from "@/db";
import ProfileForm from "@/components/ProfileForm";

export default async function EditProfilePage({
  params,
}: {
  params: { id: string };
}) {
  const session = (await getSessionUser())!;
  const [row] = await db
    .select()
    .from(styleProfiles)
    .where(
      and(
        eq(styleProfiles.id, params.id),
        eq(styleProfiles.userId, session.user.id),
      ),
    );
  if (!row) notFound();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Edit profile</h1>
      <ProfileForm
        mode="edit"
        initial={{
          id: row.id,
          name: row.name,
          tone: row.tone,
          sections_template: row.sectionsTemplate,
          cta_text: row.ctaText,
          keywords_seo: row.keywordsSeo,
          target_word_count: row.targetWordCount,
        }}
      />
    </div>
  );
}
