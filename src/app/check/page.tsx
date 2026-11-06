import { Suspense } from "react";
import { Checker } from "@/components/checker";

export const metadata = { title: "See what AI sees" };

export default function CheckPage() {
  return (
    <div>
      <h1 className="font-medium">See what AI sees</h1>
      <p className="mb-6 mt-1 text-muted">
        Paste any page. We fetch it the way ChatGPT or Claude would, show how much they have to download, and what HypoText would hand them instead.
      </p>
      <Suspense>
        <Checker />
      </Suspense>
    </div>
  );
}
