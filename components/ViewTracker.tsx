"use client";

import { useEffect, useRef } from "react";

/**
 * Fires a single POST to increment the food's view count when the
 * detail page mounts. Guards against React StrictMode double-invoke
 * in development via a ref.
 */
export function ViewTracker({ foodId }: { foodId: string }) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;

    fetch(`/api/foods/${foodId}/view`, {
      method: "POST",
      keepalive: true,
    }).catch(() => {
      // best-effort; a failed view bump should never disrupt the page
    });
  }, [foodId]);

  return null;
}
