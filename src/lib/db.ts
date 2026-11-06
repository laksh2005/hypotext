import { neon } from "@neondatabase/serverless";
import { randomBytes } from "crypto";

// Storage. Uses Postgres (Neon) when DATABASE_URL is set; otherwise an
// in-memory store so the app runs locally with zero setup.

export type Site = { id: string; key: string; domain: string; createdAt: string };
export type Hit = {
  siteId: string; bot: string; owner: string; path: string;
  htmlBytes: number; jsonBytes: number; at: string;
};
export type Page = {
  siteId: string; path: string; json: string; htmlBytes: number;
  parityOk: boolean; parity: string; checkedAt: string;
};

export interface Store {
  createSite(domain: string): Promise<Site>;
  siteByKey(key: string): Promise<Site | null>;
  logHit(h: Omit<Hit, "at">): Promise<void>;
  recentHits(siteId: string, limit: number): Promise<Hit[]>;
  stats(siteId: string, days: number): Promise<{ visits: number; savedBytes: number; bots: { bot: string; n: number }[] }>;
  upsertPage(p: Omit<Page, "checkedAt">): Promise<void>;
  getPage(siteId: string, path: string): Promise<Page | null>;
  pages(siteId: string): Promise<Page[]>;
}

export const newKey = () => "ht_" + randomBytes(12).toString("hex");
const newId = () => randomBytes(8).toString("hex");

// ---------- In-memory ----------
type Mem = { sites: Site[]; hits: Hit[]; pages: Page[] };
const g = globalThis as unknown as { __htmem?: Mem };
const mem: Mem = (g.__htmem ??= { sites: [], hits: [], pages: [] });

const memoryStore: Store = {
  async createSite(domain) {
    const s = { id: newId(), key: newKey(), domain, createdAt: new Date().toISOString() };
    mem.sites.push(s);
    return s;
  },
  async siteByKey(key) { return mem.sites.find((s) => s.key === key) ?? null; },
  async logHit(h) {
    mem.hits.push({ ...h, at: new Date().toISOString() });
    if (mem.hits.length > 5000) mem.hits.splice(0, 1000);
  },
  async recentHits(siteId, limit) {
    return mem.hits.filter((h) => h.siteId === siteId).slice(-limit).reverse();
  },
  async stats(siteId, days) {
    const since = Date.now() - days * 864e5;
    const hs = mem.hits.filter((h) => h.siteId === siteId && Date.parse(h.at) >= since);
    const counts = new Map<string, number>();
    hs.forEach((h) => counts.set(h.bot, (counts.get(h.bot) ?? 0) + 1));
    return {
      visits: hs.length,
      savedBytes: hs.reduce((a, h) => a + Math.max(0, h.htmlBytes - h.jsonBytes), 0),
      bots: [...counts].map(([bot, n]) => ({ bot, n })).sort((a, b) => b.n - a.n),
    };
  },
  async upsertPage(p) {
    const i = mem.pages.findIndex((x) => x.siteId === p.siteId && x.path === p.path);
    const row = { ...p, checkedAt: new Date().toISOString() };
    if (i >= 0) mem.pages[i] = row; else mem.pages.push(row);
  },
  async getPage(siteId, path) { return mem.pages.find((x) => x.siteId === siteId && x.path === path) ?? null; },
  async pages(siteId) { return mem.pages.filter((x) => x.siteId === siteId).sort((a, b) => a.path.localeCompare(b.path)); },
};

// ---------- Postgres ----------
function pgStore(url: string): Store {
  const sql = neon(url);
  let ready: Promise<unknown> | null = null;
  const init = () =>
    (ready ??= (async () => {
      await sql`create table if not exists sites (id text primary key, key text unique not null, domain text not null, created_at timestamptz default now())`;
      await sql`create table if not exists hits (id bigserial primary key, site_id text not null, bot text not null, owner text not null, path text not null, html_bytes int not null, json_bytes int not null, at timestamptz default now())`;
      await sql`create index if not exists hits_site_at on hits (site_id, at desc)`;
      await sql`create table if not exists pages (site_id text not null, path text not null, json text not null, html_bytes int not null, parity_ok boolean not null, parity text not null, checked_at timestamptz default now(), primary key (site_id, path))`;
    })());

  type Row = Record<string, unknown>;
  const toHit = (r: Row): Hit => ({
    siteId: r.site_id as string, bot: r.bot as string, owner: r.owner as string, path: r.path as string,
    htmlBytes: r.html_bytes as number, jsonBytes: r.json_bytes as number, at: new Date(r.at as string).toISOString(),
  });
  const toPage = (r: Row): Page => ({
    siteId: r.site_id as string, path: r.path as string, json: r.json as string, htmlBytes: r.html_bytes as number,
    parityOk: r.parity_ok as boolean, parity: r.parity as string, checkedAt: new Date(r.checked_at as string).toISOString(),
  });

  return {
    async createSite(domain) {
      await init();
      const s = { id: newId(), key: newKey(), domain, createdAt: new Date().toISOString() };
      await sql`insert into sites (id, key, domain) values (${s.id}, ${s.key}, ${s.domain})`;
      return s;
    },
    async siteByKey(key) {
      await init();
      const r = (await sql`select * from sites where key = ${key}`)[0];
      return r ? { id: r.id, key: r.key, domain: r.domain, createdAt: new Date(r.created_at).toISOString() } : null;
    },
    async logHit(h) {
      await init();
      await sql`insert into hits (site_id, bot, owner, path, html_bytes, json_bytes) values (${h.siteId}, ${h.bot}, ${h.owner}, ${h.path}, ${h.htmlBytes}, ${h.jsonBytes})`;
    },
    async recentHits(siteId, limit) {
      await init();
      return (await sql`select * from hits where site_id = ${siteId} order by at desc limit ${limit}`).map(toHit);
    },
    async stats(siteId, days) {
      await init();
      const since = new Date(Date.now() - days * 864e5).toISOString();
      const [t] = await sql`select count(*)::int as n, coalesce(sum(greatest(html_bytes - json_bytes, 0)), 0)::bigint as saved from hits where site_id = ${siteId} and at >= ${since}`;
      const bots = await sql`select bot, count(*)::int as n from hits where site_id = ${siteId} and at >= ${since} group by bot order by n desc`;
      return { visits: t.n, savedBytes: Number(t.saved), bots: bots.map((b) => ({ bot: b.bot, n: b.n })) };
    },
    async upsertPage(p) {
      await init();
      await sql`insert into pages (site_id, path, json, html_bytes, parity_ok, parity) values (${p.siteId}, ${p.path}, ${p.json}, ${p.htmlBytes}, ${p.parityOk}, ${p.parity})
        on conflict (site_id, path) do update set json = excluded.json, html_bytes = excluded.html_bytes, parity_ok = excluded.parity_ok, parity = excluded.parity, checked_at = now()`;
    },
    async getPage(siteId, path) {
      await init();
      const r = (await sql`select * from pages where site_id = ${siteId} and path = ${path}`)[0];
      return r ? toPage(r) : null;
    },
    async pages(siteId) {
      await init();
      return (await sql`select * from pages where site_id = ${siteId} order by path`).map(toPage);
    },
  };
}

export const store: Store = process.env.DATABASE_URL ? pgStore(process.env.DATABASE_URL) : memoryStore;
