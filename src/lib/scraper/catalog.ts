export interface SiteCatalogEntry {
  id: string;
  name: string;
  nameAr?: string;
  adapterType: string;
  baseUrl: string;
  defaultInterval: number;
  description: string;
  descriptionAr?: string;
  country: string;
  countryFlag: string;
}

export type CountryGroup = {
  country: string;
  countryFlag: string;
  entries: SiteCatalogEntry[];
};

export function getCatalogByCountry(): CountryGroup[] {
  const groups = new Map<string, CountryGroup>();
  for (const entry of SITE_CATALOG) {
    const key = entry.country;
    if (!groups.has(key)) {
      groups.set(key, { country: entry.country, countryFlag: entry.countryFlag, entries: [] });
    }
    groups.get(key)!.entries.push(entry);
  }
  return Array.from(groups.values());
}

export const SITE_CATALOG: SiteCatalogEntry[] = [
  {
    id: "schadeauto-zoeker.nl",
    name: "SchadeAuto-Zoeker.nl",
    adapterType: "schadeauto-zoeker",
    baseUrl:
      "https://www.schadeauto-zoeker.nl/en/search/damaged/passenger-cars/1/1/0/0/0/0/1/0?p=1925-2026",
    defaultInterval: 60,
    description:
      "Dutch damaged cars aggregator running the Schadeautos plugin. Default selectors read data-* attributes.",
    descriptionAr:
      "مجمع سيارات متضررة هولندي يعمل بإضافة Schadeautos. يقرأ المحددات الافتراضية من سمات data-*.",
    country: "NL",
    countryFlag: "🇳🇱",
  },
  {
    id: "schadeautos.nl",
    name: "Schadeautos.nl",
    adapterType: "schadeautos-nl",
    baseUrl:
      "https://www.schadeautos.nl/en/search/damaged/passenger-cars/1/1/0/0/0/0/1/0",
    defaultInterval: 60,
    description:
      "Dutch damaged cars directory running the Schadeautos plugin. Default selectors read data-* attributes.",
    descriptionAr:
      "دليل سيارات متضررة هولندي يعمل بإضافة Schadeautos. يقرأ المحددات الافتراضية من سمات data-*.",
    country: "NL",
    countryFlag: "🇳🇱",
  },
  {
    id: "declerckautohandel.be",
    name: "Declerck Autohandel",
    nameAr: "ديلرك أوتوهاندل",
    adapterType: "autos-motos",
    baseUrl: "https://www.declerckautohandel.be/en",
    defaultInterval: 60,
    description: "Declerck Autohandel — Belgian used and damaged/salvage cars.",
    descriptionAr: "ديلرك أوتوهاندل — سيارات بلجيكية مستعملة ومتضررة.",
    country: "BE",
    countryFlag: "🇧🇪",
  },
  {
    id: "cars2repair.be",
    name: "Didier (cars2repair)",
    nameAr: "ديدييه (cars2repair)",
    adapterType: "didier",
    baseUrl: "https://www.cars2repair.be/en/store/buy-damaged-salvage-cars?page=1",
    defaultInterval: 60,
    description: "Didier — Belgian damaged and salvage cars store.",
    descriptionAr: "ديدييه — متجر سيارات متضررة وإنقاذ بلجيكي.",
    country: "BE",
    countryFlag: "🇧🇪",
  },
  {
    id: "inter-cars.be",
    name: "Inter-Cars",
    nameAr: "إنتر كارز",
    adapterType: "autos-motos",
    baseUrl: "https://www.inter-cars.be/",
    defaultInterval: 60,
    description: "Inter-Cars Belgium — used and damaged cars catalog.",
    descriptionAr: "إنتر كارز بلجيكا — كتالوج سيارات مستعملة ومتضررة.",
    country: "BE",
    countryFlag: "🇧🇪",
  },
  {
    id: "dsmbelgium.com-used",
    name: "DSM Belgium — Used",
    nameAr: "دي إس إم بلجيكا — مستعمل",
    adapterType: "dsm",
    baseUrl: "https://dsmbelgium.com/Vehicles/Used",
    defaultInterval: 60,
    description: "DSM Belgium used cars catalog.",
    descriptionAr: "كتالوج السيارات المستعملة في دي إس إم بلجيكا.",
    country: "BE",
    countryFlag: "🇧🇪",
  },
  {
    id: "dsmbelgium.com-damaged",
    name: "DSM Belgium — Damaged",
    nameAr: "دي إس إم بلجيكا — متضررة",
    adapterType: "dsm",
    baseUrl: "https://dsmbelgium.com/Vehicles/Damaged",
    defaultInterval: 60,
    description: "DSM Belgium damaged cars catalog.",
    descriptionAr: "كتالوج السيارات المتضررة في دي إس إم بلجيكا.",
    country: "BE",
    countryFlag: "🇧🇪",
  },
  {
    id: "kleinanzeigen.de",
    name: "🇩🇪 Kleinanzeigen.de",
    nameAr: "كلاينأنزايغن.de — أكبر موقع إعلانات ألماني",
    adapterType: "kleinanzeigen",
    baseUrl: "https://www.kleinanzeigen.de/s-autos/unfallwagen/k0c216",
    defaultInterval: 60,
    description: "Germany's largest classifieds site with 2281+ unfallwagen (accident car) listings.",
    descriptionAr: "أكبر موقع إعلانات في ألمانيا مع أكثر من 2281 إعلان سيارة متضررة.",
    country: "DE",
    countryFlag: "🇩🇪",
  },
  {
    id: "marktplaats.nl",
    name: "🇳🇱 Marktplaats.nl",
    nameAr: "ماركtplاتس.nl — أكبر موقع إعلانات هولندي",
    adapterType: "marktplaats",
    baseUrl: "https://www.marktplaats.nl/l/auto-diversen/schadeauto-s/",
    defaultInterval: 60,
    description: "Netherlands' largest classifieds site with 875+ schadeauto (damaged car) listings.",
    descriptionAr: "أكبر موقع إعلانات في هولندا مع أكثر من 875 إعلان سيارة متضررة.",
    country: "NL",
    countryFlag: "🇳🇱",
  },
  {
    id: "olx.pl",
    name: "🇵🇱 OLX.pl",
    nameAr: "أولكس.pl — عملاق الإعلانات البولندي",
    adapterType: "olx",
    baseUrl: "https://www.olx.pl/motoryzacja/samochody/q-auta-powypadkowe-uszkodzone/",
    defaultInterval: 60,
    description: "Poland's classifieds giant — damaged and accident car listings.",
    descriptionAr: "عملاق الإعلانات في بولندا — إعلانات السيارات المتضررة والمت accidents.",
    country: "PL",
    countryFlag: "🇵🇱",
  },
  {
    id: "2dehands.be",
    name: "🇧🇪 2dehands.be",
    nameAr: "تواديهاندس.be — أكبر موقع إعلانات بلجيكي",
    adapterType: "marktplaats",
    baseUrl: "https://www.2dehands.be/l/auto-diversen/",
    defaultInterval: 60,
    description: "Belgium's largest classifieds (FR version of Marktplaats). Damaged car listings.",
    descriptionAr: "أكبر موقع إعلانات في بلجيكا (النسخة الفرنسية من ماركتبلاتس). إعلانات السيارات المتضررة.",
    country: "BE",
    countryFlag: "🇧🇪",
  },
  {
    id: "sprzedajemy.pl",
    name: "🇵🇱 Sprzedajemy.pl",
    nameAr: "سبريدجيمي.pl — موقع إعلانات بولندي",
    adapterType: "sprzedaz",
    baseUrl: "https://sprzedajemy.pl/temat/auta+uszkodzone+polska",
    defaultInterval: 60,
    description: "Polish classifieds site — damaged and used car listings across Poland.",
    descriptionAr: "موقع إعلانات بولندي — إعلانات السيارات المتضررة والمستعملة في جميع أنحاء بولندا.",
    country: "PL",
    countryFlag: "🇵🇱",
  },
  {
    id: "carito.com",
    name: "🇧🇪 Carito.com",
    nameAr: "كارتو.com — منصة السيارات المتضررة البلجيكية",
    adapterType: "carito",
    baseUrl: "https://carito.com/nl-be/schadeauto/",
    defaultInterval: 60,
    description: "Belgian damaged car platform — buy and sell damaged vehicles.",
    descriptionAr: "منصة السيارات المتضررة البلجيكية — شراء وبيع المركبات المتضررة.",
    country: "BE",
    countryFlag: "🇧🇪",
  },
  {
    id: "paruvendu.fr",
    name: "🇫🇷 Paruvendu.fr",
    nameAr: "باروفيندو.fr — إعلانات فرنسية للسيارات المتضررة",
    adapterType: "paruvendu",
    baseUrl: "https://www.paruvendu.fr/a/voiture-occasion/vehicules-accidentes/",
    defaultInterval: 60,
    description: "French classifieds with dedicated 'véhicules accidentés' section.",
    descriptionAr: "إعلانات فرنسية مع قسم مخصص للمركبات المتضررة.",
    country: "FR",
    countryFlag: "🇫🇷",
  },
  {
    id: "jmautos-casse-auto.fr",
    name: "🇫🇷 JM Autos",
    nameAr: "جي إم أوتوس — تاجر سيارات متضررة فرنسي",
    adapterType: "jm-autos",
    baseUrl: "https://www.jmautos-casse-auto.fr/vehicules-accidentes.php",
    defaultInterval: 60,
    description: "French damaged car dealer — JM Autos Casse Automobile in Avignon.",
    descriptionAr: "تاجر سيارات متضررة فرنسي — جي إم أوتوس كاس أوتوموبيل في أفينيون.",
    country: "FR",
    countryFlag: "🇫🇷",
  },
  {
    id: "voitureaccidentee.com",
    name: "🇫🇷 VoitureAccidentee.com",
    nameAr: "فوايتورأكسيدينتي.com — سيارات متضررة عابرة للحدود",
    adapterType: "voiture-accidentee",
    baseUrl: "https://www.voitureaccidentee.com/fr/",
    defaultInterval: 60,
    description: "Cross-border FR/DE damaged car dealer with 2500+ vehicles.",
    descriptionAr: "تاجر سيارات متضررة عابر للحدود فرنسي/ألماني مع أكثر من 2500 مركبة.",
    country: "FR",
    countryFlag: "🇫🇷",
  },
  {
    id: "leboncoin.fr",
    name: "Leboncoin.fr",
    nameAr: "ليبونكوان.فر",
    adapterType: "leboncoin",
    baseUrl:
      "https://www.leboncoin.fr/recherche?category=2&text=voiture%20accidentee",
    defaultInterval: 30,
    description:
      "French classifieds — damaged and accident cars on Leboncoin.",
    descriptionAr:
      "إعلانات فرنسية — سيارات متضررة وحادثة على ليبونكوان.",
    country: "FR",
    countryFlag: "🇫🇷",
  },
  {
    id: "autoscout24.de",
    name: "AutoScout24.de",
    nameAr: "أوتو سكوت 24.دي",
    adapterType: "autoscout24",
    baseUrl:
      "https://www.autoscout24.de/lst?atype=C&cy=D&desc=0&ustate=N%2CU&size=20&page=1&sort=standard&source=listpage_search&damaged_listing=on",
    defaultInterval: 30,
    description: "German AutoScout24 — damaged and repairable cars.",
    descriptionAr:
      "أوتو سكوت 24 الألماني — سيارات متضررة وقابلة للإصلاح.",
    country: "DE",
    countryFlag: "🇩🇪",
  },
  {
    id: "autoscout24.be",
    name: "AutoScout24.be",
    nameAr: "أوتو سكوت 24.بي",
    adapterType: "autoscout24",
    baseUrl:
      "https://www.autoscout24.be/lst?atype=C&cy=B&desc=0&ustate=N%2CU&size=20&page=1&sort=standard&source=listpage_search&damaged_listing=on",
    defaultInterval: 30,
    description: "Belgian AutoScout24 — damaged and repairable cars.",
    descriptionAr:
      "أوتو سكوت 24 البلجيكي — سيارات متضررة وقابلة للإصلاح.",
    country: "BE",
    countryFlag: "🇧🇪",
  },
  {
    id: "autoscout24.nl",
    name: "AutoScout24.nl",
    nameAr: "أوتو سكوت 24.إن إل",
    adapterType: "autoscout24",
    baseUrl:
      "https://www.autoscout24.nl/lst?atype=C&cy=NL&desc=0&ustate=N%2CU&size=20&page=1&sort=standard&source=listpage_search&damaged_listing=on",
    defaultInterval: 30,
    description: "Dutch AutoScout24 — damaged and repairable cars.",
    descriptionAr:
      "أوتو سكوت 24 الهولندي — سيارات متضررة وقابلة للإصلاح.",
    country: "NL",
    countryFlag: "🇳🇱",
  },
  {
    id: "autoscout24.fr",
    name: "AutoScout24.fr",
    nameAr: "أوتو سكوت 24.فر",
    adapterType: "autoscout24",
    baseUrl:
      "https://www.autoscout24.fr/lst?atype=C&cy=F&desc=0&ustate=N%2CU&size=20&page=1&sort=standard&source=listpage_search&damaged_listing=on",
    defaultInterval: 30,
    description: "French AutoScout24 — damaged and repairable cars.",
    descriptionAr:
      "أوتو سكوت 24 الفرنسي — سيارات متضررة وقابلة للإصلاح.",
    country: "FR",
    countryFlag: "🇫🇷",
  },
  {
    id: "debels.com",
    name: "Debels.com",
    nameAr: "ديبيلز.كوم",
    adapterType: "debels",
    baseUrl: "https://www.debels.com/aanbod",
    defaultInterval: 60,
    description: "Belgian damaged and salvage cars promo page.",
    descriptionAr: "صفحة عروض سيارات متضررة وإنقاذ بلجيكية.",
    country: "BE",
    countryFlag: "🇧🇪",
  },
  {
    id: "opel-vectra.de",
    name: "Opel-Vectra.de",
    nameAr: "أوبل-فيكترا.دي",
    adapterType: "generic",
    baseUrl: "https://www.opel-vectra.de/",
    defaultInterval: 120,
    description:
      "German Opel/Vectra specialist — used and damaged parts catalog.",
    descriptionAr:
      "متخصص أوبل/فيكترا الألماني — كتالوج قطع مستعملة ومتضررة.",
    country: "DE",
    countryFlag: "🇩🇪",
  },
  {
    id: "bmw-parts.be",
    name: "BMW Parts Belgium",
    nameAr: "قطع بي إم في بلجيكا",
    adapterType: "autos-motos",
    baseUrl: "https://www.bmw-parts.be/",
    defaultInterval: 120,
    description: "Belgian BMW parts — used and salvage vehicle parts.",
    descriptionAr: "قطع بي إم في بلجيكية — قطع سيارات مستعملة وإنقاذ.",
    country: "BE",
    countryFlag: "🇧🇪",
  },
  {
    id: "mercedes-parts.de",
    name: "Mercedes Parts DE",
    nameAr: "قطع مرسيدس ألمانيا",
    adapterType: "autos-motos",
    baseUrl: "https://www.mercedes-parts.de/",
    defaultInterval: 120,
    description: "German Mercedes parts — used and damaged vehicle parts.",
    descriptionAr: "قطع مرسيدس ألمانية — قطع سيارات مستعملة ومتضررة.",
    country: "DE",
    countryFlag: "🇩🇪",
  },
  {
    id: "auto-didact.nl",
    name: "Auto-Didact.nl",
    nameAr: "أوتو-ديدكت.إن إل",
    adapterType: "schadeautos",
    baseUrl: "https://www.auto-didact.nl/",
    defaultInterval: 60,
    description:
      "Dutch WordPress Schadeautos plugin site — damaged cars.",
    descriptionAr:
      "موقع ووردبريس هولندي بإضافة Schadeautos — سيارات متضررة.",
    country: "NL",
    countryFlag: "🇳🇱",
  },
];
