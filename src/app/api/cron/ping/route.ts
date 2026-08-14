import { NextResponse } from "next/server";
import { startKeepAlive } from "@/lib/cron/keep-alive";

export async function GET() {
  // Start the internal keep-alive if not already running
  startKeepAlive();

  return NextResponse.json({
    status: "ok",
    message: "Keep-alive ping received",
    timestamp: new Date().toISOString(),
  });
}
