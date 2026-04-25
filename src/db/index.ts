import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// Allow the HTTP-based Neon driver to use full results so drizzle's row
// shape is preserved.
neonConfig.fetchConnectionCache = true;

// `@vercel/postgres` enforces a "-pooler." hostname on the connection string,
// which the Neon Marketplace integration does not always satisfy. The
// `@neondatabase/serverless` HTTP driver works with any Neon URL — direct or
// pooled — so we use it as the runtime database adapter.
const url =
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL_NON_POOLING ||
  "";

const sql = neon(url);
export const db = drizzle(sql, { schema });
export * from "./schema";
