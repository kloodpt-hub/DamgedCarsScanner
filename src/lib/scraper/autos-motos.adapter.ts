import * as cheerio from "cheerio";
import type { AnyNode } from "domhandler";
import { BaseAdapter } from "./base-adapter";
import type { RawListing } from "./types";
import { parseMileage, parsePrice, parseYear } from "./attribute-parser";

const AUTOS_MOTOS_SELECTORS = {
  listingContainer: "div.box1car",
};

interface ImgLabel {
  name: string;
  year?: number;
  mileage?: number;
}

export class AutosMotosAdapter extends BaseAdapter {
  name = "autos-motos";

  async scrape(url: string): Promise<RawListing[]> {
    const loadCarsUrl = this.buildLoadCarsUrl(url);
    const html = await this.fetchHtml(loadCarsUrl);
    return this.parseListings(html, url);
  }

  protected buildLoadCarsUrl(baseUrl: string): string {
    const origin = new URL(baseUrl).origin;
    const lang = this.detectLang(baseUrl);
    return `${origin}/assets/php/loadcars.php?lang=${lang}&make=NEW&count=0`;
  }

  private detectLang(baseUrl: string): string {
    try {
      const path = new URL(baseUrl).pathname;
      const match = path.match(/^\/(en|nl|fr|de)(?:$|\/)/);
      if (match) return match[1];
    } catch {
      // fall through to default
    }
    return "en";
  }

  private parseListings(html: string, sourceUrl: string): RawListing[] {
    const $ = cheerio.load(html);
    const listings: RawListing[] = [];

    const origin = new URL(sourceUrl).origin;

    $(AUTOS_MOTOS_SELECTORS.listingContainer).each((_, element) => {
      try {
        const $el = $(element);

        const title = this.extractTitle($el);
        if (!title) return;

        const vehicleId = this.extractVehicleId($el);
        const canonicalUrl = vehicleId
          ? `${origin}/vehicle/${vehicleId}`
          : this.buildCanonicalFromImage($el, sourceUrl);
        if (!canonicalUrl) return;

        const externalId = this.generateExternalId(
          canonicalUrl,
          this.sourceId ?? this.sourceIdForExternalId(sourceUrl)
        );

        const price =
          parsePrice($el.find('[class*="box1carPrice"]').first().text()) ??
          undefined;

        const { year, mileage } = this.extractYearAndMileage($, $el);

        const imageUrl = this.extractImage($, $el, "img.box1carImage", sourceUrl);

        listings.push({
          externalId,
          title,
          price,
          year,
          mileage,
          damageStatus: undefined,
          description: undefined,
          imageUrl: imageUrl ?? undefined,
          images: imageUrl ? [imageUrl] : [],
          canonicalUrl,
          sourceUrl,
          isSold: false,
        });
      } catch (err) {
        console.warn(
          `[${this.name}] Skipping malformed listing:`,
          err instanceof Error ? err.message : String(err)
        );
      }
    });

    return listings;
  }

  private extractTitle($el: cheerio.Cheerio<AnyNode>): string | null {
    const infoTitle = $el.find(".box1carInfo > div").first().text().trim();
    if (infoTitle) return infoTitle;

    const imgLabel = this.extractImgLabel($el);
    if (imgLabel?.name) return imgLabel.name;

    const infoText = $el.find(".box1carInfo").first().text().trim();
    const firstLine = infoText.split(/\r?\n/)[0]?.trim();
    if (firstLine) return firstLine;

    return null;
  }

  private extractImgLabel($el: cheerio.Cheerio<AnyNode>): ImgLabel | null {
    const img = $el.find("img.box1carImage").first();
    const label = img.attr("title") || img.attr("alt");
    if (!label) return null;

    const match = label.match(/^(.*?)\s*-\s*(\d{4})\s*-\s*([\d., ]+)\s*km/i);
    if (!match) return null;

    return {
      name: match[1].trim(),
      year: parseYear(match[2]) ?? undefined,
      mileage: parseMileage(match[3]) ?? undefined,
    };
  }

  private extractYearAndMileage(
    $: cheerio.CheerioAPI,
    $el: cheerio.Cheerio<AnyNode>
  ): { year?: number; mileage?: number } {
    let year: number | undefined;
    let mileage: number | undefined;

    const valueRow = $el.find(".box1carInfo .row").last();
    const cells = valueRow
      .find(".col-3")
      .map((_, cell) => $(cell).text().trim())
      .get()
      .filter(Boolean);

    for (const text of cells) {
      if (year === undefined) {
        const parsedYear = parseYear(text);
        if (parsedYear !== null) {
          year = parsedYear;
          continue;
        }
      }
      if (mileage === undefined) {
        mileage = parseMileage(text) ?? undefined;
      }
      if (year !== undefined && mileage !== undefined) break;
    }

    if (year === undefined || mileage === undefined) {
      const imgLabel = this.extractImgLabel($el);
      if (year === undefined) year = imgLabel?.year;
      if (mileage === undefined) mileage = imgLabel?.mileage;
    }

    if (year === undefined) {
      year = this.extractYearFromText(
        $el.find(".box1carInfo").first().text()
      );
    }

    return { year, mileage };
  }

  private extractYearFromText(text: string): number | undefined {
    const parsed = parseYear(text);
    if (parsed !== null) return parsed;

    const match = text.match(/(?:19|20)\d{2}/);
    if (match) {
      const year = parseInt(match[0], 10);
      if (year >= 1950 && year <= new Date().getFullYear() + 1) {
        return year;
      }
    }

    return undefined;
  }

  private extractVehicleId($el: cheerio.Cheerio<AnyNode>): string | null {
    const onclick = $el.find("a").first().attr("onclick") || "";
    const match = onclick.match(/fillContentBox\s*\(\s*["']?(\d+)/);
    return match ? match[1] : null;
  }

  private buildCanonicalFromImage(
    $el: cheerio.Cheerio<AnyNode>,
    sourceUrl: string
  ): string | null {
    const src = $el.find("img.box1carImage").first().attr("src");
    if (!src) return null;
    try {
      return new URL(src, sourceUrl).href;
    } catch {
      return null;
    }
  }
}
