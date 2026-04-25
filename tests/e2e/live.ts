/**
 * End-to-end validation of AC1/AC2/AC3/AC4 against a live deployment.
 *
 * Requires env: DEPLOY_URL, POSTGRES_URL (all loaded in CI via `vercel env pull`).
 * Seeds a throw-away test user + API key + style profile directly in Postgres,
 * hits the deployed /api/generate, then cleans up via the users.id CASCADE.
 *
 * AC5 (Stripe checkout → plan activation) is NOT covered here: it requires a
 * real Stripe test-mode checkout flow with signed webhook callbacks and is
 * validated manually in the Stripe dashboard.
 */

import { createClient } from "@vercel/postgres";
import { randomBytes, createHash } from "node:crypto";
import { appendFileSync, writeFileSync } from "node:fs";

const DEPLOY_URL = mustEnv("DEPLOY_URL").replace(/\/$/, "");
mustEnv("POSTGRES_URL");

const TEST_YOUTUBE_URL = "https://youtu.be/dQw4w9WgXcQ";
const SECTIONS = ["Introduction", "Key Takeaways", "Deep Dive", "Conclusion"];
const SOLO_LIMIT = 25;
const AC1_LATENCY_BUDGET_MS = 30_000;
const AC1_WORD_COUNT_MIN = 500;

interface Result {
  name: string;
  pass: boolean;
  detail: string;
}

function mustEnv(key: string): string {
  const v = process.env[key];
  if (!v) throw new Error(`${key} is not set`);
  return v;
}

function newId(prefix: string): string {
  return `${prefix}_${randomBytes(12).toString("hex")}`;
}

function generateApiKey(): { plaintext: string; hash: string; prefix: string } {
  const raw = randomBytes(24).toString("base64url");
  const plaintext = `ytb_live_${raw}`;
  const hash = createHash("sha256").update(plaintext).digest("hex");
  return { plaintext, hash, prefix: plaintext.slice(0, 16) };
}

function hasSectionH2(html: string, section: string): boolean {
  const re = new RegExp(
    `<h2[^>]*>\\s*${section.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")}\\s*</h2>`,
    "i",
  );
  return re.test(html);
}

async function main(): Promise<void> {
  const results: Result[] = [];
  const testEmail = `e2e-${Date.now()}-${randomBytes(3).toString("hex")}@executor.local`;
  const userId = newId("usr");
  const keyId = newId("key");
  const profileId = newId("sp");
  const apiKey = generateApiKey();

  // Use createClient so we work with both pooled and direct connection strings.
  // Prefer POSTGRES_URL_NON_POOLING when present — it is always a direct
  // connection accepted by createClient — falling back to POSTGRES_URL.
  const connectionString =
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.POSTGRES_URL ||
    "";
  const client = createClient({ connectionString });
  await client.connect();

  console.log(`[seed] user=${userId} email=${testEmail} profile=${profileId}`);
  try {
    await client.sql`INSERT INTO users (id, email, plan) VALUES (${userId}, ${testEmail}, 'solo')`;
    await client.sql`
      INSERT INTO api_keys (id, user_id, key_hash, key_prefix, label)
      VALUES (${keyId}, ${userId}, ${apiKey.hash}, ${apiKey.prefix}, 'e2e')
    `;
    await client.sql`
      INSERT INTO style_profiles
        (id, user_id, name, tone, sections_template, cta_text, keywords_seo, target_word_count)
      VALUES
        (${profileId}, ${userId}, 'E2E', 'professional',
         ${JSON.stringify(SECTIONS)}::jsonb,
         'Try the API at example.com.',
         ${JSON.stringify(["youtube", "repurposing"])}::jsonb,
         600)
    `;

    // AC3 — invalid key → 401
    {
      const r = await fetch(`${DEPLOY_URL}/api/generate`, {
        method: "POST",
        headers: {
          Authorization: "Bearer ytb_live_bogus_invalid_key",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ youtube_url: TEST_YOUTUBE_URL }),
      });
      results.push({
        name: "AC3 invalid API key → 401",
        pass: r.status === 401,
        detail: `status=${r.status}`,
      });
    }

    // AC1 + AC2 — valid key + style profile → 200, ≥500 words, <30s, H2s for each section
    {
      const t0 = Date.now();
      const r = await fetch(`${DEPLOY_URL}/api/generate`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey.plaintext}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          youtube_url: TEST_YOUTUBE_URL,
          style_profile_id: profileId,
        }),
      });
      const elapsedMs = Date.now() - t0;
      const body = (await r.json().catch(() => ({}))) as {
        html?: string;
        word_count?: number;
        error?: string;
        debug?: string;
      };
      const html = body.html ?? "";
      const wc = body.word_count ?? 0;

      results.push({
        name: "AC1 generate → 200 + words≥500 + <30s",
        pass:
          r.status === 200 &&
          wc >= AC1_WORD_COUNT_MIN &&
          elapsedMs < AC1_LATENCY_BUDGET_MS,
        detail: `status=${r.status} words=${wc} elapsed=${elapsedMs}ms err=${body.error ?? "-"} debug=${body.debug ?? "-"}`,
      });

      const missing = SECTIONS.filter((s) => !hasSectionH2(html, s));
      results.push({
        name: "AC2 style profile sections → one <h2> per section",
        pass: r.status === 200 && missing.length === 0,
        detail: missing.length === 0 ? "all sections present" : `missing=${missing.join(",")}`,
      });
    }

    // AC4 — quota exhausted → 429 + reset_at
    {
      // Seed (limit - 1) additional success rows so total equals the limit
      // (we already used 1 quota slot via AC1 above).
      const already = 1;
      const toSeed = SOLO_LIMIT - already;
      for (let i = 0; i < toSeed; i++) {
        await client.sql`
          INSERT INTO usage_logs (id, user_id, api_key_id, youtube_url, status)
          VALUES (${newId("log")}, ${userId}, ${keyId}, ${TEST_YOUTUBE_URL}, 'success')
        `;
      }
      const r = await fetch(`${DEPLOY_URL}/api/generate`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey.plaintext}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ youtube_url: TEST_YOUTUBE_URL }),
      });
      const body = (await r.json().catch(() => ({}))) as {
        reset_at?: string;
        used?: number;
        limit?: number;
      };
      const resetAtValid =
        typeof body.reset_at === "string" && !Number.isNaN(Date.parse(body.reset_at));
      results.push({
        name: "AC4 quota exceeded → 429 + reset_at ISO-8601",
        pass: r.status === 429 && resetAtValid,
        detail: `status=${r.status} used=${body.used ?? "-"} limit=${body.limit ?? "-"} reset_at=${body.reset_at ?? "-"}`,
      });
    }
  } finally {
    try {
      await client.sql`DELETE FROM users WHERE id = ${userId}`;
    } catch (e) {
      console.error("[cleanup] delete failed:", e);
    }
    await client.end().catch(() => {});
  }

  const pass = results.every((r) => r.pass);
  const table =
    "| Check | Pass | Detail |\n|---|---|---|\n" +
    results
      .map((r) => `| ${r.name} | ${r.pass ? "✅" : "❌"} | \`${r.detail}\` |`)
      .join("\n");

  console.log("\n" + table + "\n");
  console.log(`overall: ${pass ? "PASS" : "FAIL"}`);

  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(process.env.GITHUB_OUTPUT, `pass=${pass ? "1" : "0"}\n`);
  }
  writeFileSync("/tmp/e2e-results.md", table + `\n\noverall: **${pass ? "✅ PASS" : "❌ FAIL"}**\n`);

  process.exit(pass ? 0 : 1);
}

main().catch((e) => {
  console.error("E2E fatal:", e);
  writeFileSync(
    "/tmp/e2e-results.md",
    `E2E crashed before completion: \`${String(e).slice(0, 500)}\`\n`,
  );
  process.exit(2);
});
