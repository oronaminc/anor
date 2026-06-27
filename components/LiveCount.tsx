"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A count that visibly climbs in real time. The server already baked organic
 * growth into `initial`; this keeps it ticking from there at `perMinute` so the
 * number is alive without a page refresh. Shows the full number (with thousand
 * separators) so the motion is visible even at large magnitudes. When
 * `perMinute` is 0 (growth speed 0), it just renders the static value.
 */
export function LiveCount({
  initial,
  perMinute,
  className,
}: {
  initial: number;
  perMinute?: number;
  className?: string;
}) {
  const [count, setCount] = useState(initial);
  const base = useRef(initial);
  const startedAt = useRef(0);

  useEffect(() => {
    base.current = initial;
    setCount(initial);
    if (!perMinute || perMinute <= 0) return;
    startedAt.current = Date.now();
    const id = setInterval(() => {
      const elapsedMin = (Date.now() - startedAt.current) / 60_000;
      setCount(Math.floor(base.current + perMinute * elapsedMin));
    }, 1200);
    return () => clearInterval(id);
  }, [initial, perMinute]);

  return (
    <span className={className} suppressHydrationWarning>
      {count.toLocaleString()}
    </span>
  );
}
