// Demo store catalog. Stands in for any React storefront.
export type Product = {
  slug: string;
  name: string;
  brand: string;
  tagline: string;
  description: string;
  price: number;
  currency: "USD";
  stock: number;
  rating: number;
  reviews: number;
  features: string[];
  color: string;
};

export const PRODUCTS: Product[] = [
  {
    slug: "aura-headphones",
    name: "Aura Headphones",
    brand: "Northwind Audio",
    tagline: "Wireless noise cancelling",
    description: "Over-ear headphones with adaptive noise cancelling, 30 hours of battery and a fold-flat design for travel.",
    price: 348,
    currency: "USD",
    stock: 47,
    rating: 4.7,
    reviews: 12483,
    features: ["Active noise cancelling", "30-hour battery", "Hi-res wireless audio", "Multipoint Bluetooth"],
    color: "#d9d4cc",
  },
  {
    slug: "pebble-speaker",
    name: "Pebble Speaker",
    brand: "Northwind Audio",
    tagline: "Pocket-sized, waterproof",
    description: "A palm-sized Bluetooth speaker that survives rain, sand and the pool, with 14 hours of playback.",
    price: 89,
    currency: "USD",
    stock: 0,
    rating: 4.4,
    reviews: 3120,
    features: ["IP67 waterproof", "14-hour battery", "Stereo pairing"],
    color: "#c9d6d2",
  },
  {
    slug: "loop-earbuds",
    name: "Loop Earbuds",
    brand: "Northwind Audio",
    tagline: "All-day comfort",
    description: "Lightweight earbuds with a secure fit, clear calls and a charging case that adds 24 hours.",
    price: 149,
    currency: "USD",
    stock: 212,
    rating: 4.5,
    reviews: 8771,
    features: ["Secure fit", "6 mics for calls", "24-hour case", "Wireless charging"],
    color: "#d6cfdc",
  },
];

export const productBySlug = (slug: string) => PRODUCTS.find((p) => p.slug === slug);

export const availability = (p: Product) => (p.stock > 0 ? "InStock" : "OutOfStock");

// The JSON a bot gets for a product page: built from the same data the page renders.
export function productJson(p: Product, url: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    url,
    name: p.name,
    brand: p.brand,
    description: p.description,
    offers: {
      price: p.price.toFixed(2),
      priceCurrency: p.currency,
      availability: availability(p),
      inventoryLevel: p.stock,
    },
    features: p.features,
    aggregateRating: { ratingValue: p.rating, reviewCount: p.reviews },
  };
}
