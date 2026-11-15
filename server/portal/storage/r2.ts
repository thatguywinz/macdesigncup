// Cloudflare R2 storage (S3-compatible API, a PRIVATE bucket) for the
// deployed portal. Chosen over Vercel Blob for the event because the free
// tier allows 1,000,000 writes and 10,000,000 reads a month (Vercel Blob
// Hobby: 2,000 / 10,000, and going over locks the store for 30 days), with
// no download fees.
//
// Nothing in the bucket is public: the browser only gets presigned URLs that
// name one object and expire in minutes. Uploads go browser -> R2 directly
// with a presigned PUT (no function body limit); the bucket's CORS rules
// allow PUT/GET from the site's origin. JSON documents get compare-and-swap
// through If-Match / If-None-Match on PUT.
//
//   R2_ACCOUNT_ID         Cloudflare account id (the endpoint's subdomain)
//   R2_ACCESS_KEY_ID      an R2 API token's access key (Object Read & Write)
//   R2_SECRET_ACCESS_KEY  its secret
//   R2_BUCKET             the bucket name
import { AwsClient } from "aws4fetch";
import { PreconditionFailed, type ObjectInfo, type Storage, type StoredDoc, type UploadTicket } from "./types.js";

export interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  /** Override the endpoint (tests, or a jurisdiction endpoint). */
  endpoint?: string;
}

export function r2ConfigFromEnv(env = process.env): R2Config | null {
  const accountId = env.R2_ACCOUNT_ID?.trim();
  const accessKeyId = env.R2_ACCESS_KEY_ID?.trim();
  const secretAccessKey = env.R2_SECRET_ACCESS_KEY?.trim();
  const bucket = env.R2_BUCKET?.trim();
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) return null;
  return { accountId, accessKeyId, secretAccessKey, bucket, endpoint: env.R2_ENDPOINT?.trim() || undefined };
}

/** Object keys are our own ids and extensions; encode each segment anyway. */
const encodeKey = (key: string) => key.split("/").map(encodeURIComponent).join("/");

export class R2Storage implements Storage {
  readonly kind = "r2" as const;
  private readonly client: AwsClient;
  private readonly base: string;

  constructor(cfg: R2Config) {
    this.client = new AwsClient({ accessKeyId: cfg.accessKeyId, secretAccessKey: cfg.secretAccessKey, service: "s3", region: "auto" });
    const endpoint = (cfg.endpoint ?? `https://${cfg.accountId}.r2.cloudflarestorage.com`).replace(/\/$/, "");
    this.base = `${endpoint}/${encodeURIComponent(cfg.bucket)}`;
  }

  private url(key: string) {
    return `${this.base}/${encodeKey(key)}`;
  }

  private async call(key: string, init: RequestInit & { headers?: Record<string, string> } = {}): Promise<Response> {
    // A couple of quick retries for network blips and R2's occasional 5xx.
    for (let attempt = 0; ; attempt++) {
      try {
        const res = await this.client.fetch(this.url(key), init);
        if (res.status >= 500 && attempt < 2) {
          await res.body?.cancel().catch(() => {});
          await new Promise((r) => setTimeout(r, 150 * (attempt + 1)));
          continue;
        }
        return res;
      } catch (e) {
        if (attempt >= 2) throw e;
        await new Promise((r) => setTimeout(r, 150 * (attempt + 1)));
      }
    }
  }

  private async fail(res: Response, what: string): Promise<never> {
    const text = await res.text().catch(() => "");
    throw new Error(`R2 ${what} failed: ${res.status} ${text.slice(0, 200)}`);
  }

  async getDoc<T>(path: string): Promise<StoredDoc<T> | null> {
    const res = await this.call(path, { method: "GET", headers: { "cache-control": "no-cache" } });
    if (res.status === 404) {
      await res.body?.cancel().catch(() => {});
      return null;
    }
    if (!res.ok) return this.fail(res, `GET ${path}`);
    const etag = res.headers.get("etag") ?? "";
    const value = (await res.json()) as T;
    return { value, etag };
  }

  async putDoc<T>(path: string, value: T, etag: string | null): Promise<string> {
    const headers: Record<string, string> = { "content-type": "application/json" };
    if (etag) headers["if-match"] = etag;
    else headers["if-none-match"] = "*";
    const res = await this.call(path, { method: "PUT", headers, body: JSON.stringify(value) });
    if (res.status === 412 || res.status === 409) {
      await res.body?.cancel().catch(() => {});
      throw new PreconditionFailed(path);
    }
    if (!res.ok) return this.fail(res, `PUT ${path}`);
    await res.body?.cancel().catch(() => {});
    const out = res.headers.get("etag");
    if (out) return out;
    // Some S3-compatible stores omit the ETag on PUT: read it back.
    const h = await this.call(path, { method: "HEAD" });
    return h.headers.get("etag") ?? "";
  }

  async head(path: string): Promise<ObjectInfo | null> {
    const res = await this.call(path, { method: "HEAD" });
    if (res.status === 404) return null;
    if (!res.ok) return this.fail(res, `HEAD ${path}`);
    return { size: Number(res.headers.get("content-length") ?? 0), contentType: res.headers.get("content-type") };
  }

  async readHead(path: string, n: number): Promise<Uint8Array | null> {
    const res = await this.call(path, { method: "GET", headers: { range: `bytes=0-${n - 1}` } });
    if (res.status === 404 || res.status === 416) {
      await res.body?.cancel().catch(() => {});
      return null;
    }
    if (!res.ok) return this.fail(res, `GET range ${path}`);
    return new Uint8Array(await res.arrayBuffer()).subarray(0, n);
  }

  async readAll(path: string, max: number): Promise<Uint8Array | null> {
    const res = await this.call(path, { method: "GET" });
    if (res.status === 404) {
      await res.body?.cancel().catch(() => {});
      return null;
    }
    if (!res.ok) return this.fail(res, `GET ${path}`);
    if (Number(res.headers.get("content-length") ?? 0) > max) {
      await res.body?.cancel().catch(() => {});
      return null;
    }
    return new Uint8Array(await res.arrayBuffer());
  }

  async delete(paths: string[]): Promise<void> {
    await Promise.all(
      paths.map(async (p) => {
        const res = await this.call(p, { method: "DELETE" });
        await res.body?.cancel().catch(() => {});
        if (!res.ok && res.status !== 404) throw new Error(`R2 DELETE ${p} failed: ${res.status}`);
      }),
    );
  }

  private async presign(key: string, method: "GET" | "PUT", ttlSeconds: number): Promise<string> {
    const url = new URL(this.url(key));
    url.searchParams.set("X-Amz-Expires", String(Math.max(60, Math.min(7 * 24 * 3600, Math.round(ttlSeconds)))));
    const signed = await this.client.sign(url.toString(), { method, aws: { signQuery: true } });
    return signed.url;
  }

  async signedGetUrl(path: string, ttlSeconds: number): Promise<string> {
    return this.presign(path, "GET", ttlSeconds);
  }

  async uploadTicket(path: string, opts: { maxBytes: number; contentType: string; ttlSeconds: number; clientPayload: string }): Promise<UploadTicket> {
    // The size and type are checked again when the upload completes (the
    // complete route deletes a file that is too big or the wrong type).
    return { mode: "s3", url: await this.presign(path, "PUT", opts.ttlSeconds), pathname: path, contentType: opts.contentType };
  }
}
