import { listPages } from "@/lib/db";
import { siteForKey } from "@/lib/sites";
import { PRODUCTS } from "@/lib/products";

// /llms.txt: a short plain-text map of a site for AI agents.
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const site = await siteForKey(q.get("key"));
  const origin = q.get("origin") ?? "";
  if (!site) return new Response("Unknown site key.\n", { status: 401 });

  const lines: string[] = [];
  if (site.id === "demo") {
    lines.push("# Northwind Audio", "", "> Headphones, speakers and earbuds. Prices and stock are live.", "", "## Products");
    for (const p of PRODUCTS) {
      lines.push(`- [${p.name}](${origin}/p/${p.slug}): ${p.tagline}, $${p.price.toFixed(2)}, ${p.stock > 0 ? "in stock" : "out of stock"}`);
    }
  } else {
    lines.push(`# ${site.domain}`, "", "## Pages");
    for (const p of await listPages(site.id)) {
      const name = JSON.parse(p.json).name ?? p.path;
      lines.push(`- [${name}](${origin}${p.path})`);
    }
  }
  lines.push("", "Request any page with an AI user agent to get it as JSON.");

  return new Response(lines.join("\n") + "\n", { headers: { "content-type": "text/plain; charset=utf-8" } });
}
