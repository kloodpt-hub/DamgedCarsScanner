"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SourceForm } from "@/components/admin/SourceForm";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { RunSourceButton } from "@/components/admin/RunSourceButton";
import { deleteSource } from "@/server/actions/sources";

interface SourcesClientActionsProps {
  locale: string;
  sourceId?: string;
  sourceName?: string;
  source?: {
    id: string;
    name: string;
    baseUrl: string;
    adapterType: string;
    selectors: unknown;
    isActive: boolean;
    scrapeIntervalMinutes: number;
  };
  inline?: boolean;
}

export function SourcesClientActions({
  locale,
  sourceId,
  sourceName,
  source,
  inline,
}: SourcesClientActionsProps) {
  const router = useRouter();
  const isRtl = locale === "ar";
  const [showForm, setShowForm] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const handleDelete = async () => {
    if (!sourceId) return;
    try {
      await deleteSource(sourceId);
      toast.success(isRtl ? "تم الحذف" : "Deleted successfully");
      setShowDelete(false);
      router.refresh();
    } catch {
      toast.error(isRtl ? "فشل في الحذف" : "Failed to delete");
    }
  };

  if (inline && sourceId) {
    return (
      <>
        <RunSourceButton sourceId={sourceId} locale={locale} />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowForm(true)}
          title={isRtl ? "تعديل" : "Edit"}
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowDelete(true)}
          title={isRtl ? "حذف" : "Delete"}
        >
          <Trash2 className="h-4 w-4 text-danger" />
        </Button>
        <ConfirmDialog
          open={showDelete}
          title={isRtl ? "حذف المصدر" : "Delete Source"}
          message={
            isRtl
              ? `هل أنت متأكد من حذف "${sourceName}"؟ هذا الإجراء لا يمكن التراجع عنه.`
              : `Are you sure you want to delete "${sourceName}"? This action cannot be undone.`
          }
          onConfirm={handleDelete}
          onCancel={() => setShowDelete(false)}
          variant="danger"
          locale={locale}
        />
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowForm(false)}
            />
            <div className="relative bg-card-bg border border-card-border rounded-xl shadow-xl p-6 max-w-lg w-full mx-4 z-10">
              <h2 className="text-lg font-semibold text-text mb-4">
                {isRtl ? "تعديل المصدر" : "Edit Source"}
              </h2>
              <SourceForm
                source={source ?? {
                  id: sourceId,
                  name: sourceName ?? "",
                  baseUrl: "",
                  adapterType: "generic",
                  selectors: {},
                  isActive: true,
                  scrapeIntervalMinutes: 60,
                }}
                locale={locale}
                onSuccess={() => {
                  setShowForm(false);
                  router.refresh();
                }}
                onCancel={() => setShowForm(false)}
              />
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <Button onClick={() => setShowForm(true)}>
        <Plus className="h-4 w-4" />
        {isRtl ? "إضافة مصدر" : "Add Source"}
      </Button>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowForm(false)}
          />
          <div className="relative bg-card-bg border border-card-border rounded-xl shadow-xl p-6 max-w-lg w-full mx-4 z-10">
            <h2 className="text-lg font-semibold text-text mb-4">
              {isRtl ? "إضافة مصدر جديد" : "Add New Source"}
            </h2>
            <SourceForm
              locale={locale}
              onSuccess={() => {
                setShowForm(false);
                router.refresh();
              }}
              onCancel={() => setShowForm(false)}
            />
          </div>
        </div>
      )}
    </>
  );
}
