import Link from "next/link";
import { listPages, siteStats, type Site } from "@/lib/db";
import { DEMO_SITE } from "@/lib/sites";
import { mySites } from "@/lib/session";
import { ago, bytes } from "@/lib/format";
import { AddSiteForm, CopyBlock, ReadPageForm, VerifyForm } from "./forms";
import { removeSite } from "./actions";

export const metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ site?: string }> }) {
  const { site: selected } = await searchParams;
  const sites = await mySites();
  const site = selected === "demo" ? DEMO_SITE : sites.find((s) => s.id === selected) ?? (selected ? null : sites[0] ?? null);

  return (
    <div>
      <nav className="mb-8 flex flex-wrap gap-x-4 gap-y-1 text-sm">
        {sites.map((s) => <Tab key={s.id} href={`/dashboard?site=${s.id}`} active={s.id === site?.id}>{s.domain}</Tab>)}
        <Tab href="/dashboard?site=demo" active={site?.id === "demo"}>demo store</Tab>
        <Tab href="/dashboard?site=new" active={!site}>+ add site</Tab>
      </nav>
      {site ? <SiteView site={site} /> : <AddSite />}
    </div>
  );
}

function Tab({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return <Link href={href} className={active ? "text-fg" : "text-muted hover:text-fg"}>{children}</Link>;
}

function AddSite() {
  return (
    <div>
      <h1 className="font-medium">Add your site</h1>
      <p className="mb-5 mt-1 text-muted">You'll get a key and a few lines of code. No account needed.</p>
      <AddSiteForm />
    </div>
  );
}

async function SiteView({ site }: { site: Site }) {
  const isDemo = site.id === "demo";
  const [stats, pages] = await Promise.all([siteStats(site.id), listPages(site.id)]);
  const matching = pages.filter((p) => p.parityOk).length;

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-medium">{isDemo ? "Northwind Audio (demo)" : site.domain}</h1>
          <div className="text-sm text-muted">last 7 days</div>
        </div>
        <span className={`tag ${stats.visits ? "bg-ok-bg text-ok" : "bg-soft text-muted"}`}>{stats.visits ? "live" : "waiting for agents"}</span>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-4">
        <Stat value={String(stats.visits)} label="AI agent visits" />
        <Stat value={bytes(stats.savedBytes)} label="bandwidth saved" />
        <Stat value={pages.length ? `${matching}/${pages.length}` : "–"} label="pages matching" />
      </div>

      {!isDemo && <Install site={site} />}

      <div className="h text-sm">who's reading</div>
      {stats.bots.length ? (
        <div className="text-sm">
          {stats.bots.map((b) => (
            <div key={b.bot} className="row"><span>{b.bot}</span><span className="text-muted">{b.count}</span></div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted">
          No AI agents yet.{" "}
          {isDemo
            ? <>Open a <Link href="/demo/p/aura-headphones" className="u text-fg">demo product</Link>, press "View as GPTBot", then come back.</>
            : "Visits appear here as soon as ChatGPT, Claude or Perplexity read a page."}
        </p>
      )}

      {stats.recent.length > 0 && (
        <>
          <div className="h text-sm">recent visits</div>
          <div className="text-sm">
            {stats.recent.map((h, i) => (
              <div key={i} className="row">
                <span className="min-w-0 truncate">{h.bot} <span className="text-muted">· {h.path}</span></span>
                <span className="whitespace-nowrap text-faint">{ago(h.at)}</span>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="h text-sm">pages</div>
      {pages.length > 0 && (
        <div className="mb-3 text-sm">
          {pages.map((p) => (
            <div key={p.path} className="row">
              <span className="min-w-0 truncate">{p.path}</span>
              <span className="flex gap-3 whitespace-nowrap">
                <span className="text-faint">{bytes(p.htmlBytes)} → {bytes(p.json.length)}</span>
                <span className={p.parityOk ? "text-ok" : "text-bad"}>{p.parityOk ? "match" : "mismatch"}</span>
              </span>
            </div>
          ))}
        </div>
      )}
      {isDemo
        ? pages.length === 0 && <p className="text-sm text-muted">Pages appear here once an agent reads them.</p>
        : <ReadPageForm site={site.id} domain={site.domain} />}

      {!isDemo && (
        <form action={removeSite} className="mt-12">
          <input type="hidden" name="site" value={site.id} />
          <button className="text-xs text-faint underline underline-offset-2 hover:text-bad">Remove from this browser</button>
        </form>
      )}
    </div>
  );
}

function Install({ site }: { site: Site }) {
  return (
    <>
      <div className="h text-sm">install</div>
      <p className="mb-2 text-sm text-muted">1. Add your key to your environment variables.</p>
      <CopyBlock text={`HYPOTEXT_KEY=${site.key}`} />
      <p className="mb-2 mt-4 text-sm text-muted">2. Add this file to your Next.js app. People see no change; AI agents get JSON.</p>
      <CopyBlock text={`// middleware.ts\nimport { hypotext } from "@hypotext/next";\n\nexport default hypotext({ siteKey: process.env.HYPOTEXT_KEY! });`} />
      <p className="mb-2 mt-4 text-sm text-muted">3. Deploy, then check it works.</p>
      <VerifyForm site={site.id} />
    </>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="text-xl font-medium">{value}</div>
      <div className="text-xs text-muted">{label}</div>
    </div>
  );
}
