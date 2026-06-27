import "server-only";
import { AwsClient } from "aws4fetch";

/**
 * Cloudflare R2 image storage (S3-compatible). The image bytes live in R2;
 * the database stores only the resulting public URL (foods.thumbnail_url).
 *
 * Required env:
 *   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET,
 *   R2_PUBLIC_BASE_URL (e.g. https://pub-xxxx.r2.dev or a custom domain)
 */
export function r2Configured(): boolean {
  return !!(
    process.env.R2_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET &&
    process.env.R2_PUBLIC_BASE_URL
  );
}

export async function uploadToR2(file: File): Promise<string> {
  if (!r2Configured()) {
    throw new Error(
      "R2 스토리지가 설정되지 않았습니다. 이미지 URL을 직접 입력하거나 R2 환경변수를 설정하세요.",
    );
  }

  const accountId = process.env.R2_ACCOUNT_ID!;
  const bucket = process.env.R2_BUCKET!;
  const publicBase = process.env.R2_PUBLIC_BASE_URL!.replace(/\/$/, "");

  const client = new AwsClient({
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    service: "s3",
    region: "auto",
  });

  const ext =
    (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") ||
    "jpg";
  const key = `foods/${crypto.randomUUID()}.${ext}`;
  const endpoint = `https://${accountId}.r2.cloudflarestorage.com/${bucket}/${key}`;
  const body = new Uint8Array(await file.arrayBuffer());

  const res = await client.fetch(endpoint, {
    method: "PUT",
    body,
    headers: { "content-type": file.type || "application/octet-stream" },
  });
  if (!res.ok) {
    throw new Error(`R2 업로드 실패 (HTTP ${res.status})`);
  }

  return `${publicBase}/${key}`;
}
