// Sets up and checks the Cloudflare R2 bucket the portal stores into.
//
//   R2_ACCOUNT_ID=… R2_ACCESS_KEY_ID=… R2_SECRET_ACCESS_KEY=… R2_BUCKET=… node scripts/portal/r2-setup.mjs
//
// 1. CORS: lets the site's pages PUT uploads and GET files straight from the
//    bucket (presigned URLs only; the bucket stays private).
// 2. Checks, against the real bucket: conditional writes (If-None-Match /
//    If-Match, which the portal's compare-and-swap relies on), a presigned
//    PUT and GET from the site's origin (CORS), range reads and deletes.
// Everything it writes is under r2-check/ and deleted at the end.
import { AwsClient } from "aws4fetch";

const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET } = process.env;
if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET) {
  console.error("Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY and R2_BUCKET.");
  process.exit(1);
}
const ORIGINS = (process.env.R2_ORIGINS ?? "https://www.macdesigncup.ca,https://macdesigncup.ca,http://localhost:8080").split(",");
const aws = new AwsClient({ accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY, service: "s3", region: "auto" });
const base = `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${R2_BUCKET}`;
let ok = true;
const check = (name, pass, extra = "") => {
  console.log(`${pass ? "PASS" : "FAIL"}  ${name}${extra ? `  (${extra})` : ""}`);
  if (!pass) ok = false;
};

// 1. CORS
const cors = `<?xml version="1.0" encoding="UTF-8"?>
<CORSConfiguration>
  <CORSRule>
${ORIGINS.map((o) => `    <AllowedOrigin>${o}</AllowedOrigin>`).join("\n")}
    <AllowedMethod>GET</AllowedMethod>
    <AllowedMethod>PUT</AllowedMethod>
    <AllowedMethod>HEAD</AllowedMethod>
    <AllowedHeader>content-type</AllowedHeader>
    <AllowedHeader>range</AllowedHeader>
    <ExposeHeader>ETag</ExposeHeader>
    <ExposeHeader>Content-Length</ExposeHeader>
    <ExposeHeader>Content-Range</ExposeHeader>
    <MaxAgeSeconds>3600</MaxAgeSeconds>
  </CORSRule>
</CORSConfiguration>`;
const md5 = (await import("node:crypto")).createHash("md5").update(cors).digest("base64");
const corsRes = await aws.fetch(`${base}?cors`, { method: "PUT", headers: { "content-type": "application/xml", "content-md5": md5 }, body: cors });
check("bucket CORS set", corsRes.ok, `${corsRes.status} ${corsRes.ok ? "" : (await corsRes.text()).slice(0, 200)}`);

// 2. Conditional writes
const k = `r2-check/doc-${Date.now()}.json`;
const p1 = await aws.fetch(`${base}/${k}`, { method: "PUT", headers: { "content-type": "application/json", "if-none-match": "*" }, body: "{}" });
const etag = p1.headers.get("etag");
check("create with If-None-Match: *", p1.ok && !!etag, `${p1.status} etag=${etag}`);
const p2 = await aws.fetch(`${base}/${k}`, { method: "PUT", headers: { "content-type": "application/json", "if-none-match": "*" }, body: "{}" });
check("second create refused (412)", p2.status === 412, String(p2.status));
const p3 = await aws.fetch(`${base}/${k}`, { method: "PUT", headers: { "content-type": "application/json", "if-match": etag }, body: '{"a":1}' });
check("update with the right ETag", p3.ok, String(p3.status));
const p4 = await aws.fetch(`${base}/${k}`, { method: "PUT", headers: { "content-type": "application/json", "if-match": etag }, body: '{"a":2}' });
check("update with a stale ETag refused (412)", p4.status === 412, String(p4.status));
const g = await aws.fetch(`${base}/${k}`);
check("read back the winning write", (await g.text()) === '{"a":1}');

// 3. Presigned PUT/GET from the site's origin (CORS), range read
const fk = `r2-check/file-${Date.now()}.png`;
const sign = async (method, key, ttl = 600) => {
  const u = new URL(`${base}/${key}`);
  u.searchParams.set("X-Amz-Expires", String(ttl));
  return (await aws.sign(u.toString(), { method, aws: { signQuery: true } })).url;
};
const putUrl = await sign("PUT", fk);
const pre = await fetch(putUrl, { method: "OPTIONS", headers: { Origin: ORIGINS[0], "Access-Control-Request-Method": "PUT", "Access-Control-Request-Headers": "content-type" } });
check("CORS preflight for an upload from the site", pre.ok && (pre.headers.get("access-control-allow-origin") ?? "").length > 0, `${pre.status} allow-origin=${pre.headers.get("access-control-allow-origin")}`);
const up = await fetch(putUrl, { method: "PUT", headers: { "content-type": "image/png", Origin: ORIGINS[0] }, body: Buffer.alloc(300_000, 7) });
check("presigned PUT (300 KB)", up.ok, String(up.status));
const getUrl = await sign("GET", fk);
const down = await fetch(getUrl, { headers: { Origin: ORIGINS[0] } });
const buf = Buffer.from(await down.arrayBuffer());
check("presigned GET returns the file", down.ok && buf.length === 300_000, `${down.status} ${buf.length} B allow-origin=${down.headers.get("access-control-allow-origin")}`);
const r = await aws.fetch(`${base}/${fk}`, { headers: { range: "bytes=0-15" } });
check("range read of the first 16 bytes", (await r.arrayBuffer()).byteLength === 16, String(r.status));
const h = await aws.fetch(`${base}/${fk}`, { method: "HEAD" });
check("head reports size and type", h.headers.get("content-length") === "300000" && h.headers.get("content-type") === "image/png", `${h.headers.get("content-length")} ${h.headers.get("content-type")}`);

// Clean up
for (const key of [k, fk]) await aws.fetch(`${base}/${key}`, { method: "DELETE" });
const gone = await aws.fetch(`${base}/${k}`, { method: "HEAD" });
check("cleanup", gone.status === 404, String(gone.status));
console.log(ok ? "\nR2 is ready for the portal." : "\nSomething above failed: fix it before switching the portal to R2.");
process.exit(ok ? 0 : 1);
