import Link from "next/link";
import { Suspense } from "react";
import { Checker } from "@/components/checker";
import { SITE_URL } from "@/lib/site-url";

export default function Home() {
  return (
    <div className="prose-ht">
      <p>
        Half the visitors to your website aren't people anymore. ChatGPT, Claude and Perplexity read your pages to answer questions about you. On a modern JavaScript site, they download megabytes of code to find one price, and often get it wrong.
      </p>
      <p className="mt-4">
        HypoText sits in front of your site. People get the page they always got. AI gets a small, clean file with just the facts: name, price, stock, specs.
      </p>
      <p className="mt-4 text-muted">Same link. No rebuild. Five lines of code.</p>

      <div className="mt-6">
        <Suspense>
          <Checker compact />
        </Suspense>
      </div>

      <div className="h">how it works</div>
      <div className="text-[15px]">
        <Step n="01">Someone, or something, opens a page on your site.</Step>
        <Step n="02">HypoText checks who's asking: a person, or an AI agent like GPTBot or ClaudeBot.</Step>
        <Step n="03">People get your normal site. Agents get the same page as clean JSON.</Step>
        <Step n="04">Before serving, it checks every fact is visible to people too, so AI never sees something your customers can't.</Step>
      </div>

      <div className="h">why it matters</div>
      <div className="text-[15px]">
        <Row title="Get quoted correctly">AI assistants stop guessing your prices and stock from messy HTML.</Row>
        <Row title="Stay visible">No need to block AI crawlers to save money. Let them in, cheaply.</Row>
        <Row title="Cut bot bandwidth">Agents pull a few hundred bytes instead of megabytes of JavaScript.</Row>
        <Row title="Know who's reading">See which AI agents visit, what they read, and how much you saved.</Row>
      </div>

      <div className="h">see it live</div>
      <p>
        Our <Link href="/demo">demo store</Link> runs HypoText. Open it normally, then ask for the same page as a bot:
      </p>
      <pre className="code mt-3">curl -A &quot;GPTBot&quot; {SITE_URL}/demo/p/aura-headphones</pre>
      <p className="mt-3 text-muted">
        Every visit shows up on the demo's <Link href="/dashboard?site=demo">public dashboard</Link>.
      </p>

      <div className="h">questions</div>
      <div className="text-[15px]">
        <Faq q="Do I need to change my website?">No. You add one small file (middleware) and a key. HypoText reads your rendered pages itself.</Faq>
        <Faq q="Is this cloaking? Will Google mind?">Cloaking means showing bots something different from people. HypoText only serves facts that are visible on the page, and holds back any page where they don't match.</Faq>
        <Faq q="What if HypoText is down?">Your site keeps working. If HypoText can't answer, bots simply get your normal page.</Faq>
        <Faq q="Which AI agents are recognised?">GPTBot, ChatGPT-User, OAI-SearchBot, ClaudeBot, Claude-User, PerplexityBot, Google-Extended, Applebot-Extended, Meta, Amazon, Common Crawl and more.</Faq>
        <Faq q="What does it cost?">Free to try. <Link href="/pricing">Plans</Link> start at $49 a month.</Faq>
      </div>

      <p className="mt-10">
        <Link href="/dashboard">Add your site</Link> or read <Link href="/docs">how it works</Link>.
      </p>
    </div>
  );
}

function Step({ n, children }: { n: string; children: React.ReactNode }) {
  return (
    <div className="row justify-start">
      <span className="w-6 shrink-0 text-faint">{n}</span>
      <span>{children}</span>
    </div>
  );
}

function Row({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-line py-2 last:border-0">
      <div className="font-medium">{title}</div>
      <div className="text-muted">{children}</div>
    </div>
  );
}

function Faq({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <details className="group border-b border-line py-2 last:border-0">
      <summary className="flex cursor-pointer list-none justify-between gap-4">
        {q}
        <span className="text-faint group-open:rotate-45 transition-transform">+</span>
      </summary>
      <p className="mt-1 text-muted">{children}</p>
    </details>
  );
}
