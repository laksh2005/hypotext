import Link from "next/link";
import { KNOWN_BOTS } from "@/lib/bots";
import { SITE_URL } from "@/lib/site-url";

export const metadata = { title: "Docs" };

export default function Docs() {
  return (
    <div className="prose-ht text-[15px]">
      <h1 className="font-medium">How HypoText works</h1>
      <p className="mt-1 text-muted">Everything you need to set it up, in one page.</p>

      <div className="h">the idea</div>
      <p>
        Your website now has two kinds of readers: people with browsers, and AI agents that read pages to answer questions. People need your design. Agents need facts. HypoText gives each what they need, from the same link.
      </p>

      <div className="h">the request flow</div>
      <pre className="code">{`visitor → your site → hypotext middleware
                          │
            person? ──────┴────── AI agent?
               │                      │
         your normal page     hypotext reads the page,
                              pulls out the facts,
                              checks they're visible,
                              returns JSON (≈ 0.5 KB)`}</pre>

      <div className="h">set up on next.js</div>
      <p>1. <Link href="/dashboard">Add your site</Link> and copy your key into your environment variables as <code className="font-mono text-xs">HYPOTEXT_KEY</code>.</p>
      <p className="mt-2">2. Create <code className="font-mono text-xs">middleware.ts</code> in your project root:</p>
      <pre className="code mt-2">{`import { hypotext } from "@hypotext/next";

export default hypotext({
  siteKey: process.env.HYPOTEXT_KEY!,
  // optional:
  // include: ["/products"],   only these paths
  // exclude: ["/account"],    never these paths
  // llmsTxt: true,            serve /llms.txt (default)
});`}</pre>
      <p className="mt-2">3. Deploy. Then test it:</p>
      <pre className="code mt-2">{`curl -A "GPTBot" https://yoursite.com/some-page   # JSON
curl https://yoursite.com/some-page                # your normal HTML`}</pre>
      <p className="mt-2 text-muted">Add <code className="font-mono text-xs">?view=ai</code> to any page in your browser to preview what agents get.</p>

      <div className="h" id="other-stacks">other stacks</div>
      <p>
        Anything that can look at a request before answering it can use HypoText. When the user agent is an AI agent, call the serve API and return its response:
      </p>
      <pre className="code mt-2">{`GET ${SITE_URL}/api/v1/serve
    ?key=YOUR_KEY
    &url=https://yoursite.com/the/page
    &bot=GPTBot

200  application/ld+json   the page's facts
409  held back             facts didn't match the page; serve your normal HTML
401 / 403                  bad key, or the URL isn't on your domain`}</pre>
      <p className="mt-2">Example for a Cloudflare Worker:</p>
      <pre className="code mt-2">{`export default {
  async fetch(req) {
    const ua = req.headers.get("user-agent") || "";
    if (/GPTBot|ClaudeBot|PerplexityBot/i.test(ua) && !req.headers.get("x-hypotext-bypass")) {
      const api = "${SITE_URL}/api/v1/serve?key=" + KEY +
        "&url=" + encodeURIComponent(req.url) + "&bot=" + encodeURIComponent(ua);
      const r = await fetch(api);
      if (r.ok) return r;
    }
    return fetch(req);
  },
};`}</pre>

      <div className="h">what agents get</div>
      <p>A schema.org JSON document. Each field comes from the first source that has it:</p>
      <div className="mt-2">
        {[
          ["1", "JSON-LD", "structured data already on your page"],
          ["2", "OpenGraph and meta", "og:title, product:price and similar tags"],
          ["3", "Microdata", "itemprop attributes"],
          ["4", "Text patterns", "price, currency, stock and rating near the main heading"],
          ["5", "Headings and text", "title, h1/h2 and the opening paragraphs"],
        ].map(([n, a, b]) => (
          <div key={n} className="row justify-start"><span className="w-6 shrink-0 text-faint">{n}</span><span>{a} <span className="text-muted">· {b}</span></span></div>
        ))}
      </div>
      <p className="mt-3">
        Pages are re-read at most once a minute, so prices and stock stay current. If a page can't be read, the last good copy is used.
      </p>

      <div className="h">content match</div>
      <p>
        Showing bots something different from people is called cloaking, and search engines penalise it. Before serving JSON, HypoText checks that the name, price and stock it found are visible on the page. If they aren't, the page is held back and agents get your normal HTML until it's fixed.
      </p>

      <div className="h">llms.txt</div>
      <p>
        HypoText also answers <code className="font-mono text-xs">/llms.txt</code> on your site: a short, plain-text map of your pages for AI agents. See the <Link href="/demo/llms.txt" prefetch={false}>demo store's</Link>.
      </p>

      <div className="h">recognised agents</div>
      <div className="text-sm">
        {KNOWN_BOTS.map((b) => (
          <div key={b.name} className="row"><span>{b.name}</span><span className="text-muted">{b.owner} · {b.kind}</span></div>
        ))}
      </div>
    </div>
  );
}
