export type Locale = "en" | "ar";

export interface Dictionary {
  common: {
    appTitle: string;
    login: string;
    logout: string;
    dashboard: string;
    settings: string;
    save: string;
    cancel: string;
    delete: string;
    edit: string;
    add: string;
    search: string;
    loading: string;
    noData: string;
    noResultsYet: string;
    noResultsHint: string;
    confirm: string;
    back: string;
    next: string;
    close: string;
    success: string;
    error: string;
    warning: string;
    collapse: string;
  };
  nav: {
    home: string;
    listings: string;
    results: string;
    filters: string;
    alerts: string;
    admin: string;
    sources: string;
    jobs: string;
    users: string;
  };
  dashboard: {
    totalListings: string;
    newToday: string;
    activeFilters: string;
    lastScan: string;
    recentActivity: string;
    todaysActivity: string;
    quickActions: string;
    scanNow: string;
    viewAll: string;
    notificationsSent: string;
    accountOverview: string;
  };
  sources: {
    addSource: string;
    editSource: string;
    sourceName: string;
    baseUrl: string;
    adapterType: string;
    selectors: string;
    isActive: string;
    scrapeInterval: string;
    lastScraped: string;
    actions: string;
    status: string;
    configured: string;
    notConfigured: string;
    manageSources: string;
    interval: string;
    active: string;
    inactive: string;
  };
  filters: {
    addFilter: string;
    editFilter: string;
    filterName: string;
    minYear: string;
    maxYear: string;
    minPrice: string;
    maxPrice: string;
    damageStatus: string;
    excludedKeywords: string;
    minMileage: string;
    maxMileage: string;
    apply: string;
    reset: string;
    activeFilters: string;
    results: string;
  };
  listings: {
    listingTitle: string;
    price: string;
    year: string;
    mileage: string;
    damage: string;
    source: string;
    date: string;
    viewDetails: string;
    markRead: string;
    notifyTelegram: string;
    unread: string;
    new: string;
    filters: string;
  };
  jobs: {
    jobStatus: string;
    pending: string;
    running: string;
    completed: string;
    failed: string;
    listingsFound: string;
    newListings: string;
    startedAt: string;
    completedAt: string;
    retry: string;
    cancel: string;
    duration: string;
  };
  auth: {
    signInTitle: string;
    email: string;
    password: string;
    signInButton: string;
    signUpButton: string;
    forgotPassword: string;
    rememberMe: string;
    orContinueWith: string;
    noAccount: string;
    hasAccount: string;
  };
  alerts: {
    title: string;
    telegramStatus: string;
    webPush: string;
    emailStatus: string;
    notificationHistory: string;
    connected: string;
    notConnected: string;
    enablePush: string;
    testNotification: string;
    noHistory: string;
    listing: string;
    sentAt: string;
    via: string;
    telegram: string;
    web: string;
    emailConfigured: string;
    emailNotConfigured: string;
    loadError: string;
    notificationsSentCount: string;
  };
  users: {
    name: string;
    role: string;
    created: string;
    admin: string;
    user: string;
    manageUsers: string;
  };
}

const en: Dictionary = {
  common: {
    appTitle: "Car Deals Hunter",
    login: "Login",
    logout: "Logout",
    dashboard: "Dashboard",
    settings: "Settings",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    add: "Add",
    search: "Search",
    loading: "Loading...",
    noData: "No data available",
    noResultsYet: "No results yet. New cars matching your filters will appear here as they are scraped.",
    noResultsHint: "Try adjusting your filters or wait for new cars to be scraped.",
    confirm: "Confirm",
    back: "Back",
    next: "Next",
    close: "Close",
    success: "Success",
    error: "Error",
    warning: "Warning",
    collapse: "Collapse",
  },
  nav: {
    home: "Home",
    listings: "Listings",
    results: "Results",
    filters: "Filters",
    alerts: "Alerts",
    admin: "Admin",
    sources: "Sources",
    jobs: "Jobs",
    users: "Users",
  },
  dashboard: {
    totalListings: "Total Listings",
    newToday: "New Today",
    activeFilters: "Active Filters",
    lastScan: "Last Scan",
    recentActivity: "Recent Activity",
    todaysActivity: "Today's Activity",
    quickActions: "Quick Actions",
    scanNow: "Scan Now",
    viewAll: "View All",
    notificationsSent: "Notifications Sent",
    accountOverview: "Your account overview",
  },
  sources: {
    addSource: "Add Source",
    editSource: "Edit Source",
    sourceName: "Source Name",
    baseUrl: "Base URL",
    adapterType: "Adapter Type",
    selectors: "Selectors",
    isActive: "Is Active",
    scrapeInterval: "Scrape Interval",
    lastScraped: "Last Scraped",
    actions: "Actions",
    status: "Status",
    configured: "Configured",
    notConfigured: "Not Configured",
    manageSources: "Manage data sources",
    interval: "Interval",
    active: "Active",
    inactive: "Inactive",
  },
  filters: {
    addFilter: "Add Filter",
    editFilter: "Edit Filter",
    filterName: "Filter Name",
    minYear: "Min Year",
    maxYear: "Max Year",
    minPrice: "Min Price",
    maxPrice: "Max Price",
    damageStatus: "Damage Status",
    excludedKeywords: "Excluded Keywords",
    minMileage: "Min Mileage",
    maxMileage: "Max Mileage",
    apply: "Apply",
    reset: "Reset",
    activeFilters: "Active Filters",
    results: "Results",
  },
  listings: {
    listingTitle: "Listing Title",
    price: "Price",
    year: "Year",
    mileage: "Mileage",
    damage: "Damage",
    source: "Source",
    date: "Date",
    viewDetails: "View Details",
    markRead: "Mark as Read",
    notifyTelegram: "Notify via Telegram",
    unread: "Unread",
    new: "New",
    filters: "Filters",
  },
  jobs: {
    jobStatus: "Job Status",
    pending: "Pending",
    running: "Running",
    completed: "Completed",
    failed: "Failed",
    listingsFound: "Listings Found",
    newListings: "New Listings",
    startedAt: "Started At",
    completedAt: "Completed At",
    retry: "Retry",
    cancel: "Cancel",
    duration: "Duration",
  },
  auth: {
    signInTitle: "Sign In",
    email: "Email",
    password: "Password",
    signInButton: "Sign In",
    signUpButton: "Sign Up",
    forgotPassword: "Forgot Password?",
    rememberMe: "Remember me",
    orContinueWith: "Or continue with",
    noAccount: "Don't have an account?",
    hasAccount: "Already have an account?",
  },
  alerts: {
    title: "Alerts & Notifications",
    telegramStatus: "Telegram Connection",
    webPush: "Web Push Notifications",
    emailStatus: "Email Notifications",
    notificationHistory: "Notification History",
    connected: "Connected",
    notConnected: "Not Connected",
    enablePush: "Enable Push Notifications",
    testNotification: "Send Test Notification",
    noHistory: "No notifications sent yet",
    listing: "Listing",
    sentAt: "Sent At",
    via: "via",
    telegram: "Telegram",
    web: "Web Push",
    emailConfigured: "Email Configured",
    emailNotConfigured: "Email Not Configured",
    loadError: "Failed to load",
    notificationsSentCount: "notifications sent",
  },
  users: {
    name: "Name",
    role: "Role",
    created: "Created",
    admin: "Admin",
    user: "User",
    manageUsers: "Manage system users",
  },
};

const ar: Dictionary = {
  common: {
    appTitle: "صائد عروض السيارات",
    login: "تسجيل الدخول",
    logout: "تسجيل الخروج",
    dashboard: "لوحة التحكم",
    settings: "الإعدادات",
    save: "حفظ",
    cancel: "إلغاء",
    delete: "حذف",
    edit: "تعديل",
    add: "إضافة",
    search: "بحث",
    loading: "جاري التحميل...",
    noData: "لا توجد بيانات",
    noResultsYet: "لا توجد نتائج بعد.ظهرت السيارات الجديدة التي تطابق فلاترك هنا عند فحصها.",
    noResultsHint: "حاول تعديل فلاترك أو انتظر حتى يتم فحص سيارات جديدة.",
    confirm: "تأكيد",
    back: "رجوع",
    next: "التالي",
    close: "إغلاق",
    success: "نجاح",
    error: "خطأ",
    warning: "تحذير",
    collapse: "تصغير",
  },
  nav: {
    home: "الرئيسية",
    listings: "الإعلانات",
    results: "النتائج",
    filters: "الفلاتر",
    alerts: "التنبيهات",
    admin: "الإدارة",
    sources: "المصادر",
    jobs: "المهام",
    users: "المستخدمون",
  },
  dashboard: {
    totalListings: "إجمالي الإعلانات",
    newToday: "جديد اليوم",
    activeFilters: "الفلاتر النشطة",
    lastScan: "آخر مسح",
    recentActivity: "النشاط الأخير",
    todaysActivity: "نشاط اليوم",
    quickActions: "إجراءات سريعة",
    scanNow: "مسح الآن",
    viewAll: "عرض الكل",
    notificationsSent: "إشعارات مرسلة",
    accountOverview: "نظرة عامة على حسابك",
  },
  sources: {
    addSource: "إضافة مصدر",
    editSource: "تعديل المصدر",
    sourceName: "اسم المصدر",
    baseUrl: "الرابط الأساسي",
    adapterType: "نوع المحول",
    selectors: "المحددات",
    isActive: "نشط",
    scrapeInterval: "فترة السحب",
    lastScraped: "آخر سحب",
    actions: "الإجراءات",
    status: "الحالة",
    configured: "تم التكوين",
    notConfigured: "لم يتم التكوين",
    manageSources: "إدارة مصادر البيانات",
    interval: "الفترة",
    active: "نشط",
    inactive: "غير نشط",
  },
  filters: {
    addFilter: "إضافة فلتر",
    editFilter: "تعديل الفلتر",
    filterName: "اسم الفلتر",
    minYear: "الحد الأدنى للسنة",
    maxYear: "الحد الأقصى للسنة",
    minPrice: "الحد الأدنى للسعر",
    maxPrice: "الحد الأقصى للسعر",
    damageStatus: "حالة الضرر",
    excludedKeywords: "الكلمات المستبعدة",
    minMileage: "الحد الأدنى للمسافة",
    maxMileage: "الحد الأقصى للمسافة",
    apply: "تطبيق",
    reset: "إعادة تعيين",
    activeFilters: "الفلاتر النشطة",
    results: "النتائج",
  },
  listings: {
    listingTitle: "عنوان الإعلان",
    price: "السعر",
    year: "السنة",
    mileage: "المسافة المقطوعة",
    damage: "الضرر",
    source: "المصدر",
    date: "التاريخ",
    viewDetails: "عرض التفاصيل",
    markRead: "تحديد كمقروء",
    notifyTelegram: "إشعار عبر تيليجرام",
    unread: "غير مقروء",
    new: "جديد",
    filters: "الفلاتر",
  },
  jobs: {
    jobStatus: "حالة المهمة",
    pending: "قيد الانتظار",
    running: "قيد التنفيذ",
    completed: "مكتمل",
    failed: "فشل",
    listingsFound: "الإعلانات المكتشفة",
    newListings: "إعلانات جديدة",
    startedAt: "بدأ في",
    completedAt: "اكتمل في",
    retry: "إعادة المحاولة",
    cancel: "إلغاء",
    duration: "المدة",
  },
  auth: {
    signInTitle: "تسجيل الدخول",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    signInButton: "تسجيل الدخول",
    signUpButton: "إنشاء حساب",
    forgotPassword: "نسيت كلمة المرور؟",
    rememberMe: "تذكرني",
    orContinueWith: "أو تابع بـ",
    noAccount: "ليس لديك حساب؟",
    hasAccount: "لديك حساب بالفعل؟",
  },
  alerts: {
    title: "التنبيهات والإشعارات",
    telegramStatus: "حالة اتصال تيليجرام",
    webPush: "إشعارات الويب",
    emailStatus: "إشعارات البريد الإلكتروني",
    notificationHistory: "سجل الإشعارات",
    connected: "متصل",
    notConnected: "غير متصل",
    enablePush: "تفعيل إشعارات الويب",
    testNotification: "إرسال إشعار تجريبي",
    noHistory: "لم يتم إرسال إشعارات بعد",
    listing: "الإعلان",
    sentAt: "تم الإرسال في",
    via: "عبر",
    telegram: "تيليجرام",
    web: "ويب",
    emailConfigured: "تم تكوين البريد الإلكتروني",
    emailNotConfigured: "لم يتم تكوين البريد الإلكتروني",
    loadError: "فشل التحميل",
    notificationsSentCount: "إشعارات مرسلة",
  },
  users: {
    name: "الاسم",
    role: "الدور",
    created: "تاريخ الإنشاء",
    admin: "مدير",
    user: "مستخدم",
    manageUsers: "إدارة المستخدمين",
  },
};

const dictionaries: Record<Locale, Dictionary> = {
  en,
  ar,
};

export async function getDictionary(locale: Locale): Promise<Dictionary> {
  return dictionaries[locale] ?? dictionaries.en;
}
