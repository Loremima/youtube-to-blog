import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { and, eq, isNull } from "drizzle-orm";
import { db, users, apiKeys, keyReveals } from "@/db";
import { getStripe } from "@/lib/stripe";
import { planFromPriceId } from "@/lib/plans";
import { generateApiKey, newId } from "@/lib/ids";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "STRIPE_WEBHOOK_SECRET not configured" },
      { status: 500 },
    );
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const raw = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, signature, secret);
  } catch (err) {
    console.error("webhook verification failed", err);
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 },
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(stripe, event.data.object);
        break;
      case "customer.subscription.updated":
      case "customer.subscription.created":
        await handleSubscriptionChange(event.data.object);
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object);
        break;
      default:
        break;
    }
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("webhook handler error", event.type, err);
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }
}

async function handleCheckoutCompleted(
  stripe: Stripe,
  session: Stripe.Checkout.Session,
): Promise<void> {
  if (!session.customer || !session.subscription) return;

  const customerId =
    typeof session.customer === "string" ? session.customer : session.customer.id;
  const subscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription.id;

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const item = subscription.items.data[0];
  if (!item) return;
  const plan = planFromPriceId(item.price.id);
  if (!plan) return;

  const email =
    session.customer_details?.email ??
    session.customer_email ??
    (await stripe.customers.retrieve(customerId).then((c) =>
      !c || c.deleted ? null : (c.email ?? null),
    ));
  if (!email) return;

  const periodEnd = new Date(subscription.current_period_end * 1000);

  const [existing] = await db.select().from(users).where(eq(users.email, email));

  let userId: string;
  let plaintextForReveal: string | null = null;

  if (existing) {
    userId = existing.id;
    await db
      .update(users)
      .set({
        plan,
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        planPeriodEnd: periodEnd,
      })
      .where(eq(users.id, existing.id));

    const [activeKey] = await db
      .select({ id: apiKeys.id })
      .from(apiKeys)
      .where(and(eq(apiKeys.userId, existing.id), isNull(apiKeys.revokedAt)))
      .limit(1);
    if (!activeKey) {
      const apiKey = generateApiKey();
      await db.insert(apiKeys).values({
        id: newId("key"),
        userId,
        keyHash: apiKey.hash,
        keyPrefix: apiKey.prefix,
        label: "default",
      });
      plaintextForReveal = apiKey.plaintext;
    }
  } else {
    userId = newId("usr");
    await db.insert(users).values({
      id: userId,
      email,
      plan,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      planPeriodEnd: periodEnd,
    });
    const apiKey = generateApiKey();
    await db.insert(apiKeys).values({
      id: newId("key"),
      userId,
      keyHash: apiKey.hash,
      keyPrefix: apiKey.prefix,
      label: "default",
    });
    plaintextForReveal = apiKey.plaintext;
  }

  if (plaintextForReveal) {
    const expiresAt = new Date(Date.now() + 1000 * 60 * 30);
    await db.insert(keyReveals).values({
      sessionId: session.id,
      userId,
      plaintext: plaintextForReveal,
      expiresAt,
    });
  }
}

async function handleSubscriptionChange(
  subscription: Stripe.Subscription,
): Promise<void> {
  const item = subscription.items.data[0];
  if (!item) return;
  const plan = planFromPriceId(item.price.id);
  if (!plan) return;
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;
  const periodEnd = new Date(subscription.current_period_end * 1000);
  await db
    .update(users)
    .set({ plan, planPeriodEnd: periodEnd, stripeSubscriptionId: subscription.id })
    .where(eq(users.stripeCustomerId, customerId));
}

async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription,
): Promise<void> {
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;
  await db
    .update(users)
    .set({ plan: "free", stripeSubscriptionId: null })
    .where(eq(users.stripeCustomerId, customerId));
}
