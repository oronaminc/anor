"use client";

import { useEffect, useRef, useState, type ComponentProps } from "react";

import GoogleMap from "@/components/GoogleMap";

/**
 * Defers mounting the interactive Google Map (which bills one "Dynamic Maps"
 * load each time it mounts) until it actually scrolls near the viewport. On the
 * home feed the map sits below the list, so most visitors never reach it — this
 * avoids paying for a map load on every home view. Same props as GoogleMap.
 */
export default function LazyGoogleMap(props: ComponentProps<typeof GoogleMap>) {
  const ref = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);
  const height = props.height ?? "200px";

  useEffect(() => {
    if (show || !ref.current) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShow(true);
          io.disconnect();
        }
      },
      { rootMargin: "300px" },
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, [show]);

  return (
    <div ref={ref} className={props.className}>
      {show ? (
        <GoogleMap {...props} className={undefined} />
      ) : (
        <div
          className="flex items-center justify-center bg-muted text-xs text-muted-foreground"
          style={{ height }}
        >
          지도
        </div>
      )}
    </div>
  );
}
