// Filesystem storage for local development and tests. Objects live under
// one root folder (default .data/portal, git-ignored). Upload and download
// URLs point back at this server and carry signed tickets, so the browser
// flow is the same shape as production's.
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { signTicket } from "../tickets.js";
import { PreconditionFailed, type ObjectInfo, type Storage, type StoredDoc, type UploadTicket } from "./types.js";

const etagOf = (buf: Buffer | string) => createHash("sha1").update(buf).digest("hex");

export class LocalStorage implements Storage {
  readonly kind = "local" as const;
  /** Serializes document writes inside this process (dev runs one). */
  private chain: Promise<unknown> = Promise.resolve();

  constructor(
    readonly root: string,
    private readonly secret: string,
    private readonly apiBase = "/api/portal",
  ) {}

  /** Absolute path for a key; refuses anything that escapes the root. */
  resolve(key: string): string {
    if (!key || key.includes("\0") || key.startsWith("/") || key.split("/").some((s) => s === ".." || s === "")) {
      throw new Error(`bad storage key: ${key}`);
    }
    const full = path.resolve(this.root, key);
    if (!full.startsWith(path.resolve(this.root) + path.sep)) throw new Error(`bad storage key: ${key}`);
    return full;
  }

  async getDoc<T>(key: string): Promise<StoredDoc<T> | null> {
    try {
      const raw = await fs.readFile(this.resolve(key));
      return { value: JSON.parse(raw.toString("utf8")) as T, etag: etagOf(raw) };
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === "ENOENT") return null;
      throw e;
    }
  }

  putDoc<T>(key: string, value: T, etag: string | null): Promise<string> {
    const run = async () => {
      const file = this.resolve(key);
      let current: string | null = null;
      try {
        current = etagOf(await fs.readFile(file));
      } catch (e) {
        if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
      }
      if (current !== etag) throw new PreconditionFailed(key);
      const body = JSON.stringify(value);
      await fs.mkdir(path.dirname(file), { recursive: true });
      const tmp = `${file}.${process.pid}.${Date.now()}.tmp`;
      await fs.writeFile(tmp, body);
      // Windows refuses to rename over a file another request has open for
      // reading (EPERM / EBUSY); that lasts milliseconds, so retry briefly.
      for (let attempt = 0; ; attempt++) {
        try {
          await fs.rename(tmp, file);
          break;
        } catch (e) {
          const code = (e as NodeJS.ErrnoException).code;
          if ((code !== "EPERM" && code !== "EBUSY" && code !== "EACCES") || attempt >= 40) {
            await fs.rm(tmp, { force: true });
            throw e;
          }
          await new Promise((r) => setTimeout(r, 10 + attempt * 5));
        }
      }
      return etagOf(body);
    };
    const next = this.chain.then(run, run);
    this.chain = next.catch(() => {});
    return next;
  }

  async head(key: string): Promise<ObjectInfo | null> {
    try {
      const st = await fs.stat(this.resolve(key));
      return st.isFile() ? { size: st.size, contentType: null } : null;
    } catch {
      return null;
    }
  }

  async readHead(key: string, n: number): Promise<Uint8Array | null> {
    let fh: fs.FileHandle | undefined;
    try {
      fh = await fs.open(this.resolve(key), "r");
      const buf = Buffer.alloc(n);
      const { bytesRead } = await fh.read(buf, 0, n, 0);
      return new Uint8Array(buf.subarray(0, bytesRead));
    } catch {
      return null;
    } finally {
      await fh?.close();
    }
  }

  async delete(keys: string[]): Promise<void> {
    await Promise.all(keys.map((k) => fs.rm(this.resolve(k), { force: true })));
  }

  async signedGetUrl(key: string, ttlSeconds: number): Promise<string> {
    const t = signTicket(this.secret, { kind: "get", p: key, exp: Date.now() + ttlSeconds * 1000 });
    return `${this.apiBase}/local-file?t=${encodeURIComponent(t)}`;
  }

  async uploadTicket(key: string, opts: { maxBytes: number; contentType: string; ttlSeconds: number }): Promise<UploadTicket> {
    const t = signTicket(this.secret, {
      kind: "put",
      p: key,
      max: opts.maxBytes,
      ct: opts.contentType,
      exp: Date.now() + opts.ttlSeconds * 1000,
    });
    return { mode: "local", url: `${this.apiBase}/local-upload?t=${encodeURIComponent(t)}`, pathname: key };
  }

  /** Writes an uploaded object (the local-upload route streams into this). */
  async writeObject(key: string, chunks: AsyncIterable<Buffer>, maxBytes: number): Promise<number> {
    const file = this.resolve(key);
    await fs.mkdir(path.dirname(file), { recursive: true });
    // Objects are write-once, like production's allowOverwrite: false.
    const handle = await fs.open(file, "wx").catch((e: NodeJS.ErrnoException) => {
      if (e.code === "EEXIST") throw new PreconditionFailed(key);
      throw e;
    });
    let size = 0;
    try {
      for await (const chunk of chunks) {
        size += chunk.length;
        if (size > maxBytes) throw new RangeError("too large");
        await handle.write(chunk);
      }
    } catch (e) {
      await handle.close();
      await fs.rm(file, { force: true });
      throw e;
    }
    await handle.close();
    return size;
  }
}
