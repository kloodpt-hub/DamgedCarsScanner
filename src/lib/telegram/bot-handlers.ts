import { prisma } from "@/lib/prisma";
import { sendTelegramMessage, sendTelegramPhoto } from "@/lib/telegram";
import { evaluateListing } from "@/lib/filters/evaluator";
import {
  getMessages,
  makeKeyboard,
  makeLocaleKeyboard,
  makeGuestKeyboard,
} from "./messages";
import type { BotLocale } from "./messages";
import type { Filter, Listing, User } from "@prisma/client";
import { Prisma } from "@prisma/client";

interface FilterDraft {
  name?: string;
  minPrice?: number | null;
  maxPrice?: number | null;
  minYear?: number | null;
  maxYear?: number | null;
  minMileage?: number | null;
  maxMileage?: number | null;
  damageStatus?: string | null;
  excludedKeywords?: string[];
}

const ANY_ANSWER = new Set(["any", "none", "skip", "-"]);

export async function handleTelegramMessage(
  chatId: string,
  text: string
): Promise<void> {
  try {
    const user = await prisma.user.findFirst({
      where: { telegramChatId: chatId },
    });

    const trimmed = text.trim();
    const parts = trimmed.split(/\s+/);
    const command = parts[0]?.toLowerCase();

    if (!user) {
      if (command === "/start" && parts[1]) {
        await handleConnect(chatId, parts[1]);
      } else {
        const siteUrl =
          process.env.NEXTAUTH_URL ||
          "https://damged-cars-scanner-native.onrender.com";
        await sendTelegramMessage(
          chatId,
          getMessages("en").guestWelcome(siteUrl),
          makeGuestKeyboard("en", siteUrl)
        );
      }
      return;
    }

    const locale: BotLocale = user.locale === "ar" ? "ar" : "en";
    const m = getMessages(locale);

    if (user.telegramConvStep && !trimmed.startsWith("/")) {
      await handleConversationStep(user, chatId, trimmed);
      return;
    }

    switch (command) {
      case "/start":
        if (parts[1]) {
          await handleConnect(chatId, parts[1]);
        } else {
          await sendTelegramMessage(chatId, m.help, makeKeyboard(locale));
        }
        return;
      case "/stop":
      case "/disconnect":
        await prisma.user.updateMany({
          where: { telegramChatId: chatId },
          data: { telegramChatId: null, telegramConvStep: null, telegramConvDraft: Prisma.DbNull },
        });
        await sendTelegramMessage(chatId, m.stopped);
        return;
      case "/pause":
        await prisma.user.update({
          where: { id: user.id },
          data: { telegramPaused: true },
        });
        await sendTelegramMessage(chatId, m.paused);
        return;
      case "/resume":
        await prisma.user.update({
          where: { id: user.id },
          data: { telegramPaused: false },
        });
        await sendTelegramMessage(chatId, m.resumed);
        return;
      case "/language":
        await sendTelegramMessage(chatId, m.chooseLocale, makeLocaleKeyboard());
        return;
      case "/help":
        await sendTelegramMessage(chatId, m.help, makeKeyboard(locale));
        return;
      case "/filters":
        await handleFilters(user, chatId, locale);
        return;
      case "/addfilter":
        await prisma.user.update({
          where: { id: user.id },
          data: { telegramConvStep: "name", telegramConvDraft: {} },
        });
        await sendTelegramMessage(chatId, `${m.addStart}\n${m.cancelHint}`);
        return;
      case "/delfilter":
      case "/deletefilter":
        await handleDeleteFilter(user, chatId, parts.slice(1).join(" "), locale);
        return;
      case "/latest":
        await handleLatest(user, chatId, locale);
        return;
      case "/cancel":
        await prisma.user.update({
          where: { id: user.id },
          data: { telegramConvStep: null, telegramConvDraft: Prisma.DbNull },
        });
        await sendTelegramMessage(chatId, m.cancelDone);
        return;
      default:
        break;
    }

    const lower = trimmed.toLowerCase();
    switch (lower) {
      case "filters":
      case "الفلاتر":
        await handleFilters(user, chatId, locale);
        return;
      case "latest":
      case "أحدث":
        await handleLatest(user, chatId, locale);
        return;
      case "add filter":
      case "إضافة فلتر":
        await prisma.user.update({
          where: { id: user.id },
          data: { telegramConvStep: "name", telegramConvDraft: {} },
        });
        await sendTelegramMessage(chatId, `${m.addStart}\n${m.cancelHint}`);
        return;
      case "help":
      case "مساعدة":
        await sendTelegramMessage(chatId, m.help, makeKeyboard(locale));
        return;
      case "pause":
      case "إيقاف مؤقت":
        await prisma.user.update({
          where: { id: user.id },
          data: { telegramPaused: true },
        });
        await sendTelegramMessage(chatId, m.paused);
        return;
      case "resume":
      case "استئناف":
        await prisma.user.update({
          where: { id: user.id },
          data: { telegramPaused: false },
        });
        await sendTelegramMessage(chatId, m.resumed);
        return;
      case "language":
      case "اللغة":
        await sendTelegramMessage(chatId, m.chooseLocale, makeLocaleKeyboard());
        return;
      case "english":
        await prisma.user.update({
          where: { id: user.id },
          data: { locale: "en" },
        });
        await sendTelegramMessage(
          chatId,
          getMessages("en").languageChanged("en"),
          makeKeyboard("en")
        );
        return;
      case "العربية":
        await prisma.user.update({
          where: { id: user.id },
          data: { locale: "ar" },
        });
        await sendTelegramMessage(
          chatId,
          getMessages("ar").languageChanged("ar"),
          makeKeyboard("ar")
        );
        return;
      default:
        await sendTelegramMessage(chatId, m.unknown);
    }
  } catch (error) {
    console.error("[telegram] handler failed:", error);
  }
}

async function handleConnect(chatId: string, token: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { telegramConnectToken: token },
  });

  if (!user || !user.telegramConnectTokenExpiresAt) {
    await sendTelegramMessage(chatId, getMessages("en").invalidLink);
    return;
  }

  if (user.telegramConnectTokenExpiresAt.getTime() < Date.now()) {
    await sendTelegramMessage(chatId, getMessages("en").invalidLink);
    return;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      telegramChatId: chatId,
      telegramConnectToken: null,
      telegramConnectTokenExpiresAt: null,
    },
  });

  await sendTelegramMessage(
    chatId,
    getMessages("en").connected,
    makeLocaleKeyboard()
  );
}

async function handleFilters(
  user: User,
  chatId: string,
  locale: BotLocale
): Promise<void> {
  const m = getMessages(locale);
  const filters = await prisma.filter.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  if (filters.length === 0) {
    await sendTelegramMessage(chatId, m.noFilters, makeKeyboard(locale));
    return;
  }

  const lines = filters.map((filter) =>
    m.filterLine(filter.name, filter.isActive, buildFilterDetail(filter, locale))
  );
  await sendTelegramMessage(
    chatId,
    [m.filtersHeader, ...lines].join("\n"),
    makeKeyboard(locale)
  );
}

async function handleDeleteFilter(
  user: User,
  chatId: string,
  nameArg: string,
  locale: BotLocale
): Promise<void> {
  const m = getMessages(locale);
  const name = nameArg.trim();

  if (!name) {
    await sendTelegramMessage(chatId, m.deleteUsage);
    return;
  }

  const filter = await prisma.filter.findFirst({
    where: { userId: user.id, name: { equals: name, mode: "insensitive" } },
  });

  if (!filter) {
    await sendTelegramMessage(chatId, m.filterNotFound);
    return;
  }

  await prisma.filter.update({
    where: { id: filter.id },
    data: { isActive: false },
  });

  await sendTelegramMessage(chatId, m.filterDeleted(filter.name));
}

async function handleLatest(
  user: User,
  chatId: string,
  locale: BotLocale
): Promise<void> {
  const m = getMessages(locale);
  const filters = await prisma.filter.findMany({
    where: { userId: user.id, isActive: true },
  });

  if (filters.length === 0) {
    await sendTelegramMessage(chatId, m.latestEmpty, makeKeyboard(locale));
    return;
  }

  const listings: Listing[] = await prisma.listing.findMany({
    where: { isSold: false },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  const matching = listings.filter(
    (listing) => evaluateListing(listing, filters).length > 0
  );

  if (matching.length === 0) {
    await sendTelegramMessage(chatId, m.latestEmpty, makeKeyboard(locale));
    return;
  }

  for (const listing of matching.slice(0, 5)) {
    const caption = m.listingCaption(
      listing.title,
      formatPrice(listing.price),
      formatYear(listing.year),
      formatMileage(listing.mileage),
      listing.damageStatus ?? "N/A",
      listing.canonicalUrl
    );
    if (listing.imageUrl) {
      await sendTelegramPhoto(chatId, listing.imageUrl, caption);
    } else {
      await sendTelegramMessage(chatId, caption);
    }
  }
}

async function handleConversationStep(
  user: User,
  chatId: string,
  text: string
): Promise<void> {
  const locale: BotLocale = user.locale === "ar" ? "ar" : "en";
  const m = getMessages(locale);
  const step = user.telegramConvStep;

  if (!step) return;

  const draft = (user.telegramConvDraft as FilterDraft | null) ?? {};

  switch (step) {
    case "name": {
      const name = text.trim();
      if (!name) {
        await sendTelegramMessage(chatId, m.addStepNameAgain);
        return;
      }
      await saveDraft(user.id, { ...draft, name }, "minPrice", chatId, m.addPricePrompt);
      return;
    }
    case "minPrice": {
      const minPrice = parseOptionalNumber(text);
      if (minPrice === undefined) {
        await sendTelegramMessage(chatId, m.addInvalid);
        return;
      }
      await saveDraft(user.id, { ...draft, minPrice }, "maxPrice", chatId, m.addPricePrompt);
      return;
    }
    case "maxPrice": {
      const maxPrice = parseOptionalNumber(text);
      if (maxPrice === undefined) {
        await sendTelegramMessage(chatId, m.addInvalid);
        return;
      }
      await saveDraft(user.id, { ...draft, maxPrice }, "minYear", chatId, m.addYearPrompt);
      return;
    }
    case "minYear": {
      const minYear = parseOptionalNumber(text);
      if (minYear === undefined) {
        await sendTelegramMessage(chatId, m.addInvalid);
        return;
      }
      await saveDraft(
        user.id,
        { ...draft, minYear: toInt(minYear) },
        "maxYear",
        chatId,
        m.addYearPrompt
      );
      return;
    }
    case "maxYear": {
      const maxYear = parseOptionalNumber(text);
      if (maxYear === undefined) {
        await sendTelegramMessage(chatId, m.addInvalid);
        return;
      }
      await saveDraft(
        user.id,
        { ...draft, maxYear: toInt(maxYear) },
        "minMileage",
        chatId,
        m.addMileagePrompt
      );
      return;
    }
    case "minMileage": {
      const minMileage = parseOptionalNumber(text);
      if (minMileage === undefined) {
        await sendTelegramMessage(chatId, m.addInvalid);
        return;
      }
      await saveDraft(
        user.id,
        { ...draft, minMileage: toInt(minMileage) },
        "maxMileage",
        chatId,
        m.addMileagePrompt
      );
      return;
    }
    case "maxMileage": {
      const maxMileage = parseOptionalNumber(text);
      if (maxMileage === undefined) {
        await sendTelegramMessage(chatId, m.addInvalid);
        return;
      }
      await saveDraft(
        user.id,
        { ...draft, maxMileage: toInt(maxMileage) },
        "damageStatus",
        chatId,
        m.addDamagePrompt
      );
      return;
    }
    case "damageStatus": {
      const damageStatus = parseDamageStatus(text);
      if (damageStatus === undefined) {
        await sendTelegramMessage(chatId, m.addInvalid);
        return;
      }
      await saveDraft(
        user.id,
        { ...draft, damageStatus },
        "excludedKeywords",
        chatId,
        m.addKeywordsPrompt
      );
      return;
    }
    case "excludedKeywords": {
      const excludedKeywords = parseKeywords(text);
      const sources = await prisma.scraperSource.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
      });
      const sourceLines = sources
        .map((source, index) => `${index + 1}. ${source.name}`)
        .join("\n");
      await saveDraft(
        user.id,
        { ...draft, excludedKeywords },
        "sourceIds",
        chatId,
        sourceLines ? `${m.addSourcePrompt}\n${sourceLines}` : m.addSourcePrompt
      );
      return;
    }
    case "sourceIds": {
      const sources = await prisma.scraperSource.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
      });
      const sourceIds = parseSourceIds(text, sources.length);
      if (sourceIds === undefined) {
        await sendTelegramMessage(chatId, m.addInvalid);
        return;
      }
      const resolvedSourceIds = sourceIds.map(
        (number) => sources[number - 1].id
      );
      await prisma.filter.create({
        data: {
          name: draft.name ?? "Filter",
          minPrice: draft.minPrice ?? null,
          maxPrice: draft.maxPrice ?? null,
          minYear: draft.minYear ?? null,
          maxYear: draft.maxYear ?? null,
          minMileage: draft.minMileage ?? null,
          maxMileage: draft.maxMileage ?? null,
          damageStatus: draft.damageStatus ?? null,
          excludedKeywords: draft.excludedKeywords ?? [],
          sourceIds: resolvedSourceIds,
          isActive: true,
          userId: user.id,
        },
      });
      await prisma.user.update({
        where: { id: user.id },
        data: { telegramConvStep: null, telegramConvDraft: Prisma.DbNull },
      });
      await sendTelegramMessage(
        chatId,
        `${m.addDone(draft.name ?? "Filter")}\n${m.addDoneHint}`,
        makeKeyboard(locale)
      );
      return;
    }
    default:
      await sendTelegramMessage(chatId, m.addInvalid);
  }
}

async function saveDraft(
  userId: string,
  draft: FilterDraft,
  nextStep: string,
  chatId: string,
  prompt: string
): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { telegramConvDraft: draft as Prisma.InputJsonValue, telegramConvStep: nextStep },
  });
  await sendTelegramMessage(chatId, prompt);
}

function buildFilterDetail(filter: Filter, locale: BotLocale): string {
  const parts: string[] = [];

  if (filter.minPrice != null || filter.maxPrice != null) {
    if (filter.minPrice != null && filter.maxPrice != null) {
      parts.push(`€${compactNumber(filter.minPrice)}-${compactNumber(filter.maxPrice)}`);
    } else if (filter.minPrice != null) {
      parts.push(`€≥${compactNumber(filter.minPrice)}`);
    } else if (filter.maxPrice != null) {
      parts.push(`€≤${compactNumber(filter.maxPrice)}`);
    }
  }

  if (filter.minYear != null || filter.maxYear != null) {
    if (filter.minYear != null && filter.maxYear != null) {
      parts.push(`${filter.minYear}-${filter.maxYear}`);
    } else if (filter.minYear != null) {
      parts.push(`≥${filter.minYear}`);
    } else if (filter.maxYear != null) {
      parts.push(`≤${filter.maxYear}`);
    }
  }

  if (filter.minMileage != null || filter.maxMileage != null) {
    if (filter.minMileage != null && filter.maxMileage != null) {
      parts.push(`${compactNumber(filter.minMileage)}-${compactNumber(filter.maxMileage)} km`);
    } else if (filter.minMileage != null) {
      parts.push(`≥${compactNumber(filter.minMileage)} km`);
    } else if (filter.maxMileage != null) {
      parts.push(`≤${compactNumber(filter.maxMileage)} km`);
    }
  }

  if (filter.damageStatus) {
    parts.push(filter.damageStatus);
  }

  if (filter.excludedKeywords && filter.excludedKeywords.length > 0) {
    parts.push(`excl: ${filter.excludedKeywords.join(",")}`);
  }

  return parts.length > 0 ? parts.join(" · ") : getMessages(locale).filterDetail;
}

function compactNumber(value: number): string {
  if (Math.abs(value) >= 1000) {
    const formatted = (value / 1000).toFixed(1).replace(/\.0$/, "");
    return `${formatted}k`;
  }
  return String(value);
}

function formatPrice(price: number | null): string {
  if (price == null) return "N/A";
  return `€${price.toLocaleString()}`;
}

function formatYear(year: number | null): string {
  return year != null ? String(year) : "N/A";
}

function formatMileage(mileage: number | null): string {
  if (mileage == null) return "N/A";
  return `${mileage.toLocaleString()} km`;
}

function parseOptionalNumber(text: string): number | null | undefined {
  const trimmed = text.trim().toLowerCase();
  if (ANY_ANSWER.has(trimmed) || trimmed === "") return null;
  const cleaned = text.replace(/[€,\s]/g, "");
  const value = parseFloat(cleaned);
  if (Number.isNaN(value)) return undefined;
  return value;
}

function toInt(value: number | null): number | null {
  return value == null ? null : Math.round(value);
}

function parseDamageStatus(text: string): string | null | undefined {
  const trimmed = text.trim().toLowerCase();
  if (ANY_ANSWER.has(trimmed) || trimmed === "") return null;
  const damageMap: Record<string, string> = {
    damage: "Damage",
    "no damage": "No Damage",
    "total loss": "Total Loss",
  };
  const mapped = damageMap[trimmed];
  if (!mapped) return undefined;
  return mapped;
}

function parseKeywords(text: string): string[] {
  const trimmed = text.trim().toLowerCase();
  if (ANY_ANSWER.has(trimmed) || trimmed === "") return [];
  return text
    .split(",")
    .map((keyword) => keyword.trim())
    .filter((keyword) => keyword.length > 0);
}

function parseSourceIds(
  text: string,
  sourceCount: number
): number[] | undefined {
  const trimmed = text.trim().toLowerCase();
  if (trimmed === "all" || ANY_ANSWER.has(trimmed) || trimmed === "") {
    return [];
  }
  const numbers = text
    .split(",")
    .map((part) => parseInt(part.trim(), 10))
    .filter((number) => !Number.isNaN(number));
  if (numbers.length === 0 || numbers.some((number) => number < 1 || number > sourceCount)) {
    return undefined;
  }
  return numbers;
}
