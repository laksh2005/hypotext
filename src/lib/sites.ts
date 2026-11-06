import { findSiteByKey, type Site } from "./db";
import { DEMO_KEY } from "./constants";

// The demo store is a built-in site, so anyone can try HypoText without signing up.
export const DEMO_SITE: Site = { id: "demo", key: DEMO_KEY, domain: "*" };

export async function siteForKey(key: string | null): Promise<Site | null> {
  if (!key) return null;
  if (key === DEMO_KEY) return DEMO_SITE;
  return findSiteByKey(key);
}

// "https://www.Shop.com/x" -> "shop.com"
export function normalizeDomain(input: string): string | null {
  try {
    const text = input.trim();
    const url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`);
    if (!url.hostname.includes(".")) return null;
    return url.hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}

export function urlBelongsToSite(site: Site, url: string): boolean {
  if (site.domain === "*") return true;
  try {
    const host = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
    return host === site.domain || host.endsWith("." + site.domain);
  } catch {
    return false;
  }
}
