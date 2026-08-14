const PING_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
let pingTimer: ReturnType<typeof setInterval> | null = null;

export function startKeepAlive(): void {
  if (pingTimer) return; // already running
  if (process.env.NODE_ENV !== "production") return; // only in production

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

  const ping = async () => {
    try {
      const res = await fetch(`${baseUrl}/api/health`, {
        method: "GET",
        signal: AbortSignal.timeout(10000),
      });
      console.log(`[keep-alive] Pinged /api/health: ${res.status} at ${new Date().toISOString()}`);
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
