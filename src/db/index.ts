import { createPool } from "@vercel/postgres";
import { drizzle } from "drizzle-orm/vercel-postgres";
import * as schema from "./schema";

// `@vercel/postgres` rejects connection strings whose hostname does not contain
// "-pooler." — the Neon Marketplace integration ships POSTGRES_URL as the
// direct host but provides POSTGRES_PRISMA_URL with the pooled hostname.
const pooled = [process.env.POSTGRES_PRISMA_URL, process.env.POSTGRES_URL].find(
  (u): u is string => typeof u === "string" && u.includes("-pooler."),
);

const pool = createPool(pooled ? { connectionString: pooled } : undefined);

export const db = drizzle(pool, { schema });
export * from "./schema";
