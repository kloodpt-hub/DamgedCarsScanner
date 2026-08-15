import webpush from "web-push";
import type { PushSubscription } from "web-push";
import { prisma } from "./prisma";

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

export type RichPushPayload = {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  tag?: string;
  renotify?: boolean;
  actions?: { action: string; title: string }[];
  url?: string;
  data?: Record<string, unknown>;
};

export async function sendPushNotification(
  subscription: PushSubscription,
  payload: RichPushPayload
): Promise<boolean> {
  initVapid();
  if (!vapidKeysInitialized) return false;

  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
    return true;
  } catch (err) {
    const statusCode = (err as { statusCode?: number })?.statusCode;
    if (statusCode === 404 || statusCode === 410) {
      try {
        await prisma.pushSubscription.deleteMany({
          where: { endpoint: subscription.endpoint },
        });
      } catch (cleanupErr) {
        console.error("[push] Failed to clean up dead subscription:", cleanupErr);
      }
    }
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
