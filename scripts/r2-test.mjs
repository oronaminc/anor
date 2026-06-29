#!/usr/bin/env node
/** Smoke-test Cloudflare R2: upload a 1×1 png, fetch its public URL, delete it.
 *  Needs the R2_* vars in .env.local. Prints no secrets. */
import { loadEnvLocal } from "./lib.mjs";
import { r2Configured, uploadToR2, deleteFromR2 } from "./r2.mjs";

loadEnvLocal();
if (!r2Configured()) {
  console.error(
    "R2 not configured in .env.local. Add: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, " +
      "R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_PUBLIC_BASE_URL (copy from Vercel).",
  );
  process.exit(1);
}

const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR42mNk+P+/HgAFhAJ/wlseKgAAAABJRU5ErkJggg==",
  "base64",
);
const key = `test/r2-check-${Date.now()}.png`;
try {
  const url = await uploadToR2(png, key, "image/png");
  console.log("1) upload         ✅", url);
  const res = await fetch(url);
  console.log("2) public GET    ", res.ok ? `✅ ${res.status}` : `❌ ${res.status}`);
  const del = await deleteFromR2(key);
  console.log("3) delete (clean)", del ? "✅" : "⚠️ failed (permissions?)");
  console.log(
    res.ok
      ? "\n🎉 R2 works — upload + public access + delete all OK."
      : "\n⚠️ Uploaded, but the public URL isn't reachable. Check R2_PUBLIC_BASE_URL\n   and that the bucket has public access (r2.dev or a connected domain).",
  );
} catch (e) {
  console.error("❌ R2 test failed:", e.message);
  console.error("   Check R2_ACCOUNT_ID / keys / bucket name.");
  process.exit(1);
}
