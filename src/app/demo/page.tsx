import Link from "next/link";
import { PRODUCTS } from "@/lib/products";

export default function DemoHome() {
  return (
    <div>
      <h1 className="text-lg font-medium">Sound, simplified</h1>
      <p className="text-sm text-muted">Headphones, speakers and earbuds from Northwind Audio.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {PRODUCTS.map((p) => (
          <Link key={p.slug} href={`/demo/p/${p.slug}`} className="block rounded-lg border border-line p-3 hover:bg-soft">
            <div className="mb-3 aspect-square rounded-md" style={{ background: p.color }} aria-hidden="true" />
            <div className="text-sm font-medium">{p.name}</div>
            <div className="text-xs text-muted">{p.tagline}</div>
            <div className="mt-1 text-sm">${p.price.toFixed(2)}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
