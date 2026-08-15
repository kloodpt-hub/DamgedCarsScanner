"use client";

import { useState, useEffect } from "react";
import { Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getCsrfToken } from "@/lib/csrf-client";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
export function PushPrompt() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Check if user has dismissed the prompt before
    const dismissed = localStorage.getItem("push-prompt-dismissed");
    if (dismissed) return;

    // Check if push is already enabled
    if ("Notification" in window && Notification.permission === "granted") {
      return;
    }

    // Check if this is first login (no push subscriptions)
    // Show after a short delay
    const timer = setTimeout(() => setShow(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleEnable = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return;

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      localStorage.setItem("push-prompt-dismissed", "1");
      setShow(false);
      return;
    }

    if (!("serviceWorker" in navigator)) {
      localStorage.setItem("push-prompt-dismissed", "1");
      setShow(false);
      return;
    }

    try {
      const reg = await navigator.serviceWorker.ready;

      const statusRes = await fetch("/api/notifications/status");
      if (!statusRes.ok) throw new Error("Failed to fetch push config");
      const statusData = await statusRes.json();

      if (!statusData.vapidPublicKey) {
        toast.error("Push notifications not configured by admin");
        localStorage.setItem("push-prompt-dismissed", "1");
        setShow(false);
        return;
      }

      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(statusData.vapidPublicKey) as BufferSource,
      });

      const csrfToken = await getCsrfToken();
      const subRes = await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(csrfToken ? { "X-CSRF-Token": csrfToken } : {}),
        },
        body: JSON.stringify(subscription),
      });

      if (!subRes.ok) throw new Error("Failed to save subscription");

      toast.success("Push notifications enabled!");
      localStorage.setItem("push-prompt-dismissed", "1");
      setShow(false);
    } catch {
      toast.error("Failed to enable push notifications. You can try again later.");
      // Don't set localStorage - let them try again
    }
  };

  const handleDismiss = () => {
    localStorage.setItem("push-prompt-dismissed", "1");
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm animate-in slide-in-from-bottom-4">
      <div className="card shadow-xl border-primary/20">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-primary/10 shrink-0">
            <Bell className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-text">Enable Push Notifications</h3>
            <p className="text-xs text-text-muted mt-1">
              Get instant alerts when new matching cars are listed, even when this tab is closed.
            </p>
            <div className="flex items-center gap-2 mt-3">
              <Button size="sm" onClick={handleEnable}>Enable</Button>
              <Button size="sm" variant="ghost" onClick={handleDismiss}>Not now</Button>
            </div>
          </div>
          <button onClick={handleDismiss} className="p-2.5 -m-2.5 text-text-muted hover:text-text">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
