"use client";

import { useEffect, useRef } from "react";
import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: "danger" | "default";
  locale?: string;
}

const confirmLabels = {
  en: { cancel: "Cancel", confirm: "Confirm" },
  ar: { cancel: "إلغاء", confirm: "تأكيد" },
};

export function ConfirmDialog({
  open,
  title,
  message,
  onConfirm,
  onCancel,
  variant = "default",
  locale,
}: ConfirmDialogProps) {
  const t =
    confirmLabels[(locale as keyof typeof confirmLabels) ?? "en"] ??
    confirmLabels.en;
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) {
      cancelRef.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onCancel();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto p-4 sm:p-6">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        className="relative w-full max-w-md rounded-2xl border border-card-border bg-card-bg p-6 shadow-ambient z-10 max-h-[calc(100dvh-2rem)] overflow-y-auto animate-[slide-up-fade_300ms_cubic-bezier(0.32,0.72,0,1)]"
      >
        <div className="flex items-start gap-3">
          {variant === "danger" && (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-danger/10">
              <TriangleAlert className="h-5 w-5 text-danger" />
            </div>
          )}
          <div className="min-w-0">
            <h2 id="confirm-dialog-title" className="text-lg font-semibold tracking-tight text-text mb-1.5">
              {title}
            </h2>
            <p className="text-sm text-text-muted leading-relaxed">{message}</p>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button ref={cancelRef} variant="outline" onClick={onCancel}>
            {t.cancel}
          </Button>
          <Button
            variant={variant === "danger" ? "destructive" : "default"}
            onClick={onConfirm}
          >
            {t.confirm}
          </Button>
        </div>
      </div>
    </div>
  );
}
