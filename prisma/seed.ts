import { PrismaClient } from "@prisma/client";
import { randomBytes } from "crypto";
import { hashSync } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Use env-provided admin password, or generate a random one and log it.
  const tempPassword =
    process.env.SEED_ADMIN_PASSWORD ?? randomBytes(16).toString("base64url");
  if (!process.env.SEED_ADMIN_PASSWORD) {
    console.log(`[seed] Generated admin password: ${tempPassword}`);
  }
  const adminPassword = hashSync(tempPassword, 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@damagedcarscanner.com" },
    update: {},
    create: {
      email: "admin@damagedcarscanner.com",
      name: "Admin",
      password: adminPassword,
      role: "ADMIN",
    },
  });

  console.log(`Created admin user: ${admin.email}`);

  const leboncoin = await prisma.scraperSource.upsert({
    where: { id: "seed-leboncoin" },
    update: {},
    create: {
      id: "seed-leboncoin",
      name: "LeBonCoin",
      baseUrl: "https://www.leboncoin.fr",
      adapterType: "leboncoin",
      selectors: JSON.parse(
        JSON.stringify({
          listingContainer: '[data-qa-id="aditem_container"], [data-qa-id="listitem_ad"]',
          title: '[data-qa-id="aditem_title"], h2',
          price: '[data-qa-id="aditem_price"], [class*="price"]',
          year: '[data-qa-id="criteria_value"], [class*="year"]',
          mileage: '[data-qa-id="criteria_value"], [class*="mileage"]',
          damageStatus: '[data-qa-id="aditem_description"]',
          description: '[data-qa-id="aditem_description"]',
          imageUrl: 'img',
          link: 'a[data-qa-id="aditem_container"], a[href*="/ad/"]',
          nextPage: 'button[data-qa-id="pagination_next"]',
        })
      ),
      scrapeIntervalMinutes: 30,
    },
  });

  const autoscout24 = await prisma.scraperSource.upsert({
    where: { id: "seed-autoscout24" },
    update: {},
    create: {
      id: "seed-autoscout24",
      name: "AutoScout24",
      baseUrl: "https://www.autoscout24.com",
      adapterType: "autoscout24",
      selectors: JSON.parse(
        JSON.stringify({
          listingContainer: '[data-testid="sr-listing-item"], .cl-list-element',
          title: '[data-testid="vehicle-title"], h2',
          price: '[data-testid="price"], [class*="price"]',
          year: '[data-testid="vehicle-registration"], [class*="registration"]',
          mileage: '[data-testid="vehicle-mileage"], [class*="km"]',
          damageStatus: '[data-testid="vehicle-condition"], [class*="damage"]',
          description: '[data-testid="vehicle-details"]',
          imageUrl: 'img',
          link: 'a[data-testid="listing-link"], a[href*="/listing/"]',
          nextPage: 'button[aria-label="Next page"]',
        })
      ),
      scrapeIntervalMinutes: 60,
    },
  });

  const generic = await prisma.scraperSource.upsert({
    where: { id: "seed-generic" },
    update: {},
    create: {
      id: "seed-generic",
      name: "Generic Scraper",
      baseUrl: "https://example.com",
      adapterType: "generic",
      selectors: JSON.parse(
        JSON.stringify({
          listingContainer: '[class*="listing"], [class*="card"]',
          title: 'h2, h3, [class*="title"]',
          price: '[class*="price"]',
          year: '[class*="year"]',
          mileage: '[class*="mileage"], [class*="km"]',
          damageStatus: '[class*="damage"]',
          description: '[class*="description"], p',
          imageUrl: 'img',
          link: 'a[href]',
          nextPage: '',
        })
      ),
      scrapeIntervalMinutes: 120,
      isActive: false,
    },
  });

  console.log(`Created scraper sources: ${leboncoin.name}, ${autoscout24.name}, ${generic.name}`);
  console.log("Seeding complete.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
