import { NextResponse } from "next/server";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db, styleProfiles } from "@/db";
import { getSessionUser } from "@/lib/session";
import { handleUnknownError } from "@/lib/errors";

export const runtime = "nodejs";

const UpdateBody = z.object({
  name: z.string().min(1).max(80),
  tone: z.string().min(1).max(120),
  sections_template: z.array(z.string().min(1).max(80)).max(12),
  cta_text: z.string().max(280).nullable().optional(),
  keywords_seo: z.array(z.string().min(1).max(80)).max(20),
  target_word_count: z.number().int().min(200).max(3000),
});

interface Ctx {
  params: { id: string };
}

export async function GET(_req: Request, { params }: Ctx) {
  const session = await getSessionUser();
  if (!session)
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const [row] = await db
    .select()
    .from(styleProfiles)
    .where(
      and(
        eq(styleProfiles.id, params.id),
        eq(styleProfiles.userId, session.user.id),
      ),
    );
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(row);
}

export async function PUT(req: Request, { params }: Ctx) {
  try {
    const session = await getSessionUser();
    if (!session)
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 },
      );
    const body = UpdateBody.parse(await req.json());
    const res = await db
      .update(styleProfiles)
      .set({
        name: body.name,
        tone: body.tone,
        sectionsTemplate: body.sections_template,
        ctaText: body.cta_text ?? null,
        keywordsSeo: body.keywords_seo,
        targetWordCount: body.target_word_count,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(styleProfiles.id, params.id),
          eq(styleProfiles.userId, session.user.id),
        ),
      )
      .returning({ id: styleProfiles.id });

    if (res.length === 0)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleUnknownError(e);
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const session = await getSessionUser();
  if (!session)
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const res = await db
    .delete(styleProfiles)
    .where(
      and(
        eq(styleProfiles.id, params.id),
        eq(styleProfiles.userId, session.user.id),
      ),
    )
    .returning({ id: styleProfiles.id });
  if (res.length === 0)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
