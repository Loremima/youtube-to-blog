# YouTube-to-Blog

Transform any YouTube video into a blog article in your brand's voice.
Configure your style once (tone, section structure, CTAs) — each new video
automatically becomes a publish-ready article, via UI or API.

## Why

Every YouTube-to-blog SaaS produces generic markdown that requires heavy human
editing. This project ships two differentiators:

1. **Persistent style profile** — configure tone, section template, SEO
   keywords and CTAs once, then apply them automatically to every article.
2. **REST API + webhook** — automate the full pipeline "YouTube upload →
   styled article" from n8n, Make, Zapier, or any backend.

## Stack

- **Framework:** Next.js 14 (app router) on Vercel
- **Database:** Vercel Postgres (Neon) via Drizzle ORM
- **AI:** Claude Haiku 4.5 (`@anthropic-ai/sdk`)
- **Transcripts:** [TranscriptAPI](https://transcriptapi.com)
- **Billing:** Stripe (checkout + webhook)

## Local dev

```bash
npm install
cp .env.example .env.local   # fill in secrets
npm run db:push              # apply schema to Postgres
npm run dev
```

Visit http://localhost:3000.

## API

### `POST /api/generate`

Generate an article from a YouTube URL using your style profile.

**Request:**

```bash
curl -X POST https://<app>/api/generate \
  -H "Authorization: Bearer ytb_live_xxx" \
  -H "Content-Type: application/json" \
  -d '{"youtube_url": "https://youtu.be/VIDEO_ID", "style_profile_id": "..."}'
```

**Response:**

```json
{
  "html": "<article>…</article>",
  "markdown": "# Title\n…",
  "word_count": 842
}
```

**Errors:** `401` invalid key · `402` plan required · `429` quota exceeded.

## Pricing

| Plan    | Price    | Articles/mo | API | Style profiles |
|---------|----------|-------------|-----|----------------|
| Free    | $0       | 3           | ❌  | 1              |
| Solo    | $9/mo    | 25          | ✅  | 3              |
| Creator | $19/mo   | 100         | ✅  | 10             |

## Env vars

See `.env.example`. Required in production:

- `POSTGRES_URL` — auto-injected by Vercel Postgres
- `TRANSCRIPTAPI_KEY` — https://transcriptapi.com
- `ANTHROPIC_API_KEY` — https://console.anthropic.com
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_SOLO`, `STRIPE_PRICE_CREATOR` — product price IDs
- `NEXT_PUBLIC_APP_URL` — public URL (e.g. `https://yt2blog.vercel.app`)

## License

MIT
