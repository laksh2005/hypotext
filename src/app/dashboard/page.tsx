import Link from "next/link";
import { store, type Site } from "@/lib/db";
import { DEMO_SITE, siteForKey } from "@/lib/sites";
import { mySiteKeys } from "@/lib/session";
import { ago, bytes, num } from "@/lib/format";
import { AddSiteForm, CopyBlock, CopyKey, OpenWithKeyForm, ReadPageForm, VerifyForm } from "./forms";
import { removeSite } from "./actions";

export const metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ site?: string }> }) {
  const { site: selected } = await searchParams;
  const mine = (await Promise.all((await mySiteKeys()).map(siteForKey))).filter((s): s is Site => !!s);
  const site = selected === "demo" ? DEMO_SITE : mine.find((s) => s.id === selected) ?? (selected ? null : mine[0] ?? null);

  return (
    <div>
      {(mine.length > 0 || selected === "demo") && (
        <div className="mb-8 flex flex-wrap gap-x-4 gap-y-1 text-sm">
          {mine.map((s) => (
            <Link key={s.id} href={`/dashboard?site=${s.id}`} className={s.id === site?.id ? "text-fg" : "text-muted hover:text-fg"}>{s.domain}</Link>
          ))}
          <Link href="/dashboard?site=demo" className={site?.id === "demo" ? "text-fg" : "text-muted hover:text-fg"}>demo store</Link>
          <Link href="/dashboard?site=new" className="text-muted hover:text-fg">+ add site</Link>
        </div>
      )}
      {site ? <SiteView site={site} /> : <Empty hasSites={mine.length > 0} />}
    </div>
  );
}

function Empty({ hasSites }: { hasSites: boolean }) {
  return (
    <div>
      <h1 className="font-medium">{hasSites ? "Add another site" : "Add your site"}</h1>
      <p className="mb-5 mt-1 text-muted">
        You'll get a site key and a five-line snippet. No account needed: the key is stored on this browser.
      </p>
      <AddSiteForm />
      <div className="h text-sm">already have a key</div>
      <OpenWithKeyForm />
      {!hasSites && (
        <p className="mt-8 text-sm text-muted">
          Just looking? Open the <Link href="/dashboard?site=demo" className="u text-fg">demo store's dashboard</Link>.
        </p>
      )}
    </div>
  );
}

async function SiteView({ site }: { site: Site }) {
  const isDemo = site.id === "demo";
  const [stats, hits, pages] = await Promise.all([store.stats(site.id, 7), store.recentHits(site.id, 12), store.pages(site.id)]);
  const matching = pages.filter((p) => p.parityOk).length;
  const live = hits.length > 0;

  const env = `HYPOTEXT_KEY=${site.key}`;
  const snippet = `// middleware.ts (in your Next.js app)
import { hypotext } from "@hypotext/next";

export default hypotext({ siteKey: process.env.HYPOTEXT_KEY! });`;

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-medium">{isDemo ? "northwind audio (demo)" : site.domain}</h1>
          <div className="text-sm text-muted">
            {isDemo ? "public demo · last 7 days" : <>site key <CopyKey value={site.key} /></>}
          </div>
        </div>
        <span className={`tag ${live ? "bg-ok-bg text-ok" : "bg-soft text-muted"}`}>{live ? "live" : "waiting for bots"}</span>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-4">
        <Stat value={num(stats.visits)} label="AI agent visits" />
        <Stat value={bytes(stats.savedBytes)} label="bandwidth saved" />
        <Stat value={pages.length ? `${matching}/${pages.length}` : "–"} label="pages matching" />
      </div>

      {stats.bots.length > 0 && (
        <>
          <div className="h text-sm">who's reading</div>
          <div className="text-sm">
            {stats.bots.map((b) => (
              <div key={b.bot} className="row">
                <span>{b.bot}</span>
                <span className="flex items-center gap-3 text-muted">
                  <span className="hidden h-1.5 rounded-full bg-fg/70 sm:block" style={{ width: `${Math.max(4, (b.n / stats.visits) * 160)}px` }} aria-hidden="true" />
                  {num(b.n)}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="h text-sm">recent visits</div>
      {hits.length ? (
        <div className="text-sm">
          {hits.map((h, i) => (
            <div key={i} className="row">
              <span className="min-w-0 truncate">{h.bot} <span className="text-muted">· {h.path}</span></span>
              <span className="whitespace-nowrap text-faint">{ago(h.at)}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted">
          No AI agents yet. {isDemo
            ? <>Try <code className="font-mono text-xs">curl -A GPTBot</code> on a <Link href="/demo/p/aura-headphones" className="u text-fg">demo product</Link>, then refresh.</>
            : "Visits show up here as soon as ChatGPT, Claude, Perplexity or others read a page."}
        </p>
      )}

      <div className="h text-sm">pages</div>
      {pages.length > 0 && (
        <div className="mb-3 text-sm">
          {pages.map((p) => {
            const parity = JSON.parse(p.parity) as { checks: { field: string; ok: boolean }[] };
            const bad = parity.checks.filter((c) => !c.ok).map((c) => c.field);
            return (
              <div key={p.path} className="row">
                <span className="min-w-0 truncate">{p.path}</span>
                <span className="flex gap-3 whitespace-nowrap">
                  <span className="text-faint">{bytes(p.htmlBytes)} → {bytes(Buffer.byteLength(p.json))}</span>
                  <span className={p.parityOk ? "text-ok" : "text-bad"}>{p.parityOk ? "match" : `${bad.join(", ")} mismatch`}</span>
                </span>
              </div>
            );
          })}
        </div>
      )}
      {isDemo ? (
        pages.length === 0 && <p className="text-sm text-muted">Pages appear here once a bot asks for them.</p>
      ) : (
        <ReadPageForm site={site.id} domain={site.domain} />
      )}

      {!isDemo && (
        <>
          <div className="h text-sm">install</div>
          <p className="mb-3 text-sm text-muted">1. Add your key to your environment variables.</p>
          <CopyBlock text={env} />
          <p className="mb-3 mt-4 text-sm text-muted">2. Add the middleware. People see no change; AI agents get JSON.</p>
          <CopyBlock text={snippet} />
          <p className="mb-3 mt-4 text-sm text-muted">3. Deploy, then check it's working.</p>
          <VerifyForm site={site.id} />
          <p className="mt-4 text-sm text-muted">Not on Next.js? See <Link href="/docs#other-stacks" className="u text-fg">other stacks</Link>.</p>

          <form action={removeSite} className="mt-12">
            <input type="hidden" name="site" value={site.id} />
            <button className="text-xs text-faint underline decoration-faint underline-offset-2 hover:text-bad">Remove from this browser</button>
          </form>
        </>
      )}
    </div>
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
