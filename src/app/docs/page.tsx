import Link from "next/link";
import { KNOWN_BOTS } from "@/lib/bots";
import { SITE_URL } from "@/lib/site-url";

export const metadata = { title: "Docs" };

export default function Docs() {
  return (
    <div className="prose-ht">
      <h1 className="font-medium">How HypoText works</h1>
      <p className="mt-1 text-muted">Everything you need to set it up, on one page.</p>

      <div className="h">the request flow</div>
      <pre className="code">{`visitor → your site → hypotext middleware
                          │
            person ───────┴─────── AI agent
               │                      │
         your normal page     read the page, pull out the facts,
                              check they're visible, send JSON`}</pre>

      <div className="h">set up</div>
      <p>1. <Link href="/dashboard">Add your site</Link> and save the key as <code className="font-mono text-xs">HYPOTEXT_KEY</code>.</p>
      <p className="mt-2">2. Add <code className="font-mono text-xs">middleware.ts</code> to your Next.js app:</p>
      <pre className="code mt-2">{`import { hypotext } from "@hypotext/next";

export default hypotext({ siteKey: process.env.HYPOTEXT_KEY! });`}</pre>
      <p className="mt-2">3. Deploy and test:</p>
      <pre className="code mt-2">{`curl -A "GPTBot" https://yoursite.com/some-page   # JSON
curl https://yoursite.com/some-page                # your normal page`}</pre>
      <p className="mt-2 text-muted">
        Add <code className="font-mono text-xs">?view=ai</code> to any page in your browser to preview what agents get. Not on Next.js? Any server or edge function can call{" "}
        <code className="font-mono text-xs">{SITE_URL}/api/v1/serve?key=…&amp;url=…&amp;bot=…</code> when an AI agent visits.
      </p>

      <div className="h">what agents get</div>
      <p>A schema.org JSON document. Each fact comes from the first place it's found:</p>
      <ol className="mt-2 list-decimal pl-5 text-muted">
        <li>JSON-LD structured data already on the page</li>
        <li>OpenGraph and meta tags</li>
        <li>Microdata (itemprop attributes)</li>
        <li>Price, stock and rating text near the main heading</li>
        <li>The title, headings and opening paragraphs</li>
      </ol>
      <p className="mt-2">Pages are re-read at most once a minute, so prices and stock stay current.</p>

      <div className="h">content match</div>
      <p>
        Showing bots something different from people is called cloaking, and search engines penalise it. Before sending JSON, HypoText checks that the name, price and stock are visible on the page. If they aren't, the agent gets your normal page.
      </p>

      <div className="h">llms.txt</div>
      <p>
        HypoText also answers <code className="font-mono text-xs">/llms.txt</code>: a short, plain-text map of your site for AI agents. See the <Link href="/demo/llms.txt" prefetch={false}>demo store's</Link>.
      </p>

      <div className="h">recognised agents</div>
      <div className="text-sm">
        {KNOWN_BOTS.map((b) => (
          <div key={b.name} className="row"><span>{b.name}</span><span className="text-muted">{b.owner}</span></div>
        ))}
      </div>
    </div>
  );
}
