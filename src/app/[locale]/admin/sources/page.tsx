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
import { SourcesClientActions } from "./SourcesClientActions";

export default async function SourcesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale = "en" } = await params;
  const t = await getDictionary(locale as Locale);
  const isRtl = locale === "ar";

  const sources = await prisma.scraperSource.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className={`flex flex-wrap items-center justify-between gap-3 ${isRtl ? "flex-row-reverse" : ""}`}>
        <div>
          <h1 className="text-2xl font-bold text-text">
            {t.nav.sources}
          </h1>
          <p className="text-text-muted text-sm mt-1">
            {t.sources.manageSources}
          </p>
        </div>
        <SourcesClientActions locale={locale} />
      </div>

      <Card>
        <CardContent>
          {sources.length === 0 ? (
            <p className="text-text-muted text-sm py-8 text-center">
              {t.common.noData}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.sources.sourceName}</TableHead>
                  <TableHead>{t.sources.baseUrl}</TableHead>
                  <TableHead>{t.sources.adapterType}</TableHead>
                  <TableHead>{t.sources.interval}</TableHead>
                  <TableHead>{t.sources.lastScraped}</TableHead>
                  <TableHead>{t.sources.status}</TableHead>
                  <TableHead className="text-end">{t.sources.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sources.map((source) => (
                  <TableRow key={source.id}>
                    <TableCell className="font-medium text-text">
                      {source.name}
                    </TableCell>
                    <TableCell className="text-text-muted max-w-[200px] truncate" dir="ltr">
                      {source.baseUrl}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{source.adapterType}</Badge>
                    </TableCell>
                    <TableCell className="text-text">
                      {source.scrapeIntervalMinutes}m
                    </TableCell>
                    <TableCell className="text-text-muted">
                      {source.lastScrapedAt
                        ? formatDate(source.lastScrapedAt, locale)
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={source.isActive ? "success" : "secondary"}
                      >
                        {source.isActive
                          ? t.sources.active
                          : t.sources.inactive}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <SourceRowActions
                        source={source}
                        locale={locale}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SourceRowActions({
  source,
  locale,
}: {
  source: {
    id: string;
    name: string;
    baseUrl: string;
    adapterType: string;
    selectors: unknown;
    isActive: boolean;
    scrapeIntervalMinutes: number;
  };
  locale: string;
}) {
  return (
    <div className="flex justify-end gap-1">
      <SourcesClientActions
        locale={locale}
        sourceId={source.id}
        sourceName={source.name}
        source={source}
        inline
      />
    </div>
  );
}
