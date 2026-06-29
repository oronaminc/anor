import { cn } from "@/lib/utils";

/**
 * A single location shown via the Google **Maps Embed API** (an iframe). Unlike
 * the interactive JS map, the Embed API's place mode is free — no per-load
 * billing — so it's the right fit for a shop detail page that just needs to show
 * one pin. Falls back to a neutral placeholder without a key or coordinates.
 *
 * Requires the SAME NEXT_PUBLIC_GOOGLE_MAPS_API_KEY with the **Maps Embed API**
 * enabled for it in Google Cloud (in addition to Maps JavaScript API).
 */
export function MapEmbed({
  lat,
  lng,
  title,
  height = "220px",
  zoom = 16,
  className,
}: {
  lat: number | null;
  lng: number | null;
  title?: string;
  height?: string;
  zoom?: number;
  className?: string;
}) {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const hasCoords = typeof lat === "number" && typeof lng === "number";

  if (!key || !hasCoords) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-muted text-sm text-muted-foreground",
          className,
        )}
        style={{ height }}
      >
        지도 미리보기
      </div>
    );
  }

  const src =
    `https://www.google.com/maps/embed/v1/place?key=${key}` +
    `&q=${lat},${lng}&zoom=${zoom}&language=ko`;

  return (
    <iframe
      src={src}
      title={title ?? "지도"}
      loading="lazy"
      className={className}
      style={{ width: "100%", height, border: 0 }}
      referrerPolicy="no-referrer-when-downgrade"
      allowFullScreen
    />
  );
}
