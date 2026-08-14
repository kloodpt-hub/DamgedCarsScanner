import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/Sidebar";
import { PushPrompt } from "@/components/shared/PushPrompt";

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale?: string }>;
}) {
  const session = await auth();
  const { locale = "en" } = await params;

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-bg">
      <Sidebar locale={locale} role={session.user.role} />
      <div className="lg:ml-64 transition-all duration-300">
        <main className="p-4 lg:p-6 pt-16 lg:pt-6">{children}</main>
      </div>
      <PushPrompt />
    </div>
  );
}
