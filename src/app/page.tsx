import Link from "next/link";
import PricingCta from "@/components/PricingCta";

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-lg font-semibold">
            YouTube-to-Blog
          </Link>
          <nav className="flex items-center gap-6 text-sm">
            <a href="#how" className="hover:text-brand">
              How it works
            </a>
            <a href="#pricing" className="hover:text-brand">
              Pricing
            </a>
            <a href="#faq" className="hover:text-brand">
              FAQ
            </a>
            <Link href="/login" className="hover:text-brand">
              Sign in
            </Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-24 text-center">
        <p className="text-sm font-semibold uppercase tracking-wider text-brand">
          Your videos · Your voice · Your articles
        </p>
        <h1 className="mt-4 text-5xl font-bold leading-tight tracking-tight md:text-6xl">
          Turn every YouTube video into a blog article{" "}
          <span className="text-brand">in your voice.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-neutral-600">
          Other tools give you generic markdown that needs heavy editing. This
          one lets you configure your brand voice once — tone, section
          structure, CTAs — and produces a publish-ready article from every new
          video, via UI or API.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <a href="#pricing" className="btn-primary">
            Get started · from $9/mo
          </a>
          <Link href="/login" className="btn-ghost">
            I have an API key
          </Link>
        </div>
        <p className="mt-4 text-xs text-neutral-500">
          No credit card for 3 free articles · Cancel anytime.
        </p>
      </section>

      <section id="how" className="border-y border-neutral-200 bg-white py-20">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 md:grid-cols-3">
          <Step
            n={1}
            title="Define your style"
            body="Tone, section template (e.g. Intro · Key Takeaways · Deep Dive · CTA), SEO keywords, target word count. One profile, unlimited articles."
          />
          <Step
            n={2}
            title="Paste a YouTube URL"
            body="Or send one via the REST API from n8n, Make, Zapier, your backend. 30 seconds later you have semantic HTML + Markdown."
          />
          <Step
            n={3}
            title="Copy · Publish · Done"
            body="One-click copy HTML or Markdown. Paste into WordPress, Ghost, Substack, Beehiiv. No manual editing, no retrofitting."
          />
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-5xl px-6 py-24">
        <div className="text-center">
          <h2 className="text-3xl font-bold">Simple pricing</h2>
          <p className="mt-3 text-neutral-600">
            Monthly quota resets the 1st of each month, UTC.
          </p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          <PricingCard
            name="Free"
            price="$0"
            blurb="Try the product."
            features={[
              "3 articles / month",
              "1 style profile",
              "No API access",
            ]}
            cta={<Link href="/login" className="btn-ghost w-full">Sign in</Link>}
          />
          <PricingCard
            name="Solo"
            price="$9"
            blurb="For solo creators."
            highlight
            features={[
              "25 articles / month",
              "3 style profiles",
              "REST API access",
              "Email support",
            ]}
            cta={<PricingCta plan="solo" label="Subscribe · $9/mo" />}
          />
          <PricingCard
            name="Creator"
            price="$19"
            blurb="For weekly publishers."
            features={[
              "100 articles / month",
              "10 style profiles",
              "REST API access",
              "Priority support",
            ]}
            cta={<PricingCta plan="creator" label="Subscribe · $19/mo" />}
          />
        </div>
      </section>

      <section id="faq" className="border-t border-neutral-200 bg-white py-20">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="text-center text-3xl font-bold">FAQ</h2>
          <div className="mt-10 space-y-8 text-sm">
            <Faq q="How is this different from videotoblog.ai or Castmagic?">
              Other tools produce generic markdown. Here you define a{" "}
              <strong>style profile</strong> once — tone, section structure,
              SEO keywords, CTAs — and every article matches your brand
              automatically. Plus we ship a REST API so you can wire it to n8n,
              Make, or your own backend.
            </Faq>
            <Faq q="Which languages are supported?">
              Any language YouTube captions are available in. The output is in
              the same language as the transcript unless you override it in
              your style profile tone.
            </Faq>
            <Faq q="What model powers the generation?">
              Claude Haiku 4.5 by Anthropic. We picked it for speed and cost —
              the average article is generated in under 20 seconds.
            </Faq>
            <Faq q="Can I cancel anytime?">
              Yes, one click inside the Stripe customer portal. Your plan stays
              active until the end of the billing period.
            </Faq>
          </div>
        </div>
      </section>

      <footer className="border-t border-neutral-200 bg-neutral-100 py-10 text-center text-sm text-neutral-500">
        <p>
          © {new Date().getFullYear()} YouTube-to-Blog ·{" "}
          <a href="mailto:lorenzo@amnura.co" className="hover:text-brand">
            lorenzo@amnura.co
          </a>
        </p>
      </footer>
    </div>
  );
}

function Step({
  n,
  title,
  body,
}: {
  n: number;
  title: string;
  body: string;
}) {
  return (
    <div>
      <div className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-brand font-semibold text-white">
        {n}
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-neutral-600">{body}</p>
    </div>
  );
}

function PricingCard({
  name,
  price,
  blurb,
  features,
  cta,
  highlight,
}: {
  name: string;
  price: string;
  blurb: string;
  features: string[];
  cta: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div
      className={`card flex flex-col ${
        highlight ? "border-brand shadow-md ring-1 ring-brand" : ""
      }`}
    >
      <h3 className="text-lg font-semibold">{name}</h3>
      <p className="mt-1 text-sm text-neutral-500">{blurb}</p>
      <p className="mt-6 text-4xl font-bold">
        {price}
        <span className="text-base font-medium text-neutral-500">/mo</span>
      </p>
      <ul className="mt-6 space-y-2 text-sm">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2">
            <span className="text-brand">✓</span>
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <div className="mt-8">{cta}</div>
    </div>
  );
}

function Faq({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="font-semibold">{q}</h3>
      <p className="mt-2 text-neutral-600">{children}</p>
    </div>
  );
}
