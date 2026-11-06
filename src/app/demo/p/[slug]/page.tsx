import { notFound } from "next/navigation";
import { PRODUCTS, productBySlug } from "@/lib/products";
import { AddToCart } from "./add-to-cart";

export function generateStaticParams() {
  return PRODUCTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const p = productBySlug((await params).slug);
  return p ? { title: p.name, description: p.description } : {};
}

// A normal product page. It has no JSON-LD on purpose: HypoText reads the
// rendered page itself, so the store needs no code changes.
export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const p = productBySlug((await params).slug);
  if (!p) notFound();
  const inStock = p.stock > 0;
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <div className="aspect-square rounded-lg" style={{ background: p.color }} aria-hidden="true" />
      <div>
        <div className="text-xs text-muted">{p.brand}</div>
        <h1 className="text-lg font-medium">{p.name}</h1>
        <div className="text-sm text-muted">{p.tagline}</div>
        <div className="mt-3 text-lg">${p.price.toFixed(2)}</div>
        <div className={`text-sm ${inStock ? "text-ok" : "text-bad"}`}>{inStock ? `In stock · ${p.stock} left` : "Sold out"}</div>
        <p className="mt-3 text-sm">{p.description}</p>
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {p.features.map((f) => <li key={f} className="tag bg-soft">{f}</li>)}
        </ul>
        <div className="mt-3 text-xs text-muted">★ {p.rating} · {p.reviews.toLocaleString("en-US")} reviews</div>
        <AddToCart disabled={!inStock} />
      </div>
    </div>
  );
}
