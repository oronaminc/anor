"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A product's live view count on its detail page. Mirrors ShopViewCount: never
 * shows the (possibly stale) server-rendered value — it fetches the live count
 * on mount (which also records the view) and shows only that. `initial` is an
 * offline fallback.
 */
export function ProductViewCount({
  productId,
  initial,
}: {
  productId: string;
  initial: number;
}) {
  const [count, setCount] = useState<number | null>(null);
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    fetch(`/api/products/${productId}/view`, { method: "POST" })
      .then((r) => r.json())
      .then((data) =>
        setCount(typeof data?.view_count === "number" ? data.view_count : initial + 1),
      )
      .catch(() => setCount(initial + 1));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  if (count === null) {
    return (
      <span
        className="inline-block h-[1em] w-12 animate-pulse rounded bg-muted align-[-0.15em]"
        aria-hidden
      />
    );
  }
  return (
    <span data-testid="product-view-count" className="tabular-nums">
      {count.toLocaleString()}
    </span>
  );
}
