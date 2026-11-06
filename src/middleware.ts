import type { NextRequest } from "next/server";
import { hypotext } from "@/lib/hypotext";
import { DEMO_KEY } from "@/lib/constants";

// HypoText runs in front of its own demo store, exactly as it would on a
// customer's site. The rest of this website is served normally.
export default function middleware(req: NextRequest) {
  return hypotext({ siteKey: DEMO_KEY, endpoint: req.nextUrl.origin, basePath: "/demo" })(req);
}

export const config = { matcher: ["/demo/:path*"] };
