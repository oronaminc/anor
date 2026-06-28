"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * The shop's view count on the detail page. Opening the page counts YOUR view:
 * it shows +1 immediately and POSTs it (persisted), then router.refresh() so the
 * stored value is re-read and the rest of the app (e.g. the home feed on back
 * navigation) reflects it. The `fired` ref keeps a single mount from
 * double-counting; the API also rate-limits per IP. Stable otherwise.
 */
export function ShopViewCount({
  shopId,
  initial,
}: {
  shopId: string;
  initial: number;
}) {
  const router = useRouter();
  const [count, setCount] = useState(initial);
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    setCount(initial + 1); // your view counts, shown immediately
    fetch(`/api/shops/${shopId}/view`, { method: "POST" })
      .then(() => router.refresh())
      .catch(() => {
        /* best-effort; a failed bump never disrupts the page */
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shopId]);

  return <span className="tabular-nums">{count.toLocaleString()}</span>;
}
