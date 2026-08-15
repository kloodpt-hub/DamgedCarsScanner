import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { isLocale } from "@/lib/i18n/routing";

export default async function AuthLayout({
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

  const session = await auth();

  if (session?.user) {
    redirect(`/${locale}/dashboard`);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-4">
      {children}
    </div>
  );
}
