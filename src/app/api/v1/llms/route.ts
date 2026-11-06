import { store } from "@/lib/db";
import { siteForKey } from "@/lib/sites";
import { PRODUCTS } from "@/lib/products";

export const runtime = "nodejs";

// /llms.txt for a connected site: a plain-text map of the site for AI agents,
// built from the pages HypoText has already read.
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const site = await siteForKey(q.get("key"));
  if (!site) return new Response("Unknown site key.\n", { status: 401 });
  const origin = q.get("origin") ?? "";
  const base = q.get("base") ?? "";

  const lines: string[] = [];
  if (site.id === "demo") {
    lines.push("# Northwind Audio (HypoText demo store)", "", "> Headphones, speakers and earbuds. Prices and stock are live.", "", "## Products");
    for (const p of PRODUCTS) {
      lines.push(`- [${p.name}](${origin}${base}/p/${p.slug}): ${p.tagline}, $${p.price.toFixed(2)}, ${p.stock > 0 ? "in stock" : "out of stock"}`);
    }
  } else {
    lines.push(`# ${site.domain}`, "", "> Pages on this site are available to AI agents as structured JSON at the same URL.", "", "## Pages");
    const pages = await store.pages(site.id);
    for (const p of pages.slice(0, 200)) {
      let name = p.path;
      try { name = JSON.parse(p.json).name ?? p.path; } catch {}
      lines.push(`- [${name}](${origin}${p.path})`);
    }
    if (!pages.length) lines.push("- (no pages read yet)");
  }
  lines.push("", "## Notes", "- Request any page with an AI user agent to get JSON instead of HTML.", "- Served by HypoText.");

  return new Response(lines.join("\n") + "\n", {
    headers: { "content-type": "text/plain; charset=utf-8", "x-hypotext": "llms" },
  });
}
