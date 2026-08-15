export type BotLocale = "en" | "ar";

export const BOT_LOCALES: BotLocale[] = ["en", "ar"];

export const messages = {
  en: {
    welcome: "Welcome! To connect your account, open the app, click Connect Telegram, and tap the link again.",
    chooseLocale: "Choose your language / اختر لغتك:",
    connected: "Your account has been successfully connected! You will receive instant notifications here.",
    connectedPromptLocale: "You are connected. Choose your preferred language:",
    invalidLink: "Invalid or expired connection link. Please request a new link from your account settings.",
    stopped: "Your Telegram notifications have been disabled.",
    paused: "Notifications paused. Use /resume to start receiving alerts again.",
    resumed: "Notifications resumed. You will receive alerts again.",
    help: [
      "Available commands:",
      "/filters - List your filters",
      "/addfilter - Create a new filter",
      "/delfilter <name> - Delete a filter",
      "/latest - Show recent matching listings",
      "/pause - Pause notifications",
      "/resume - Resume notifications",
      "/language - Change language",
      "/stop - Disconnect Telegram",
      "/help - Show this help",
    ].join("\n"),
    noFilters: "You have no filters yet. Use /addfilter to create one.",
    filtersHeader: "Your filters:",
    filterLine: (name: string, active: boolean, detail: string) =>
      `${active ? "🟢" : "⚪"} ${name}${detail ? ` (${detail})` : ""}`,
    filterDetail: "no detail",
    deleteUsage: "Usage: /delfilter <name>",
    filterNotFound: "Filter not found.",
    filterDeleted: (name: string) => `Filter "${name}" deleted.`,
    addStart: "Let's create a filter. Enter a name for this filter (e.g. \"BMW under 30k\"):",
    cancelHint: "Send /cancel to abort anytime.",
    addStepNameAgain: "Name is required. Enter a name:",
    addPricePrompt: "Enter max price in € (or \"any\"):",
    addYearPrompt: "Enter max year (e.g. 2020) or \"any\":",
    addMileagePrompt: "Enter max mileage in km (or \"any\"):",
    addDamagePrompt: "Enter damage status (Damage / No Damage / Total Loss / any):",
    addKeywordsPrompt: "Enter keywords to exclude, comma-separated (or \"none\"):",
    addSourcePrompt: "Enter source numbers to include, comma-separated (or \"all\"):",
    addDone: (name: string) => `Filter "${name}" created! 🎉`,
    addDoneHint: "Use /filters to see it, or /delfilter to remove it.",
    addInvalid: "That doesn't look right. Try again or send /cancel.",
    latestEmpty: "No recent listings match your filters.",
    latestHeader: "Recent matches:",
    latestLine: (title: string, price: string, year: string, url: string) =>
      `• ${title}\n  💰 ${price} · 📅 ${year}\n  🔗 ${url}`,
    latestNone: "None",
    listingCaption: (title: string, price: string, year: string, mileage: string, damage: string, url: string) =>
      `🚗 ${title}\n💰 ${price}\n📅 ${year}\n📍 ${mileage}\n⚠️ ${damage}\n🔗 ${url}`,
    guestWelcome: (url: string) =>
      `👋 Welcome to Car Deals Hunter!\n\nIt looks like you're not connected yet.\n\n1️⃣ Create your account at ${url}\n2️⃣ Log in and open Alerts\n3️⃣ Tap Connect Telegram\n4️⃣ Send the link here to start receiving car alerts with photos.`,
    guestConnectButton: "Open the app",
    languageChanged: (locale: string) =>
      locale === "ar" ? "تم تغيير اللغة إلى العربية 🇸🇦" : "Language changed to English 🇬🇧",
    unknown: "Sorry, I didn't understand that. Send /help for available commands.",
    cancelDone: "Cancelled.",
  },
  ar: {
    welcome: "مرحبًا! لربط حسابك، افتح التطبيق، انقر على ربط تيليجرام، ثم اضغط على الرابط مرة أخرى.",
    chooseLocale: "اختر لغتك / Choose your language:",
    connected: "تم ربط حسابك بنجاح! ستتلقى إشعارات فورية هنا.",
    connectedPromptLocale: "تم الربط. اختر لغتك المفضلة:",
    invalidLink: "رابط الربط غير صالح أو منتهي. يرجى طلب رابط جديد من إعدادات حسابك.",
    stopped: "تم إيقاف إشعارات تيليجرام الخاصة بك.",
    paused: "تم إيقاف الإشعارات مؤقتًا. استخدم /resume لاستئناف التنبيهات.",
    resumed: "تم استئناف الإشعارات. ستتلقى التنبيهات مجددًا.",
    help: [
      "الأوامر المتاحة:",
      "/filters - عرض الفلاتر الخاصة بك",
      "/addfilter - إنشاء فلتر جديد",
      "/delfilter <name> - حذف فلتر",
      "/latest - عرض أحدث السيارات المطابقة",
      "/pause - إيقاف الإشعارات مؤقتًا",
      "/resume - استئناف الإشعارات",
      "/language - تغيير اللغة",
      "/stop - قطع اتصال تيليجرام",
      "/help - عرض المساعدة",
    ].join("\n"),
    noFilters: "لا توجد فلاتر بعد. استخدم /addfilter لإنشاء واحد.",
    filtersHeader: "الفلاتر الخاصة بك:",
    filterLine: (name: string, active: boolean, detail: string) =>
      `${active ? "🟢" : "⚪"} ${name}${detail ? ` (${detail})` : ""}`,
    filterDetail: "بدون تفاصيل",
    deleteUsage: "الاستخدام: /delfilter <name>",
    filterNotFound: "الفلتر غير موجود.",
    filterDeleted: (name: string) => `تم حذف الفلتر "${name}".`,
    addStart: "لننشئ فلترًا. أدخل اسمًا لهذا الفلتر (مثال: \"بي إم دبليو تحت 30 ألف\"):",
    cancelHint: "أرسل /cancel للإلغاء في أي وقت.",
    addStepNameAgain: "الاسم مطلوب. أدخل اسمًا:",
    addPricePrompt: "أدخل الحد الأقصى للسعر باليورو (أو \"أي\"):",
    addYearPrompt: "أدخل أقصى سنة (مثال 2020) أو \"أي\":",
    addMileagePrompt: "أدخل أقصى مسافة بالكيلومتر (أو \"أي\"):",
    addDamagePrompt: "أدخل حالة الضرر (Damage / No Damage / Total Loss / أي):",
    addKeywordsPrompt: "أدخل الكلمات المفتاحية المستثناة، مفصولة بفواصل (أو \"لا شيء\"):",
    addSourcePrompt: "أدخل أرقام المصادر المطلوب تضمينها، مفصولة بفواصل (أو \"الكل\"):",
    addDone: (name: string) => `تم إنشاء الفلتر "${name}"! 🎉`,
    addDoneHint: "استخدم /filters لعرضه، أو /delfilter لحذفه.",
    addInvalid: "هذا غير صحيح. حاول مجددًا أو أرسل /cancel.",
    latestEmpty: "لا توجد سيارات حديثة مطابقة لفلاترك.",
    latestHeader: "أحدث المطابقات:",
    latestLine: (title: string, price: string, year: string, url: string) =>
      `• ${title}\n  💰 ${price} · 📅 ${year}\n  🔗 ${url}`,
    latestNone: "لا شيء",
    listingCaption: (title: string, price: string, year: string, mileage: string, damage: string, url: string) =>
      `🚗 ${title}\n💰 ${price}\n📅 ${year}\n📍 ${mileage}\n⚠️ ${damage}\n🔗 ${url}`,
    guestWelcome: (url: string) =>
      `👋 مرحباً بك في صائد عروض السيارات!\n\nيبدو أنك غير مرتبط بعد.\n\n1️⃣ أنشئ حسابك في ${url}\n2️⃣ سجّل الدخول وافتح التنبيهات\n3️⃣ اضغط ربط تيليجرام\n4️⃣ أرسل الرابط هنا لتبدأ بتلقي تنبيهات السيارات مع الصور.`,
    guestConnectButton: "افتح التطبيق",
    languageChanged: (locale: string) =>
      locale === "ar" ? "تم تغيير اللغة إلى العربية 🇸🇦" : "Language changed to English 🇬🇧",
    unknown: "عذرًا، لم أفهم ذلك. أرسل /help لعرض الأوامر المتاحة.",
    cancelDone: "تم الإلغاء.",
  },
} as const;

export type BotMessages = typeof messages.en;

export function getMessages(locale: BotLocale): BotMessages {
  return (messages[locale] ?? messages.en) as BotMessages;
}

export function makeKeyboard(locale: BotLocale): { keyboard: string[][]; resize_keyboard: boolean } {
  const isAr = locale === "ar";
  return {
    keyboard: [
      [
        isAr ? "الفلاتر" : "Filters",
        isAr ? "أحدث" : "Latest",
      ],
      [
        isAr ? "إضافة فلتر" : "Add Filter",
        isAr ? "مساعدة" : "Help",
      ],
      [
        isAr ? "إيقاف مؤقت" : "Pause",
        isAr ? "استئناف" : "Resume",
        isAr ? "اللغة" : "Language",
      ],
    ],
    resize_keyboard: true,
  };
}

export function makeLocaleKeyboard(): {
  keyboard: { text: string }[][];
  resize_keyboard: boolean;
  one_time_keyboard: boolean;
} {
  return {
    keyboard: [
      [{ text: "English" }, { text: "العربية" }],
    ],
    resize_keyboard: true,
    one_time_keyboard: true,
  };
}

export function makeGuestKeyboard(
  locale: BotLocale,
  url: string
): { inline_keyboard: { text: string; url: string }[][] } {
  return {
    inline_keyboard: [
      [
        {
          text: locale === "ar" ? "افتح التطبيق" : "Open the app",
          url,
        },
      ],
    ],
  };
}
