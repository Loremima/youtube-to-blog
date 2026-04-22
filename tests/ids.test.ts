import { describe, it, expect } from "vitest";
import { newId, generateApiKey, hashApiKey } from "../src/lib/ids";

describe("newId", () => {
  it("prefixes and produces unique ids", () => {
    const a = newId("usr");
    const b = newId("usr");
    expect(a).toMatch(/^usr_[0-9a-f]{24}$/);
    expect(a).not.toBe(b);
  });
});

describe("generateApiKey", () => {
  it("produces ytb_live_ prefix and stable hash", () => {
    const k = generateApiKey();
    expect(k.plaintext.startsWith("ytb_live_")).toBe(true);
    expect(k.prefix).toBe(k.plaintext.slice(0, 16));
    expect(k.hash).toHaveLength(64);
    expect(hashApiKey(k.plaintext)).toBe(k.hash);
  });
});
