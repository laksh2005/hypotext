import { store, type Site } from "./db";

// The public demo store is a built-in site so anyone can try it without signing up.
import { DEMO_KEY } from "./constants";
export { DEMO_KEY };
export const DEMO_SITE: Site = { id: "demo", key: DEMO_KEY, domain: "*", createdAt: "2025-01-01T00:00:00.000Z" };

export async function siteForKey(key: string | null | undefined): Promise<Site | null> {
  if (!key) return null;
  if (key === DEMO_KEY) return DEMO_SITE;
  return store.siteByKey(key);
}

export function normalizeDomain(input: string): string | null {
  try {
    const u = new URL(/^https?:\/\//i.test(input.trim()) ? input.trim() : `https://${input.trim()}`);
    if (!u.hostname.includes(".") && u.hostname !== "localhost") return null;
    return u.hostname.replace(/^www\./, "").toLowerCase();
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
