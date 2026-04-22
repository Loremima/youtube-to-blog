import { NextResponse } from "next/server";
import { z } from "zod";
import { eq, desc, count } from "drizzle-orm";
import { db, styleProfiles } from "@/db";
import { newId } from "@/lib/ids";
import { getSessionUser } from "@/lib/session";
import { PLAN_LIMITS } from "@/lib/plans";
import { handleUnknownError } from "@/lib/errors";

export const runtime = "nodejs";

const CreateBody = z.object({
  name: z.string().min(1).max(80),
  tone: z.string().min(1).max(120),
  sections_template: z.array(z.string().min(1).max(80)).max(12),
  cta_text: z.string().max(280).nullable().optional(),
  keywords_seo: z.array(z.string().min(1).max(80)).max(20),
  target_word_count: z.number().int().min(200).max(3000),
});

export async function GET() {
  const session = await getSessionUser();
  if (!session)
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const rows = await db
    .select()
    .from(styleProfiles)
    .where(eq(styleProfiles.userId, session.user.id))
    .orderBy(desc(styleProfiles.updatedAt));
  return NextResponse.json({ profiles: rows });
}

export async function POST(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session)
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 },
      );

    const body = CreateBody.parse(await req.json());

    const [{ value: existing }] = await db
      .select({ value: count() })
      .from(styleProfiles)
      .where(eq(styleProfiles.userId, session.user.id));
    const maxProfiles = PLAN_LIMITS[session.user.plan].maxStyleProfiles;
    if (existing >= maxProfiles) {
      return NextResponse.json(
        { error: `Plan limit reached (${maxProfiles} profiles). Upgrade to add more.` },
        { status: 402 },
      );
    }

    const id = newId("sp");
    await db.insert(styleProfiles).values({
      id,
      userId: session.user.id,
      name: body.name,
      tone: body.tone,
      sectionsTemplate: body.sections_template,
      ctaText: body.cta_text ?? null,
      keywordsSeo: body.keywords_seo,
      targetWordCount: body.target_word_count,
    });

    return NextResponse.json({ id }, { status: 201 });
  } catch (e) {
    return handleUnknownError(e);
  }
}
