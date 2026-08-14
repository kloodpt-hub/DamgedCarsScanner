"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";

interface UsersClientActionsProps {
  locale: string;
  userId?: string;
  userName?: string;
  currentRole?: string;
  inline?: boolean;
}

export function UsersClientActions({
  locale,
  userId,
  userName,
  currentRole,
  inline,
}: UsersClientActionsProps) {
  const router = useRouter();
  const isRtl = locale === "ar";
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [role, setRole] = useState(currentRole ?? "USER");
  const [loading, setLoading] = useState(false);

  const handleRoleUpdate = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (res.ok) {
        toast.success(isRtl ? "تم التحديث" : "Updated");
        setShowEdit(false);
        router.refresh();
      } else {
        toast.error(isRtl ? "فشل" : "Failed");
      }
    } catch {
      toast.error(isRtl ? "حدث خطأ" : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success(isRtl ? "تم الحذف" : "Deleted");
        setShowDelete(false);
        router.refresh();
      } else {
        toast.error(isRtl ? "فشل" : "Failed");
      }
    } catch {
      toast.error(isRtl ? "حدث خطأ" : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const name = form.get("name") as string;
    const email = form.get("email") as string;
    const password = form.get("password") as string;
    const userRole = form.get("role") as string;

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role: userRole }),
      });
      if (res.ok) {
        toast.success(isRtl ? "تم الإنشاء" : "Created");
        setShowAdd(false);
        router.refresh();
      } else {
        const data = await res.json();
        toast.error(data.error || (isRtl ? "فشل" : "Failed"));
      }
    } catch {
      toast.error(isRtl ? "حدث خطأ" : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (inline && userId) {
    return (
      <div className="flex justify-end gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setRole(currentRole ?? "USER");
            setShowEdit(true);
          }}
          title={isRtl ? "تعديل الدور" : "Edit Role"}
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

        {showEdit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowEdit(false)}
            />
            <div className="relative bg-card-bg border border-card-border rounded-xl shadow-xl p-6 max-w-sm w-full mx-4 z-10">
              <h2 className="text-lg font-semibold text-text mb-4">
                {isRtl ? "تعديل الدور" : "Edit Role"}
              </h2>
              <p className="text-sm text-text-muted mb-4">{userName}</p>
              <Select value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="USER">User</option>
                <option value="ADMIN">Admin</option>
              </Select>
              <div className="flex justify-end gap-3 mt-6">
                <Button variant="outline" onClick={() => setShowEdit(false)}>
                  {isRtl ? "إلغاء" : "Cancel"}
                </Button>
                <Button onClick={handleRoleUpdate} loading={loading}>
                  {isRtl ? "حفظ" : "Save"}
                </Button>
              </div>
            </div>
          </div>
        )}

        <ConfirmDialog
          open={showDelete}
          title={isRtl ? "حذف المستخدم" : "Delete User"}
          message={
            isRtl
              ? `هل أنت متأكد من حذف "${userName}"؟`
              : `Are you sure you want to delete "${userName}"?`
          }
          onConfirm={handleDelete}
          onCancel={() => setShowDelete(false)}
          variant="danger"
        />
      </div>
    );
  }

  return (
    <>
      <Button onClick={() => setShowAdd(true)}>
        <Plus className="h-4 w-4" />
        {isRtl ? "إضافة مستخدم" : "Add User"}
      </Button>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowAdd(false)}
          />
          <div className="relative bg-card-bg border border-card-border rounded-xl shadow-xl p-6 max-w-md w-full mx-4 z-10">
            <h2 className="text-lg font-semibold text-text mb-4">
              {isRtl ? "إضافة مستخدم جديد" : "Add New User"}
            </h2>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-text">
                  {isRtl ? "الاسم" : "Name"}
                </label>
                <Input name="name" required />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-text">
                  {isRtl ? "البريد الإلكتروني" : "Email"}
                </label>
                <Input name="email" type="email" required dir="ltr" />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-text">
                  {isRtl ? "كلمة المرور" : "Password"}
                </label>
                <Input name="password" type="password" required minLength={6} dir="ltr" />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-text">
                  {isRtl ? "الدور" : "Role"}
                </label>
                <Select name="role" defaultValue="USER">
                  <option value="USER">User</option>
                  <option value="ADMIN">Admin</option>
                </Select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowAdd(false)}>
                  {isRtl ? "إلغاء" : "Cancel"}
                </Button>
                <Button type="submit" loading={loading}>
                  {isRtl ? "إنشاء" : "Create"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
