"use client";

import { useEffect, useRef } from "react";

/** Skip re-counting the same shop on this device within ~6h. */
const VIEW_TTL_MS = 6 * 60 * 60 * 1000;

/**
 * Fires a single POST to increment the shop's view count when the detail page
 * mounts. Guards against:
 *  - React StrictMode double-invoke (a ref), and
 *  - reload/refresh inflation (a localStorage TTL — light per-device dedupe;
 *    the API also rate-limits per IP).
 */
export function ViewTracker({ shopId }: { shopId: string }) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;

    try {
      const key = `anor:viewed:${shopId}`;
      const last = Number(localStorage.getItem(key) || 0);
      if (Date.now() - last < VIEW_TTL_MS) return;
      localStorage.setItem(key, String(Date.now()));
    } catch {
      // localStorage unavailable (private mode) — fall through and still count.
    }

    fetch(`/api/shops/${shopId}/view`, {
      method: "POST",
      keepalive: true,
    }).catch(() => {
      // best-effort; a failed view bump should never disrupt the page
    });
  }, [shopId]);

  return null;
}
