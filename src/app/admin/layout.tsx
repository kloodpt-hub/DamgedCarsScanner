import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/Sidebar";

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale?: string }>;
}) {
  const session = await auth();
  const { locale = "en" } = await params;

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-bg">
      <Sidebar currentPath="/admin" locale={locale} role={session.user.role} />
      <div
        className={
          locale === "ar"
            ? "mr-[64px] lg:mr-[256px] transition-all duration-300"
            : "ml-[64px] lg:ml-[256px] transition-all duration-300"
        }
      >
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
