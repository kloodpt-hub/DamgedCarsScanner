import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/shared/Header";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { PushPrompt } from "@/components/shared/PushPrompt";
import { NotificationDrawerProvider } from "@/components/shared/NotificationDrawer";
import { SidebarProvider } from "@/components/shared/SidebarProvider";
import { ShellMain } from "@/components/shared/ShellMain";
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
      <SidebarProvider>
        <div className="min-h-screen bg-bg">
          <Sidebar locale={safeLocale} role={session.user.role} />
          <Header locale={safeLocale} />
          <MobileBottomNav locale={safeLocale} role={session.user.role} />
          <ShellMain>{children}</ShellMain>
          <PushPrompt locale={safeLocale} />
        </div>
      </SidebarProvider>
    </NotificationDrawerProvider>
  );
}
