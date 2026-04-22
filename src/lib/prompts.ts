import type { StyleProfile } from "@/db/schema";
import type { Transcript } from "./transcript";

export interface GenerationInput {
  transcript: Transcript;
  profile: StyleProfile | null;
}

const DEFAULT_TONE = "professional, clear, and engaging";
const DEFAULT_SECTIONS = [
  "Introduction",
  "Key Takeaways",
  "Deep Dive",
  "Conclusion",
];

export function buildSystemPrompt(profile: StyleProfile | null): string {
  const tone = profile?.tone || DEFAULT_TONE;
  const sections =
    profile?.sectionsTemplate && profile.sectionsTemplate.length > 0
      ? profile.sectionsTemplate
      : DEFAULT_SECTIONS;
  const keywords = profile?.keywordsSeo ?? [];
  const cta = profile?.ctaText;
  const targetWords = profile?.targetWordCount ?? 800;

  return `You are a senior content writer who repurposes YouTube video transcripts into publish-ready blog articles.

Strict rules:
- Write in this tone: ${tone}.
- Produce approximately ${targetWords} words (accept ±20%).
- Use this exact section structure, one <h2> per section, in this order: ${sections.map((s) => `"${s}"`).join(", ")}.
- Output VALID, SEMANTIC HTML ONLY (no markdown fences, no <html> or <body> tags). Use <h1>, <h2>, <h3>, <p>, <ul>, <li>, <strong>, <em>, <blockquote>, <a href>. Do not include inline styles.
- The first element must be a single <h1> with the article title.
${keywords.length > 0 ? `- Naturally weave these SEO keywords into the article: ${keywords.join(", ")}.` : ""}
${cta ? `- End the final section with this call-to-action in a <p> block: "${cta}".` : ""}
- Never fabricate facts absent from the transcript. If the transcript is sparse, explicitly summarize without inventing details.
- Do not wrap the output in markdown code fences.`;
}

export function buildUserPrompt({ transcript }: GenerationInput): string {
  const titleLine = transcript.title ? `Video title: ${transcript.title}\n` : "";
  const langLine = transcript.language ? `Language: ${transcript.language}\n` : "";
  return `${titleLine}${langLine}Source URL: ${transcript.videoUrl}

Transcript:
"""
${transcript.text}
"""

Write the article now. Return ONLY the HTML.`;
}

export function htmlToMarkdown(html: string): string {
  let md = html;
  // Inline transforms first so nested markers survive block stripTags.
  md = md.replace(/<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, (_m, href, t) => `[${stripTags(t)}](${href})`);
  md = md.replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, (_m, t) => `**${stripTags(t)}**`);
  md = md.replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, (_m, t) => `*${stripTags(t)}*`);
  // Block transforms.
  md = md.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, (_m, t) => `\n# ${stripTags(t)}\n\n`);
  md = md.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, (_m, t) => `\n## ${stripTags(t)}\n\n`);
  md = md.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, (_m, t) => `\n### ${stripTags(t)}\n\n`);
  md = md.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_m, t) => `- ${stripTags(t)}\n`);
  md = md.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, (_m, t) => `${stripTags(t)}\n\n`);
  md = md.replace(/<\/?(ul|ol|blockquote)[^>]*>/gi, "\n");
  md = md.replace(/<br\s*\/?\s*>/gi, "\n");
  md = md.replace(/<[^>]+>/g, "");
  md = md.replace(/\n{3,}/g, "\n\n").trim();
  return md;
}

function stripTags(s: string): string {
  return s.replace(/<[^>]+>/g, "").trim();
}

export function countWords(html: string): number {
  const text = html.replace(/<[^>]+>/g, " ");
  const words = text.trim().split(/\s+/).filter(Boolean);
  return words.length;
}
