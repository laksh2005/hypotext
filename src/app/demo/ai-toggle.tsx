"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";

// Shows the exact response an AI agent would get for the current page.
export function AiToggle() {
  const path = usePathname();
  const [json, setJson] = useState<string | null>(null);
  const [meta, setMeta] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (json) { setJson(null); return; }
    setLoading(true);
    try {
      const t0 = performance.now();
      const r = await fetch(`${path}?view=ai`, { cache: "no-store" });
      const text = await r.text();
      let pretty = text;
      try { pretty = JSON.stringify(JSON.parse(text), null, 2); } catch {}
      setMeta(`${r.status} · ${r.headers.get("content-type")?.split(";")[0]} · ${new Blob([text]).size} bytes · ${Math.round(performance.now() - t0)} ms`);
      setJson(pretty);
    } catch {
      setJson("Couldn't load the AI view.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button onClick={load} className="btn-ghost">{loading ? "Loading…" : json ? "Back to the human view" : "View as GPTBot"}</button>
      {json && (
        <div className="mt-2 w-full">
          <div className="mb-1 text-xs text-muted">{meta}</div>
          <pre className="code max-h-96">{json}</pre>
        </div>
      )}
    </>
  );
}
