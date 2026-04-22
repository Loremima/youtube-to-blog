const VIDEO_ID_RE = /^[A-Za-z0-9_-]{11}$/;

export class InvalidYouTubeUrlError extends Error {
  constructor(input: string) {
    super(`Invalid YouTube URL or video ID: ${input}`);
    this.name = "InvalidYouTubeUrlError";
  }
}

export function extractVideoId(input: string): string {
  const trimmed = input.trim();
  if (VIDEO_ID_RE.test(trimmed)) return trimmed;

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    throw new InvalidYouTubeUrlError(input);
  }

  const host = url.hostname.replace(/^www\./, "");
  if (host === "youtu.be") {
    const id = url.pathname.split("/").filter(Boolean)[0];
    if (id && VIDEO_ID_RE.test(id)) return id;
  }
  if (host === "youtube.com" || host === "m.youtube.com") {
    const v = url.searchParams.get("v");
    if (v && VIDEO_ID_RE.test(v)) return v;
    const parts = url.pathname.split("/").filter(Boolean);
    if ((parts[0] === "shorts" || parts[0] === "embed" || parts[0] === "v") && parts[1]) {
      if (VIDEO_ID_RE.test(parts[1])) return parts[1];
    }
  }
  throw new InvalidYouTubeUrlError(input);
}

export function normalizeUrl(input: string): string {
  const id = extractVideoId(input);
  return `https://www.youtube.com/watch?v=${id}`;
}
