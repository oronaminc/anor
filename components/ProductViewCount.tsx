"use client";

import { useEffect, useRef, useState } from "react";

import { recordView } from "@/lib/record-view";

/**
 * A product's view count on its detail page. Mirrors ShopViewCount: renders the
 * cached server value (the same snapshot the ranking lists render) and records
 * the view fire-and-forget, deduped per device — no database round-trip just to
 * display a number. See lib/record-view.ts and lib/cache.ts.
 */
export function ProductViewCount({
  productId,
  initial,
}: {
  productId: string;
  initial: number;
}) {
  const [count, setCount] = useState(initial);
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    if (recordView("products", productId)) setCount((c) => c + 1);
  }, [productId]);

  return (
    <span data-testid="product-view-count" className="tabular-nums">
      {count.toLocaleString()}
    </span>
  );
}
