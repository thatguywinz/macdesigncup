// The portal's storage contract. Two drivers implement it: Vercel Blob (a
// private store, for the deployed site) and the local filesystem (dev and
// tests). Everything is a keyed object; JSON documents get compare-and-swap
// through ETags so two judges saving at once never lose a write.

export interface StoredDoc<T> {
  value: T;
  etag: string;
}

export interface ObjectInfo {
  size: number;
  contentType: string | null;
}

/**
 * How the browser uploads one file. `local`: a plain PUT to a signed URL on
 * this server. `blob`: the Vercel Blob client SDK's presigned upload, which
 * asks `handleUploadUrl` for its payload.
 */
export type UploadTicket =
  | { mode: "local"; url: string; pathname: string }
  | { mode: "blob"; pathname: string; handleUploadUrl: string; clientPayload: string };

export class PreconditionFailed extends Error {}

export interface Storage {
  readonly kind: "blob" | "local";
  /** Reads a JSON document, bypassing caches. Null when it does not exist. */
  getDoc<T>(path: string): Promise<StoredDoc<T> | null>;
  /**
   * Writes a JSON document only if it still has `etag` (or, with null, only if
   * it does not exist yet). Throws PreconditionFailed when someone else wrote first.
   */
  putDoc<T>(path: string, value: T, etag: string | null): Promise<string>;
  head(path: string): Promise<ObjectInfo | null>;
  /** The first `n` bytes of an object (for checking what a file really is). */
  readHead(path: string, n: number): Promise<Uint8Array | null>;
  delete(paths: string[]): Promise<void>;
  /** A short-lived URL the browser can GET the object from. */
  signedGetUrl(path: string, ttlSeconds: number): Promise<string>;
  /** Permission for the browser to upload exactly one object to `path`. */
  uploadTicket(path: string, opts: { maxBytes: number; contentType: string; ttlSeconds: number; clientPayload: string }): Promise<UploadTicket>;
}
