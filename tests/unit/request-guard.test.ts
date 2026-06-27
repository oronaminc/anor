import { describe, it, expect, afterEach } from "vitest";

import { isSameOrigin } from "@/lib/request-guard";

function req(headers: Record<string, string>): Request {
  return { headers: new Headers(headers) } as unknown as Request;
}

const ORIG = { ...process.env };
afterEach(() => {
  process.env = { ...ORIG };
});

describe("isSameOrigin", () => {
  it("allows a same-host Origin", () => {
    expect(
      isSameOrigin(
        req({ host: "anor.app", origin: "https://anor.app" }),
      ),
    ).toBe(true);
  });

  it("blocks a foreign Origin", () => {
    expect(
      isSameOrigin(
        req({ host: "anor.app", origin: "https://evil.example" }),
      ),
    ).toBe(false);
  });

  it("falls back to Referer when Origin is absent", () => {
    expect(
      isSameOrigin(
        req({ host: "anor.app", referer: "https://anor.app/food/1" }),
      ),
    ).toBe(true);
    expect(
      isSameOrigin(
        req({ host: "anor.app", referer: "https://evil.example/x" }),
      ),
    ).toBe(false);
  });

  it("allows requests with no Origin and no Referer (non-browser)", () => {
    expect(isSameOrigin(req({ host: "anor.app" }))).toBe(true);
  });

  it("honors NEXT_PUBLIC_SITE_URL and ALLOWED_ORIGINS", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://anor.app";
    process.env.ALLOWED_ORIGINS = "https://www.anor.app, https://anor.vercel.app";
    expect(
      isSameOrigin(
        req({ host: "internal", origin: "https://www.anor.app" }),
      ),
    ).toBe(true);
    expect(
      isSameOrigin(
        req({ host: "internal", origin: "https://anor.vercel.app" }),
      ),
    ).toBe(true);
    expect(
      isSameOrigin(req({ host: "internal", origin: "https://nope.com" })),
    ).toBe(false);
  });

  it("rejects a malformed Origin", () => {
    expect(isSameOrigin(req({ host: "anor.app", origin: "not a url" }))).toBe(
      false,
    );
  });
});
