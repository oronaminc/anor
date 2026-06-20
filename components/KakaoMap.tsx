"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Food } from "@/lib/types";

type MapFood = Pick<Food, "id" | "name_ko" | "lat" | "lng" | "category">;

interface KakaoMapProps {
  /** Foods to render as markers. Single item => single-marker mode. */
  foods: MapFood[];
  /** Map height (Tailwind-friendly CSS value). */
  height?: string;
  /** Default zoom level (Kakao: smaller = closer). */
  level?: number;
  /** Clicking a marker navigates to the food detail page. */
  linkToDetail?: boolean;
  className?: string;
}

// Myeongdong center fallback
const MYEONGDONG = { lat: 37.5636, lng: 126.985 };

function waitForKakao(): Promise<any> {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const tick = () => {
      if (typeof window !== "undefined" && window.kakao && window.kakao.maps) {
        window.kakao.maps.load(() => resolve(window.kakao));
        return;
      }
      if (Date.now() - start > 10000) {
        reject(new Error("Kakao Maps SDK failed to load"));
        return;
      }
      setTimeout(tick, 100);
    };
    tick();
  });
}

export default function KakaoMap({
  foods,
  height = "320px",
  level = 4,
  linkToDetail = false,
  className,
}: KakaoMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const points = foods.filter(
    (f) => typeof f.lat === "number" && typeof f.lng === "number",
  );

  useEffect(() => {
    let cancelled = false;

    if (!process.env.NEXT_PUBLIC_KAKAO_MAP_KEY) {
      setError("Kakao 지도 키가 설정되지 않았습니다.");
      return;
    }

    waitForKakao()
      .then((kakao) => {
        if (cancelled || !containerRef.current) return;

        const center =
          points.length === 1
            ? new kakao.maps.LatLng(points[0].lat, points[0].lng)
            : new kakao.maps.LatLng(MYEONGDONG.lat, MYEONGDONG.lng);

        const map = new kakao.maps.Map(containerRef.current, {
          center,
          level,
        });

        const bounds = new kakao.maps.LatLngBounds();

        points.forEach((food) => {
          const pos = new kakao.maps.LatLng(food.lat, food.lng);
          bounds.extend(pos);

          const marker = new kakao.maps.Marker({ position: pos, map });

          const info = new kakao.maps.InfoWindow({
            content: `<div style="padding:6px 10px;font-size:13px;font-weight:600;white-space:nowrap;">${food.name_ko}</div>`,
          });

          kakao.maps.event.addListener(marker, "mouseover", () =>
            info.open(map, marker),
          );
          kakao.maps.event.addListener(marker, "mouseout", () => info.close());
          kakao.maps.event.addListener(marker, "click", () => {
            if (linkToDetail) {
              router.push(`/food/${food.id}`);
            } else {
              info.open(map, marker);
            }
          });
        });

        if (points.length > 1) {
          map.setBounds(bounds);
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e.message);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(points), level, linkToDetail]);

  if (error) {
    return (
      <div
        className={className}
        style={{ height }}
        role="alert"
      >
        <div className="flex h-full w-full items-center justify-center rounded-xl border border-dashed bg-muted/40 p-4 text-center text-sm text-muted-foreground">
          🗺️ 지도를 불러올 수 없습니다.
          <br />
          {error}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ height, width: "100%" }}
      aria-label="카카오 지도"
    />
  );
}
