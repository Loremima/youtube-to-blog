import { and, eq, isNull } from "drizzle-orm";
import { db, apiKeys, users } from "@/db";
import type { Plan } from "@/db/schema";
import { ApiError } from "./errors";
import { hashApiKey } from "./ids";

export interface AuthContext {
  userId: string;
  plan: Plan;
  apiKeyId: string;
}

const BEARER_RE = /^Bearer\s+(.+)$/i;

function extractBearer(req: Request): string | null {
  const raw = req.headers.get("authorization") ?? req.headers.get("Authorization");
  if (!raw) return null;
  const m = raw.match(BEARER_RE);
  return m?.[1]?.trim() ?? null;
}

export async function authenticate(req: Request): Promise<AuthContext> {
  const token = extractBearer(req);
  if (!token) {
    throw new ApiError(401, "Missing Authorization: Bearer <api_key>");
  }
  if (!token.startsWith("ytb_")) {
    throw new ApiError(401, "Invalid API key format");
  }

  const hash = hashApiKey(token);

  const [row] = await db
    .select({
      apiKeyId: apiKeys.id,
      userId: users.id,
      plan: users.plan,
      revokedAt: apiKeys.revokedAt,
    })
    .from(apiKeys)
    .innerJoin(users, eq(apiKeys.userId, users.id))
    .where(and(eq(apiKeys.keyHash, hash), isNull(apiKeys.revokedAt)))
    .limit(1);

  if (!row) {
    throw new ApiError(401, "Invalid or revoked API key");
  }

  await db
    .update(apiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKeys.id, row.apiKeyId))
    .catch(() => {});

  return {
    userId: row.userId,
    plan: row.plan,
    apiKeyId: row.apiKeyId,
  };
}
