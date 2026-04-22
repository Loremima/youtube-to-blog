"use client";

import { useState } from "react";

interface Profile {
  id: string;
  name: string;
}

interface Result {
  html: string;
  markdown: string;
  word_count: number;
  latency_ms: number;
}

export default function TryGenerator({ profiles }: { profiles: Profile[] }) {
  const [url, setUrl] = useState("");
  const [profileId, setProfileId] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setBusy(true);
    setError(null);
    setResult(null);
    const res = await fetch("/dashboard/try/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        youtube_url: url,
        style_profile_id: profileId || null,
      }),
    });
    setBusy(false);
    const body = await res.json().catch(() => ({ error: "Invalid response" }));
    if (!res.ok) {
      setError(body.error ?? `Failed with status ${res.status}`);
      return;
    }
    setResult(body);
  }

  return (
    <div className="space-y-6">
      <div className="card space-y-4">
        <div>
          <label className="label">YouTube URL</label>
          <input
            className="input"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://youtu.be/VIDEO_ID"
          />
        </div>
        <div>
          <label className="label">Style profile (optional)</label>
          <select
            className="select"
            value={profileId}
            onChange={(e) => setProfileId(e.target.value)}
          >
            <option value="">— No profile (generic) —</option>
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          className="btn-primary"
          disabled={!url || busy}
          onClick={generate}
        >
          {busy ? "Generating…" : "Generate article"}
        </button>
        {error && (
          <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>
        )}
      </div>

      {result && (
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Result</h2>
              <p className="text-sm text-neutral-500">
                {result.word_count} words · {result.latency_ms} ms
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                className="btn-ghost"
                onClick={() => navigator.clipboard.writeText(result.html)}
              >
                Copy HTML
              </button>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => navigator.clipboard.writeText(result.markdown)}
              >
                Copy Markdown
              </button>
            </div>
          </div>
          <article
            className="prose max-w-none rounded-md border border-neutral-200 bg-neutral-50 p-4"
            dangerouslySetInnerHTML={{ __html: result.html }}
          />
        </div>
      )}
    </div>
  );
}
