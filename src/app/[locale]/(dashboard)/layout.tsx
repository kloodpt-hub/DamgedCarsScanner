import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/shared/Header";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { PushPrompt } from "@/components/shared/PushPrompt";
import { NotificationDrawerProvider } from "@/components/shared/NotificationDrawer";
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
    <NotificationDrawerProvider locale={safeLocale}>
      <div className="min-h-screen bg-bg">
        <Sidebar locale={safeLocale} role={session.user.role} />
        <Header locale={safeLocale} />
        <MobileBottomNav locale={safeLocale} role={session.user.role} />
        <div className="lg:ms-64 transition-all duration-300">
          <main className="px-4 pt-20 pb-24 lg:px-6 lg:pt-20 lg:pb-6">{children}</main>
        </div>
        <PushPrompt locale={safeLocale} />
      </div>
    </NotificationDrawerProvider>
  );
}
