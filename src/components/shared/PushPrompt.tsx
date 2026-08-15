"use client";

import { useState, useEffect } from "react";
import { Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  subscribeToPush,
  isPushSupported,
  isIosDevice,
  isIosPwa,
  getIosPushHint,
} from "@/lib/push-client";

const labels = {
  en: {
    title: "Enable Push Notifications",
    description:
      "Get instant alerts when new matching cars are listed, even when this tab is closed.",
    enable: "Enable",
    notNow: "Not now",
    blockedTitle: "Notifications blocked",
    blockedText:
      "Notifications are blocked by your browser. Enable them in your site settings or browser permissions, then try again.",
    enabled: "Push notifications enabled!",
    notConfigured: "Push notifications not configured by admin",
    allowFirst:
      "Push only works after you allow notifications. Click Enable and choose Allow in the browser dialog.",
    iosHint: getIosPushHint("en"),
  },
  ar: {
    title: "تفعيل إشعارات الويب",
    description:
      "احصل على تنبيهات فورية عند ظهور سيارات مطابقة جديدة، حتى أثناء إغلاق هذه الصفحة.",
    enable: "تفعيل",
    notNow: "لاحقًا",
    blockedTitle: "الإشعارات محظورة",
    blockedText:
      "تم حظر الإشعارات بواسطة المتصفح. فعّلها من إعدادات الموقع أو أذونات المتصفح ثم حاول مرة أخرى.",
    enabled: "تم تفعيل إشعارات الويب!",
    notConfigured: "الإشعارات غير مكوّنة من قبل المسؤول",
    allowFirst:
      "تعمل الإشعارات فقط بعد السماح بها. اضغط تفعيل واختر السماح في نافذة المتصفح.",
    iosHint: getIosPushHint("ar"),
  },
} as const;

interface PushPromptProps {
  locale?: string;
}

export function PushPrompt({ locale = "en" }: PushPromptProps) {
  const [show, setShow] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [busy, setBusy] = useState(false);

  const t = labels[locale === "ar" ? "ar" : "en"];
  const iosHint =
    show && isIosDevice() && !isIosPwa() && isPushSupported();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const dismissed = localStorage.getItem("push-prompt-dismissed");
    if (dismissed) return;
    if ("Notification" in window && Notification.permission === "granted") {
      return;
    }
    const timer = setTimeout(() => setShow(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  const dismiss = () => {
    localStorage.setItem("push-prompt-dismissed", "1");
    setShow(false);
  };

  const handleEnable = async () => {
    if (busy) return;
    setBusy(true);
    setBlocked(false);
    try {
      const result = await subscribeToPush();
      if (result.ok) {
        toast.success(t.enabled);
        dismiss();
        return;
      }
      if (result.reason === "denied") {
        setBlocked(true);
        return;
      }
      if (result.reason === "no-vapid") {
        toast.error(t.notConfigured);
        return;
      }
      if (result.reason === "no-permission" || result.reason === "default") {
        toast(t.allowFirst);
        return;
      }
      toast.error(t.allowFirst);
    } finally {
      setBusy(false);
    }
  };

  const handleDismiss = () => dismiss();

  if (!show) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm animate-in slide-in-from-bottom-4">
      <div className="card shadow-xl border-primary/20">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-primary/10 shrink-0">
            <Bell className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            {blocked ? (
              <>
                <h3 className="text-sm font-semibold text-text">
                  {t.blockedTitle}
                </h3>
                <p className="text-xs text-text-muted mt-1">{t.blockedText}</p>
              </>
            ) : (
              <>
                <h3 className="text-sm font-semibold text-text">{t.title}</h3>
                <p className="text-xs text-text-muted mt-1">{t.description}</p>
              </>
            )}
            {iosHint && !blocked && (
              <p className="text-xs text-warning mt-2">{t.iosHint}</p>
            )}
            <div className="flex items-center gap-2 mt-3">
              {blocked ? (
                <Button size="sm" variant="ghost" onClick={handleDismiss}>
                  {t.notNow}
                </Button>
              ) : (
                <>
                  <Button size="sm" onClick={handleEnable} disabled={busy}>
                    {t.enable}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={handleDismiss}>
                    {t.notNow}
                  </Button>
                </>
              )}
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="p-2.5 -m-2.5 text-text-muted hover:text-text"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
