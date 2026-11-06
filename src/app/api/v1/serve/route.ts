import { NextResponse } from "next/server";
import { analyze } from "@/lib/render";
import { getPage, logHit, savePage } from "@/lib/db";
import { siteForKey, urlBelongsToSite } from "@/lib/sites";

export const maxDuration = 30;

// A page's JSON is reused for one minute, then re-read from the live page,
// so agents always see current prices and stock.
const FRESH_FOR_MS = 60_000;

// Called by the middleware when an AI agent asks for a page.
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const site = await siteForKey(q.get("key"));
  const url = q.get("url") ?? "";
  const bot = q.get("bot") ?? "unknown";

  if (!site) return NextResponse.json({ error: "Unknown site key." }, { status: 401 });
  if (!urlBelongsToSite(site, url)) return NextResponse.json({ error: "That URL isn't on this site." }, { status: 403 });

  const { pathname, search } = new URL(url);
  const path = pathname + search;

  let page = await getPage(site.id, path);
  if (!page || Date.now() - page.checkedAt > FRESH_FOR_MS) {
    try {
      const a = await analyze(url);
      await savePage({
        siteId: site.id, path, json: JSON.stringify(a.data), htmlBytes: a.totalBytes,
        parityOk: a.parity.ok, parity: JSON.stringify(a.parity),
      });
      page = await getPage(site.id, path);
    } catch {
      return NextResponse.json({ error: "Couldn't read the page." }, { status: 502 });
    }
  }
  if (!page) return NextResponse.json({ error: "Couldn't read the page." }, { status: 502 });

  if (bot !== "preview") {
    await logHit({ siteId: site.id, bot, path, htmlBytes: page.htmlBytes, jsonBytes: Buffer.byteLength(page.json) });
  }

  // Never serve facts people can't see. The agent gets the normal page instead.
  if (!page.parityOk) return NextResponse.json({ error: "Facts don't match the visible page." }, { status: 409 });

  return new NextResponse(page.json, { headers: { "content-type": "application/ld+json; charset=utf-8" } });
}
