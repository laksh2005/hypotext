"use client";

import { useState } from "react";

export function AddToCart({ disabled }: { disabled: boolean }) {
  const [added, setAdded] = useState(false);
  return (
    <button className="btn mt-4 w-full" disabled={disabled} onClick={() => setAdded(true)}>
      {disabled ? "Sold out" : added ? "Added to cart" : "Add to cart"}
    </button>
  );
}
