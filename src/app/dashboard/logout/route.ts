import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/session";

export const runtime = "nodejs";

export async function POST(req: Request) {
  clearSessionCookie();
  const url = new URL("/login", req.url);
  return NextResponse.redirect(url, 303);
}
