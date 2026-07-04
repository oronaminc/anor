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

/** The object key for one of our public URLs, or null if it isn't ours. */
export function keyFromPublicUrl(url) {
  if (!url) return null;
  const base = process.env.R2_PUBLIC_BASE_URL.replace(/\/$/, "");
  return url.startsWith(base + "/") ? url.slice(base.length + 1) : null;
}

const unxml = (s) =>
  s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'");

/** List object keys under a prefix (S3 ListObjectsV2, follows pagination). */
export async function listR2(prefix = "") {
  const accountId = process.env.R2_ACCOUNT_ID;
  const bucket = process.env.R2_BUCKET;
  const keys = [];
  let token;
  do {
    const u = new URL(`https://${accountId}.r2.cloudflarestorage.com/${bucket}`);
    u.searchParams.set("list-type", "2");
    if (prefix) u.searchParams.set("prefix", prefix);
    if (token) u.searchParams.set("continuation-token", token);
    const res = await client().fetch(u.toString(), { method: "GET" });
    if (!res.ok) throw new Error(`R2 list failed (HTTP ${res.status})`);
    const xml = await res.text();
    for (const m of xml.matchAll(/<Key>([^<]+)<\/Key>/g)) keys.push(unxml(m[1]));
    token = /<IsTruncated>true<\/IsTruncated>/.test(xml)
      ? xml.match(/<NextContinuationToken>([^<]+)<\/NextContinuationToken>/)?.[1]
      : null;
  } while (token);
  return keys;
}

const EXT_CT = {
  jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp",
  gif: "image/gif", svg: "image/svg+xml", avif: "image/avif",
};
export const contentTypeForExt = (ext) =>
  EXT_CT[(ext || "").toLowerCase()] || "application/octet-stream";
