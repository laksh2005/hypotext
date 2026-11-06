"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSite, savePage } from "@/lib/db";
import { analyze } from "@/lib/render";
import { normalizeDomain } from "@/lib/sites";
import { forgetSiteKey, mySites, rememberSiteKey } from "@/lib/session";

export type FormState = { error?: string; ok?: string };

export async function addSite(_: FormState, form: FormData): Promise<FormState> {
  const domain = normalizeDomain(String(form.get("domain") ?? ""));
  if (!domain) return { error: "Enter a domain like yourstore.com." };
  const site = await createSite(domain);
  await rememberSiteKey(site.key);
  redirect(`/dashboard?site=${site.id}`);
}

// Only sites stored in this browser's cookie can be changed.
async function ownedSite(form: FormData) {
  const id = String(form.get("site"));
  return (await mySites()).find((s) => s.id === id) ?? null;
}

export async function removeSite(form: FormData) {
  const site = await ownedSite(form);
  if (site) await forgetSiteKey(site.key);
  redirect("/dashboard");
}

// Read one page now and store its JSON and content match.
export async function readPage(_: FormState, form: FormData): Promise<FormState> {
  const site = await ownedSite(form);
  if (!site) return { error: "You don't have access to this site." };

  let path = String(form.get("path") ?? "").trim() || "/";
  if (!path.startsWith("/")) path = "/" + path;

  try {
    const a = await analyze(`https://${site.domain}${path}`);
    await savePage({
      siteId: site.id, path, json: JSON.stringify(a.data), htmlBytes: a.totalBytes,
      parityOk: a.parity.ok, parity: JSON.stringify(a.parity),
    });
    revalidatePath("/dashboard");
    return a.parity.ok
      ? { ok: `Read ${path}. Facts match the page.` }
      : { error: `Read ${path}. Some facts don't match what people see, so agents get the normal page for now.` };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Couldn't read that page." };
  }
}

// Ask the live site for its homepage as GPTBot and see if HypoText answered.
export async function verifyInstall(_: FormState, form: FormData): Promise<FormState> {
  const site = await ownedSite(form);
  if (!site) return { error: "You don't have access to this site." };
  try {
    const r = await fetch(`https://${site.domain}/`, {
      headers: { "user-agent": "Mozilla/5.0 (compatible; GPTBot/1.2)" },
      signal: AbortSignal.timeout(10000),
      cache: "no-store",
    });
    return r.headers.get("x-hypotext")
      ? { ok: "Installed. Your site answered GPTBot with JSON." }
      : { error: "Not detected yet. Your site answered GPTBot with its normal page. Check the middleware is deployed." };
  } catch {
    return { error: `Couldn't reach ${site.domain}.` };
  }
}
