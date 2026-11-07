import type { Extracted } from "./extract";

// Content parity: every fact we serve to bots must be visible to people.
// This is what keeps dual serving from becoming "cloaking".

export type ParityCheck = { field: string; value: string; ok: boolean };
// `empty` means the page has almost no text until JavaScript runs, so nothing can be checked.
export type ParityResult = { ok: boolean; checks: ParityCheck[]; empty?: boolean };

const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ");

function priceVariants(price: string): string[] {
  const n = Number(price);
  const whole = Math.trunc(n);
  const withCommas = whole.toLocaleString("en-US");
  const out = [price, withCommas + "." + price.split(".")[1], withCommas];
  if (Number.isInteger(n)) out.push(String(whole));
  return [...new Set(out)];
}

export function checkParity(data: Extracted, visibleText: string, title = ""): ParityResult {
  const text = norm(visibleText);
  // Nothing to compare against: don't serve, but don't call it a mismatch either.
  if (text.length < 80) return { ok: false, checks: [], empty: true };
  const checks: ParityCheck[] = [];

  if (data.name) {
    // Titles often carry a site suffix ("Product · Store"); the main part must be visible.
    const parts = data.name.replace(/…$/, "").split(/\s+[·|–—\-:]\s+/).map(norm).filter((p) => p.length > 2);
    // The tab title counts too: people see it in the browser.
    const seen = text + " " + norm(title);
    const ok = seen.includes(norm(data.name).replace(/…$/, "")) || (parts.length > 0 && seen.includes(parts[0]));
    checks.push({ field: "name", value: data.name, ok });
  }
  if (data.offers?.price) {
    const ok = priceVariants(data.offers.price).some((v) => text.includes(v));
    checks.push({ field: "price", value: data.offers.price, ok });
  }
  if (data.offers?.availability) {
    const a = data.offers.availability;
    const shownOut = /out of stock|sold out|unavailable/.test(text);
    const shownIn = /in stock|add to (cart|bag|basket)|buy now|available now/.test(text);
    // "In stock" is fine if the page lets people buy (some variants may be sold out).
    // "Out of stock" must be visible on the page.
    const ok = a === "OutOfStock" ? shownOut : shownIn || !shownOut;
    checks.push({ field: "availability", value: a, ok });
  }
  return { ok: checks.every((c) => c.ok), checks };
}
