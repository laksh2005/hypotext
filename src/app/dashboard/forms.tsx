"use client";

import { useActionState, useState } from "react";
import { addSite, openWithKey, readPage, verifyInstall, type FormState } from "./actions";

function Msg({ s }: { s: FormState }) {
  if (s.error) return <p className="mt-2 text-sm text-bad">{s.error}</p>;
  if (s.ok) return <p className="mt-2 text-sm text-ok">{s.ok}</p>;
  return null;
}

export function AddSiteForm() {
  const [s, action, pending] = useActionState(addSite, {});
  return (
    <form action={action}>
      <div className="flex gap-2">
        <input name="domain" className="input" placeholder="yourstore.com" aria-label="Your domain" autoCapitalize="off" spellCheck={false} />
        <button className="btn" disabled={pending}>{pending ? "Adding…" : "Add site"}</button>
      </div>
      <Msg s={s} />
    </form>
  );
}

export function OpenWithKeyForm() {
  const [s, action, pending] = useActionState(openWithKey, {});
  return (
    <form action={action}>
      <div className="flex gap-2">
        <input name="key" className="input font-mono" placeholder="ht_…" aria-label="Site key" autoCapitalize="off" spellCheck={false} />
        <button className="btn-ghost h-10" disabled={pending}>Open</button>
      </div>
      <Msg s={s} />
    </form>
  );
}

export function ReadPageForm({ site, domain }: { site: string; domain: string }) {
  const [s, action, pending] = useActionState(readPage, {});
  return (
    <form action={action}>
      <input type="hidden" name="site" value={site} />
      <div className="flex gap-2">
        <div className="flex flex-1 items-center rounded-lg border border-line pl-3 text-sm text-muted focus-within:border-faint">
          <span className="whitespace-nowrap">{domain}</span>
          <input name="path" className="h-10 w-full bg-transparent pr-3 text-fg outline-none" placeholder="/products/anything" aria-label="Page path" />
        </div>
        <button className="btn-ghost h-10" disabled={pending}>{pending ? "Reading…" : "Read page"}</button>
      </div>
      <Msg s={s} />
    </form>
  );
}

export function VerifyForm({ site }: { site: string }) {
  const [s, action, pending] = useActionState(verifyInstall, {});
  return (
    <form action={action}>
      <input type="hidden" name="site" value={site} />
      <button className="btn-ghost" disabled={pending}>{pending ? "Checking…" : "Check install"}</button>
      <Msg s={s} />
    </form>
  );
}

export function CopyKey({ value }: { value: string }) {
  const [shown, setShown] = useState(false);
  const [copied, setCopied] = useState(false);
  return (
    <span className="inline-flex items-center gap-2">
      <code className="font-mono text-xs">{shown ? value : value.slice(0, 6) + "•".repeat(12)}</code>
      <button type="button" className="text-xs text-muted underline decoration-faint underline-offset-2 hover:text-fg" onClick={() => setShown(!shown)}>{shown ? "hide" : "show"}</button>
      <button
        type="button"
        className="text-xs text-muted underline decoration-faint underline-offset-2 hover:text-fg"
        onClick={() => { navigator.clipboard.writeText(value).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }); }}
      >
        {copied ? "copied" : "copy"}
      </button>
    </span>
  );
}

export function CopyBlock({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="relative">
      <pre className="code pr-16">{text}</pre>
      <button
        type="button"
        className="absolute right-2 top-2 rounded-md px-2 py-0.5 text-xs text-muted hover:bg-bg hover:text-fg"
        onClick={() => { navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }); }}
      >
        {copied ? "copied" : "copy"}
      </button>
    </div>
  );
}
