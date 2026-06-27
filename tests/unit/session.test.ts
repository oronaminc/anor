// @vitest-environment node
import { describe, it, expect } from "vitest";

import { signSession, verifySession } from "@/lib/session";

const SECRET = "unit-test-secret";

describe("session sign/verify (HMAC cookie)", () => {
  it("round-trips a valid payload", async () => {
    const token = await signSession(
      { role: "admin", exp: Date.now() + 10_000 },
      SECRET,
    );
    const payload = await verifySession(token, SECRET);
    expect(payload?.role).toBe("admin");
  });

  it("rejects a tampered body", async () => {
    const token = await signSession(
      { role: "admin", exp: Date.now() + 10_000 },
      SECRET,
    );
    const [body, sig] = token.split(".");
    // Keep the old signature but change the payload.
    expect(await verifySession(`${body}AA.${sig}`, SECRET)).toBeNull();
  });

  it("rejects a wrong secret", async () => {
    const token = await signSession(
      { role: "admin", exp: Date.now() + 10_000 },
      SECRET,
    );
    expect(await verifySession(token, "other-secret")).toBeNull();
  });

  it("rejects an expired token", async () => {
    const token = await signSession(
      { role: "admin", exp: Date.now() - 1 },
      SECRET,
    );
    expect(await verifySession(token, SECRET)).toBeNull();
  });

  it("rejects malformed / empty tokens", async () => {
    expect(await verifySession("garbage", SECRET)).toBeNull();
    expect(await verifySession("", SECRET)).toBeNull();
    expect(await verifySession(undefined, SECRET)).toBeNull();
  });
});
