const PING_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes
const JITTER_MS = 2 * 60 * 1000; // up to 2 minutes jitter
let pingTimer: ReturnType<typeof setInterval> | null = null;

export function startKeepAlive(): void {
  if (pingTimer) return; // already running
  if (process.env.NODE_ENV !== "production") return; // only in production

  const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL || process.env.NEXTAUTH_URL}`
    : "http://localhost:3000";

  const ping = async () => {
    try {
      const jitter = Math.floor(Math.random() * JITTER_MS);
      await new Promise(r => setTimeout(r, jitter));

      const res = await fetch(`${baseUrl}/api/health`, {
        method: "GET",
        signal: AbortSignal.timeout(10000),
      });
      console.log(`[keep-alive] Pinged /api/health: ${res.status}`);
    } catch (err) {
      console.warn("[keep-alive] Ping failed:", err instanceof Error ? err.message : String(err));
    }
  };

  pingTimer = setInterval(ping, PING_INTERVAL_MS);
  console.log(`[keep-alive] Started, pinging every ${PING_INTERVAL_MS / 60000} minutes`);
}

export function stopKeepAlive(): void {
  if (pingTimer) {
    clearInterval(pingTimer);
    pingTimer = null;
  }
}

// Auto-start in production
if (typeof window === "undefined" && process.env.NODE_ENV === "production") {
  startKeepAlive();
}
