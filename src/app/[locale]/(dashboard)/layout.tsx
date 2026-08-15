import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/Sidebar";
import { PushPrompt } from "@/components/shared/PushPrompt";
import { isLocale, type Locale } from "@/lib/i18n/routing";

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }
  const safeLocale = locale as Locale;

  const session = await auth();

  if (!session?.user) {
    redirect(`/${safeLocale}/login`);
  }

  return (
    <div className="min-h-screen bg-bg">
      <Sidebar locale={safeLocale} role={session.user.role} />
      <div className="lg:ml-64 transition-all duration-300">
        <main className="p-4 lg:p-6 pt-16 lg:pt-6">{children}</main>
      </div>
      <PushPrompt />
    </div>
  );
}
