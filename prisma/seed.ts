import { PrismaClient } from "@prisma/client";
import { hashSync } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const adminPassword = hashSync("admin123", 10);

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
          listingCard: ".styles_adCard__Gxxv4",
          title: "[data-qa-id='adtitle']",
          price: "[data-qa-id='adprice']",
          link: "a[data-qa-id='aditem_title']",
          image: "img[data-qa-id='aditem_image']",
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
          listingCard: ".cl-list-element",
          title: ".truncate",
          price: ".price-section__price",
          link: "a.cl-list-element__-link",
          image: ".image-container img",
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
          listingCard: ".listing-item",
          title: ".listing-title",
          price: ".listing-price",
          link: "a.listing-link",
          image: "img.listing-image",
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
