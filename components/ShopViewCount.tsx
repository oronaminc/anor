"use client";

import { useEffect, useRef, useState } from "react";

import { recordView } from "@/lib/record-view";

/**
 * The shop's view count on the detail page.
 *
 * It renders the server value straight away. That value comes from the shared
 * read cache (lib/cache.ts), which is the SAME snapshot the home feed and its
 * cards render from — so the number already agrees everywhere and there is
 * nothing to reconcile. (The old version hid the server value and fetched a
 * live count on mount to defeat a stale *client router* cache; `staleTimes: 0`
 * plus `prefetch={false}` already handle that, and the fetch cost a database
 * round-trip on every single detail open.)
 *
 * Recording the view is fire-and-forget and deduped per device — see
 * lib/record-view.ts. The `+1` is applied locally when this visit counted.
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
    if (recordView("shops", shopId)) setCount((c) => c + 1);
  }, [shopId]);

  return (
    <span data-testid="view-count" className="tabular-nums">
      {count.toLocaleString()}
    </span>
  );
}
