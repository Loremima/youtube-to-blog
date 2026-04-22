import {
  pgTable,
  text,
  timestamp,
  integer,
  jsonb,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";

export const planEnum = pgEnum("plan", ["free", "solo", "creator"]);

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  plan: planEnum("plan").notNull().default("free"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  planPeriodEnd: timestamp("plan_period_end", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const apiKeys = pgTable(
  "api_keys",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    keyHash: text("key_hash").notNull().unique(),
    keyPrefix: text("key_prefix").notNull(),
    label: text("label").notNull().default("default"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
  },
  (t) => ({
    keyHashIdx: index("api_keys_key_hash_idx").on(t.keyHash),
    userIdx: index("api_keys_user_idx").on(t.userId),
  }),
);

export const styleProfiles = pgTable(
  "style_profiles",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    tone: text("tone").notNull().default("professional"),
    sectionsTemplate: jsonb("sections_template")
      .$type<string[]>()
      .notNull()
      .default([]),
    ctaText: text("cta_text"),
    keywordsSeo: jsonb("keywords_seo").$type<string[]>().notNull().default([]),
    targetWordCount: integer("target_word_count").notNull().default(800),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    userIdx: index("style_profiles_user_idx").on(t.userId),
  }),
);

export const keyReveals = pgTable("key_reveals", {
  sessionId: text("session_id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  plaintext: text("plaintext").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const usageLogs = pgTable(
  "usage_logs",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    apiKeyId: text("api_key_id").references(() => apiKeys.id, {
      onDelete: "set null",
    }),
    youtubeUrl: text("youtube_url").notNull(),
    styleProfileId: text("style_profile_id").references(() => styleProfiles.id),
    wordCount: integer("word_count"),
    latencyMs: integer("latency_ms"),
    status: text("status").notNull(),
    errorMessage: text("error_message"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    userMonthIdx: index("usage_logs_user_created_idx").on(
      t.userId,
      t.createdAt,
    ),
  }),
);

export type User = typeof users.$inferSelect;
export type ApiKey = typeof apiKeys.$inferSelect;
export type StyleProfile = typeof styleProfiles.$inferSelect;
export type UsageLog = typeof usageLogs.$inferSelect;
export type KeyReveal = typeof keyReveals.$inferSelect;
export type Plan = (typeof planEnum.enumValues)[number];
