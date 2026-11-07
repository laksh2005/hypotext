import Link from "next/link";
import { AiToggle } from "./ai-toggle";
import { SITE_URL } from "@/lib/site-url";

export const metadata = {
  title: "Demo store",
  description: "Northwind Audio: headphones, speakers and earbuds. A sample store running HypoText.",
};

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-6 rounded-lg border border-line p-4 text-sm">
        <p>
          This is a sample store running HypoText. You see the normal shop. AI agents asking for the same links get JSON.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <AiToggle />
          <Link href="/demo/llms.txt" className="btn-ghost inline-flex items-center" prefetch={false}>/llms.txt</Link>
        </div>
        <pre className="code mt-3">curl -A "GPTBot" {SITE_URL}/demo/p/aura-headphones</pre>
      </div>
      <div className="rounded-lg border border-line">
        <div className="flex items-center justify-between border-b border-line px-4 py-3 text-sm">
          <Link href="/demo" className="font-medium">northwind audio</Link>
          <span className="text-muted">cart (0)</span>
        </div>
        <article className="p-4">{children}</article>
      </div>
    </div>
  );
}
