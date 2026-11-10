// Vercel Blob storage (a PRIVATE store) for the deployed portal. Nothing in
// the store is public: the browser only ever sees presigned URLs that name
// one object and expire in minutes.
//
// Uploads go browser -> Blob directly (no 4.5 MB function body limit). The
// browser runs the SDK's `uploadPresigned`, which POSTs to our
// /api/portal/blob-upload route; that route checks our signed ticket and
// answers with a presigned PUT payload for exactly the pathname and size the
// ticket allows (see presignPutPayload below).
import { BlobNotFoundError, BlobPreconditionFailedError, del, get, head, issueSignedToken, presignUrl, put } from "@vercel/blob";
import { PreconditionFailed, type ObjectInfo, type Storage, type StoredDoc, type UploadTicket } from "./types.js";

type Delegation = Awaited<ReturnType<typeof issueSignedToken>>;

/** Presigned URL payload, in the shape the SDK's uploadPresigned expects. */
export interface PresignedUrlPayload {
  delegationToken: string;
  signature: string;
  params: Record<string, string>;
}

async function streamToBuffer(stream: ReadableStream<Uint8Array>, limit = Infinity): Promise<Buffer> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (size < limit) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      size += value.length;
    }
  } finally {
    if (size >= limit) await reader.cancel().catch(() => {});
    else reader.releaseLock();
  }
  const buf = Buffer.concat(chunks);
  return Number.isFinite(limit) ? buf.subarray(0, limit) : buf;
}

export class BlobStorage implements Storage {
  readonly kind = "blob" as const;
  private delegation: Delegation | null = null;
  private delegationPending: Promise<Delegation> | null = null;

  constructor(private readonly apiBase = "/api/portal") {}

  /** One store-wide delegation (get + put), reused until 20 minutes before it expires. */
  private async signer(): Promise<Delegation> {
    if (this.delegation && this.delegation.validUntil - Date.now() > 20 * 60 * 1000) return this.delegation;
    if (!this.delegationPending) {
      this.delegationPending = issueSignedToken({ operations: ["get", "put"], validUntil: Date.now() + 2 * 60 * 60 * 1000 })
        .then((d) => (this.delegation = d))
        .finally(() => (this.delegationPending = null));
    }
    return this.delegationPending;
  }

  async getDoc<T>(path: string): Promise<StoredDoc<T> | null> {
    const res = await get(path, { access: "private", useCache: false });
    if (!res || res.statusCode !== 200) return null;
    const raw = await streamToBuffer(res.stream);
    return { value: JSON.parse(raw.toString("utf8")) as T, etag: res.blob.etag };
  }

  async putDoc<T>(path: string, value: T, etag: string | null): Promise<string> {
    try {
      const res = await put(path, JSON.stringify(value), {
        access: "private",
        contentType: "application/json",
        addRandomSuffix: false,
        allowOverwrite: etag !== null,
        ...(etag ? { ifMatch: etag } : {}),
        cacheControlMaxAge: 60,
      });
      return res.etag;
    } catch (e) {
      // ETag mismatch, or "already exists" when we expected to create it.
      if (e instanceof BlobPreconditionFailedError || /already exists/i.test(String((e as Error)?.message))) {
        throw new PreconditionFailed(path);
      }
      throw e;
    }
  }

  async head(path: string): Promise<ObjectInfo | null> {
    try {
      const h = await head(path);
      return { size: h.size, contentType: h.contentType ?? null };
    } catch (e) {
      if (e instanceof BlobNotFoundError) return null;
      throw e;
    }
  }

  async readHead(path: string, n: number): Promise<Uint8Array | null> {
    const res = await get(path, { access: "private", useCache: false, headers: { Range: `bytes=0-${n - 1}` } });
    if (!res || res.statusCode !== 200) return null;
    return new Uint8Array(await streamToBuffer(res.stream, n));
  }

  async readAll(path: string, max: number): Promise<Uint8Array | null> {
    const res = await get(path, { access: "private", useCache: false });
    if (!res || res.statusCode !== 200 || (res.blob.size ?? 0) > max) return null;
    return new Uint8Array(await streamToBuffer(res.stream));
  }

  async delete(paths: string[]): Promise<void> {
    if (paths.length) await del(paths);
  }

  async signedGetUrl(path: string, ttlSeconds: number): Promise<string> {
    const { presignedUrl } = await presignUrl(await this.signer(), {
      operation: "get",
      pathname: path,
      access: "private",
      validUntil: Date.now() + ttlSeconds * 1000,
    });
    return presignedUrl;
  }

  async uploadTicket(path: string, opts: { clientPayload: string }): Promise<UploadTicket> {
    return { mode: "blob", pathname: path, handleUploadUrl: `${this.apiBase}/blob-upload`, clientPayload: opts.clientPayload };
  }

  /**
   * A presigned PUT for one pathname, as the payload object the SDK's
   * uploadPresigned wants: the delegation token, the signature and the
   * signed vercel-blob-* parameters, read back out of the presigned URL.
   */
  async presignPutPayload(path: string, maxBytes: number, ttlSeconds: number, contentType: string): Promise<PresignedUrlPayload> {
    const { presignedUrl } = await presignUrl(await this.signer(), {
      operation: "put",
      pathname: path,
      access: "private",
      maximumSizeInBytes: maxBytes,
      // The uploader can't pick how the file is served (e.g. text/html).
      allowedContentTypes: [contentType],
      allowOverwrite: false,
      addRandomSuffix: false,
      validUntil: Date.now() + ttlSeconds * 1000,
    });
    const url = new URL(presignedUrl);
    const delegationToken = url.searchParams.get("vercel-blob-delegation");
    const signature = url.searchParams.get("vercel-blob-signature");
    if (!delegationToken || !signature) throw new Error("presigned URL is missing its signature");
    const params: Record<string, string> = {};
    for (const [k, v] of url.searchParams) {
      if (k !== "pathname" && k !== "vercel-blob-delegation" && k !== "vercel-blob-signature") params[k] = v;
    }
    return { delegationToken, signature, params };
  }
}
