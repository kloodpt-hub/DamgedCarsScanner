import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/shared/Header";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { isLocale, type Locale } from "@/lib/i18n/routing";

export default async function AdminLayout({
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

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect(`/${safeLocale}/login`);
  }

  return (
    <div className="min-h-screen bg-bg">
      <Sidebar locale={safeLocale} role={session.user.role} />
      <Header locale={safeLocale} />
      <MobileBottomNav locale={safeLocale} role={session.user.role} />
      <div className="lg:ml-64 transition-all duration-300">
        <main className="p-4 lg:p-6 pt-20 pb-24 lg:pb-6">{children}</main>
      </div>
    </div>
  );
}
