import Link from "next/link";
import { Suspense } from "react";
import { Checker } from "@/components/checker";
import { SITE_URL } from "@/lib/site-url";

const EXAMPLE_JSON = `{
  "@type": "Product",
  "name": "Aura Headphones",
  "offers": {
    "price": "348.00",
    "priceCurrency": "USD",
    "availability": "InStock"
  },
  "aggregateRating": {
    "ratingValue": 4.7,
    "reviewCount": 12483
  }
}`;

export default function Home() {
  return (
    <div>
      <h1 className="text-2xl font-medium leading-snug">Make your website readable by AI.</h1>
      <p className="mt-3 text-muted">
        ChatGPT, Claude and Perplexity read your pages to answer questions about you. HypoText gives them a clean, accurate version of each page, while people keep seeing your normal site.
      </p>

      <div className="mt-6">
        <Suspense>
          <Checker compact />
        </Suspense>
      </div>

      <div className="h">same page, two readers</div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <div className="mb-2 flex justify-between text-sm"><span>What people see</span><span className="text-faint">496 KB</span></div>
          <div className="rounded-lg border border-line p-4">
            <div className="mb-3 aspect-[2/1] rounded-md bg-[#d9d4cc]" aria-hidden="true" />
            <div className="text-xs text-muted">Northwind Audio</div>
            <div className="font-medium">Aura Headphones</div>
            <div className="mt-1 text-sm">$348.00 · <span className="text-ok">In stock</span></div>
            <div className="mt-3 rounded-md bg-fg py-1.5 text-center text-sm text-bg">Add to cart</div>
          </div>
        </div>
        <div>
          <div className="mb-2 flex justify-between text-sm"><span>What AI gets</span><span className="text-faint">416 bytes</span></div>
          <pre className="code">{EXAMPLE_JSON}</pre>
        </div>
      </div>
      <p className="mt-3 text-sm text-muted">
        Same link, about 1,000× less data, and no guessing. <Link href="/demo/p/aura-headphones" className="u text-fg">Open this product</Link> and press "View as GPTBot" to see it live.
      </p>

      <div className="h">how it works</div>
      <div>
        <Step n="1">Add a few lines of code to your site. No rebuild.</Step>
        <Step n="2">When an AI agent visits, HypoText reads the page and pulls out the facts.</Step>
        <Step n="3">It checks people can see those same facts, then sends the agent clean JSON.</Step>
      </div>

      <div className="mt-8 flex flex-wrap gap-2">
        <Link href="/dashboard" className="btn inline-flex items-center">Add your site</Link>
        <Link href="/demo" className="btn-ghost inline-flex h-10 items-center">Try the demo store</Link>
      </div>

      <div className="h">questions</div>
      <div>
        <Faq q="Do I need to change my website?">No. You add one small file and a key. HypoText reads your pages the way they already are.</Faq>
        <Faq q="Is this cloaking? Will Google mind?">No. HypoText only sends facts that are visible on the page. If they don't match, the agent gets your normal page.</Faq>
        <Faq q="What if HypoText is down?">Your site keeps working. Agents get your normal page instead.</Faq>
        <Faq q="Can I try it from a terminal?">
          Yes: <code className="font-mono text-xs">curl -A &quot;GPTBot&quot; {SITE_URL}/demo/p/aura-headphones</code>
        </Faq>
      </div>
    </div>
  );
}

function Step({ n, children }: { n: string; children: React.ReactNode }) {
  return (
    <div className="row justify-start">
      <span className="w-5 shrink-0 text-faint">{n}</span>
      <span>{children}</span>
    </div>
  );
}

function Faq({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <details className="group border-b border-line py-2 last:border-0">
      <summary className="flex cursor-pointer list-none justify-between gap-4">
        {q}
        <span className="text-faint transition-transform group-open:rotate-45">+</span>
      </summary>
      <p className="mt-1 text-muted">{children}</p>
    </details>
  );
}
