import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, styleProfiles, usageLogs } from "@/db";
import { fetchTranscript } from "@/lib/transcript";
import { generateArticleHtml } from "@/lib/claude";
import { countWords, htmlToMarkdown } from "@/lib/prompts";
import { handleUnknownError } from "@/lib/errors";
import { newId } from "@/lib/ids";
import { authenticate } from "@/lib/auth";
import { checkQuota } from "@/lib/quota";

export const runtime = "nodejs";
export const maxDuration = 60;

const Body = z.object({
  youtube_url: z.string().min(1),
  style_profile_id: z.string().optional(),
});

export async function POST(req: Request) {
  const start = Date.now();
  let userId: string | null = null;
  let apiKeyId: string | null = null;
  let youtubeUrl = "";
  let styleProfileId: string | null = null;

  try {
    const auth = await authenticate(req);
    userId = auth.userId;
    apiKeyId = auth.apiKeyId;

    const quota = await checkQuota(auth.userId, auth.plan);
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

    const json = await req.json();
    const body = Body.parse(json);
    youtubeUrl = body.youtube_url;
    styleProfileId = body.style_profile_id ?? null;

    let profile = null;
    if (styleProfileId) {
      const [row] = await db
        .select()
        .from(styleProfiles)
        .where(eq(styleProfiles.id, styleProfileId));
      if (!row || row.userId !== auth.userId) {
        return NextResponse.json(
          { error: "Style profile not found" },
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
      userId: auth.userId,
      apiKeyId: auth.apiKeyId,
      youtubeUrl: transcript.videoUrl,
      styleProfileId,
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
    const latencyMs = Date.now() - start;
    if (userId) {
      await db
        .insert(usageLogs)
        .values({
          id: newId("log"),
          userId,
          apiKeyId,
          youtubeUrl,
          styleProfileId,
          latencyMs,
          status: "error",
          errorMessage: e instanceof Error ? e.message.slice(0, 500) : "unknown",
        })
        .catch(() => {});
    }
    return handleUnknownError(e);
  }
}
