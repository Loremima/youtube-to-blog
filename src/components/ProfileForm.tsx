"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export interface ProfileFormValues {
  id?: string;
  name: string;
  tone: string;
  sections_template: string[];
  cta_text: string | null;
  keywords_seo: string[];
  target_word_count: number;
}

const DEFAULT: ProfileFormValues = {
  name: "",
  tone: "professional, clear, and engaging",
  sections_template: ["Introduction", "Key Takeaways", "Deep Dive", "Conclusion"],
  cta_text: null,
  keywords_seo: [],
  target_word_count: 800,
};

export default function ProfileForm({
  initial,
  mode,
}: {
  initial?: Partial<ProfileFormValues>;
  mode: "create" | "edit";
}) {
  const router = useRouter();
  const [values, setValues] = useState<ProfileFormValues>({ ...DEFAULT, ...initial });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const url =
      mode === "create" ? "/api/profiles" : `/api/profiles/${values.id}`;
    const method = mode === "create" ? "POST" : "PUT";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: values.name,
        tone: values.tone,
        sections_template: values.sections_template.map((s) => s.trim()).filter(Boolean),
        cta_text: values.cta_text?.trim() || null,
        keywords_seo: values.keywords_seo.map((k) => k.trim()).filter(Boolean),
        target_word_count: Number(values.target_word_count),
      }),
    });
    setBusy(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: "Failed" }));
      setError(body.error ?? "Failed");
      return;
    }
    router.push("/dashboard/profiles");
    router.refresh();
  }

  async function onDelete() {
    if (!values.id) return;
    if (!confirm("Delete this profile?")) return;
    setBusy(true);
    const res = await fetch(`/api/profiles/${values.id}`, { method: "DELETE" });
    setBusy(false);
    if (res.ok) {
      router.push("/dashboard/profiles");
      router.refresh();
    }
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-5">
      <div>
        <label className="label">Name</label>
        <input
          className="input"
          required
          value={values.name}
          onChange={(e) => setValues({ ...values, name: e.target.value })}
          placeholder="My blog voice"
        />
      </div>
      <div>
        <label className="label">Tone</label>
        <input
          className="input"
          required
          value={values.tone}
          onChange={(e) => setValues({ ...values, tone: e.target.value })}
          placeholder="professional, clear, and engaging"
        />
      </div>
      <div>
        <label className="label">Section template (one per line, rendered as &lt;h2&gt;)</label>
        <textarea
          className="textarea"
          rows={5}
          value={values.sections_template.join("\n")}
          onChange={(e) =>
            setValues({ ...values, sections_template: e.target.value.split("\n") })
          }
        />
      </div>
      <div>
        <label className="label">SEO keywords (comma-separated)</label>
        <input
          className="input"
          value={values.keywords_seo.join(", ")}
          onChange={(e) =>
            setValues({
              ...values,
              keywords_seo: e.target.value.split(",").map((s) => s.trim()),
            })
          }
          placeholder="ai, video repurposing, content automation"
        />
      </div>
      <div>
        <label className="label">Call to action (optional)</label>
        <input
          className="input"
          value={values.cta_text ?? ""}
          onChange={(e) =>
            setValues({ ...values, cta_text: e.target.value || null })
          }
          placeholder="Subscribe to our newsletter at example.com/newsletter."
        />
      </div>
      <div>
        <label className="label">Target word count</label>
        <input
          type="number"
          className="input"
          min={200}
          max={3000}
          value={values.target_word_count}
          onChange={(e) =>
            setValues({ ...values, target_word_count: Number(e.target.value) })
          }
        />
      </div>

      {error && (
        <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>
      )}

      <div className="flex items-center justify-between">
        <button type="submit" className="btn-primary" disabled={busy}>
          {busy ? "Saving…" : mode === "create" ? "Create profile" : "Save changes"}
        </button>
        {mode === "edit" && (
          <button
            type="button"
            className="text-sm text-red-600 hover:underline"
            onClick={onDelete}
            disabled={busy}
          >
            Delete profile
          </button>
        )}
      </div>
    </form>
  );
}
