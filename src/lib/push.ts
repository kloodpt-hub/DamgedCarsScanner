import webpush from "web-push";
import type { PushSubscription } from "web-push";

let vapidKeysInitialized = false;

function initVapid() {
  if (vapidKeysInitialized) return;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;

  if (!publicKey || !privateKey) {
    console.warn("[push] VAPID keys not configured");
    return;
  }

  webpush.setVapidDetails(
    "mailto:" + (process.env.FROM_EMAIL || "noreply@damagedcarscanner.com"),
    publicKey,
    privateKey
  );
  vapidKeysInitialized = true;
}

export function isPushConfigured(): boolean {
  return (
    !!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
    !!process.env.VAPID_PRIVATE_KEY
  );
}

export async function sendPushNotification(
  subscription: PushSubscription,
  payload: { title: string; body: string; url?: string }
): Promise<boolean> {
  initVapid();
  if (!vapidKeysInitialized) return false;

  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
    return true;
  } catch (err) {
    console.error("[push] Failed to send:", err);
    return false;
  }
}

export function generateVapidKeys(): {
  publicKey: string;
  privateKey: string;
} {
  return webpush.generateVAPIDKeys();
}
