import { NextResponse } from "next/server";
import { z } from "zod";
import { getStripe, appUrl } from "@/lib/stripe";
import { PLAN_LIMITS } from "@/lib/plans";
import { handleUnknownError } from "@/lib/errors";

export const runtime = "nodejs";

const Body = z.object({
  plan: z.enum(["solo", "creator"]),
  email: z.string().email().optional(),
});

export async function POST(req: Request) {
  try {
    const body = Body.parse(await req.json());
    const envKey = PLAN_LIMITS[body.plan].stripePriceEnv;
    if (!envKey) {
      return NextResponse.json({ error: "Plan not billable" }, { status: 400 });
    }
    const priceId = process.env[envKey];
    if (!priceId) {
      return NextResponse.json(
        { error: `Missing Stripe price env var: ${envKey}` },
        { status: 500 },
      );
    }

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: body.email,
      success_url: appUrl(
        `/welcome?session_id={CHECKOUT_SESSION_ID}&plan=${body.plan}`,
      ),
      cancel_url: appUrl("/?canceled=1"),
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      metadata: { plan: body.plan },
      subscription_data: { metadata: { plan: body.plan } },
    });

    return NextResponse.json({ url: session.url, id: session.id });
  } catch (e) {
    return handleUnknownError(e);
  }
}
