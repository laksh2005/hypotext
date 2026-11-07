import { neon } from "@neondatabase/serverless";
import { randomBytes } from "crypto";

// Storage for sites, pages HypoText has read, and AI agent visits.
// Uses Postgres when DATABASE_URL is set (production). Without it, data is
// kept in memory so the app runs locally with zero setup.

export type Site = { id: string; key: string; domain: string };
export type Page = { siteId: string; path: string; json: string; htmlBytes: number; parityOk: boolean; parity: string; checkedAt: number };
export type Hit = { siteId: string; bot: string; path: string; htmlBytes: number; jsonBytes: number; at: number };

const sql = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null;

// ---------- local fallback ----------
type Memory = { sites: Site[]; pages: Page[]; hits: Hit[] };
const g = globalThis as unknown as { htMemory?: Memory };
const mem: Memory = (g.htMemory ??= { sites: [], pages: [], hits: [] });

// ---------- schema (created once, on first use) ----------
let ready: Promise<void> | null = null;
function setup() {
  if (!sql) return Promise.resolve();
  ready ??= Promise.all([
    sql`create table if not exists sites (id text primary key, key text unique not null, domain text not null)`,
    sql`create table if not exists pages (site_id text, path text, json text, html_bytes int, parity_ok boolean, parity text, checked_at bigint, primary key (site_id, path))`,
    sql`create table if not exists hits (site_id text, bot text, path text, html_bytes int, json_bytes int, at bigint)`,
  ]).then(() => sql`create index if not exists hits_site_at on hits (site_id, at)`).then(() => {});
  return ready;
}

type Row = Record<string, unknown>;
const toPage = (r: Row): Page => ({
  siteId: r.site_id as string, path: r.path as string, json: r.json as string, htmlBytes: Number(r.html_bytes),
  parityOk: r.parity_ok as boolean, parity: r.parity as string, checkedAt: Number(r.checked_at),
});
const toHit = (r: Row): Hit => ({
  siteId: r.site_id as string, bot: r.bot as string, path: r.path as string,
  htmlBytes: Number(r.html_bytes), jsonBytes: Number(r.json_bytes), at: Number(r.at),
});

// ---------- sites ----------
export async function createSite(domain: string): Promise<Site> {
  const site = { id: randomBytes(8).toString("hex"), key: "ht_" + randomBytes(12).toString("hex"), domain };
  if (!sql) { mem.sites.push(site); return site; }
  await setup();
  await sql`insert into sites (id, key, domain) values (${site.id}, ${site.key}, ${site.domain})`;
  return site;
}

export async function findSiteByKey(key: string): Promise<Site | null> {
  if (!sql) return mem.sites.find((s) => s.key === key) ?? null;
  await setup();
  const [row] = await sql`select id, key, domain from sites where key = ${key}`;
  return (row as Site) ?? null;
}

// ---------- pages ----------
export async function savePage(page: Omit<Page, "checkedAt">) {
  const now = Date.now();
  if (!sql) {
    mem.pages = mem.pages.filter((p) => !(p.siteId === page.siteId && p.path === page.path));
    mem.pages.push({ ...page, checkedAt: now });
    return;
  }
  await setup();
  await sql`insert into pages values (${page.siteId}, ${page.path}, ${page.json}, ${page.htmlBytes}, ${page.parityOk}, ${page.parity}, ${now})
    on conflict (site_id, path) do update set json = excluded.json, html_bytes = excluded.html_bytes,
    parity_ok = excluded.parity_ok, parity = excluded.parity, checked_at = excluded.checked_at`;
}

export async function getPage(siteId: string, path: string): Promise<Page | null> {
  if (!sql) return mem.pages.find((p) => p.siteId === siteId && p.path === path) ?? null;
  await setup();
  const [row] = await sql`select * from pages where site_id = ${siteId} and path = ${path}`;
  return row ? toPage(row) : null;
}

export async function listPages(siteId: string): Promise<Page[]> {
  if (!sql) return mem.pages.filter((p) => p.siteId === siteId).sort((a, b) => a.path.localeCompare(b.path));
  await setup();
  return (await sql`select * from pages where site_id = ${siteId} order by path`).map(toPage);
}

// ---------- visits ----------
export async function logHit(hit: Omit<Hit, "at">) {
  if (!sql) { mem.hits.push({ ...hit, at: Date.now() }); return; }
  await setup();
  await sql`insert into hits values (${hit.siteId}, ${hit.bot}, ${hit.path}, ${hit.htmlBytes}, ${hit.jsonBytes}, ${Date.now()})`;
}

// Visits in the last 7 days, summarised for the dashboard.
export async function siteStats(siteId: string) {
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  let hits: Hit[];
  if (!sql) {
    hits = mem.hits.filter((h) => h.siteId === siteId && h.at >= weekAgo);
  } else {
    await setup();
    hits = (await sql`select * from hits where site_id = ${siteId} and at >= ${weekAgo} order by at`).map(toHit);
  }

  const perBot = new Map<string, number>();
  for (const h of hits) perBot.set(h.bot, (perBot.get(h.bot) ?? 0) + 1);

  return {
    visits: hits.length,
    savedBytes: hits.reduce((sum, h) => sum + Math.max(0, h.htmlBytes - h.jsonBytes), 0),
    bots: [...perBot].map(([bot, count]) => ({ bot, count })).sort((a, b) => b.count - a.count),
    recent: hits.slice(-12).reverse(),
  };
}
