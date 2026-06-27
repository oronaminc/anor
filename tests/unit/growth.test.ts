import { describe, it, expect } from "vitest";

import {
  kstWeekStartMs,
  computeDisplay,
  clampSpeed,
  formatWeekRange,
  DEFAULT_GROWTH_SPEED,
} from "@/lib/growth";
import { formatViewCount } from "@/lib/utils";

const HOUR = 3600_000;
const DAY = 24 * HOUR;
const KST = 9 * HOUR;
// A reference instant: 2026-06-24 12:00 KST (a Wednesday).
const NOW = Date.parse("2026-06-24T12:00:00+09:00");

function weekStartDateStr(now: number): string {
  // The YYYY-MM-DD of the current KST week's Monday (matches DB week_start).
  const d = new Date(kstWeekStartMs(now) + KST);
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${d.getUTCFullYear()}-${m}-${day}`;
}

describe("kstWeekStartMs", () => {
  it("returns a Monday 00:00 KST not after now, within the last 7 days", () => {
    const ws = kstWeekStartMs(NOW);
    const k = new Date(ws + KST);
    expect(k.getUTCDay()).toBe(1); // Monday
    expect(k.getUTCHours()).toBe(0);
    expect(k.getUTCMinutes()).toBe(0);
    expect(ws).toBeLessThanOrEqual(NOW);
    expect(NOW - ws).toBeLessThan(7 * DAY);
  });

  it("is idempotent within the same week", () => {
    const ws = kstWeekStartMs(NOW);
    expect(kstWeekStartMs(ws + 3 * DAY)).toBe(ws);
    expect(kstWeekStartMs(ws)).toBe(ws);
  });
});

describe("clampSpeed", () => {
  it("clamps to 0..5 and rounds", () => {
    expect(clampSpeed(-2)).toBe(0);
    expect(clampSpeed(9)).toBe(5);
    expect(clampSpeed(2.4)).toBe(2);
    expect(clampSpeed(Number.NaN)).toBe(DEFAULT_GROWTH_SPEED);
  });
});

describe("computeDisplay", () => {
  const thisWeek = weekStartDateStr(NOW);

  const base = {
    weekly_view_count: 100,
    weekly_like_count: 10,
    week_start: thisWeek,
    growth_weight: 1,
    is_trending: false,
  };

  it("adds no organic growth at speed 0 (shows real weekly only)", () => {
    expect(computeDisplay(base, 0, NOW)).toEqual({ views: 100, likes: 10 });
  });

  it("grows with elapsed time at higher speed", () => {
    const d = computeDisplay(base, 5, NOW);
    expect(d.views).toBeGreaterThan(100);
    expect(d.likes).toBeGreaterThanOrEqual(10);
  });

  it("always keeps views greater than likes", () => {
    for (const speed of [0, 1, 3, 5]) {
      const d = computeDisplay({ ...base, weekly_like_count: 5 }, speed, NOW);
      expect(d.views).toBeGreaterThan(d.likes);
    }
  });

  it("trending grows faster than non-trending", () => {
    const plain = computeDisplay(base, 5, NOW);
    const hot = computeDisplay({ ...base, is_trending: true }, 5, NOW);
    expect(hot.views).toBeGreaterThan(plain.views);
  });

  it("treats a stale week as reset to 0 (plus organic)", () => {
    const stale = { ...base, week_start: "2020-01-06" };
    expect(computeDisplay(stale, 0, NOW)).toEqual({ views: 0, likes: 0 });
  });

  it("is monotonic over time", () => {
    const a = computeDisplay(base, 3, NOW);
    const b = computeDisplay(base, 3, NOW + 6 * HOUR);
    expect(b.views).toBeGreaterThanOrEqual(a.views);
  });

  it("grows visibly within a minute at high speed", () => {
    const hot = { ...base, is_trending: true };
    const a = computeDisplay(hot, 5, NOW);
    const b = computeDisplay(hot, 5, NOW + 60_000);
    expect(b.views - a.views).toBeGreaterThanOrEqual(3);
  });
});

describe("formatWeekRange", () => {
  it("formats a M/D – M/D range", () => {
    expect(formatWeekRange(NOW)).toMatch(/^\d{1,2}\/\d{1,2} – \d{1,2}\/\d{1,2}$/);
  });
});

describe("formatViewCount (K/M)", () => {
  it("shows small numbers as-is", () => {
    expect(formatViewCount(0)).toBe("0");
    expect(formatViewCount(999)).toBe("999");
  });
  it("uses K for thousands", () => {
    expect(formatViewCount(1500)).toBe("1.5K");
    expect(formatViewCount(1000)).toBe("1K");
    expect(formatViewCount(12000)).toBe("12K");
    expect(formatViewCount(340000)).toBe("340K");
  });
  it("uses M for millions", () => {
    expect(formatViewCount(1200000)).toBe("1.2M");
    expect(formatViewCount(2000000)).toBe("2M");
  });
});
