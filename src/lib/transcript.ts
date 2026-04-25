import { normalizeUrl } from "./youtube";

export class TranscriptError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "TranscriptError";
  }
}

const TRANSCRIPT_API_URL =
  process.env.TRANSCRIPTAPI_URL ??
  "https://transcriptapi.com/api/v2/youtube/transcript";

interface TranscriptResponse {
  text?: string;
  transcript?: string;
  title?: string;
  language?: string;
  duration?: number;
}

export interface Transcript {
  text: string;
  title: string | null;
  language: string | null;
  durationSeconds: number | null;
  videoUrl: string;
}

export async function fetchTranscript(
  youtubeUrl: string,
  apiKey = process.env.TRANSCRIPTAPI_KEY,
): Promise<Transcript> {
  if (!apiKey) {
    throw new TranscriptError("TRANSCRIPTAPI_KEY is not configured", 500);
  }

  const videoUrl = normalizeUrl(youtubeUrl);

  const url = new URL(TRANSCRIPT_API_URL);
  url.searchParams.set("video_url", videoUrl);
  url.searchParams.set("format", "text");
  url.searchParams.set("include_timestamp", "false");

  const res = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new TranscriptError(
      `TranscriptAPI returned ${res.status}: ${body.slice(0, 200)}`,
      res.status,
    );
  }

  const data = (await res.json()) as TranscriptResponse;
  const text = data.text ?? data.transcript;
  if (!text) {
    throw new TranscriptError("TranscriptAPI returned empty transcript", 502);
  }

  return {
    text,
    title: data.title ?? null,
    language: data.language ?? null,
    durationSeconds: data.duration ?? null,
    videoUrl,
  };
}
