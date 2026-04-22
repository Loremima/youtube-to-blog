import { cookies } from "next/headers";
import { and, eq, isNull } from "drizzle-orm";
import { db, users, apiKeys } from "@/db";
import type { User } from "@/db/schema";
import { hashApiKey } from "./ids";

export const SESSION_COOKIE = "ytb_session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

export function setSessionCookie(apiKey: string): void {
  cookies().set(SESSION_COOKIE, apiKey, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
}

export function clearSessionCookie(): void {
  cookies().delete(SESSION_COOKIE);
}

export interface SessionUser {
  user: User;
  apiKeyId: string;
  apiKeyPrefix: string;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const raw = cookies().get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  if (!raw.startsWith("ytb_")) return null;

  const hash = hashApiKey(raw);
  const [row] = await db
    .select({
      apiKeyId: apiKeys.id,
      apiKeyPrefix: apiKeys.keyPrefix,
      user: users,
    })
    .from(apiKeys)
    .innerJoin(users, eq(apiKeys.userId, users.id))
    .where(and(eq(apiKeys.keyHash, hash), isNull(apiKeys.revokedAt)))
    .limit(1);

  if (!row) return null;
  return {
    user: row.user,
    apiKeyId: row.apiKeyId,
    apiKeyPrefix: row.apiKeyPrefix,
  };
}

export async function requireSession(): Promise<SessionUser> {
  const session = await getSessionUser();
  if (!session) {
    throw new Response(JSON.stringify({ error: "Not authenticated" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }
  return session;
}
