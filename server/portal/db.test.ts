import { describe, expect, it } from "vitest";
import { DOCS, Db, ENTRY_SHARDS, NO_CHANGE, namespace, shardOf } from "./db.js";
import { PreconditionFailed, type Storage } from "./storage/types.js";

/** An in-memory store with Blob-like delays and ETag compare-and-swap. */
function memStore(delay = () => 2 + Math.random() * 8) {
  const files = new Map<string, { v: unknown; e: number }>();
  let seq = 0;
  let puts = 0;
  const sleep = () => new Promise((r) => setTimeout(r, delay()));
  const store = {
    kind: "blob",
    files,
    get puts() {
      return puts;
    },
    async getDoc(p: string) {
      await sleep();
      const f = files.get(p);
      return f ? { value: structuredClone(f.v), etag: String(f.e) } : null;
    },
    async putDoc(p: string, v: unknown, etag: string | null) {
      await sleep();
      const f = files.get(p);
      if ((etag ?? "none") !== (f ? String(f.e) : "none")) throw new PreconditionFailed(p);
      puts++;
      files.set(p, { v: structuredClone(v), e: ++seq });
      return String(seq);
    },
  };
  return store as unknown as Storage & { files: typeof files; puts: number };
}

const entry = (id: string, n = 0) => ({ id, n }) as never;

describe("Db entries shards", () => {
  it("keeps every write when many teams save at once (no lost updates)", async () => {
    const store = memStore();
    const ids = Array.from({ length: 60 }, (_, i) => `team${i}xyz`);
    await Promise.all(
      ids.map(async (id) => {
        const db = new Db(store, 0); // every team on its own server instance
        await db.mutate("entries", (d) => void (d.entries[id] = entry(id)));
        for (let k = 0; k < 4; k++) await db.mutate("entries", (d) => void ((d.entries[id] as unknown as { n: number }).n += 1));
      }),
    );
    const all = await new Db(store, 0).read("entries", { fresh: true });
    expect(Object.keys(all.entries)).toHaveLength(60);
    for (const id of ids) expect((all.entries[id] as unknown as { n: number }).n).toBe(4);
    // Spread over the shard files, and nothing went to the old single file.
    expect(store.files.has(namespace() + DOCS.entries)).toBe(false);
    expect(new Set(ids.map(shardOf)).size).toBeGreaterThan(1);
  });

  it("only writes the shard that changed, and skips no-op writes", async () => {
    const store = memStore();
    const db = new Db(store, 0);
    await db.mutate("entries", (d) => void (d.entries.aaa = entry("aaa")));
    const before = store.puts;
    await db.mutate("entries", (d) => void ((d.entries.aaa as unknown as { n: number }).n = 1));
    expect(store.puts - before).toBe(1);
    await db.mutate("entries", () => NO_CHANGE);
    await db.mutate("entries", () => "unchanged");
    expect(store.puts - before).toBe(1);
    expect(ENTRY_SHARDS).toBeGreaterThan(1);
  });

  it("still reads, edits and deletes entries kept in the old single file", async () => {
    const store = memStore();
    await store.putDoc(namespace() + DOCS.entries, { v: 1, entries: { old1: entry("old1"), old2: entry("old2") } }, null);
    const db = new Db(store, 0);
    expect(Object.keys((await db.read("entries", { fresh: true })).entries).sort()).toEqual(["old1", "old2"]);
    await db.mutate("entries", (d) => {
      (d.entries.old1 as unknown as { n: number }).n = 7;
      delete d.entries.old2;
      d.entries.new1 = entry("new1");
    });
    const legacy = store.files.get(namespace() + DOCS.entries)!.v as { entries: Record<string, { n: number }> };
    expect(Object.keys(legacy.entries)).toEqual(["old1"]);
    expect(legacy.entries.old1.n).toBe(7);
    const all = await db.read("entries", { fresh: true });
    expect(Object.keys(all.entries).sort()).toEqual(["new1", "old1"]);
  });

  it("gives up with a clear 503 'busy' after its time budget, never a lost write", async () => {
    const store = memStore();
    const db = new Db(store, 0, 50);
    // A store where every write conflicts.
    (store as unknown as { putDoc: () => Promise<never> }).putDoc = async () => {
      throw new PreconditionFailed("x");
    };
    await expect(db.mutate("settings", (s) => void (s.closed = true))).rejects.toMatchObject({ status: 503 });
  });
});
