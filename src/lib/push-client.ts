import { getCsrfToken } from "@/lib/csrf-client";

export interface PushNotificationData {
  url: string;
  listingId?: string;
  title?: string;
  price?: number;
  year?: number;
  mileage?: number;
  sourceName?: string;
  imageUrl?: string;
}

export interface RichPushPayload {
  title: string;
  body: string;
  icon: string;
  badge: string;
  image?: string;
  tag?: string;
  renotify?: boolean;
  actions?: { action: string; title: string }[];
  data: PushNotificationData;
}

type NavigatorWithUaData = Navigator & {
  userAgentData?: { platform?: string };
};

export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "Notification" in window &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    window.isSecureContext
  );
}

export function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const base64WithPadding = (base64 + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const rawData = atob(base64WithPadding);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function isIosDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  const platform =
    (navigator as NavigatorWithUaData).userAgentData?.platform ||
    navigator.platform ||
    "";
  if (/iPad|iPhone|iPod/.test(ua)) return true;
  if (platform === "iPad" || platform === "iPhone" || platform === "iPod") {
    return true;
  }
  if (
    platform === "MacIntel" &&
    typeof window !== "undefined" &&
    navigator.maxTouchPoints > 0 &&
    "ontouchstart" in window
  ) {
    return true;
  }
  return false;
}

export function isIosPwa(): boolean {
  if (typeof window === "undefined" || !isIosDevice()) return false;
  if (window.matchMedia("(display-mode: standalone)").matches) return true;
  return (
    "standalone" in navigator &&
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
  );
}

export async function getVapidPublicKey(): Promise<string> {
  const res = await fetch("/api/notifications/status");
  if (!res.ok) throw new Error("Failed to fetch push config");
  const data = (await res.json()) as { vapidPublicKey?: string };
  if (!data.vapidPublicKey) throw new Error("VAPID public key not configured");
  return data.vapidPublicKey;
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  try {
    return await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  } catch {
    return null;
  }
}

export async function requestNotificationPermission(): Promise<
  "granted" | "denied" | "default" | "unsupported"
> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }
  return Notification.requestPermission();
}

export async function subscribeToPush(): Promise<
  { ok: true } | { ok: false; reason: string }
> {
  if (!isPushSupported()) return { ok: false, reason: "unsupported" };

  try {
    const permission = await Notification.requestPermission();
    if (permission === "denied") return { ok: false, reason: "denied" };
    if (permission !== "granted") return { ok: false, reason: "no-permission" };
  } catch {
    return { ok: false, reason: "no-permission" };
  }

  const reg = await registerServiceWorker();
  if (!reg) return { ok: false, reason: "sw-failed" };

  let vapidPublicKey: string;
  try {
    vapidPublicKey = await getVapidPublicKey();
  } catch {
    return { ok: false, reason: "no-vapid" };
  }

  let subscription: PushSubscription;
  try {
    subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
    });
  } catch {
    return { ok: false, reason: "subscribe-failed" };
  }

  try {
    const csrfToken = await getCsrfToken();
    const res = await fetch("/api/notifications/subscribe", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(csrfToken ? { "X-CSRF-Token": csrfToken } : {}),
      },
      body: JSON.stringify(subscription),
    });
    if (!res.ok) return { ok: false, reason: "save-failed" };
  } catch {
    return { ok: false, reason: "save-failed" };
  }

  return { ok: true };
}

export async function getCurrentSubscription(): Promise<PushSubscription | null> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }
  try {
    const reg = await navigator.serviceWorker.ready;
    return await reg.pushManager.getSubscription();
  } catch {
    return null;
  }
}

export async function unsubscribeFromPush(): Promise<{ ok: boolean }> {
  const subscription = await getCurrentSubscription();
  if (!subscription) return { ok: true };

  try {
    await subscription.unsubscribe();
  } catch {}

  try {
    const csrfToken = await getCsrfToken();
    const res = await fetch("/api/notifications/subscribe", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...(csrfToken ? { "X-CSRF-Token": csrfToken } : {}),
      },
      body: JSON.stringify({ endpoint: subscription.endpoint }),
    });
    return { ok: res.ok };
  } catch {
    return { ok: false };
  }
}

export async function isSubscribed(): Promise<boolean> {
  return !!(await getCurrentSubscription());
}

export const IOS_PUSH_HINTS = {
  en: "Push notifications on iPhone/iPad require adding this app to your Home Screen (iOS 16.4+). Open the Share menu and tap Add to Home Screen.",
  ar: "إشعارات الويب على آيفون/آيباد تتطلب إضافة التطبيق إلى الشاشة الرئيسية (iOS 16.4+). افتح قائمة المشاركة واضغط «أضف إلى الشاشة الرئيسية».",
} as const;

export function getIosPushHint(locale?: string): string {
  return locale === "ar" ? IOS_PUSH_HINTS.ar : IOS_PUSH_HINTS.en;
}
