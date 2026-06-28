"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The shop's view count on the detail page. Opening the page counts your view:
 * it shows +1 immediately and POSTs it (stored). With the home re-fetching on
 * navigation (router cache off), both surfaces then show the same stored number.
 * The `fired` ref keeps one mount from double-counting; the API rate-limits per IP.
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
    setCount(initial + 1);
    fetch(`/api/shops/${shopId}/view`, { method: "POST", keepalive: true }).catch(
      () => {
        /* best-effort; a failed bump never disrupts the page */
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shopId]);

  return <span className="tabular-nums">{count.toLocaleString()}</span>;
}
