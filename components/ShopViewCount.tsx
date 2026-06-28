"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The shop's view count on the detail page. Opening the page counts your view:
 * it shows +1 immediately, POSTs it, then RECONCILES to the fresh DB total the
 * API returns — so even if this page was served from a stale client/router
 * cache, the number self-corrects to the live value on mount. The `fired` ref
 * keeps one mount from double-counting; the API rate-limits per IP.
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
    setCount(initial + 1); // optimistic, instant
    fetch(`/api/shops/${shopId}/view`, { method: "POST" })
      .then((r) => r.json())
      .then((data) => {
        if (data && typeof data.view_count === "number") setCount(data.view_count);
      })
      .catch(() => {
        /* best-effort; a failed bump never disrupts the page */
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shopId]);

  return <span data-testid="view-count" className="tabular-nums">{count.toLocaleString()}</span>;
}
