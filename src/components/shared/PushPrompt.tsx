"use client";

import { useState, useEffect } from "react";
import { Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";

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
    if (!("Notification" in window)) return;
    const permission = await Notification.requestPermission();
    if (permission === "granted" && "serviceWorker" in navigator) {
      try {
        await navigator.serviceWorker.ready;
        // Try to subscribe - the alerts page has the full subscription logic
        // Just request permission here, full subscription happens on alerts page
      } catch {}
    }
    setShow(false);
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
          <button onClick={handleDismiss} className="text-text-muted hover:text-text">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
