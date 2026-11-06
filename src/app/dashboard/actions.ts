"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { store } from "@/lib/db";
import { analyze } from "@/lib/render";
import { normalizeDomain, siteForKey } from "@/lib/sites";
import { forgetSiteKey, mySiteKeys, rememberSiteKey } from "@/lib/session";

export type FormState = { error?: string; ok?: string };

export async function addSite(_: FormState, form: FormData): Promise<FormState> {
  const domain = normalizeDomain(String(form.get("domain") ?? ""));
  if (!domain) return { error: "Enter a domain like yourstore.com." };
  const site = await store.createSite(domain);
  await rememberSiteKey(site.key);
  redirect(`/dashboard?site=${site.id}`);
}

export async function openWithKey(_: FormState, form: FormData): Promise<FormState> {
  const key = String(form.get("key") ?? "").trim();
  const site = await siteForKey(key);
  if (!site || site.id === "demo") return { error: "That key doesn't match a site." };
  await rememberSiteKey(site.key);
  redirect(`/dashboard?site=${site.id}`);
}

async function ownedSite(siteId: string) {
  for (const k of await mySiteKeys()) {
    const s = await siteForKey(k);
    if (s?.id === siteId) return s;
  }
  return null;
}

export async function removeSite(form: FormData) {
  const s = await ownedSite(String(form.get("site")));
  if (s) await forgetSiteKey(s.key);
  redirect("/dashboard");
}

// Read a page now: refreshes its JSON and content match.
export async function readPage(_: FormState, form: FormData): Promise<FormState> {
  const site = await ownedSite(String(form.get("site")));
  if (!site) return { error: "You don't have access to this site." };
  let path = String(form.get("path") ?? "/").trim() || "/";
  if (/^https?:\/\//i.test(path)) {
    try { const u = new URL(path); path = u.pathname + u.search; } catch { return { error: "That link isn't valid." }; }
  }
  if (!path.startsWith("/")) path = "/" + path;
  try {
    const a = await analyze(`https://${site.domain}${path}`);
    await store.upsertPage({
      siteId: site.id, path, json: JSON.stringify(a.data), htmlBytes: a.totalBytes,
      parityOk: a.parity.ok, parity: JSON.stringify(a.parity),
    });
    revalidatePath("/dashboard");
    return a.parity.ok
      ? { ok: `Read ${path}. Facts match the page.` }
      : { error: `Read ${path}. Some facts don't match what people see, so bots will get the normal page for now.` };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Couldn't read that page." };
  }
}

// Ask the live site for its homepage as GPTBot and check HypoText answered.
export async function verifyInstall(_: FormState, form: FormData): Promise<FormState> {
  const site = await ownedSite(String(form.get("site")));
  if (!site) return { error: "You don't have access to this site." };
  try {
    const r = await fetch(`https://${site.domain}/`, {
      headers: { "user-agent": "Mozilla/5.0 (compatible; GPTBot/1.2; +https://openai.com/gptbot)" },
      signal: AbortSignal.timeout(10000), cache: "no-store",
    });
    const tag = r.headers.get("x-hypotext");
    if (tag?.startsWith("served")) return { ok: "Installed. Your site answered GPTBot with JSON." };
    if (tag === "held") return { ok: "Installed, but the homepage is held back because its facts don't match the page." };
    return { error: "Not detected yet. Your site answered GPTBot with its normal page. Check the middleware is deployed." };
  } catch {
    return { error: `Couldn't reach ${site.domain}.` };
  }
}
