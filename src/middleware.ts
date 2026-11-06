import type { NextRequest } from "next/server";
import { hypotext } from "@hypotext/next";
import { DEMO_KEY } from "@/lib/constants";

// HypoText runs in front of its own demo store, using the same package
// customers install. Only /demo is handled; the rest of this site is normal.
const ht = (origin: string) => hypotext({ siteKey: DEMO_KEY, endpoint: origin, include: ["/demo"] });

export default function middleware(req: NextRequest) {
  return ht(process.env.HYPOTEXT_ENDPOINT ?? req.nextUrl.origin)(req);
}

export const config = { matcher: ["/demo/:path*"] };
