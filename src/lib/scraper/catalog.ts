export interface SiteCatalogEntry {
  id: string;
  name: string;
  nameAr?: string;
  adapterType: string;
  baseUrl: string;
  defaultInterval: number;
  description: string;
  descriptionAr?: string;
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
  },
];
