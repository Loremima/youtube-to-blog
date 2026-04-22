import { NextResponse } from "next/server";
import { z } from "zod";
import { and, eq, isNull } from "drizzle-orm";
import { db, apiKeys, users } from "@/db";
import { hashApiKey } from "@/lib/ids";
import { setSessionCookie, clearSessionCookie } from "@/lib/session";

export const runtime = "nodejs";

const Body = z.object({ api_key: z.string().min(1) });

export async function POST(req: Request) {
  const body = Body.parse(await req.json());
  const key = body.api_key.trim();
  if (!key.startsWith("ytb_")) {
    return NextResponse.json({ error: "Invalid key format" }, { status: 401 });
  }
  const hash = hashApiKey(key);
  const [row] = await db
    .select({ userId: users.id })
    .from(apiKeys)
    .innerJoin(users, eq(apiKeys.userId, users.id))
    .where(and(eq(apiKeys.keyHash, hash), isNull(apiKeys.revokedAt)))
    .limit(1);

  if (!row) {
    return NextResponse.json({ error: "Unknown key" }, { status: 401 });
  }
  setSessionCookie(key);
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  clearSessionCookie();
  return NextResponse.json({ ok: true });
}
