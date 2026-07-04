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

import type { Shop } from "@/lib/types";
import { MYEONGDONG_CENTER } from "@/lib/maps";
import { localizedName } from "@/lib/i18n-food";

type MapShop = Pick<
  Shop,
  "id" | "name_ko" | "name_en" | "name_ja" | "name_es" | "lat" | "lng"
>;

interface GoogleMapProps {
  shops: MapShop[];
  height?: string;
  /** Clicking a marker navigates to the shop detail page. */
  linkToDetail?: boolean;
  className?: string;
  zoom?: number;
}

const containerStyleBase = { width: "100%" };

export default function GoogleMap({
  shops,
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
      shops.filter(
        (s) => typeof s.lat === "number" && typeof s.lng === "number",
      ),
    [shops],
  );

  const center = useMemo(() => {
    if (points.length === 1) {
      return { lat: points[0].lat as number, lng: points[0].lng as number };
    }
    return MYEONGDONG_CENTER;
  }, [points]);

  // Render Google's own labels/place names in the active app language. The
  // loader bakes ?language into the script URL; a locale switch does a full page
  // reload (LanguageSwitcher), so the map re-loads in the new language.
  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: apiKey,
    language: locale,
    region: locale === "ja" ? "JP" : "KR",
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
        {points.map((shop) => {
          const name = localizedName(shop, locale);
          return (
            <MarkerF
              key={shop.id}
              position={{ lat: shop.lat as number, lng: shop.lng as number }}
              title={name}
              onClick={() => {
                if (linkToDetail) router.push(`/shop/${shop.id}`);
                else setActiveId(shop.id);
              }}
            >
              {activeId === shop.id && !linkToDetail && (
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
