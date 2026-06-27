import { describe, it, expect } from "vitest";

import { getClientIp, hashIp } from "@/lib/ip";

describe("getClientIp", () => {
  it("uses the first x-forwarded-for entry", () => {
    const h = new Headers({ "x-forwarded-for": "203.0.113.7, 10.0.0.1" });
    expect(getClientIp(h)).toBe("203.0.113.7");
  });

  it("falls back to x-real-ip", () => {
    expect(getClientIp(new Headers({ "x-real-ip": "198.51.100.2" }))).toBe(
      "198.51.100.2",
    );
  });

  it("prefers trusted platform headers over a (spoofable) x-forwarded-for", () => {
    expect(
      getClientIp(
        new Headers({
          "x-forwarded-for": "1.2.3.4",
          "x-real-ip": "198.51.100.2",
        }),
      ),
    ).toBe("198.51.100.2");
    expect(
      getClientIp(
        new Headers({
          "x-forwarded-for": "1.2.3.4",
          "cf-connecting-ip": "203.0.113.9",
        }),
      ),
    ).toBe("203.0.113.9");
  });

  it("returns 'unknown' when no IP headers are present", () => {
    expect(getClientIp(new Headers())).toBe("unknown");
  });
});

describe("hashIp", () => {
  it("is deterministic and does not leak the raw IP", () => {
    const a = hashIp("203.0.113.7");
    const b = hashIp("203.0.113.7");
    expect(a).toBe(b);
    expect(a).toMatch(/^[a-f0-9]{64}$/); // sha256 hex
    expect(a).not.toContain("203.0.113.7");
  });

  it("produces different hashes for different IPs", () => {
    expect(hashIp("203.0.113.7")).not.toBe(hashIp("203.0.113.8"));
  });
});
