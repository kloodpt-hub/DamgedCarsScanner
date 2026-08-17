"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Save, ShieldCheck, ShieldAlert, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { getAiSettings, updateAiSettings } from "@/server/actions/ai-settings";

export function AiSettingsEditor({ locale = "en" }: { locale?: string }) {
  const isRtl = locale === "ar";

  const t = {
    status: isRtl ? "الحالة" : "Status",
    configured: isRtl ? "تم التهيئة" : "Configured",
    notConfigured: isRtl ? "غير مهيأ" : "Not Configured",
    enabled: isRtl ? "مفعّل" : "Enabled",
    apiUrl: isRtl ? "رابط API" : "API URL",
    apiKey: isRtl ? "مفتاح API" : "API Key",
    model: isRtl ? "النموذج" : "Model",
    save: isRtl ? "حفظ" : "Save",
    saved: isRtl ? "تم الحفظ بنجاح" : "Saved successfully",
    saveError: isRtl ? "فشل الحفظ" : "Failed to save",
    hint: isRtl
      ? "تُخزن الإعدادات في قاعدة البيانات. تأخذ المفعول فوراً، لا حاجة لإعادة النشر."
      : "Settings are stored in the database. Changes take effect immediately, no redeploy needed.",
    current: isRtl ? "الحالي" : "Current",
    newPlaceholder: isRtl ? "قيمة جديدة…" : "New value…",
    newApiKeyPlaceholder: isRtl ? "مفتاح API جديد…" : "New API key…",
  };

  const [enabled, setEnabled] = useState(false);
  const [apiUrl, setApiUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("gpt-4o-mini");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [apiKeyMasked, setApiKeyMasked] = useState("");

  useEffect(() => {
    getAiSettings()
      .then((settings) => {
        setEnabled(settings.enabled);
        setApiUrl(settings.apiUrl);
        setModel(settings.model);
        setHasApiKey(settings.hasApiKey);
        setApiKeyMasked(settings.apiKey);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await updateAiSettings({
        enabled,
        apiUrl: apiUrl || undefined,
        apiKey: apiKey.trim() || undefined,
        model: model.trim() || undefined,
      });
      if (result.ok) {
        toast.success(t.saved);
        if (apiKey.trim()) {
          setHasApiKey(true);
          setApiKeyMasked(apiKey.slice(0, 4) + "••••••••" + apiKey.slice(-4));
          setApiKey("");
        }
      } else {
        toast.error(result.error || t.saveError);
      }
    } catch {
      toast.error(t.saveError);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-text-muted text-sm">
        <Loader2 className="h-4 w-4 animate-spin" />
        {isRtl ? "جاري التحميل…" : "Loading…"}
      </div>
    );
  }

  const isConfigured = enabled && hasApiKey;

  return (
    <div className="space-y-4">
      <div className={`flex items-center gap-2 ${isRtl ? "flex-row-reverse" : ""}`}>
        <span className="text-sm font-medium text-text">{t.status}:</span>
        {isConfigured ? (
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

      {hasApiKey && (
        <div className="rounded-xl border border-border/60 bg-surface/40 p-4 space-y-2.5 text-sm">
          <div className={`flex ${isRtl ? "flex-row-reverse" : ""} justify-between`}>
            <span className="text-text-muted">{t.apiKey}</span>
            <span className="text-text font-medium font-mono">{apiKeyMasked}</span>
          </div>
          {apiUrl && (
            <div className={`flex ${isRtl ? "flex-row-reverse" : ""} justify-between`}>
              <span className="text-text-muted">{t.apiUrl}</span>
              <span className="text-text font-medium">{apiUrl}</span>
            </div>
          )}
          <div className={`flex ${isRtl ? "flex-row-reverse" : ""} justify-between`}>
            <span className="text-text-muted">{t.model}</span>
            <span className="text-text font-medium">{model}</span>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between rounded-lg border border-card-border p-3">
        <Label className="cursor-pointer">{t.enabled}</Label>
        <Switch checked={enabled} onCheckedChange={setEnabled} />
      </div>

      <div className="space-y-2">
        <Label>{t.apiUrl}</Label>
        <Input
          dir="ltr"
          value={apiUrl}
          onChange={(e) => setApiUrl(e.target.value)}
          placeholder="https://api.openai.com"
        />
      </div>

      <div className="space-y-2">
        <Label>{t.apiKey}</Label>
        <Input
          type="password"
          dir="ltr"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder={t.newApiKeyPlaceholder}
        />
      </div>

      <div className="space-y-2">
        <Label>{t.model}</Label>
        <Input
          dir="ltr"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          placeholder="gpt-4o-mini"
        />
      </div>

      <div className={`flex flex-wrap items-center gap-2 ${isRtl ? "flex-row-reverse" : ""}`}>
        <Button onClick={handleSave} loading={saving} disabled={saving} size="sm">
          <Save className="h-4 w-4 me-1" />
          {t.save}
        </Button>
      </div>

      <p className="text-xs text-text-muted">{t.hint}</p>
    </div>
  );
}
