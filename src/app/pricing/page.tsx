import Link from "next/link";

export const metadata = { title: "Pricing" };

const PLANS = [
  {
    name: "Pro",
    price: "$49",
    who: "For stores, startups and indie developers.",
    features: ["Up to 100K AI agent requests a month", "JSON for every page", "Known AI agent detection", "Content match on every page", "Dashboard and llms.txt", "Email support"],
  },
  {
    name: "Enterprise",
    price: "$299",
    who: "For large catalogs, SaaS docs and publishers.",
    features: ["Unlimited AI agent requests", "Custom fields and schema", "Advanced bot verification", "Real-time analytics and API", "Dedicated support with SLA"],
  },
];

export default function Pricing() {
  return (
    <div>
      <h1 className="font-medium">Pricing</h1>
      <p className="mt-1 text-muted">Start free. Pay when AI agents are reading you at scale.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {PLANS.map((p) => (
          <div key={p.name} className="rounded-lg border border-line p-5">
            <div className="font-medium">{p.name}</div>
            <div className="mt-1"><span className="text-2xl font-medium">{p.price}</span><span className="text-sm text-muted"> / month</span></div>
            <p className="mt-1 text-sm text-muted">{p.who}</p>
            <ul className="mt-4 space-y-1.5 text-sm">
              {p.features.map((f) => (
                <li key={f} className="flex gap-2"><span className="text-faint">–</span>{f}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <p className="mt-6 text-sm text-muted">
        Every plan starts with a free trial and no card. <Link href="/dashboard" className="u text-fg">Add your site</Link> to begin.
      </p>
    </div>
  );
}
