import { cookies } from "next/headers";

// Sites you've added live in an httpOnly cookie on your browser, keyed by
// their secret site key. No account needed; the key is the credential.
const COOKIE = "ht_sites";
const MAX = 10;

export async function mySiteKeys(): Promise<string[]> {
  const raw = (await cookies()).get(COOKIE)?.value ?? "";
  return raw.split(",").filter((k) => /^ht_[a-f0-9]{24}$/.test(k));
}

export async function rememberSiteKey(key: string) {
  const keys = [key, ...(await mySiteKeys()).filter((k) => k !== key)].slice(0, MAX);
  (await cookies()).set(COOKIE, keys.join(","), {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 365,
  });
}

export async function forgetSiteKey(key: string) {
  const keys = (await mySiteKeys()).filter((k) => k !== key);
  (await cookies()).set(COOKIE, keys.join(","), { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 365 });
}
