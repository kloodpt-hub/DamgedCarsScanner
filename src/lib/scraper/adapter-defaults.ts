const LEBONCOIN_DEFAULTS = {
  listingContainer: '[data-qa-id="aditem_container"], [data-qa-id="listitem_ad"], .styles_adCard__',
  title: '[data-qa-id="aditem_title"], [data-qa-id="subject"], h2, .textHeading',
  price: '[data-qa-id="aditem_price"], [data-qa-id="price"], .adPrice, [class*="price"]',
  year: '[data-qa-id="criteria_value"], [class*="year"], [data-qa-id="aditem_date"]',
  mileage: '[data-qa-id="criteria_value"], [data-qa-id="item_params"] span, [class*="mileage"]',
  damageStatus: '[data-qa-id="aditem_description"], [class*="damage"], [class*="state"]',
  description: '[data-qa-id="aditem_description"], [data-qa-id="ad_description"], .textDescription',
  imageUrl: "img",
  link: 'a[data-qa-id="aditem_container"], a[data-qa-id="listitem_ad"], a[href*="/ad/"]',
  nextPage: 'button[data-qa-id="pagination_next"], a[data-qa-id="pagination_next"], [aria-label="Page suivante"]',
};

const AUTOSCOUT24_DEFAULTS = {
  listingContainer: '[data-testid="sr-listing-item"], [data-testid="list-item"], .cl-list-element',
  title: '[data-testid="vehicle-title"], [data-testid="title"], .heading, h2, .vehicle-title',
  price: '[data-testid="price"], [class*="price"], .price, [data-testid="listing-price"]',
  year: '[data-testid="vehicle-registration"], [data-testid="first-registration"], .first-registration, [class*="registration"]',
  mileage: '[data-testid="vehicle-mileage"], [data-testid="mileage"], .mileage, [class*="km"]',
  damageStatus: '[data-testid="vehicle-condition"], [class*="condition"], [class*="damage"]',
  description: '[data-testid="vehicle-details"], [data-testid="seller-details"], .seller-details, [class*="description"]',
  imageUrl: "img",
  link: 'a[data-testid="listing-link"], a[data-testid="listing-detail-link"], a[href*="/listing/"]',
  nextPage: 'button[aria-label="Next page"], a[aria-label="Next page"], [data-testid="pagination-next"], [class*="next"]',
};

const GENERIC_DEFAULTS = {
  listingContainer: "",
  title: "",
  price: "",
  year: "",
  mileage: "",
  damageStatus: "",
  description: "",
  imageUrl: "",
  link: "",
  nextPage: "",
};

const SCHADEAUTOS_DEFAULTS = {
  listingContainer: "a.schadeautos-card",
  title: ".schadeautos-card__title",
  price: ".schadeautos-card__price",
  year: ".schadeautos-card__footer .schadeautos-card__stat:nth-child(1) span",
  mileage: ".schadeautos-card__footer .schadeautos-card__stat:nth-child(3) span",
  damageStatus: "",
  description: ".schadeautos-card__subtitle",
  imageUrl: ".schadeautos-card__image",
  link: "a.schadeautos-card",
  nextPage: ".schadeautos-pagination__nav--next",
};

const VEHICLE_GRID_DEFAULTS = {
  listingContainer:
    '[class*="listing"], [class*="card"], [class*="vehicle"], [class*="annonce"]',
  title: 'h2, h3, [class*="title"], [class*="heading"]',
  price: '[class*="price"], [class*="prix"], [itemprop="price"]',
  year: '[class*="year"], [class*="registration"], [class*="annee"]',
  mileage: '[class*="mileage"], [class*="km"], [class*="kilometr"]',
  damageStatus: '[class*="damage"], [class*="state"], [class*="condition"]',
  description: '[class*="description"], [class*="desc"], p',
  imageUrl: "img",
  link: "a[href]",
  nextPage: '[rel="next"], a[class*="next"], [class*="pagination"] a',
};

type SelectorField = keyof typeof GENERIC_DEFAULTS;

export function getDefaultsForAdapter(
  type: string
): Record<SelectorField, string> {
  switch (type) {
    case "leboncoin":
      return { ...LEBONCOIN_DEFAULTS };
    case "autoscout24":
      return { ...AUTOSCOUT24_DEFAULTS };
    case "schadeautos":
    case "schadeauto-zoeker":
    case "schadeautos-nl":
      return { ...SCHADEAUTOS_DEFAULTS };
    case "autos-motos":
    case "didier":
    case "dsm":
      return { ...VEHICLE_GRID_DEFAULTS };
    default:
      return { ...GENERIC_DEFAULTS };
  }
}
