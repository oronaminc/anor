// @vitest-environment node
import { describe, it, expect } from "vitest";

import {
  totalViews,
  totalLikes,
  cappedLikeInc,
  likeBoostViewLift,
} from "@/lib/counts";

function shop(v: number, sv: number, l: number, sl: number) {
  return {
    view_count: v,
    synthetic_view_count: sv,
    like_count: l,
    synthetic_like_count: sl,
  };
}
const ri = (a: number, b: number) => Math.floor(Math.random() * (b - a + 1)) + a;

describe("totals = real + synthetic (the displayed number)", () => {
  it("sums both stored counters", () => {
    expect(totalViews(shop(5240, 96, 0, 0))).toBe(5336);
    expect(totalLikes(shop(0, 0, 718, 11))).toBe(729);
  });
  it("treats a missing synthetic field as 0", () => {
    expect(totalViews({ view_count: 7 })).toBe(7);
    expect(totalLikes({ like_count: 4 })).toBe(4);
  });
});

describe("cappedLikeInc — a growth tick never lets total likes reach total views", () => {
  it("returns 0 when there is no room", () => {
    expect(cappedLikeInc(shop(100, 0, 99, 0), 0, 50)).toBe(0); // 100-99-1 = 0
  });
  it("opens room equal to the added views", () => {
    expect(cappedLikeInc(shop(100, 0, 99, 0), 10, 50)).toBe(10); // 110-99-1 = 10
  });
  it("passes the like increment through when there is plenty of room", () => {
    expect(cappedLikeInc(shop(10000, 0, 10, 0), 5, 3)).toBe(3);
  });
  it("is never negative", () => {
    expect(cappedLikeInc(shop(10, 0, 100, 0), 0, 5)).toBe(0);
  });
  it("fuzz (2000×): from any views>likes state, stays views>likes", () => {
    for (let i = 0; i < 2000; i++) {
      const s = shop(ri(0, 100000), ri(0, 100000), ri(0, 100000), ri(0, 100000));
      const viewInc = ri(0, 500);
      const likeInc = ri(0, 500);
      const applied = cappedLikeInc(s, viewInc, likeInc);
      expect(applied).toBeGreaterThanOrEqual(0);
      expect(applied).toBeLessThanOrEqual(likeInc);
      if (totalViews(s) > totalLikes(s)) {
        expect(totalViews(s) + viewInc).toBeGreaterThan(totalLikes(s) + applied);
      }
    }
  });
});

describe("likeBoostViewLift — a like boost lifts views to stay above likes", () => {
  it("lifts views just past the new like total", () => {
    expect(likeBoostViewLift(shop(100, 0, 90, 0), 50)).toBe(41); // 140-100+1
  });
  it("no lift when views already lead", () => {
    expect(likeBoostViewLift(shop(1000, 0, 10, 0), 5)).toBe(0);
  });
  it("fuzz (2000×): after the boost, total views > total likes", () => {
    for (let i = 0; i < 2000; i++) {
      const s = shop(ri(0, 100000), ri(0, 100000), ri(0, 100000), ri(0, 100000));
      const amount = ri(0, 5000);
      const lift = likeBoostViewLift(s, amount);
      expect(totalViews(s) + lift).toBeGreaterThan(totalLikes(s) + amount);
    }
  });
});
