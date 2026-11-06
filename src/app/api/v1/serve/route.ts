import { NextResponse } from "next/server";
import { analyze } from "@/lib/render";
import { store } from "@/lib/db";
import { siteForKey, urlBelongsToSite } from "@/lib/sites";
import { KNOWN_BOTS } from "@/lib/bots";

export const runtime = "nodejs";
export const maxDuration = 30;

// How long a page's JSON is reused before HypoText re-reads the live page.
// Short on purpose: bots should see current prices and stock, not a snapshot.
const TTL_MS = 60_000;

// Called by the middleware when an AI agent requests a page.
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const site = await siteForKey(q.get("key"));
  const url = q.get("url");
  const botName = q.get("bot") ?? "unknown";
  if (!site) return NextResponse.json({ error: "Unknown site key." }, { status: 401 });
  if (!url || !urlBelongsToSite(site, url)) return NextResponse.json({ error: "That URL isn't on this site." }, { status: 403 });

  const u = new URL(url);
  const path = u.pathname + u.search;
  let page = await store.getPage(site.id, path);
  let cache = "hit";

  if (!page || Date.now() - Date.parse(page.checkedAt) > TTL_MS) {
    cache = "miss";
    try {
      const a = await analyze(url);
      await store.upsertPage({
        siteId: site.id,
        path,
        json: JSON.stringify(a.data),
        htmlBytes: a.totalBytes,
        parityOk: a.parity.ok,
        parity: JSON.stringify(a.parity),
      });
      page = await store.getPage(site.id, path);
    } catch (e) {
      // Fall back to the last good copy if the live page can't be read right now.
      if (!page) return NextResponse.json({ error: e instanceof Error ? e.message : "Couldn't read page." }, { status: 502 });
      cache = "stale";
    }
  }
  if (!page) return NextResponse.json({ error: "Couldn't read page." }, { status: 502 });

  const known = KNOWN_BOTS.find((b) => b.name === botName);
  if (botName !== "preview") {
    await store.logHit({
      siteId: site.id,
      bot: botName,
      owner: known?.owner ?? "unknown",
      path,
      htmlBytes: page.htmlBytes,
      jsonBytes: Buffer.byteLength(page.json),
    });
  }

  // Parity failed: don't serve facts people can't see. Bot gets the normal page instead.
  if (!page.parityOk) {
    return NextResponse.json({ error: "Held back: facts don't match the visible page." }, { status: 409, headers: { "x-hypotext": "held" } });
  }

  return new NextResponse(page.json, {
    headers: {
      "content-type": "application/ld+json; charset=utf-8",
      "x-hypotext": `served; cache=${cache}`,
      "x-hypotext-checked-at": page.checkedAt,
    },
  });
}
