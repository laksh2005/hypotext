// @hypotext/next — drop-in Next.js middleware.
//
//   // middleware.ts
//   import { hypotext } from "@hypotext/next";
//   export default hypotext({ siteKey: process.env.HYPOTEXT_KEY! });
//
// People get your site exactly as before. Known AI agents get a small JSON
// version of the same URL, produced by HypoText from your rendered page.

import { NextResponse, type NextRequest } from "next/server";
import { detectBot } from "./bots";

export type HypoTextOptions = {
  siteKey: string;
  /** HypoText API origin. Defaults to the hosted service. */
  endpoint?: string;
  /** Only handle these path prefixes (default: every page). */
  include?: string[];
  /** Never handle these path prefixes. */
  exclude?: string[];
  /** Serve /llms.txt describing your site to agents (default: true). */
  llmsTxt?: boolean;
};

export const BYPASS_HEADER = "x-hypotext-bypass";
const DEFAULT_ENDPOINT = "https://hypotext.vercel.app";
const SKIP = /^\/(_next|api|favicon\.ico|robots\.txt|sitemap\.xml)|\.(png|jpe?g|gif|svg|webp|ico|css|js|map|woff2?|txt|xml|json)$/i;

export function hypotext(opts: HypoTextOptions) {
  const endpoint = (opts.endpoint ?? DEFAULT_ENDPOINT).replace(/\/$/, "");

  return async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    // HypoText itself is reading the page: let it through to the human version.
    if (req.headers.get(BYPASS_HEADER)) return NextResponse.next();

    if (opts.llmsTxt !== false && pathname === llmsPath(opts)) {
      return proxy(`${endpoint}/api/v1/llms?key=${enc(opts.siteKey)}&origin=${enc(req.nextUrl.origin)}&base=${enc(basePath(opts))}`);
    }

    if (SKIP.test(pathname)) return NextResponse.next();
    if (opts.include && !opts.include.some((p) => pathname.startsWith(p))) return NextResponse.next();
    if (opts.exclude?.some((p) => pathname.startsWith(p))) return NextResponse.next();

    const ua = req.headers.get("user-agent");
    const forced = req.nextUrl.searchParams.get("view") === "ai";
    const bot = detectBot(ua);
    if (!bot && !forced) return NextResponse.next();

    // Build the canonical page URL (without our ?view=ai switch).
    const pageUrl = new URL(req.nextUrl.toString());
    pageUrl.searchParams.delete("view");

    const api = `${endpoint}/api/v1/serve?key=${enc(opts.siteKey)}&url=${enc(pageUrl.toString())}&bot=${enc(bot?.name ?? "preview")}`;
    const res = await proxy(api);
    // If HypoText is unreachable, fail open: the bot gets the normal page.
    return res.ok ? res : NextResponse.next();
  };
}

const enc = encodeURIComponent;
const basePath = (o: HypoTextOptions) => (o.include?.length === 1 ? o.include[0].replace(/\/$/, "") : "");
const llmsPath = (o: HypoTextOptions) => `${basePath(o)}/llms.txt`;

async function proxy(url: string): Promise<Response> {
  try {
    const r = await fetch(url, { headers: { [BYPASS_HEADER]: "1" }, cache: "no-store", signal: AbortSignal.timeout(12000) });
    const headers = new Headers({
      "content-type": r.headers.get("content-type") ?? "application/json",
      "x-hypotext": r.headers.get("x-hypotext") ?? "served",
      vary: "user-agent",
      "cache-control": "public, max-age=60",
    });
    return new Response(r.body, { status: r.status, headers });
  } catch {
    return new Response(null, { status: 502 });
  }
}

export { detectBot };
