"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The shop's view count on the detail page. To avoid ever flashing a stale
 * number, it does NOT display the server-rendered value (which a client/router
 * cache may serve old). It shows a tiny placeholder, fetches the LIVE count from
 * the API on mount (which also records this view), and shows only that. So no
 * matter what's cached, the visible number is always the live DB value.
 * `initial` is used only as an offline fallback. The `fired` ref de-dupes mount;
 * the API rate-limits per IP.
 */
export function ShopViewCount({
  shopId,
  initial,
}: {
  shopId: string;
  initial: number;
}) {
  const [count, setCount] = useState<number | null>(null);
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    fetch(`/api/shops/${shopId}/view`, { method: "POST" })
      .then((r) => r.json())
      .then((data) =>
        setCount(typeof data?.view_count === "number" ? data.view_count : initial + 1),
      )
      .catch(() => setCount(initial + 1));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shopId]);

  if (count === null) {
    return (
      <span
        className="inline-block h-[1em] w-12 animate-pulse rounded bg-muted align-[-0.15em]"
        aria-hidden
      />
    );
  }
  return (
    <span data-testid="view-count" className="tabular-nums">
      {count.toLocaleString()}
    </span>
  );
}
