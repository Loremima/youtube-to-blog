import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { TranscriptError } from "./transcript";
import { ClaudeError } from "./claude";
import { InvalidYouTubeUrlError } from "./youtube";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code?: string,
    public readonly extra?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function jsonError(
  status: number,
  message: string,
  extra?: Record<string, unknown>,
): NextResponse {
  return NextResponse.json({ error: message, ...extra }, { status });
}

export function handleUnknownError(e: unknown): NextResponse {
  if (e instanceof ApiError) {
    return jsonError(e.status, e.message, { code: e.code, ...e.extra });
  }
  if (e instanceof ZodError) {
    return jsonError(400, "Invalid request body", { issues: e.issues });
  }
  if (e instanceof InvalidYouTubeUrlError) {
    return jsonError(400, e.message);
  }
  if (e instanceof TranscriptError) {
    const status = e.status >= 500 ? 502 : e.status === 404 ? 404 : 502;
    return jsonError(status, `Transcript fetch failed: ${e.message}`);
  }
  if (e instanceof ClaudeError) {
    return jsonError(e.status >= 500 ? 502 : e.status, `Generation failed: ${e.message}`);
  }
  console.error("unhandled:", e);
  const debug =
    e instanceof Error
      ? `${e.name}: ${e.message}${e.cause ? ` | cause=${String(e.cause).slice(0, 200)}` : ""}`
      : String(e).slice(0, 300);
  return jsonError(500, "Internal server error", { debug });
}
