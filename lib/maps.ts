import type { Food } from "./types";

/**
 * Kakao Map directions deep link ("길찾기").
 * Opens the destination on Kakao Map web/app.
 * https://map.kakao.com/link/to/name,lat,lng
 */
export function kakaoDirectionsUrl(food: Pick<Food, "name_ko" | "lat" | "lng">) {
  const name = encodeURIComponent(food.name_ko);
  return `https://map.kakao.com/link/to/${name},${food.lat},${food.lng}`;
}

/** Kakao Map "place" link centered on the coordinates. */
export function kakaoPlaceUrl(food: Pick<Food, "name_ko" | "lat" | "lng">) {
  const name = encodeURIComponent(food.name_ko);
  return `https://map.kakao.com/link/map/${name},${food.lat},${food.lng}`;
}
