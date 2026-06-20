import type { Food } from "./types";

/** Center of Myeongdong, used as the default map center. */
export const MYEONGDONG_CENTER = { lat: 37.5636, lng: 126.985 };

/**
 * Google Maps directions deep link.
 * https://www.google.com/maps/dir/?api=1&destination=LAT,LNG
 */
export function googleDirectionsUrl(food: Pick<Food, "lat" | "lng">) {
  return `https://www.google.com/maps/dir/?api=1&destination=${food.lat},${food.lng}`;
}

/** Google Maps "search/place" link centered on the coordinates. */
export function googlePlaceUrl(food: Pick<Food, "lat" | "lng">) {
  return `https://www.google.com/maps/search/?api=1&query=${food.lat},${food.lng}`;
}
