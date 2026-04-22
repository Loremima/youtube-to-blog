"use client";

import { useState } from "react";

export default function RevealKey({ plaintext }: { plaintext: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(plaintext);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <div className="space-y-3">
      <label className="label">Your API key</label>
      <div className="flex items-stretch gap-2">
        <code className="flex-1 overflow-x-auto rounded-md border border-neutral-300 bg-neutral-50 px-3 py-2 font-mono text-xs">
          {plaintext}
        </code>
        <button type="button" className="btn-primary" onClick={copy}>
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <p className="text-xs text-neutral-500">
        Store this in a password manager. You'll use it both to sign into the
        dashboard and as the API Bearer token.
      </p>
    </div>
  );
}
