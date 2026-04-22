"use client";

import { useState } from "react";

export default function PricingCta({
  plan,
  label,
}: {
  plan: "solo" | "creator";
  label: string;
}) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan, email: email || undefined }),
    });
    const body = await res.json().catch(() => null);
    if (!res.ok || !body?.url) {
      setBusy(false);
      setError(body?.error ?? "Unable to start checkout");
      return;
    }
    window.location.href = body.url as string;
  }

  return (
    <div className="space-y-2">
      <input
        type="email"
        className="input"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <button
        type="button"
        className="btn-primary w-full"
        disabled={busy}
        onClick={start}
      >
        {busy ? "Redirecting…" : label}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
