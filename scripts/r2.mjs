// Node-side Cloudflare R2 (S3-compatible) helpers — mirrors lib/storage.ts but
// usable from plain scripts (data sync, r2 test). Reads the same R2_* env vars.
// The DB only ever stores the resulting public URL.
import { AwsClient } from "aws4fetch";

export function r2Configured() {
  return !!(
    process.env.R2_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET &&
    process.env.R2_PUBLIC_BASE_URL
  );
}

function client() {
  return new AwsClient({
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    service: "s3",
    region: "auto",
  });
}

function endpointFor(key) {
  const accountId = process.env.R2_ACCOUNT_ID;
  const bucket = process.env.R2_BUCKET;
  return `https://${accountId}.r2.cloudflarestorage.com/${bucket}/${key}`;
}

export function publicUrlFor(key) {
  const base = process.env.R2_PUBLIC_BASE_URL.replace(/\/$/, "");
  return `${base}/${key}`;
}

/** Upload bytes to R2 under `key`; returns the public URL. */
export async function uploadToR2(bytes, key, contentType = "application/octet-stream") {
  if (!r2Configured()) throw new Error("R2 not configured (set R2_* env vars)");
  const res = await client().fetch(endpointFor(key), {
    method: "PUT",
    body: bytes,
    headers: { "content-type": contentType },
  });
  if (!res.ok) throw new Error(`R2 upload failed (HTTP ${res.status})`);
  return publicUrlFor(key);
}

/** Delete an object from R2 by key. */
export async function deleteFromR2(key) {
  const res = await client().fetch(endpointFor(key), { method: "DELETE" });
  return res.ok;
}

const EXT_CT = {
  jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp",
  gif: "image/gif", svg: "image/svg+xml", avif: "image/avif",
};
export const contentTypeForExt = (ext) =>
  EXT_CT[(ext || "").toLowerCase()] || "application/octet-stream";
