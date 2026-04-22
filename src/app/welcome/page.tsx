import Link from "next/link";
import { eq } from "drizzle-orm";
import { db, keyReveals } from "@/db";
import RevealKey from "./RevealKey";

interface Props {
  searchParams: { session_id?: string; plan?: string };
}

export default async function WelcomePage({ searchParams }: Props) {
  const sessionId = searchParams.session_id;
  if (!sessionId) {
    return (
      <div className="mx-auto max-w-xl px-6 py-16 text-center">
        <h1 className="text-2xl font-semibold">Welcome</h1>
        <p className="mt-2 text-sm text-neutral-600">
          Missing session id.{" "}
          <Link href="/login" className="text-brand">
            Sign in here
          </Link>
          .
        </p>
      </div>
    );
  }

  const [row] = await db
    .select()
    .from(keyReveals)
    .where(eq(keyReveals.sessionId, sessionId));

  let plaintext: string | null = null;
  if (row && row.expiresAt > new Date()) {
    plaintext = row.plaintext;
    await db.delete(keyReveals).where(eq(keyReveals.sessionId, sessionId));
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <div className="card space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">You're in 🎉</h1>
          <p className="mt-2 text-sm text-neutral-600">
            Your{" "}
            <strong className="capitalize">{searchParams.plan ?? "subscription"}</strong>{" "}
            plan is active. Copy your API key — this is the only time we show it
            in plaintext.
          </p>
        </div>
        {plaintext ? (
          <RevealKey plaintext={plaintext} />
        ) : (
          <div className="rounded-md bg-amber-50 p-4 text-sm text-amber-800">
            This one-time key has already been revealed or the link has expired.{" "}
            Sign in with the key you saved, or{" "}
            <a href="mailto:lorenzo@amnura.co" className="underline">
              contact support
            </a>{" "}
            to reset.
          </div>
        )}
        <div className="border-t border-neutral-200 pt-4 text-sm">
          <Link href="/login" className="text-brand hover:underline">
            Go to sign in →
          </Link>
        </div>
      </div>
    </div>
  );
}
