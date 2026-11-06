import * as cheerio from "cheerio";

// Rules-only extractor. Turns a full HTML page into a small JSON document
// with just the facts. Sources are tried in priority order and the first
// source that provides a field wins:
//   1. JSON-LD already on the page (schema.org)
//   2. OpenGraph / product meta tags
//   3. Microdata (itemprop)
//   4. Text patterns (price, currency, stock)
//   5. Title, headings and main text

export type Extracted = {
  "@context": "https://schema.org";
  "@type": string;
  url: string;
  name?: string;
  description?: string;
  brand?: string;
  image?: string;
  offers?: { price?: string; priceCurrency?: string; availability?: string };
  aggregateRating?: { ratingValue?: number; reviewCount?: number };
  headings?: string[];
  summary?: string;
};

export type FieldSource = Record<string, string>;

export type ExtractResult = {
  data: Extracted;
  sources: FieldSource; // which rule produced each field
  visibleText: string; // what a person can read on the page, used for parity
};

const CURRENCY_SYMBOLS: Record<string, string> = { $: "USD", "€": "EUR", "£": "GBP", "₹": "INR", "¥": "JPY" };

function clean(s: string | undefined | null, max = 300): string | undefined {
  if (!s) return undefined;
  const t = s.replace(/\s+/g, " ").trim();
  if (!t) return undefined;
  return t.length > max ? t.slice(0, max - 1).trimEnd() + "…" : t;
}

function normPrice(p: unknown): string | undefined {
  if (p === undefined || p === null || p === "") return undefined;
  const n = Number(String(p).replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) && n > 0 ? n.toFixed(2) : undefined;
}

function normAvailability(a: unknown): string | undefined {
  if (!a) return undefined;
  const s = String(a).toLowerCase();
  if (s.includes("outofstock") || s.includes("out of stock") || s.includes("sold out")) return "OutOfStock";
  if (s.includes("preorder")) return "PreOrder";
  if (s.includes("instock") || s.includes("in stock") || s.includes("available")) return "InStock";
  return undefined;
}

// Flatten JSON-LD blocks (arrays, @graph) into a list of nodes.
function jsonLdNodes($: cheerio.CheerioAPI): Record<string, unknown>[] {
  const out: Record<string, unknown>[] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const parsed = JSON.parse($(el).contents().text());
      const stack = Array.isArray(parsed) ? [...parsed] : [parsed];
      while (stack.length) {
        const n = stack.shift();
        if (!n || typeof n !== "object") continue;
        if (Array.isArray(n)) { stack.push(...n); continue; }
        const obj = n as Record<string, unknown>;
        if (Array.isArray(obj["@graph"])) stack.push(...(obj["@graph"] as unknown[]));
        out.push(obj);
      }
    } catch { /* ignore malformed JSON-LD */ }
  });
  return out;
}

const typeOf = (n: Record<string, unknown>) =>
  ([] as unknown[]).concat(n["@type"] ?? []).map(String);

const PREFERRED_TYPES = ["Product", "SoftwareApplication", "Article", "NewsArticle", "BlogPosting", "Organization", "WebPage"];

export function extract(html: string, url: string): ExtractResult {
  const $ = cheerio.load(html);
  const sources: FieldSource = {};
  const data: Extracted = { "@context": "https://schema.org", "@type": "WebPage", url };

  const set = <K extends keyof Extracted>(key: K, value: Extracted[K] | undefined, source: string) => {
    if (value === undefined || data[key] !== undefined && key !== "@type") return;
    data[key] = value;
    sources[key as string] = source;
  };

  // 1. JSON-LD
  const nodes = jsonLdNodes($);
  const main =
    PREFERRED_TYPES.map((t) => nodes.find((n) => typeOf(n).includes(t))).find(Boolean) ?? nodes[0];
  if (main) {
    const t = typeOf(main)[0];
    if (t) { data["@type"] = t; sources["@type"] = "json-ld"; }
    set("name", clean(main.name as string), "json-ld");
    set("description", clean(main.description as string), "json-ld");
    const brand = main.brand as { name?: string } | string | undefined;
    set("brand", clean(typeof brand === "string" ? brand : brand?.name), "json-ld");
    const img = main.image as string | string[] | { url?: string } | undefined;
    set("image", typeof img === "string" ? img : Array.isArray(img) ? img[0] : img?.url, "json-ld");
    const offersRaw = main.offers as Record<string, unknown> | Record<string, unknown>[] | undefined;
    const offer = Array.isArray(offersRaw) ? offersRaw[0] : offersRaw;
    if (offer) {
      const price = normPrice(offer.price ?? offer.lowPrice);
      const o = {
        price,
        priceCurrency: offer.priceCurrency ? String(offer.priceCurrency) : undefined,
        availability: normAvailability(offer.availability),
      };
      if (o.price || o.availability) set("offers", o, "json-ld");
    }
    const r = main.aggregateRating as Record<string, unknown> | undefined;
    if (r?.ratingValue) {
      set("aggregateRating", {
        ratingValue: Number(r.ratingValue),
        reviewCount: r.reviewCount ? Number(r.reviewCount) : r.ratingCount ? Number(r.ratingCount) : undefined,
      }, "json-ld");
    }
  }

  // 2. OpenGraph and product meta
  const meta = (k: string) =>
    $(`meta[property="${k}"]`).attr("content") ?? $(`meta[name="${k}"]`).attr("content");
  set("name", clean(meta("og:title")), "opengraph");
  set("description", clean(meta("og:description") ?? meta("description")), "meta");
  set("image", meta("og:image"), "opengraph");
  const ogType = meta("og:type");
  if (!sources["@type"] && ogType) {
    if (/product/i.test(ogType)) data["@type"] = "Product";
    else if (/article/i.test(ogType)) data["@type"] = "Article";
    if (data["@type"] !== "WebPage") sources["@type"] = "opengraph";
  }
  const metaPrice = normPrice(meta("product:price:amount") ?? meta("og:price:amount"));
  if (metaPrice) {
    set("offers", {
      price: metaPrice,
      priceCurrency: meta("product:price:currency") ?? meta("og:price:currency"),
      availability: normAvailability(meta("product:availability") ?? meta("og:availability")),
    }, "meta");
  }

  // 3. Microdata
  const ip = (k: string) => {
    const el = $(`[itemprop="${k}"]`).first();
    return el.attr("content") ?? el.attr("href") ?? clean(el.text());
  };
  set("name", clean(ip("name")), "microdata");
  const mdPrice = normPrice(ip("price"));
  if (mdPrice) {
    set("offers", { price: mdPrice, priceCurrency: ip("priceCurrency"), availability: normAvailability(ip("availability")) }, "microdata");
  }

  // Visible text: what a person actually sees (scripts, styles and hidden nodes removed).
  const body = $("body").clone();
  body.find("script,style,noscript,template,svg,iframe,[hidden],[aria-hidden='true']").remove();
  const visibleText = (body.text() || "").replace(/\s+/g, " ").trim();

  // 4. Text patterns: only used when no structured source gave a price.
  // Look for the price near the main heading first, so prices from nav or
  // "related products" don't win.
  const h1Text = clean($("h1").first().text());
  const h1At = h1Text ? visibleText.indexOf(h1Text) : -1;
  const near = h1At >= 0 ? visibleText.slice(h1At, h1At + 600) : visibleText;
  const commerce = /add to (cart|bag|basket)|buy now|sold out|out of stock|in stock/i;
  if (!data.offers && (data["@type"] === "Product" || commerce.test(near))) {
    const priceRe = /([$€£₹¥])\s?(\d{1,3}(?:[,\d]{0,9})(?:\.\d{2})?)/;
    const m = near.match(priceRe) ?? visibleText.match(priceRe);
    if (m) {
      data["@type"] = data["@type"] === "WebPage" ? "Product" : data["@type"];
      set("offers", {
        price: normPrice(m[2]),
        priceCurrency: CURRENCY_SYMBOLS[m[1]],
        availability: normAvailability(near.match(/out of stock|sold out|in stock/i)?.[0]),
      }, "text-pattern");
    }
  }
  // Ratings like "4.7 · 12,483 reviews" or "4.5 out of 5 (320 reviews)".
  if (!data.aggregateRating && data["@type"] === "Product") {
    const r = near.match(/(\d(?:\.\d)?)\s*(?:out of 5|\/\s*5)?\s*(?:stars?)?\s*[·•|(\-–]?\s*([\d,]+)\s*(?:reviews|ratings)/i);
    if (r && Number(r[1]) <= 5) {
      set("aggregateRating", { ratingValue: Number(r[1]), reviewCount: Number(r[2].replace(/,/g, "")) }, "text-pattern");
    }
  }

  // 5. Title, headings, main text
  set("name", clean($("h1").first().text()) ?? clean($("title").text()), "html");
  const headings = $("h1,h2")
    .map((_, el) => clean($(el).text(), 120))
    .get()
    .filter(Boolean) as string[];
  if (headings.length) set("headings", [...new Set(headings)].slice(0, 8), "html");
  const mainEl = $("article").length ? $("article").first() : $("main").length ? $("main") : $("body");
  const para = mainEl
    .find("p")
    .map((_, el) => clean($(el).text(), 400))
    .get()
    .filter((t: string) => t && t.length > 60)
    .slice(0, 2)
    .join(" ");
  set("summary", clean(para, 500), "html");
  set("description", data.summary, "html");

  // Drop empty nested values so the output stays small.
  if (data.offers) {
    for (const k of Object.keys(data.offers) as (keyof NonNullable<Extracted["offers"]>)[])
      if (data.offers[k] === undefined) delete data.offers[k];
  }
  // Summary only adds value when it says more than the description.
  if (data.summary && data.description && data.summary.startsWith(data.description.replace(/…$/, ""))) {
    delete data.summary; delete sources.summary;
  }

  // Stable, readable key order.
  const order = ["@context", "@type", "name", "brand", "description", "url", "image", "offers", "aggregateRating", "headings", "summary"];
  const ordered = Object.fromEntries(
    order.filter((k) => (data as Record<string, unknown>)[k] !== undefined).map((k) => [k, (data as Record<string, unknown>)[k]]),
  ) as Extracted;

  return { data: ordered, sources, visibleText };
}

// Rough token estimate (about 4 characters per token for English and markup).
export const estimateTokens = (s: string) => Math.ceil(s.length / 4);
