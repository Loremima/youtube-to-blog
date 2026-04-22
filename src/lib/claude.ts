import Anthropic from "@anthropic-ai/sdk";
import { buildSystemPrompt, buildUserPrompt, type GenerationInput } from "./prompts";

export class ClaudeError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ClaudeError";
  }
}

const MODEL = "claude-haiku-4-5-20251001";

let client: Anthropic | null = null;
function getClient(): Anthropic {
  if (client) return client;
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new ClaudeError("ANTHROPIC_API_KEY is not configured", 500);
  client = new Anthropic({ apiKey: key });
  return client;
}

export async function generateArticleHtml(input: GenerationInput): Promise<string> {
  const anthropic = getClient();
  const system = buildSystemPrompt(input.profile);
  const user = buildUserPrompt(input);

  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 4096,
    system: [
      {
        type: "text",
        text: system,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [{ role: "user", content: user }],
  });

  const textBlock = message.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new ClaudeError("Claude returned no text content", 502);
  }
  return sanitizeHtml(textBlock.text.trim());
}

function sanitizeHtml(raw: string): string {
  let html = raw.trim();
  html = html.replace(/^```(?:html)?\s*/i, "").replace(/```\s*$/i, "");
  return html.trim();
}
