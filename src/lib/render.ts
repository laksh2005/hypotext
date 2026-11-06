import { extract, estimateTokens, type Extracted, type FieldSource } from "./extract";
import { checkParity, type ParityResult } from "./parity";
import { BYPASS_HEADER } from "./hypotext";

export type Analysis = {
  url: string;
  finalUrl: string;
  status: number;
  htmlBytes: number;     // the HTML document
  assetBytes: number;    // linked JS + CSS a bot would also have to pull
  totalBytes: number;
  jsonBytes: number;
  htmlTokens: number;
  jsonTokens: number;
  scriptCount: number;
  data: Extracted;
  sources: FieldSource;
  parity: ParityResult;
  rawPreview: string;
  ms: number;
};

const UA = "Mozilla/5.0 (compatible; HypoText/1.0; +https://hypotext.dev)";
const MAX_HTML = 5_000_000;

function normalizeUrl(input: string): URL {
  let s = input.trim();
  if (!/^https?:\/\//i.test(s)) s = "https://" + s;
  const u = new URL(s);
  if (!/^https?:$/.test(u.protocol)) throw new Error("Only http and https links are supported.");
  const host = u.hostname;
  // Refuse private and local addresses (basic SSRF guard).
  if (
    host === "localhost" || host.endsWith(".local") || host.endsWith(".internal") ||
    /^(127\.|10\.|192\.168\.|169\.254\.|0\.)/.test(host) || /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
    host === "[::1]"
  ) {
    if (process.env.NODE_ENV === "production" && process.env.ALLOW_PRIVATE_URLS !== "1") throw new Error("That address isn't publicly reachable.");
  }
  return u;
}

async function fetchText(url: string, timeoutMs = 10000) {
  const res = await fetch(url, {
    headers: { "user-agent": UA, accept: "text/html,application/xhtml+xml", [BYPASS_HEADER]: "1" },
    redirect: "follow",
    signal: AbortSignal.timeout(timeoutMs),
    cache: "no-store",
  });
  const buf = await res.arrayBuffer();
  if (buf.byteLength > MAX_HTML) throw new Error("That page is larger than 5 MB.");
  return { res, text: new TextDecoder().decode(buf), bytes: buf.byteLength };
}

// HEAD-ish size lookup for linked assets, capped so analysis stays fast.
async function assetSize(url: string): Promise<number> {
  try {
    const r = await fetch(url, { headers: { "user-agent": UA }, signal: AbortSignal.timeout(4000), cache: "no-store" });
    const len = Number(r.headers.get("content-length"));
    if (len > 0) { r.body?.cancel(); return len; }
    return (await r.arrayBuffer()).byteLength;
  } catch { return 0; }
}

export async function analyze(input: string, opts: { measureAssets?: boolean } = {}): Promise<Analysis> {
  const t0 = Date.now();
  const u = normalizeUrl(input);
  const { res, text, bytes } = await fetchText(u.toString());
  if (!/html/i.test(res.headers.get("content-type") ?? "html")) throw new Error("That link doesn't return a web page.");

  const { data, sources, visibleText } = extract(text, res.url || u.toString());
  const json = JSON.stringify(data);
  const parity = checkParity(data, visibleText);

  // Collect linked scripts and stylesheets a crawler would have to fetch.
  const assetUrls = [...text.matchAll(/<script[^>]+src=["']([^"']+)["']|<link[^>]+rel=["']stylesheet["'][^>]*href=["']([^"']+)["']/gi)]
    .map((m) => m[1] ?? m[2])
    .filter(Boolean)
    .map((src) => { try { return new URL(src, res.url).toString(); } catch { return null; } })
    .filter((x): x is string => !!x);
  const scriptCount = (text.match(/<script\b/gi) ?? []).length;
  let assetBytes = 0;
  if (opts.measureAssets !== false && assetUrls.length) {
    const sizes = await Promise.all(assetUrls.slice(0, 25).map(assetSize));
    assetBytes = sizes.reduce((a, b) => a + b, 0);
  }

  return {
    url: u.toString(),
    finalUrl: res.url || u.toString(),
    status: res.status,
    htmlBytes: bytes,
    assetBytes,
    totalBytes: bytes + assetBytes,
    jsonBytes: new TextEncoder().encode(json).byteLength,
    htmlTokens: estimateTokens(text),
    jsonTokens: estimateTokens(json),
    scriptCount,
    data,
    sources,
    parity,
    rawPreview: text.slice(0, 1200),
    ms: Date.now() - t0,
  };
}
