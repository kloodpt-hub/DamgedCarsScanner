import { prisma } from "@/lib/prisma";
import { getDictionary, type Locale } from "@/lib/i18n";
import { formatDate } from "@/lib/utils";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { UsersClientActions } from "./UsersClientActions";

export default async function UsersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale = "en" } = await params;
  const t = await getDictionary(locale as Locale);
  const isRtl = locale === "ar";

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  }) as Array<{
    id: string;
    name: string | null;
    email: string;
    role: string;
    createdAt: Date;
  }>;

  const roleBadge = (role: string) => {
    return role === "ADMIN"
      ? { variant: "default" as const, label: t.users.admin }
      : { variant: "secondary" as const, label: t.users.user };
  };

  return (
    <div className="space-y-6">
      <div className={`flex flex-wrap items-center justify-between gap-3 ${isRtl ? "flex-row-reverse" : ""}`}>
        <div className="space-y-1.5">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            {isRtl ? "الإدارة" : "Admin"}
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-text">
            {t.nav.users}
          </h1>
          <p className="text-text-muted text-sm">
            {t.users.manageUsers}
          </p>
        </div>
        <UsersClientActions locale={locale} />
      </div>

      <div className="rounded-[1.75rem] bg-surface/70 p-1.5 ring-1 ring-border/40">
        <Card className="shadow-none">
          <CardContent>
            {users.length === 0 ? (
              <p className="text-text-muted text-sm py-8 text-center">
                {t.common.noData}
              </p>
            ) : (
              <>
                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t.users.name}</TableHead>
                        <TableHead>{t.auth.email}</TableHead>
                        <TableHead>{t.users.role}</TableHead>
                        <TableHead>{t.users.created}</TableHead>
                        <TableHead className="text-end">{t.sources.actions}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => {
                        const badge = roleBadge(user.role);
                        return (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium text-text">
                              {user.name ?? "-"}
                            </TableCell>
                            <TableCell className="text-text-muted">{user.email}</TableCell>
                            <TableCell>
                              <Badge variant={badge.variant}>{badge.label}</Badge>
                            </TableCell>
                            <TableCell className="text-text-muted">
                              {formatDate(user.createdAt, locale)}
                            </TableCell>
                            <TableCell>
                              <UsersClientActions
                                locale={locale}
                                userId={user.id}
                                userName={user.name ?? user.email}
                                currentRole={user.role}
                                inline
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                <div className="md:hidden space-y-3">
                  {users.map((user) => {
                    const badge = roleBadge(user.role);
                    return (
                      <div
                        key={user.id}
                        className="rounded-2xl border border-card-border bg-card-bg p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-text truncate">
                              {user.name ?? "-"}
                            </p>
                            <p className="mt-0.5 text-xs text-text-muted truncate" dir="ltr">
                              {user.email}
                            </p>
                          </div>
                          <Badge variant={badge.variant} className="shrink-0">
                            {badge.label}
                          </Badge>
                        </div>
                        <div className="mt-3 flex items-center justify-between gap-3">
                          <p className="text-xs text-text-muted">
                            {t.users.created}: {formatDate(user.createdAt, locale)}
                          </p>
                          <UsersClientActions
                            locale={locale}
                            userId={user.id}
                            userName={user.name ?? user.email}
                            currentRole={user.role}
                            inline
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
