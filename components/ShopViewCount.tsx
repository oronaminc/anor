"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The shop's view count on the detail page. Opening the page counts YOUR view:
 * it optimistically shows +1 and POSTs it so the stored count goes up by one
 * (persisted). The `fired` ref keeps a single mount from double-counting; the
 * API also rate-limits per IP. Stable otherwise — the number only moves on a
 * real view (or a like / boost elsewhere).
 */
export function ShopViewCount({
  shopId,
  initial,
}: {
  shopId: string;
  initial: number;
}) {
  const [count, setCount] = useState(initial);
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    setCount(initial + 1); // your view counts, shown immediately
    fetch(`/api/shops/${shopId}/view`, { method: "POST", keepalive: true }).catch(
      () => {
        /* best-effort; a failed bump never disrupts the page */
      },
    );
  }, [shopId, initial]);

  return <span className="tabular-nums">{count.toLocaleString()}</span>;
}
