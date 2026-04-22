import { and, eq, gte, sql } from "drizzle-orm";
import { db, usageLogs } from "@/db";
import type { Plan } from "@/db/schema";
import { PLAN_LIMITS } from "./plans";
import { ApiError } from "./errors";

export interface QuotaStatus {
  ok: boolean;
  used: number;
  limit: number;
  resetAt: Date;
  plan: Plan;
}

export function currentPeriod(now = new Date()): { start: Date; end: Date } {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  return { start, end };
}

export async function checkQuota(
  userId: string,
  plan: Plan,
  now = new Date(),
): Promise<QuotaStatus> {
  const { start, end } = currentPeriod(now);
  const limits = PLAN_LIMITS[plan];

  if (!limits.apiAccess && plan === "free") {
    // Free plan has no API access — this throws before reaching /api/generate
    // via an external flag check if needed. Kept here to keep policy in one place.
  }

  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(usageLogs)
    .where(
      and(
        eq(usageLogs.userId, userId),
        eq(usageLogs.status, "success"),
        gte(usageLogs.createdAt, start),
      ),
    );

  const used = row?.count ?? 0;

  return {
    ok: used < limits.monthlyArticles,
    used,
    limit: limits.monthlyArticles,
    resetAt: end,
    plan,
  };
}

export function enforceApiAccess(plan: Plan): void {
  if (!PLAN_LIMITS[plan].apiAccess) {
    throw new ApiError(
      402,
      "API access is not included in your plan. Upgrade to Solo or Creator.",
    );
  }
}
