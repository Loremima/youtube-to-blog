import { describe, it, expect } from "vitest";
import {
  buildSystemPrompt,
  htmlToMarkdown,
  countWords,
} from "../src/lib/prompts";
import type { StyleProfile } from "../src/db/schema";

function makeProfile(overrides: Partial<StyleProfile> = {}): StyleProfile {
  return {
    id: "sp_test",
    userId: "usr_test",
    name: "test",
    tone: "witty and direct",
    sectionsTemplate: ["Intro", "Body", "Outro"],
    ctaText: "Subscribe at example.com.",
    keywordsSeo: ["ai", "content"],
    targetWordCount: 600,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe("buildSystemPrompt", () => {
  it("includes tone and sections from profile", () => {
    const p = makeProfile();
    const sys = buildSystemPrompt(p);
    expect(sys).toContain("witty and direct");
    expect(sys).toContain('"Intro", "Body", "Outro"');
    expect(sys).toContain("600 words");
    expect(sys).toContain("ai, content");
    expect(sys).toContain("Subscribe at example.com.");
  });
  it("uses defaults without a profile", () => {
    const sys = buildSystemPrompt(null);
    expect(sys).toContain("800 words");
    expect(sys).toContain("Introduction");
  });
});

describe("htmlToMarkdown", () => {
  it("converts headings and paragraphs", () => {
    const md = htmlToMarkdown("<h1>Title</h1><p>Hello <strong>world</strong></p>");
    expect(md).toContain("# Title");
    expect(md).toContain("Hello **world**");
  });
  it("converts links and lists", () => {
    const md = htmlToMarkdown(
      '<ul><li>A</li><li><a href="https://x.com">B</a></li></ul>',
    );
    expect(md).toContain("- A");
    expect(md).toContain("[B](https://x.com)");
  });
});

describe("countWords", () => {
  it("strips HTML and counts words", () => {
    expect(countWords("<p>Hello world</p>")).toBe(2);
    expect(countWords("<h1>a</h1><p>b c d</p>")).toBe(4);
  });
});
