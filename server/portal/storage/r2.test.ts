// R2Storage against a tiny in-process S3-style server: object GET/PUT/HEAD/
// DELETE with ETags, If-Match / If-None-Match and Range, and a check that
// every request is SigV4-signed (header or presigned query).
import http from "node:http";
import crypto from "node:crypto";
import type { AddressInfo } from "node:net";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { R2Storage } from "./r2.js";
import { PreconditionFailed } from "./types.js";
import { Db } from "../db.js";

const objects = new Map<string, { body: Buffer; type: string; etag: string }>();
let unsigned = 0;
let server: http.Server;
let endpoint = "";

beforeAll(async () => {
  server = http.createServer(async (req, res) => {
    const url = new URL(req.url!, "http://x");
    const signed = !!req.headers.authorization?.startsWith("AWS4-HMAC-SHA256") || url.searchParams.has("X-Amz-Signature");
    if (!signed) unsigned++;
    const key = decodeURIComponent(url.pathname.replace(/^\/bucket\//, ""));
    const chunks: Buffer[] = [];
    for await (const c of req) chunks.push(c as Buffer);
    const obj = objects.get(key);
    if (req.method === "PUT") {
      const im = req.headers["if-match"];
      const inm = req.headers["if-none-match"];
      if ((im && (!obj || obj.etag !== im)) || (inm === "*" && obj)) return res.writeHead(412).end("PreconditionFailed");
      const body = Buffer.concat(chunks);
      const etag = `"${crypto.createHash("md5").update(body).digest("hex")}"`;
      objects.set(key, { body, type: String(req.headers["content-type"] ?? "application/octet-stream"), etag });
      return res.writeHead(200, { etag }).end();
    }
    if (req.method === "DELETE") {
      objects.delete(key);
      return res.writeHead(204).end();
    }
    if (!obj) return res.writeHead(404).end("NoSuchKey");
    if (req.method === "HEAD") return res.writeHead(200, { etag: obj.etag, "content-length": obj.body.length, "content-type": obj.type }).end();
    const range = /bytes=0-(\d+)/.exec(String(req.headers.range ?? ""));
    const body = range ? obj.body.subarray(0, Number(range[1]) + 1) : obj.body;
    res.writeHead(range ? 206 : 200, { etag: obj.etag, "content-length": body.length, "content-type": obj.type }).end(body);
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", () => r()));
  endpoint = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
afterAll(() => server?.close());

const store = () => new R2Storage({ accountId: "acc", accessKeyId: "AKID", secretAccessKey: "secret", bucket: "bucket", endpoint });

describe("R2Storage", () => {
  it("reads and writes JSON documents with compare-and-swap", async () => {
    const s = store();
    expect(await s.getDoc("portal/settings.json")).toBeNull();
    const e1 = await s.putDoc("portal/settings.json", { a: 1 }, null);
    await expect(s.putDoc("portal/settings.json", { a: 2 }, null)).rejects.toBeInstanceOf(PreconditionFailed);
    const doc = await s.getDoc<{ a: number }>("portal/settings.json");
    expect(doc).toEqual({ value: { a: 1 }, etag: e1 });
    const e2 = await s.putDoc("portal/settings.json", { a: 2 }, e1);
    expect(e2).not.toBe(e1);
    await expect(s.putDoc("portal/settings.json", { a: 3 }, e1)).rejects.toBeInstanceOf(PreconditionFailed);
    expect(unsigned).toBe(0);
  });

  it("drives the sharded Db with many writers and loses nothing", async () => {
    const db = () => new Db(store(), 0);
    await Promise.all(Array.from({ length: 30 }, (_, i) => db().mutate("entries", (d) => void (d.entries[`t${i}abc`] = { id: `t${i}abc` } as never))));
    expect(Object.keys((await db().read("entries", { fresh: true })).entries)).toHaveLength(30);
  });

  it("heads, reads the first bytes, reads all with a cap, and deletes", async () => {
    const s = store();
    objects.set("portal/files/x/a.stl", { body: Buffer.from("solid hello"), type: "model/stl", etag: '"1"' });
    expect(await s.head("portal/files/x/a.stl")).toEqual({ size: 11, contentType: "model/stl" });
    expect(Buffer.from((await s.readHead("portal/files/x/a.stl", 5))!).toString()).toBe("solid");
    expect(await s.readAll("portal/files/x/a.stl", 5)).toBeNull();
    expect(Buffer.from((await s.readAll("portal/files/x/a.stl", 100))!).toString()).toBe("solid hello");
    await s.delete(["portal/files/x/a.stl", "portal/files/x/missing.stl"]);
    expect(await s.head("portal/files/x/a.stl")).toBeNull();
  });

  it("hands the browser presigned PUT and GET URLs that work without other credentials", async () => {
    const s = store();
    const t = await s.uploadTicket("portal/files/y/b.png", { maxBytes: 100, contentType: "image/png", ttlSeconds: 600, clientPayload: "" });
    expect(t.mode).toBe("s3");
    if (t.mode !== "s3") return;
    expect(t.url).toMatch(/X-Amz-Signature=/);
    expect(t.url).toMatch(/X-Amz-Expires=600/);
    const put = await fetch(t.url, { method: "PUT", headers: { "content-type": t.contentType }, body: "png!" });
    expect(put.status).toBe(200);
    const get = await fetch(await s.signedGetUrl("portal/files/y/b.png", 300));
    expect(await get.text()).toBe("png!");
    expect(unsigned).toBe(0);
  });
});
