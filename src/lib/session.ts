import { cookies } from "next/headers";
import { findSiteByKey, type Site } from "./db";

// The sites you've added are remembered in an httpOnly cookie on your browser.
// There are no accounts: a site's secret key is its login.
const COOKIE = "ht_sites";
const ONE_YEAR = 60 * 60 * 24 * 365;

async function myKeys(): Promise<string[]> {
  const raw = (await cookies()).get(COOKIE)?.value ?? "";
  return raw.split(",").filter((k) => k.startsWith("ht_"));
}

async function saveKeys(keys: string[]) {
  (await cookies()).set(COOKIE, keys.join(","), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: ONE_YEAR });
}

export async function mySites(): Promise<Site[]> {
  const sites = await Promise.all((await myKeys()).map(findSiteByKey));
  return sites.filter((s): s is Site => s !== null);
}

export async function rememberSiteKey(key: string) {
  await saveKeys([key, ...(await myKeys()).filter((k) => k !== key)].slice(0, 10));
}

export async function forgetSiteKey(key: string) {
  await saveKeys((await myKeys()).filter((k) => k !== key));
}
