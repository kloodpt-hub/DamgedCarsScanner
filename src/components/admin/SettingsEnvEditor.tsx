"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Rocket, ShieldCheck, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { updateEnvVar, redeployService } from "@/server/actions/settings";

export interface SettingsEnvEntry {
  label: string;
  envVar: string;
  value: string;
  configured: boolean;
  isSecret: boolean;
}

interface SettingsEnvEditorProps {
  locale: string;
  entries: SettingsEnvEntry[];
}

const labels = {
  en: {
    configured: "Configured",
    notConfigured: "Not Configured",
    notSet: "— not set —",
    edit: "Edit",
    save: "Save",
    cancel: "Cancel",
    placeholder: "Enter new value…",
    saved: "Saved successfully",
    saveError: "Failed to update value",
    deploy: "Deploy now",
    deploySuccess: "Deploy started",
    deployError: "Failed to start deploy",
    hint: "After saving, the app redeploys automatically so changes take effect (~2 min).",
  },
  ar: {
    configured: "تم التكوين",
    notConfigured: "لم يتم التكوين",
    notSet: "— غير مضبوط —",
    edit: "تعديل",
    save: "حفظ",
    cancel: "إلغاء",
    placeholder: "أدخل قيمة جديدة…",
    saved: "تم الحفظ بنجاح",
    saveError: "فشل تحديث القيمة",
    deploy: "انشر الآن",
    deploySuccess: "بدأ النشر",
    deployError: "فشل بدء النشر",
    hint: "بعد الحفظ، يعاد نشر التطبيق تلقائيًا حتى تسري التغييرات (~دقيقتين).",
  },
};

export function SettingsEnvEditor({ locale, entries }: SettingsEnvEditorProps) {
  const router = useRouter();
  const isRtl = locale === "ar";
  const t = labels[isRtl ? "ar" : "en"];

  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [deploying, setDeploying] = useState(false);

  const startEdit = (envVar: string) => {
    setEditingKey(envVar);
    setInputValue("");
  };

  const cancelEdit = () => {
    setEditingKey(null);
    setInputValue("");
  };

  const handleSave = async (entry: SettingsEnvEntry) => {
    if (!inputValue.trim()) return;
    setSaving(true);
    try {
      await updateEnvVar(entry.envVar, inputValue);
      toast.success(t.saved);
      setEditingKey(null);
      setInputValue("");
      router.refresh();
    } catch {
      toast.error(t.saveError);
    } finally {
      setSaving(false);
    }
  };

  const handleDeploy = async () => {
    setDeploying(true);
    try {
      await redeployService();
      toast.success(t.deploySuccess);
    } catch {
      toast.error(t.deployError);
    } finally {
      setDeploying(false);
    }
  };

  return (
    <div className="space-y-3">
      {entries.map((entry) => (
        <div
          key={entry.envVar}
          className="rounded-xl border border-border/60 bg-surface/40 p-4 space-y-2.5 transition-colors duration-200 ease-premium hover:border-border"
        >
          <div
            className={`flex items-center justify-between gap-2 ${
              isRtl ? "flex-row-reverse" : ""
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm font-medium text-text">{entry.label}</span>
              <code className="text-xs text-text-muted bg-bg px-1.5 py-0.5 rounded min-w-0 break-all">
                {entry.envVar}
              </code>
            </div>
            {entry.configured ? (
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

          {editingKey === entry.envVar ? (
            <div className={`flex items-center gap-2 ${isRtl ? "flex-row-reverse" : ""}`}>
              <Input
                type={entry.isSecret ? "password" : "text"}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={t.placeholder}
                autoFocus
                dir="ltr"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSave(entry);
                  }
                }}
              />
              <Button
                type="button"
                onClick={() => handleSave(entry)}
                loading={saving}
                className="shrink-0"
              >
                {t.save}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={cancelEdit}
                disabled={saving}
                className="shrink-0"
              >
                {t.cancel}
              </Button>
            </div>
          ) : (
            <div className={`flex items-center gap-2 ${isRtl ? "flex-row-reverse" : ""}`}>
              <div className="flex h-10 flex-1 min-w-0 items-center rounded-xl border border-border bg-bg px-3 font-mono text-sm text-text truncate">
                {entry.configured ? (
                  entry.value
                ) : (
                  <span className="text-text-muted">{t.notSet}</span>
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => startEdit(entry.envVar)}
                title={t.edit}
                aria-label={t.edit}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      ))}

      <div className="pt-2 space-y-2">
        <Button
          type="button"
          variant="outline"
          onClick={handleDeploy}
          loading={deploying}
          disabled={deploying}
        >
          <Rocket className="h-4 w-4" />
          {t.deploy}
        </Button>
        <p className="text-xs text-text-muted">{t.hint}</p>
      </div>
    </div>
  );
}
