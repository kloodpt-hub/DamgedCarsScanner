import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { startKeepAlive } from "@/lib/cron/keep-alive";
import { startScrapeScheduler } from "@/lib/cron/scrape-scheduler";

function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

export async function GET(request: Request) {
  // Fail-closed: if the secret is not configured, never allow.
  if (!process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }

  const authHeader = request.headers.get("authorization");
  if (!authHeader || !safeCompare(authHeader, `Bearer ${process.env.CRON_SECRET}`)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Start the internal keep-alive and scrape scheduler if not already running
  startKeepAlive();
  startScrapeScheduler();

  return NextResponse.json({
    status: "ok",
    message: "Keep-alive ping received",
    timestamp: new Date().toISOString(),
  });
}
