"use client";

import { useEffect, useRef } from "react";

/**
 * The shop's view count on the detail page. Shows the SAME stored value the
 * home/cards show (so they stay consistent), and counts this visit in the
 * background (POST → stored count +1, reflected on the next load). The `fired`
 * ref keeps one mount from double-counting; the API also rate-limits per IP.
 */
export function ShopViewCount({
  shopId,
  initial,
}: {
  shopId: string;
  initial: number;
}) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    fetch(`/api/shops/${shopId}/view`, { method: "POST", keepalive: true }).catch(
      () => {
        /* best-effort; a failed bump never disrupts the page */
      },
    );
  }, [shopId]);

  return <span className="tabular-nums">{initial.toLocaleString()}</span>;
}
