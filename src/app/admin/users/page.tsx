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
  params: Promise<{ locale?: string }>;
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
      <div className={`flex items-center justify-between ${isRtl ? "flex-row-reverse" : ""}`}>
        <div>
          <h1 className="text-2xl font-bold text-text">
            {t.nav.users}
          </h1>
          <p className="text-text-muted text-sm mt-1">
            {t.users.manageUsers}
          </p>
        </div>
        <UsersClientActions locale={locale} />
      </div>

      <Card>
        <CardContent>
          {users.length === 0 ? (
            <p className="text-text-muted text-sm py-8 text-center">
              {t.common.noData}
            </p>
          ) : (
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
