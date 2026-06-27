import { describe, it, expect } from "vitest";

import { generateCode, hashCode } from "@/lib/login-challenge";

describe("generateCode", () => {
  it("always returns a 6-digit numeric string", () => {
    for (let i = 0; i < 2000; i++) {
      const code = generateCode();
      expect(code).toMatch(/^\d{6}$/);
      expect(code.length).toBe(6);
    }
  });

  it("preserves leading zeros (zero-padded)", () => {
    // Over many samples we expect at least one value < 100000 → leading zero.
    const codes = Array.from({ length: 5000 }, () => generateCode());
    expect(codes.some((c) => c[0] === "0")).toBe(true);
  });

  it("is not trivially constant", () => {
    const codes = new Set(Array.from({ length: 50 }, () => generateCode()));
    expect(codes.size).toBeGreaterThan(1);
  });
});

describe("hashCode", () => {
  it("returns a 64-char sha256 hex digest", async () => {
    const h = await hashCode("123456");
    expect(h).toMatch(/^[0-9a-f]{64}$/);
  });

  it("is deterministic for the same input", async () => {
    expect(await hashCode("482910")).toBe(await hashCode("482910"));
  });

  it("differs for different codes", async () => {
    expect(await hashCode("000000")).not.toBe(await hashCode("000001"));
  });

  it("never echoes the plaintext code", async () => {
    const h = await hashCode("314159");
    expect(h).not.toContain("314159");
  });
});
