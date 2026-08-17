import { prisma } from "@/lib/prisma";
import { getDictionary, type Locale } from "@/lib/i18n";
import { formatDate } from "@/lib/utils";
import { SITE_CATALOG } from "@/lib/scraper/catalog";
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
import { SourcesViewWrapper } from "./SourcesViewWrapper";

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

  const existingSourceIds = sources
    .map((s) => {
      const entry = SITE_CATALOG.find(
        (c) => c.baseUrl === s.baseUrl || c.name === s.name
      );
      return entry?.id;
    })
    .filter(Boolean) as string[];

  return (
    <div className="space-y-6">
      <div
        className={`flex flex-wrap items-center justify-between gap-3 ${isRtl ? "flex-row-reverse" : ""}`}
      >
        <div className="space-y-1.5">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            {isRtl ? "الإدارة" : "Admin"}
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-text">
            {t.nav.sources}
          </h1>
          <p className="text-text-muted text-sm">
            {t.sources.manageSources}
          </p>
        </div>
        <SourcesClientActions locale={locale} />
      </div>

      <SourcesViewWrapper
        existingSourceIds={existingSourceIds}
        locale={locale}
      >
        <div className="rounded-[1.75rem] bg-surface/70 p-1.5 ring-1 ring-border/40">
          <Card className="shadow-none">
            <CardContent>
              {sources.length === 0 ? (
                <p className="text-text-muted text-sm py-8 text-center">
                  {t.common.noData}
                </p>
              ) : (
                <>
                  <div className="hidden md:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t.sources.sourceName}</TableHead>
                          <TableHead>{t.sources.baseUrl}</TableHead>
                          <TableHead>{t.sources.adapterType}</TableHead>
                          <TableHead>{t.sources.interval}</TableHead>
                          <TableHead>{t.sources.lastScraped}</TableHead>
                          <TableHead>{t.sources.status}</TableHead>
                          <TableHead className="text-end">
                            {t.sources.actions}
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sources.map((source) => (
                          <TableRow key={source.id}>
                            <TableCell className="font-medium text-text">
                              {source.name}
                            </TableCell>
                            <TableCell
                              className="text-text-muted max-w-[200px] truncate"
                              dir="ltr"
                            >
                              {source.baseUrl}
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">
                                {source.adapterType}
                              </Badge>
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
                                variant={
                                  source.isActive ? "success" : "secondary"
                                }
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
                  </div>

                  <div className="md:hidden space-y-3">
                    {sources.map((source) => (
                      <div
                        key={source.id}
                        className="rounded-2xl border border-card-border bg-card-bg p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-text truncate">
                              {source.name}
                            </p>
                            <p
                              className="mt-0.5 text-xs text-text-muted truncate"
                              dir="ltr"
                            >
                              {source.baseUrl}
                            </p>
                          </div>
                          <Badge
                            variant={
                              source.isActive ? "success" : "secondary"
                            }
                            className="shrink-0"
                          >
                            {source.isActive
                              ? t.sources.active
                              : t.sources.inactive}
                          </Badge>
                        </div>
                        <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <dt className="text-xs text-text-muted">
                              {t.sources.adapterType}
                            </dt>
                            <dd className="mt-1">
                              <Badge variant="secondary">
                                {source.adapterType}
                              </Badge>
                            </dd>
                          </div>
                          <div>
                            <dt className="text-xs text-text-muted">
                              {t.sources.interval}
                            </dt>
                            <dd className="mt-0.5 font-semibold text-text">
                              {source.scrapeIntervalMinutes}m
                            </dd>
                          </div>
                        </dl>
                        <div className="mt-3 flex items-center justify-between gap-3">
                          <p className="text-xs text-text-muted">
                            {t.sources.lastScraped}:{" "}
                            {source.lastScrapedAt
                              ? formatDate(source.lastScrapedAt, locale)
                              : "-"}
                          </p>
                          <SourceRowActions source={source} locale={locale} />
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </SourcesViewWrapper>
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
