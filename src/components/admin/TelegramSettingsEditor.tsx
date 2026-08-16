"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Save, Webhook, ShieldCheck, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  updateTelegramSettings,
  registerTelegramWebhook,
} from "@/server/actions/telegram";

export function TelegramSettingsEditor({
  locale = "en",
  configured,
  tokenMasked,
  username,
}: {
  locale?: string;
  configured: boolean;
  tokenMasked: string | null;
  username: string | null;
}) {
  const isRtl = locale === "ar";
  const t = {
    status: isRtl ? "الحالة" : "Status",
    configured: isRtl ? "تم التهيئة" : "Configured",
    notConfigured: isRtl ? "غير مهيأ" : "Not Configured",
    token: isRtl ? "رمز البوت" : "Bot Token",
    username: isRtl ? "اسم المستخدم" : "Bot Username",
    save: isRtl ? "حفظ" : "Save",
    saved: isRtl ? "تم الحفظ بنجاح" : "Saved successfully",
    saveError: isRtl ? "فشل الحفظ" : "Failed to save",
    register: isRtl ? "تفعيل الويب هوك" : "Register Webhook",
    registerSuccess: isRtl ? "تم تفعيل الويب هوك" : "Webhook registered",
    registerError: isRtl ? "فشل تفعيل الويب هوك" : "Failed to register webhook",
    hint: isRtl
      ? "تُخزن القيم في قاعدة البيانات، وتُقرأ مباشرة دون إعادة نشر."
      : "Values are stored in the database and read directly, no redeploy needed.",
    current: isRtl ? "الحالي" : "Current",
  };

  const [token, setToken] = useState("");
  const [user, setUser] = useState("");
  const [saving, setSaving] = useState(false);
  const [registering, setRegistering] = useState(false);

  const handleSave = async () => {
    if (!token.trim() && !user.trim()) return;
    setSaving(true);
    try {
      const result = await updateTelegramSettings({
        token: token.trim() || undefined,
        username: user.trim() || undefined,
      });
      if (result.ok) {
        toast.success(t.saved);
        setToken("");
        setUser("");
      } else {
        toast.error(result.error || t.saveError);
      }
    } catch {
      toast.error(t.saveError);
    } finally {
      setSaving(false);
    }
  };

  const handleRegister = async () => {
    setRegistering(true);
    try {
      const result = await registerTelegramWebhook();
      if (result.ok) {
        toast.success(t.registerSuccess);
      } else {
        toast.error(result.error || t.registerError);
      }
    } catch {
      toast.error(t.registerError);
    } finally {
      setRegistering(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className={`flex items-center gap-2 ${isRtl ? "flex-row-reverse" : ""}`}>
        <span className="text-sm font-medium text-text">{t.status}:</span>
        {configured ? (
          <Badge variant="success" className="gap-1">
            <ShieldCheck className="h-3 w-3" />
            {t.configured}
          </Badge>
        ) : (
          <Badge variant="secondary" className="gap-1">
            <ShieldAlert className="h-3 w-3" />
            {t.notConfigured}
          </Badge>
        )}
      </div>

      {configured && (
        <div className="rounded-xl border border-border/60 bg-surface/40 p-4 space-y-2.5 text-sm">
          <div className={`flex ${isRtl ? "flex-row-reverse" : ""} justify-between`}>
            <span className="text-text-muted">{t.username}</span>
            <span className="text-text font-medium">@{username ?? "-"}</span>
          </div>
          <div className={`flex ${isRtl ? "flex-row-reverse" : ""} justify-between`}>
            <span className="text-text-muted">{t.token}</span>
            <span className="text-text font-medium font-mono">{tokenMasked}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input
          type="password"
          dir="ltr"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder={isRtl ? "رمز البوت الجديد…" : "New bot token…"}
        />
        <Input
          dir="ltr"
          value={user}
          onChange={(e) => setUser(e.target.value)}
          placeholder={isRtl ? "اسم مستخدم البوت…" : "New bot username…"}
        />
      </div>

      <div className={`flex flex-wrap items-center gap-2 ${isRtl ? "flex-row-reverse" : ""}`}>
        <Button onClick={handleSave} loading={saving} disabled={saving} size="sm">
          <Save className="h-4 w-4 me-1" />
          {t.save}
        </Button>
        <Button
          onClick={handleRegister}
          variant="outline"
          loading={registering}
          disabled={registering}
          size="sm"
        >
          <Webhook className="h-4 w-4 me-1" />
          {t.register}
        </Button>
      </div>

      <p className="text-xs text-text-muted">{t.hint}</p>
    </div>
  );
}
