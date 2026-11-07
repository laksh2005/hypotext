"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import type { Analysis } from "@/lib/render";
import { bytes, num, ratio } from "@/lib/format";

const EXAMPLES = ["/demo/p/aura-headphones", "vercel.com", "allbirds.com/products/mens-tree-runners"];
const LABELS: Record<string, string> = {
  "/demo/p/aura-headphones": "our demo store",
  "allbirds.com/products/mens-tree-runners": "an Allbirds product",
};

export function Checker({ compact = false }: { compact?: boolean }) {
  const params = useSearchParams();
  const router = useRouter();
  const initial = params.get("url") ?? "";
  const [url, setUrl] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Analysis | null>(null);

  const run = useCallback(async (target: string) => {
    const t = target.trim();
    if (!t) { setError("Enter a website address."); return; }
    setError(""); setLoading(true); setResult(null);
    const full = t.startsWith("/") ? window.location.origin + t : t;
    try {
      const res = await fetch("/api/check", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ url: full }) });
      const json = await res.json();
      if (!res.ok) setError(json.error ?? "Something went wrong.");
      else setResult(json);
    } catch {
      setError("Couldn't run the check. Try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (initial && !compact) run(initial); }, [initial, compact, run]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (compact) { router.push(`/check?url=${encodeURIComponent(url.trim())}`); return; }
    router.replace(`/check?url=${encodeURIComponent(url.trim())}`, { scroll: false });
    run(url);
  };

  return (
    <div>
      <form onSubmit={submit} className="flex gap-2">
        <input
          className="input"
          value={url}
          onChange={(e) => { setUrl(e.target.value); setError(""); }}
          placeholder="yourstore.com/products/anything"
          aria-label="Website address"
          inputMode="url"
          autoCapitalize="off"
          spellCheck={false}
        />
        <button className="btn" disabled={loading}>{loading ? "Reading…" : "See what AI sees"}</button>
      </form>
      {error && <p className="mt-2 text-sm text-bad">{error}</p>}
      {!result && !loading && (
        <p className="mt-2 text-sm text-muted">
          Try{" "}
          {EXAMPLES.map((ex, i) => (
            <span key={ex}>
              <button type="button" className="underline decoration-faint underline-offset-2 hover:text-fg" onClick={() => { setUrl(ex); if (compact) router.push(`/check?url=${encodeURIComponent(ex)}`); else { router.replace(`/check?url=${encodeURIComponent(ex)}`, { scroll: false }); run(ex); } }}>{LABELS[ex] ?? ex}</button>
              {i < EXAMPLES.length - 1 ? ", " : "."}
            </span>
          ))}
        </p>
      )}
      {loading && <p className="mt-4 text-sm text-muted">Fetching the page the way a bot would, then pulling out the facts…</p>}
      {result && <Result r={result} />}
    </div>
  );
}

function Stat({ value, label, tone }: { value: string; label: string; tone?: "ok" | "bad" }) {
  return (
    <div>
      <div className={`text-xl font-medium ${tone === "ok" ? "text-ok" : tone === "bad" ? "text-bad" : ""}`}>{value}</div>
      <div className="text-xs leading-5 text-muted">{label}</div>
    </div>
  );
}

function Result({ r }: { r: Analysis }) {
  const saved = r.htmlTokens ? Math.max(0, 1 - r.jsonTokens / r.htmlTokens) : 0;
  const json = JSON.stringify(r.data, null, 2);
  const fields = Object.keys(r.sources).filter((k) => k !== "@type");
  const thin = !r.data.offers && !r.data.description && !r.data.summary;
  return (
    <div className="mt-8">
      <div className="text-sm text-muted">
        Read <span className="text-fg">{r.finalUrl.replace(/^https?:\/\//, "")}</span> in {(r.ms / 1000).toFixed(1)}s
      </div>
      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-4">
        <Stat value={bytes(r.totalBytes)} label={`what a bot downloads (${r.scriptCount} scripts)`} />
        <Stat value={bytes(r.jsonBytes)} label="with hypotext" />
        <Stat value={`${Math.round(saved * 100)}%`} label={`fewer tokens (${num(r.htmlTokens)} → ${num(r.jsonTokens)})`} />
        <Stat value={r.parity.empty ? "can't check" : r.parity.checks.length ? (r.parity.ok ? "match" : "mismatch") : "–"} label="facts vs the page" tone={r.parity.checks.length ? (r.parity.ok ? "ok" : "bad") : undefined} />
      </div>
      <p className="mt-4 text-sm text-muted">That's {ratio(r.totalBytes, r.jsonBytes)} less data for the same facts.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="min-w-0">
          <div className="mb-2 text-sm font-medium"><span className="text-faint"># </span>what AI sees today</div>
          <pre className="code max-h-80 overflow-hidden whitespace-pre-wrap break-all text-faint">{r.rawPreview}{"\n"}… {num(Math.max(0, r.htmlBytes - 1200))} more bytes</pre>
        </div>
        <div className="min-w-0">
          <div className="mb-2 text-sm font-medium"><span className="text-faint"># </span>what AI sees with hypotext</div>
          <pre className="code max-h-80">{json}</pre>
        </div>
      </div>

      {r.parity.empty && (
        <p className="mt-4 text-sm text-muted">
          This page is built in the browser with JavaScript, so it sends bots almost no text. HypoText can only read its title and meta tags, and won't serve facts it can't check against the page.
        </p>
      )}

      {thin && !r.parity.empty && (
        <p className="mt-4 text-sm text-muted">
          This page doesn't expose much structured data, so the summary is based on its headings and text. Adding schema.org markup gives bots richer facts.
        </p>
      )}

      {r.parity.checks.length > 0 && (
        <>
          <div className="h text-sm">content match</div>
          <p className="text-sm text-muted">Every fact we hand to AI must also be visible to people. Otherwise it's cloaking.</p>
          <div className="mt-2 text-sm">
            {r.parity.checks.map((c) => (
              <div key={c.field} className="row">
                <span>{c.field} <span className="text-muted">· {c.value}</span></span>
                <span className={c.ok ? "text-ok" : "text-bad"}>{c.ok ? "visible on page" : "not found on page"}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {fields.length > 0 && (
        <>
          <div className="h text-sm">where each fact came from</div>
          <div className="text-sm">
            {fields.map((k) => (
              <div key={k} className="row"><span>{k}</span><span className="text-muted">{r.sources[k]}</span></div>
            ))}
          </div>
        </>
      )}

      <p className="mt-8 text-sm text-muted">
        Want bots to get this on your site? <Link href="/dashboard" className="u text-fg">Add your site</Link> or read <Link href="/docs" className="u text-fg">how it works</Link>.
      </p>
    </div>
  );
}
