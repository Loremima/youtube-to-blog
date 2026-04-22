import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, styleProfiles, usageLogs } from "@/db";
import { fetchTranscript } from "@/lib/transcript";
import { generateArticleHtml } from "@/lib/claude";
import { countWords, htmlToMarkdown } from "@/lib/prompts";
import { handleUnknownError } from "@/lib/errors";
import { newId } from "@/lib/ids";
import { getSessionUser } from "@/lib/session";
import { checkQuota } from "@/lib/quota";

export const runtime = "nodejs";
export const maxDuration = 60;

const Body = z.object({
  youtube_url: z.string().min(1),
  style_profile_id: z.string().nullable().optional(),
});

export async function POST(req: Request) {
  const start = Date.now();
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 },
      );
    }

    const quota = await checkQuota(session.user.id, session.user.plan);
    if (!quota.ok) {
      return NextResponse.json(
        {
          error: "Monthly quota exceeded",
          used: quota.used,
          limit: quota.limit,
          reset_at: quota.resetAt.toISOString(),
        },
        { status: 429 },
      );
    }

    const body = Body.parse(await req.json());
    let profile = null;
    if (body.style_profile_id) {
      const [row] = await db
        .select()
        .from(styleProfiles)
        .where(eq(styleProfiles.id, body.style_profile_id));
      if (!row || row.userId !== session.user.id) {
        return NextResponse.json(
          { error: "Profile not found" },
          { status: 404 },
        );
      }
      profile = row;
    }

    const transcript = await fetchTranscript(body.youtube_url);
    const html = await generateArticleHtml({ transcript, profile });
    const markdown = htmlToMarkdown(html);
    const wordCount = countWords(html);
    const latencyMs = Date.now() - start;

    await db.insert(usageLogs).values({
      id: newId("log"),
      userId: session.user.id,
      apiKeyId: null,
      youtubeUrl: transcript.videoUrl,
      styleProfileId: body.style_profile_id ?? null,
      wordCount,
      latencyMs,
      status: "success",
    });

    return NextResponse.json({
      html,
      markdown,
      word_count: wordCount,
      latency_ms: latencyMs,
    });
  } catch (e) {
    return handleUnknownError(e);
  }
}
