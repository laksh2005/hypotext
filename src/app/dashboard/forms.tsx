"use client";

import { useActionState, useState } from "react";
import { addSite, readPage, verifyInstall, type FormState } from "./actions";

function Message({ state }: { state: FormState }) {
  if (state.error) return <p className="mt-2 text-sm text-bad">{state.error}</p>;
  if (state.ok) return <p className="mt-2 text-sm text-ok">{state.ok}</p>;
  return null;
}

export function AddSiteForm() {
  const [state, action, pending] = useActionState(addSite, {});
  return (
    <form action={action}>
      <div className="flex gap-2">
        <input name="domain" className="input" placeholder="yourstore.com" aria-label="Your domain" autoCapitalize="off" spellCheck={false} />
        <button className="btn" disabled={pending}>{pending ? "Adding…" : "Add site"}</button>
      </div>
      <Message state={state} />
    </form>
  );
}

export function ReadPageForm({ site, domain }: { site: string; domain: string }) {
  const [state, action, pending] = useActionState(readPage, {});
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
      <Message state={state} />
    </form>
  );
}

export function VerifyForm({ site }: { site: string }) {
  const [state, action, pending] = useActionState(verifyInstall, {});
  return (
    <form action={action}>
      <input type="hidden" name="site" value={site} />
      <button className="btn-ghost" disabled={pending}>{pending ? "Checking…" : "Check install"}</button>
      <Message state={state} />
    </form>
  );
}

export function CopyBlock({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="relative">
      <pre className="code pr-16">{text}</pre>
      <button type="button" onClick={copy} className="absolute right-2 top-2 rounded-md px-2 py-0.5 text-xs text-muted hover:bg-bg hover:text-fg">
        {copied ? "copied" : "copy"}
      </button>
    </div>
  );
}
