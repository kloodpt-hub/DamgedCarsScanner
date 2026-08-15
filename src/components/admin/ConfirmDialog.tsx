"use client";

import { useEffect, useRef } from "react";
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
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 sm:p-6">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div className="relative bg-card-bg border border-card-border rounded-xl shadow-xl p-6 max-w-md w-full z-10 max-h-[calc(100dvh-2rem)] overflow-y-auto">
        <h2 className="text-lg font-semibold text-text mb-2">{title}</h2>
        <p className="text-sm text-text-muted mb-6">{message}</p>
        <div className="flex justify-end gap-3">
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
