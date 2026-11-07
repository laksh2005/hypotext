// The HypoText middleware. Customers add this to their Next.js app:
//
//   // middleware.ts
//   import { hypotext } from "@hypotext/next";
//   export default hypotext({ siteKey: process.env.HYPOTEXT_KEY! });
//
// People get the normal page. Known AI agents get the same page as JSON.

import { NextResponse, type NextRequest } from "next/server";
import { detectBot } from "./bots";

type Options = {
  siteKey: string;
  endpoint: string; // HypoText API origin
  basePath?: string; // only handle pages under this path, e.g. "/demo"
};

// Sent when HypoText fetches a page itself, so it gets the human version.
export const BYPASS_HEADER = "x-hypotext-bypass";

// Files and framework routes that are never pages.
const NOT_A_PAGE = /^\/(_next|api)\/|\.(png|jpe?g|gif|svg|webp|ico|css|js|map|woff2?|xml|json|txt|pdf|mp4|zip)$/i;

export function hypotext({ siteKey, endpoint, basePath = "" }: Options) {
  return async function middleware(req: NextRequest) {
    const { pathname, searchParams, origin } = req.nextUrl;
    const key = encodeURIComponent(siteKey);

    // Only page loads get JSON; form posts and other requests pass straight through.
    if (req.headers.get(BYPASS_HEADER) || (req.method !== "GET" && req.method !== "HEAD")) return NextResponse.next();

    // A plain-text map of the site for AI agents.
    if (pathname === `${basePath}/llms.txt`) {
      return forward(`${endpoint}/api/v1/llms?key=${key}&origin=${encodeURIComponent(origin + basePath)}`);
    }

    if (NOT_A_PAGE.test(pathname) || !pathname.startsWith(basePath)) return NextResponse.next();

    // ?view=ai lets a person preview what agents get.
    const bot = detectBot(req.headers.get("user-agent"));
    const preview = searchParams.get("view") === "ai";
    if (!bot && !preview) return NextResponse.next();

    const pageUrl = new URL(req.url);
    pageUrl.searchParams.delete("view");
    const botName = bot?.name ?? "Preview (?view=ai)";

    const res = await forward(`${endpoint}/api/v1/serve?key=${key}&url=${encodeURIComponent(pageUrl.toString())}&bot=${encodeURIComponent(botName)}`);
    // If HypoText can't answer, fail open: the agent gets the normal page.
    return res.ok ? res : NextResponse.next();
  };
}

async function forward(url: string): Promise<Response> {
  try {
    const r = await fetch(url, { headers: { [BYPASS_HEADER]: "1" }, cache: "no-store" });
    return new Response(r.body, {
      status: r.status,
      headers: {
        "content-type": r.headers.get("content-type") ?? "application/json", vary: "user-agent", "x-hypotext": "served",
        ...(r.headers.get("cache-control") ? { "cache-control": r.headers.get("cache-control")! } : {}),
      },
    });
  } catch {
    return new Response(null, { status: 502 });
  }
}
