"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export default function LoginForm() {
  const router = useRouter();
  const [key, setKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_key: key.trim() }),
    });
    setBusy(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: "Invalid" }));
      setError(body.error ?? "Invalid key");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-4">
      <div>
        <label className="label">API key</label>
        <input
          className="input font-mono text-xs"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="ytb_live_…"
          autoFocus
        />
      </div>
      {error && (
        <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>
      )}
      <button type="submit" disabled={busy || !key} className="btn-primary w-full">
        {busy ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
