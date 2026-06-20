"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  GoogleMap as GMap,
  MarkerF,
  InfoWindowF,
  useJsApiLoader,
} from "@react-google-maps/api";

import type { Food } from "@/lib/types";
import { MYEONGDONG_CENTER } from "@/lib/maps";
import { localizedName } from "@/lib/i18n-food";

type MapFood = Pick<
  Food,
  "id" | "name_ko" | "name_en" | "name_ja" | "name_es" | "lat" | "lng" | "category"
>;

interface GoogleMapProps {
  foods: MapFood[];
  height?: string;
  /** Clicking a marker navigates to the food detail page. */
  linkToDetail?: boolean;
  className?: string;
  zoom?: number;
}

const containerStyleBase = { width: "100%" };

export default function GoogleMap({
  foods,
  height = "320px",
  linkToDetail = false,
  className,
  zoom = 15,
}: GoogleMapProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("map");
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
  const [activeId, setActiveId] = useState<string | null>(null);

  const points = useMemo(
    () =>
      foods.filter(
        (f) => typeof f.lat === "number" && typeof f.lng === "number",
      ),
    [foods],
  );

  const center = useMemo(() => {
    if (points.length === 1) {
      return { lat: points[0].lat as number, lng: points[0].lng as number };
    }
    return MYEONGDONG_CENTER;
  }, [points]);

  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: apiKey,
  });

  const onLoad = useCallback(
    (map: google.maps.Map) => {
      if (points.length > 1) {
        const bounds = new google.maps.LatLngBounds();
        points.forEach((p) =>
          bounds.extend({ lat: p.lat as number, lng: p.lng as number }),
        );
        map.fitBounds(bounds, 64);
      }
    },
    [points],
  );

  if (!apiKey || loadError) {
    return (
      <Fallback
        height={height}
        className={className}
        message={!apiKey ? t("missingKey") : t("failed")}
      />
    );
  }

  if (!isLoaded) {
    return (
      <div
        className={className}
        style={{ ...containerStyleBase, height }}
        aria-busy="true"
      >
        <div className="h-full w-full animate-pulse rounded-2xl bg-muted" />
      </div>
    );
  }

  return (
    <div className={className} style={{ ...containerStyleBase, height }}>
      <GMap
        mapContainerStyle={{ width: "100%", height: "100%" }}
        center={center}
        zoom={points.length === 1 ? 16 : zoom}
        onLoad={onLoad}
        options={{
          disableDefaultUI: true,
          zoomControl: true,
          clickableIcons: false,
          gestureHandling: "greedy",
        }}
      >
        {points.map((food) => {
          const name = localizedName(food, locale);
          return (
            <MarkerF
              key={food.id}
              position={{ lat: food.lat as number, lng: food.lng as number }}
              title={name}
              onClick={() => {
                if (linkToDetail) router.push(`/food/${food.id}`);
                else setActiveId(food.id);
              }}
            >
              {activeId === food.id && !linkToDetail && (
                <InfoWindowF onCloseClick={() => setActiveId(null)}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{name}</div>
                </InfoWindowF>
              )}
            </MarkerF>
          );
        })}
      </GMap>
    </div>
  );
}

function Fallback({
  height,
  className,
  message,
}: {
  height: string;
  className?: string;
  message: string;
}) {
  return (
    <div className={className} style={{ ...containerStyleBase, height }} role="alert">
      <div className="flex h-full w-full items-center justify-center rounded-2xl border border-dashed bg-muted/40 p-4 text-center text-sm text-muted-foreground">
        🗺️ {message}
      </div>
    </div>
  );
}
