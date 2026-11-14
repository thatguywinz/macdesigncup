// @vitest-environment node
// End-to-end tests for the portal API against local storage in a temp
// folder: a real HTTP server, real uploads, the same calls the browser makes.
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import type { AddressInfo } from "node:net";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createContext } from "./handler";
import { resetRateLimits } from "./http";
import { dispatch, type PortalContext } from "./routes";

let server: http.Server;
let base = "";
let dir = "";
let clock = Date.parse("2026-11-16T12:00:00-05:00");
let ctx: PortalContext;

/** A binary STL: one triangle. */
function tinyStl(): Buffer {
  const b = Buffer.alloc(84 + 50);
  b.write("tiny", 0);
  b.writeUInt32LE(1, 80);
  const v = [0, 0, 1, 0, 0, 0, 10, 0, 0, 0, 10, 0];
  v.forEach((x, i) => b.writeFloatLE(x, 84 + i * 4));
  return b;
}

const PNG = Buffer.from("89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d4944415478da63f8ffff3f0005fe02fea7d6a4a50000000049454e44ae426082", "hex");

const entry = (over: Record<string, unknown> = {}) => ({
  title: "Tidal Lamp",
  teamName: "Team Tide",
  members: [
    { name: "Avery Lin", school: "William Lyon Mackenzie CI", grade: "11" },
    { name: "Sam Okafor", school: "William Lyon Mackenzie CI", grade: "10" },
  ],
  contactEmail: "avery@example.com",
  software: ["Fusion 360"],
  softwareOther: "",
  summary: "A lamp whose shade folds like a wave, answering the theme with motion.",
  process: "",
  aiUse: "none",
  aiNote: "",
  credit: "names",
  shareable: true,
  original: true,
  upAxis: "z",
  videoLink: "https://youtu.be/abcdefghijk",
  ...over,
});

interface Opts {
  method?: string;
  body?: unknown;
  key?: string;
  cookie?: string;
  headers?: Record<string, string>;
  raw?: Buffer;
}

async function call(p: string, o: Opts = {}) {
  const method = o.method ?? (o.body !== undefined || o.raw ? "POST" : "GET");
  const headers: Record<string, string> = { ...(method !== "GET" ? { "X-Portal": "1" } : {}), ...(o.headers ?? {}) };
  if (o.body !== undefined) headers["Content-Type"] = "application/json";
  if (o.key) headers["X-Edit-Key"] = o.key;
  if (o.cookie) headers.Cookie = o.cookie;
  const res = await fetch(`${base}${p.startsWith("/api") ? p : `/api/portal${p}`}`, {
    method,
    headers,
    body: o.raw ?? (o.body === undefined ? undefined : JSON.stringify(o.body)),
  });
  const text = await res.text();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test responses are read loosely
  let json: Record<string, any> = {};
  try {
    json = JSON.parse(text);
  } catch {
    /* csv or file */
  }
  return { status: res.status, json, text, headers: res.headers };
}

async function create(over: Record<string, unknown> = {}) {
  const r = await call("/entries", { body: { code: "mdc-demo", entry: entry(over) } });
  expect(r.status).toBe(201);
  return { id: r.json.id as string, key: r.json.editKey as string };
}

async function upload(id: string, key: string, slot: string, name: string, bytes: Buffer) {
  const s = await call(`/entries/${id}/files`, { body: { slot, name, size: bytes.length }, key });
  if (s.status !== 200) return s;
  const url = new URL(s.json.ticket.url, base);
  const put = await fetch(url, { method: "PUT", body: bytes, headers: { "X-Portal": "1" } });
  expect(put.status).toBe(200);
  return call(`/entries/${id}/files/${s.json.fileId}/complete`, { body: {}, key });
}

async function login(passcode: string, name = "Judge Rivera") {
  const r = await call("/judge/login", { body: { name, passcode } });
  const cookie = (r.headers.get("set-cookie") ?? "").split(";")[0];
  return { ...r, cookie };
}

beforeAll(async () => {
  process.env.PORTAL_SKIP_VIDEO_CHECK = "1";
  dir = fs.mkdtempSync(path.join(os.tmpdir(), "portal-test-"));
  delete process.env.VERCEL;
  delete process.env.PORTAL_STORAGE;
  ctx = createContext({ localRoot: dir, now: () => clock });
  server = http.createServer((req, res) => {
    void dispatch(ctx, req, res);
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", () => r()));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(() => {
  server?.close();
  fs.rmSync(dir, { recursive: true, force: true });
});

beforeEach(() => {
  resetRateLimits();
  clock = Date.parse("2026-11-16T12:00:00-05:00");
});

describe("teams", () => {
  it("creates, uploads, submits, and shares an entry", async () => {
    const { id, key } = await create();
    expect(id).toMatch(/^[A-Za-z0-9]{12}$/);
    expect(key.length).toBeGreaterThan(30);

    const up = await upload(id, key, "model", "Lamp v3.STL", tinyStl());
    expect(up.status).toBe(200);
    expect(up.json.entry.files).toHaveLength(1);
    expect(up.json.entry.files[0].path).toBeUndefined(); // storage keys never leave the server

    expect((await call(`/entry/${id}`)).status).toBe(404); // drafts aren't shared

    const sub = await call(`/entries/${id}/submit`, { body: {}, key });
    expect(sub.status).toBe(200);
    expect(sub.json.entry.status).toBe("submitted");
    expect(sub.json.entry.late).toBe(false);

    const pub = await call(`/entry/${id}`);
    expect(pub.status).toBe(200);
    expect(pub.json.credit).toBe("Avery L. and Sam O.");
    expect(JSON.stringify(pub.json)).not.toMatch(/avery@example|Okafor|Mackenzie CI|editKey/);
    // The model URL is a signed, working download.
    const file = await fetch(new URL(pub.json.model.url, base));
    expect(file.status).toBe(200);
    expect(Buffer.from(await file.arrayBuffer()).equals(tinyStl())).toBe(true);
  });

  it("refuses a wrong entry code", async () => {
    const r = await call("/entries", { body: { code: "nope", entry: entry() } });
    expect(r.status).toBe(403);
    expect(r.json.field).toBe("code");
  });

  it("validates fields on the server", async () => {
    const r = await call("/entries", { body: { code: "MDC-DEMO", entry: entry({ title: "", original: false, members: [] }) } });
    expect(r.status).toBe(422);
    expect(Object.keys(r.json.errors)).toEqual(expect.arrayContaining(["title", "original", "members"]));
  });

  it("needs a team name to submit, but not to save a draft", async () => {
    for (const teamName of ["", "   "]) {
      const r = await call("/entries", { body: { code: "MDC-DEMO", entry: entry({ teamName }) } });
      expect(r.status).toBe(422);
      expect(r.json.errors.teamName).toMatch(/team a name/i);
    }
    // A draft saves without one, then submitting it is refused until it has one.
    const d = await call("/entries", { body: { code: "MDC-DEMO", entry: entry({ teamName: "" }), draft: true } });
    expect(d.status).toBe(201);
    const refused = await call(`/entries/${d.json.id}/submit`, { body: {}, key: d.json.editKey });
    expect(refused.status).toBe(422);
    expect(Object.keys(refused.json.errors)).toContain("teamName");
    expect((await call(`/entries/${d.json.id}`, { method: "PUT", body: { entry: entry({ teamName: "Tide" }), draft: true }, key: d.json.editKey })).status).toBe(200);
    expect((await call(`/entries/${d.json.id}/submit`, { body: {}, key: d.json.editKey })).status).toBe(200);
  });

  it("needs the edit key, and the same answer for wrong key and no entry", async () => {
    const { id } = await create();
    const wrong = await call(`/entries/${id}`, { key: "x".repeat(43) });
    const missing = await call(`/entries/AAAAAAAAAAAA`, { key: "x".repeat(43) });
    expect(wrong.status).toBe(404);
    expect(missing.status).toBe(404);
    expect(wrong.json.error).toBe(missing.json.error);
  });

  it("rejects a file whose bytes don't match its extension", async () => {
    const { id, key } = await create();
    const r = await upload(id, key, "model", "evil.glb", Buffer.from("<html><script>alert(1)</script></html>"));
    expect(r.status).toBe(422);
    const own = await call(`/entries/${id}`, { key });
    expect(own.json.entry.files).toHaveLength(0);
    expect(fs.readdirSync(path.join(dir, "portal", "files", id))).toHaveLength(0);
  });

  it("rejects a disallowed type and an oversize file before upload", async () => {
    const { id, key } = await create();
    expect((await call(`/entries/${id}/files`, { body: { slot: "model", name: "x.html", size: 10 }, key })).status).toBe(422);
    expect((await call(`/entries/${id}/files`, { body: { slot: "image", name: "x.png", size: 999_000_000 }, key })).status).toBe(422);
  });

  it("takes a 250 MB model, but caps one entry's files at 300 MB together", async () => {
    const { id, key } = await create();
    const MB = 1024 * 1024;
    expect((await call(`/entries/${id}/files`, { body: { slot: "model", name: "m.stl", size: 250 * MB }, key })).status).toBe(200);
    expect((await call(`/entries/${id}/files`, { body: { slot: "model", name: "m.stl", size: 251 * MB }, key })).status).toBe(422);
    // 250 MB model pending + 100 MB project file is over 300 MB.
    expect((await call(`/entries/${id}/files`, { body: { slot: "source", name: "p.step", size: 100 * MB }, key })).status).toBe(413);
    expect((await call(`/entries/${id}/files`, { body: { slot: "source", name: "p.step", size: 40 * MB }, key })).status).toBe(200);
  });

  it("caps an upload at the size the ticket allows", async () => {
    const { id, key } = await create();
    const s = await call(`/entries/${id}/files`, { body: { slot: "thumb", name: "p.png", size: 10 }, key });
    const big = Buffer.concat([PNG, Buffer.alloc(3 * 1024 * 1024)]);
    const put = await fetch(new URL(s.json.ticket.url, base), { method: "PUT", body: big, headers: { "X-Portal": "1" } });
    expect(put.status).toBe(413);
  });

  it("refuses a forged upload ticket", async () => {
    const r = await fetch(`${base}/api/portal/local-upload?t=eyJ.forged`, { method: "PUT", body: "x", headers: { "X-Portal": "1" } });
    expect(r.status).toBe(403);
  });

  it("replaces the model instead of keeping two", async () => {
    const { id, key } = await create();
    await upload(id, key, "model", "a.stl", tinyStl());
    const r = await upload(id, key, "model", "b.stl", tinyStl());
    expect(r.json.entry.files.filter((f: { slot: string }) => f.slot === "model").map((f: { name: string }) => f.name)).toEqual(["b.stl"]);
  });

  it("needs one thing to look at: an image, a video or a model, any of them", async () => {
    const { id, key } = await create({ videoLink: "" });
    const r = await call(`/entries/${id}/submit`, { body: {}, key });
    expect(r.status).toBe(422);
    expect(r.json.field).toBe("visuals");
    // A single render is enough.
    expect((await upload(id, key, "image", "render.png", PNG)).status).toBe(200);
    expect((await call(`/entries/${id}/submit`, { body: {}, key })).status).toBe(200);
    // ...and can't then be removed, leaving nothing.
    const own = await call(`/entries/${id}`, { key });
    const img = own.json.entry.files.find((f: { slot: string }) => f.slot === "image");
    expect((await call(`/entries/${id}/files/${img.id}`, { method: "DELETE", key })).status).toBe(409);
    // An uploaded MP4 counts too.
    const v = await create({ videoLink: "" });
    const mp4 = Buffer.concat([Buffer.from([0, 0, 0, 0x18]), Buffer.from("ftypmp42"), Buffer.alloc(64)]);
    expect((await upload(v.id, v.key, "video", "pitch.mp4", mp4)).status).toBe(200);
    expect((await call(`/entries/${v.id}/submit`, { body: {}, key: v.key })).status).toBe(200);
    // A fake MP4 is rejected.
    const other = await create({ videoLink: "" });
    expect((await upload(other.id, other.key, "video", "x.mp4", Buffer.from("<html>nope</html>"))).status).toBe(422);
  });

  it("limits the text boxes by words, not characters", async () => {
    const long = Array.from({ length: 81 }, (_, i) => `w${i}`).join(" ");
    const r = await call("/entries", { body: { code: "MDC-DEMO", entry: entry({ summary: long }) } });
    expect(r.status).toBe(422);
    expect(r.json.errors.summary).toMatch(/80 words/);
    expect((await call("/entries", { body: { code: "mdc demo", entry: entry({ summary: long.split(" ").slice(0, 80).join(" ") }) } })).status).toBe(201);
  });

  it("accepts known video links and turns them into embeds; refuses others", async () => {
    const { parseVideoLink } = await import("../../src/portal/shared/video");
    expect(parseVideoLink("https://youtu.be/abcdefghijk")?.embed).toBe("https://www.youtube-nocookie.com/embed/abcdefghijk");
    expect(parseVideoLink("https://www.youtube.com/watch?v=abcdefghijk&t=3")?.host).toBe("youtube");
    expect(parseVideoLink("https://youtube.com/shorts/abcdefghijk")?.embed).toContain("abcdefghijk");
    expect(parseVideoLink("https://drive.google.com/file/d/1AbCdEfGhIjKlMnOp/view?usp=sharing")?.embed).toBe("https://drive.google.com/file/d/1AbCdEfGhIjKlMnOp/preview");
    expect(parseVideoLink("https://vimeo.com/123456789")?.embed).toBe("https://player.vimeo.com/video/123456789");
    expect(parseVideoLink("http://youtu.be/abcdefghijk")).toBeNull();
    expect(parseVideoLink("https://evil.example/video.mp4")).toBeNull();
    expect((await call("/entries", { body: { code: "MDC-DEMO", entry: entry({ videoLink: "https://evil.example/v" }) } })).json.errors.videoLink).toBeTruthy();
  });

  it("closes at 1:30 PM sharp: no late submissions, even for drafts already started", async () => {
    const { id, key } = await create();
    await upload(id, key, "model", "a.stl", tinyStl());
    clock = Date.parse("2026-11-16T13:29:00-05:00");
    expect((await call("/status")).json.open).toBe(true);
    clock = Date.parse("2026-11-16T13:30:00-05:00");
    expect((await call("/status")).json.open).toBe(false);
    expect((await call("/entries", { body: { code: "MDC-DEMO", entry: entry() } })).status).toBe(409);
    expect((await call(`/entries/${id}/submit`, { body: {}, key })).status).toBe(409);
    expect((await call(`/entries/${id}`, { method: "PUT", body: { entry: entry({ title: "Changed" }) }, key })).status).toBe(409);
  });

  it("locks a submitted entry at the deadline (no grace for edits)", async () => {
    const { id, key } = await create();
    await upload(id, key, "model", "a.stl", tinyStl());
    await call(`/entries/${id}/submit`, { body: {}, key });
    clock = Date.parse("2026-11-16T14:01:00-05:00");
    expect((await call(`/entries/${id}`, { method: "PUT", body: { entry: entry({ title: "Changed" }) }, key })).status).toBe(409);
    expect((await call(`/entries/${id}`, { key })).json.entry.locked).toBe(true);
  });

  it("keeps a private entry off its share link", async () => {
    const { id, key } = await create({ shareable: false });
    await upload(id, key, "model", "a.stl", tinyStl());
    await call(`/entries/${id}/submit`, { body: {}, key });
    expect((await call(`/entry/${id}`)).status).toBe(404);
  });
});

describe("request guards", () => {
  it("needs the X-Portal header on writes", async () => {
    const r = await call("/entries", { body: { code: "MDC-DEMO", entry: entry() }, headers: { "X-Portal": "0" } });
    expect(r.status).toBe(403);
  });

  it("refuses cross-origin writes", async () => {
    const r = await call("/entries", { body: { code: "MDC-DEMO", entry: entry() }, headers: { Origin: "https://evil.example" } });
    expect(r.status).toBe(403);
  });

  it("rate-limits entry-code guessing", async () => {
    let last = 0;
    for (let i = 0; i < 62; i++) last = (await call("/entries", { body: { code: `guess${i}`, entry: entry() } })).status;
    expect(last).toBe(429);
  });

  it("answers unknown routes with 404 and wrong methods with 405", async () => {
    expect((await call("/nope")).status).toBe(404);
    expect((await call("/status", { method: "DELETE" })).status).toBe(405);
  });
});

describe("judges", () => {
  it("doesn't lock out a shared venue IP after many good sign-ins", async () => {
    for (let i = 0; i < 30; i++) expect((await login("judge-demo", `Judge ${i}`)).status).toBe(200);
  });

  it("signs in with the passcode only", async () => {
    expect((await login("wrong")).status).toBe(401);
    const ok = await login("judge-demo");
    expect(ok.status).toBe(200);
    expect(ok.json.role).toBe("judge");
    expect(ok.headers.get("set-cookie")).toMatch(/HttpOnly; SameSite=Strict/);
    expect((await call("/judge/entries")).status).toBe(401);
  });

  it("rejects a tampered session cookie", async () => {
    const { cookie } = await login("judge-demo");
    const [name, value] = cookie.split("=");
    const [body, sig] = value.split(".");
    const forged = Buffer.from(JSON.stringify({ ...JSON.parse(Buffer.from(body, "base64url").toString()), role: "admin" })).toString("base64url");
    expect((await call("/judge/results", { cookie: `${name}=${forged}.${sig}` })).status).toBe(401);
  });

  it("lists submitted entries, scores them, and keeps judges' marks apart", async () => {
    const { id, key } = await create({ title: "Scored Entry" });
    await upload(id, key, "model", "a.stl", tinyStl());
    await call(`/entries/${id}/submit`, { body: {}, key });

    const a = await login("judge-demo", "Judge A");
    const b = await login("judge-demo", "Judge B");
    const list = await call("/judge/entries", { cookie: a.cookie });
    expect(list.status).toBe(200);
    const card = list.json.cards.find((c: { id: string }) => c.id === id);
    expect(card.myTotal).toBeNull();

    const marks = { originality: 20, technical: 18, theme: 22, communication: 30 }; // 30 clamps to 25
    const s = await call(`/judge/entries/${id}/score`, { method: "PUT", body: { marks, notes: "Lovely fold." }, cookie: a.cookie });
    expect(s.status).toBe(200);
    expect(s.json.total).toBe(85);
    await call(`/judge/entries/${id}/score`, { method: "PUT", body: { marks: { originality: 6, technical: 6, theme: 6, communication: 6 } }, cookie: b.cookie });

    const detail = await call(`/judge/entries/${id}`, { cookie: a.cookie });
    expect(detail.json.entry.myScore.marks.communication).toBe(25);
    expect(detail.json.entry.scoreCount).toBe(2);
    expect(detail.json.entry.members[1].name).toBe("Sam Okafor"); // judges see full names

    // Judges can't see results; organizers can.
    expect((await call("/judge/results", { cookie: a.cookie })).status).toBe(403);
    const admin = await login("admin-demo", "Organizer");
    const res = await call("/judge/results", { cookie: admin.cookie });
    const row = res.json.rows.find((r: { id: string }) => r.id === id);
    expect(row.average).toBe((85 + 24) / 2);
    expect(row.judgeCount).toBe(2);
  });

  it("exports CSV without formula injection", async () => {
    const { id, key } = await create({ title: "=HYPERLINK(1)" });
    await upload(id, key, "model", "a.stl", tinyStl());
    await call(`/entries/${id}/submit`, { body: {}, key });
    const admin = await login("admin-demo", "Organizer");
    const csv = await call("/judge/export.csv", { cookie: admin.cookie });
    expect(csv.status).toBe(200);
    expect(csv.headers.get("content-type")).toMatch(/text\/csv/);
    expect(csv.text).toContain("'=HYPERLINK(1)");
  });

  it("lets organizers hide, award, gallery and delete", async () => {
    const { id, key } = await create({ title: "Admin Target" });
    await upload(id, key, "model", "a.stl", tinyStl());
    await call(`/entries/${id}/submit`, { body: {}, key });
    const admin = await login("admin-demo", "Organizer");
    const judge = await login("judge-demo", "Judge C");
    expect((await call(`/judge/entries/${id}`, { method: "PATCH", body: { hidden: true }, cookie: judge.cookie })).status).toBe(403);

    await call(`/judge/entries/${id}`, { method: "PATCH", body: { hidden: true }, cookie: admin.cookie });
    expect((await call(`/entry/${id}`)).status).toBe(404);
    await call(`/judge/entries/${id}`, { method: "PATCH", body: { hidden: false, gallery: true, award: "1st place" }, cookie: admin.cookie });
    const gallery = await call("/gallery");
    expect(gallery.json.entries[0].id).toBe(id);
    expect(gallery.json.entries[0].award).toBe("1st place");
    expect((await call(`/judge/entries/${id}`, { method: "PATCH", body: { award: "Best vibes" }, cookie: admin.cookie })).status).toBe(422);

    expect((await call(`/judge/entries/${id}`, { method: "DELETE", cookie: admin.cookie })).status).toBe(200);
    expect((await call(`/entry/${id}`)).status).toBe(404);
    expect(fs.existsSync(path.join(dir, "portal", "files", id)) ? fs.readdirSync(path.join(dir, "portal", "files", id)) : []).toHaveLength(0);
  });

  it("lets organizers move the deadline and close early", async () => {
    const admin = await login("admin-demo", "Organizer");
    let r = await call("/judge/settings", { method: "PUT", body: { closed: true }, cookie: admin.cookie });
    expect(r.json.open).toBe(false);
    expect((await call("/entries", { body: { code: "MDC-DEMO", entry: entry() } })).status).toBe(409);
    await call("/judge/settings", { method: "PUT", body: { closed: false }, cookie: admin.cookie });
    clock = Date.parse("2026-11-16T14:30:00-05:00");
    r = await call("/judge/settings", { method: "PUT", body: { deadlineOverride: "2026-11-16T15:00:00-05:00" }, cookie: admin.cookie });
    expect(r.json.open).toBe(true);
    expect((await call("/entries", { body: { code: "MDC-DEMO", entry: entry() } })).status).toBe(201);
    await call("/judge/settings", { method: "PUT", body: { deadlineOverride: null }, cookie: admin.cookie });
  });
});

describe("concurrency", () => {
  it("never loses an entry when many teams submit at once", async () => {
    const before = Object.keys((await ctx.db.read("entries", { fresh: true })).entries).length;
    const made = await Promise.all(Array.from({ length: 15 }, (_, i) => call("/entries", { body: { code: "MDC-DEMO", entry: entry({ title: `Rush ${i}` }) } })));
    // The create limit is per IP, so some may be rate-limited; every 201 must be stored.
    const ok = made.filter((r) => r.status === 201).map((r) => r.json.id as string);
    const after = (await ctx.db.read("entries", { fresh: true })).entries;
    expect(Object.keys(after).length).toBe(before + ok.length);
    for (const id of ok) expect(after[id]).toBeTruthy();
  });
});

describe("security review fixes", () => {
  it("lets the right entry code through even after a flood of wrong ones", async () => {
    for (let i = 0; i < 62; i++) await call("/entries", { body: { code: `typo${i}`, entry: entry() } });
    expect((await call("/entries", { body: { code: "wrong", entry: entry() } })).status).toBe(429);
    expect((await call("/entries", { body: { code: "MDC-DEMO", entry: entry() } })).status).toBe(201);
  });

  it("keeps uploaded file names off public pages and out of storage keys", async () => {
    const { id, key } = await create();
    await upload(id, key, "model", "Avery_Lindqvist_final.stl", tinyStl());
    await call(`/entries/${id}/submit`, { body: {}, key });
    const pub = await call(`/entry/${id}`);
    expect(JSON.stringify(pub.json)).not.toMatch(/Lindqvist/);
    expect(pub.json.model.name).toBe("model.stl");
    expect(fs.readdirSync(path.join(dir, "portal", "files", id)).join()).not.toMatch(/Lindqvist/);
    // The team and judges still see the name they uploaded.
    expect((await call(`/entries/${id}`, { key })).json.entry.files[0].name).toBe("Avery_Lindqvist_final.stl");
  });

  it("refuses route ids like __proto__", async () => {
    const admin = await login("admin-demo", "Organizer");
    const r = await call("/judge/entries/__proto__", { method: "PATCH", body: { unlocked: true }, cookie: admin.cookie });
    expect(r.status).toBe(404);
    expect(({} as Record<string, unknown>).unlocked).toBeUndefined();
  });

  it("deletes abandoned uploads from storage", async () => {
    const { id, key } = await create();
    const s = await call(`/entries/${id}/files`, { body: { slot: "image", name: "a.png", size: PNG.length }, key });
    await fetch(new URL(s.json.ticket.url, base), { method: "PUT", body: PNG, headers: { "X-Portal": "1" } });
    const filesDir = path.join(dir, "portal", "files", id);
    expect(fs.readdirSync(filesDir)).toHaveLength(1);
    clock += 60 * 60 * 1000; // an hour later, never completed
    await call(`/entries/${id}/files`, { body: { slot: "image", name: "b.png", size: PNG.length }, key });
    expect(fs.readdirSync(filesDir)).toHaveLength(0);
  });

  it("with a judges list, only listed judges sign in and count", async () => {
    const { id, key } = await create({ title: "Roster Entry" });
    await upload(id, key, "model", "a.stl", tinyStl());
    await call(`/entries/${id}/submit`, { body: {}, key });
    const admin = await login("admin-demo", "Organizer");
    // A phantom judge marks before the list exists...
    const phantom = await login("judge-demo", "Judge Phantom");
    await call(`/judge/entries/${id}/score`, { method: "PUT", body: { marks: { originality: 10, technical: 10, theme: 10, communication: 10 } }, cookie: phantom.cookie });
    await call("/judge/settings", { method: "PUT", body: { judges: ["Judge Real", " judge real ", "x"] }, cookie: admin.cookie });
    const st = await call("/judge/settings", { cookie: admin.cookie });
    expect(st.json.judges).toEqual(["Judge Real"]);
    expect((await login("judge-demo", "Judge Phantom 2")).status).toBe(403);
    const real = await login("judge-demo", "judge  REAL");
    expect(real.status).toBe(200);
    await call(`/judge/entries/${id}/score`, { method: "PUT", body: { marks: { originality: 5, technical: 5, theme: 5, communication: 5 } }, cookie: real.cookie });
    const res = await call("/judge/results", { cookie: admin.cookie });
    const row = res.json.rows.find((r: { id: string }) => r.id === id);
    expect(row.average).toBe(20); // the phantom's 40 doesn't count
    expect(res.json.unlisted.map((u: { name: string }) => u.name)).toContain("Judge Phantom");
    await call("/judge/settings", { method: "PUT", body: { judges: [] }, cookie: admin.cookie });
  });
});

describe("day-of switches", () => {
  it("with the entry code off, anyone can start an entry, but only after the reveal", async () => {
    const admin = await login("admin-demo", "Organizer");
    let st = await call("/judge/settings", { method: "PUT", body: { entryCodeOn: false, revealAt: "2026-11-16T09:10:00-05:00" }, cookie: admin.cookie });
    expect(st.json.entryCodeOn).toBe(false);
    let status = await call("/status");
    expect(status.json.codeRequired).toBe(false);
    expect(status.json.opensAt).toBeNull();
    expect((await call("/entries", { body: { entry: entry({ title: "No Code" }) } })).status).toBe(201);

    clock = Date.parse("2026-11-16T08:00:00-05:00");
    status = await call("/status");
    expect(status.json.opensAt).toBe(new Date("2026-11-16T09:10:00-05:00").toISOString());
    const early = await call("/entries", { body: { entry: entry() } });
    expect(early.status).toBe(409);
    expect(early.json.error).toMatch(/theme reveal/);

    st = await call("/judge/settings", { method: "PUT", body: { entryCodeOn: true }, cookie: admin.cookie });
    expect(st.json.entryCodeOn).toBe(true);
    expect((await call("/status")).json.codeRequired).toBe(true);
    expect((await call("/entries", { body: { entry: entry() } })).status).toBe(403);
  });

  it("sends each judge to the unmarked entry with the fewest marks", async () => {
    const ids: string[] = [];
    for (const t of ["Queue A", "Queue B"]) {
      const { id, key } = await create({ title: t });
      await call(`/entries/${id}/submit`, { body: {}, key });
      ids.push(id);
    }
    const a = await login("judge-demo", "Queue Judge A");
    const c = await login("judge-demo", "Queue Judge C");
    const full = { originality: 5, technical: 5, theme: 5, communication: 5 };
    await call(`/judge/entries/${ids[0]}/score`, { method: "PUT", body: { marks: full }, cookie: a.cookie });

    const list = await call("/judge/entries", { cookie: c.cookie });
    const cards = list.json.cards as { id: string; scoreCount: number; myTotal: number | null }[];
    const pick = cards.find((x) => x.id === list.json.nextToMark)!;
    expect(pick.myTotal).toBeNull();
    expect(pick.scoreCount).toBe(Math.min(...cards.filter((x) => x.myTotal === null).map((x) => x.scoreCount)));
    expect(list.json.nextToMark).not.toBe(ids[0]); // the marked one waits

    const detail = await call(`/judge/entries/${ids[1]}`, { cookie: a.cookie });
    expect(detail.json.nextToMark).not.toBe(ids[0]); // never one you've marked
    expect(detail.json.nextToMark).not.toBe(ids[1]); // nor the one you're on
    expect(detail.json.total).toBeGreaterThanOrEqual(detail.json.toMark);
  });

  it("shows organizers each listed judge's progress, even before they mark", async () => {
    const admin = await login("admin-demo", "Organizer");
    await call("/judge/settings", { method: "PUT", body: { judges: ["Live Judge", "Idle Judge"] }, cookie: admin.cookie });
    const { id, key } = await create({ title: "Live Entry" });
    await call(`/entries/${id}/submit`, { body: {}, key });
    const j = await login("judge-demo", "Live Judge");
    await call(`/judge/entries/${id}/score`, { method: "PUT", body: { marks: { originality: 7, technical: 7, theme: 7, communication: 7 } }, cookie: j.cookie });
    const res = await call("/judge/results", { cookie: admin.cookie });
    const byName = Object.fromEntries(res.json.activity.map((x: { name: string }) => [x.name, x]));
    expect(byName["Live Judge"].marked).toBe(1);
    expect(byName["Live Judge"].lastAt).toBeTruthy();
    expect(byName["Idle Judge"].marked).toBe(0);
    expect(typeof res.json.drafts).toBe("number");
    await call("/judge/settings", { method: "PUT", body: { judges: [] }, cookie: admin.cookie });
  });
});

describe("judging schedule", () => {
  it("spreads entries over the rooms, keeps given slots, and sends each judge through their room in order", async () => {
    const admin = await login("admin-demo", "Organizer");
    await call("/judge/schedule", { body: { action: "clear" }, cookie: admin.cookie });
    await call("/judge/settings", {
      method: "PUT",
      body: { judges: ["Room Judge"], rooms: { names: ["R1", "R2"], start: "2026-11-16T14:10:00-05:00", slotMinutes: 5, judgeRooms: { "Room Judge": "R2" } } },
      cookie: admin.cookie,
    });
    let st = await call("/judge/schedule", { body: { action: "make" }, cookie: admin.cookie });
    expect(st.status).toBe(200);
    const res = await call("/judge/results", { cookie: admin.cookie });
    const slots = res.json.rows.map((r: { slot: { room: string; at: string } | null }) => r.slot);
    expect(slots.every(Boolean)).toBe(true);
    const r1 = slots.filter((s: { room: string }) => s.room === "R1").length;
    const r2 = slots.filter((s: { room: string }) => s.room === "R2").length;
    expect(Math.abs(r1 - r2)).toBeLessThanOrEqual(1); // balanced
    const r2times = slots.filter((s: { room: string }) => s.room === "R2").map((s: { at: string }) => Date.parse(s.at)).sort();
    expect(r2times[0]).toBe(Date.parse("2026-11-16T14:10:00-05:00"));
    expect(r2times[1] - r2times[0]).toBe(5 * 60_000);
    expect(Date.parse(st.json.scheduleEnds)).toBeGreaterThan(Date.parse("2026-11-16T14:10:00-05:00"));

    // A new entry is added after the others; nobody already scheduled moves.
    const before = JSON.stringify(slots);
    const { id, key } = await create({ title: "Late Addition" });
    await call(`/entries/${id}/submit`, { body: {}, key });
    st = await call("/judge/schedule", { body: { action: "make" }, cookie: admin.cookie });
    const after = (await call("/judge/results", { cookie: admin.cookie })).json.rows;
    const kept = after.filter((r: { id: string }) => r.id !== id).map((r: { slot: unknown }) => r.slot);
    expect(JSON.stringify(kept.sort())).toBe(JSON.stringify(JSON.parse(before).sort()));
    expect(after.find((r: { id: string }) => r.id === id).slot).toBeTruthy();

    // The team sees its room and time.
    expect((await call(`/entries/${id}`, { key })).json.entry.slot.room).toMatch(/^R[12]$/);

    // The judge in R2 is sent to R2's earliest entry.
    const j = await login("judge-demo", "Room Judge");
    const list = await call("/judge/entries", { cookie: j.cookie });
    expect(list.json.myRoom).toBe("R2");
    const first = list.json.cards
      .filter((c: { slot: { room: string } | null }) => c.slot?.room === "R2")
      .sort((a: { slot: { at: string } }, b: { slot: { at: string } }) => a.slot.at.localeCompare(b.slot.at))[0];
    expect(list.json.nextToMark).toBe(first.id);

    // Deleting an entry frees its slot.
    const before2 = (await call("/judge/settings", { cookie: admin.cookie })).json.scheduled;
    await call(`/judge/entries/${id}`, { method: "DELETE", cookie: admin.cookie });
    expect((await call("/judge/settings", { cookie: admin.cookie })).json.scheduled).toBe(before2 - 1);

    await call("/judge/schedule", { body: { action: "clear" }, cookie: admin.cookie });
    await call("/judge/settings", { method: "PUT", body: { judges: [], rooms: { names: ["WFL632", "WFL634", "WFL637"], judgeRooms: {} } }, cookie: admin.cookie });
  });
});

describe("day of (organizers, 2026-11-14)", () => {
  const marks = (n: number) => ({ marks: { originality: n, technical: n, theme: n, communication: n } });

  it("makes the schedule by itself once submissions close", async () => {
    await ctx.db.mutate("settings", (st) => {
      delete st.schedule;
      delete st.autoScheduledAt;
      delete st.scheduleOff;
    });
    const { id, key } = await create({ title: "Auto Slot" });
    await call(`/entries/${id}/submit`, { body: {}, key });
    const late = await create({ title: "Reopened Slot" }); // a draft that misses the deadline
    const admin = await login("admin-demo", "Organizer");
    expect((await call("/judge/settings", { cookie: admin.cookie })).json.autoScheduledAt).toBeNull();
    clock = Date.parse("2026-11-16T13:31:00-05:00");
    const st = await call("/judge/settings", { cookie: admin.cookie });
    expect(st.json.autoScheduledAt).toBeTruthy();
    expect(st.json.scheduled).toBeGreaterThan(0);
    expect((await call(`/entries/${id}`, { key })).json.entry.slot?.room).toBeTruthy();
    // Organizers reopen one entry's window: a new submission gets a slot by itself too.
    await ctx.db.mutate("entries", (doc) => {
      doc.entries[late.id].unlocked = true;
    });
    await call(`/entries/${late.id}/submit`, { body: {}, key: late.key });
    expect((await call(`/entries/${late.id}`, { key: late.key })).json.entry.slot?.room).toBeTruthy();
    // Cleared on purpose after the deadline: it stays cleared.
    await call("/judge/schedule", { body: { action: "clear" }, cookie: admin.cookie });
    expect((await call("/judge/settings", { cookie: admin.cookie })).json.scheduled).toBe(0);
  });

  it("a test run before the deadline can't stop the schedule from making itself", async () => {
    const admin = await login("admin-demo", "Organizer");
    await ctx.db.mutate("settings", (st) => {
      st.scheduleOff = true;
    });
    await call("/judge/schedule", { body: { action: "make" }, cookie: admin.cookie });
    await call("/judge/schedule", { body: { action: "clear" }, cookie: admin.cookie });
    expect((await call("/judge/settings", { cookie: admin.cookie })).json.autoScheduledAt).toBeNull();
    const { id, key } = await create({ title: "Gone Later" });
    await call(`/entries/${id}/submit`, { body: {}, key });
    const judge = await login("judge-demo", "Cleanup Judge");
    await call(`/judge/entries/${id}/score`, { method: "PUT", body: { marks: { originality: 5, technical: 5, theme: 5, communication: 5 } }, cookie: judge.cookie });
    await call(`/judge/final/${id}`, { method: "PUT", body: { why: "test" }, cookie: admin.cookie });
    await call(`/judge/entries/${id}`, { method: "DELETE", cookie: admin.cookie });
    const res = await call("/judge/results", { cookie: admin.cookie });
    expect(res.json.unlisted.find((u: { name: string }) => u.name === "Cleanup Judge")).toBeUndefined();
    const st = await ctx.db.read("settings", { fresh: true });
    expect(st.finalNotes?.[id]).toBeUndefined();
  });

  it("an entry with two marks is done: nobody else is sent to it, and it ranks by the pair's average", async () => {
    const admin = await login("admin-demo", "Organizer");
    await call("/judge/settings", { method: "PUT", body: { judges: ["Pair One", "Pair Two", "Third Judge"] }, cookie: admin.cookie });
    const { id, key } = await create({ title: "Pair Marked", teamName: "Pair Team" });
    await call(`/entries/${id}/submit`, { body: {}, key });
    const one = await login("judge-demo", "Pair One");
    const two = await login("judge-demo", "Pair Two");
    const third = await login("judge-demo", "Third Judge");
    await call(`/judge/entries/${id}/score`, { method: "PUT", body: marks(20), cookie: one.cookie });
    await call(`/judge/entries/${id}/score`, { method: "PUT", body: marks(15), cookie: two.cookie });
    const list = await call("/judge/entries", { cookie: third.cookie });
    expect(list.json.nextToMark).not.toBe(id);
    const card = list.json.cards.find((c: { id: string }) => c.id === id);
    expect(card.scoreCount).toBe(2);
    expect(card.teamName).toBe("Pair Team");
    const res = await call("/judge/results", { cookie: admin.cookie });
    const row = res.json.rows.find((r: { id: string }) => r.id === id);
    expect(row.average).toBe(70);
    expect(row.complete).toBe(true);
    expect(row.rank).toBeGreaterThan(0);
    expect(res.json.marksNeeded).toBe(2);
    await call("/judge/settings", { method: "PUT", body: { judges: [] }, cookie: admin.cookie });
  });

  it("keeps the organizers' notes on why a winner won", async () => {
    const admin = await login("admin-demo", "Organizer");
    const judge = await login("judge-demo");
    const { id, key } = await create({ title: "Winner" });
    await call(`/entries/${id}/submit`, { body: {}, key });
    expect((await call(`/judge/final/${id}`, { method: "PUT", body: { why: "Clean topology" }, cookie: judge.cookie })).status).toBe(403);
    expect((await call(`/judge/final/${id}`, { method: "PUT", body: { why: "Clean topology" }, cookie: admin.cookie })).status).toBe(200);
    const res = await call("/judge/results", { cookie: admin.cookie });
    expect(res.json.rows.find((r: { id: string }) => r.id === id).why).toBe("Clean topology");
  });

  it("serves the Google Sheets feed only with the secret key, without emails", async () => {
    const admin = await login("admin-demo", "Organizer");
    const { sheetPath } = (await call("/judge/settings", { cookie: admin.cookie })).json;
    expect(sheetPath).toMatch(/^\/api\/portal\/sheet\/[A-Za-z0-9]{32}$/);
    const r = await fetch(new URL(sheetPath, base));
    expect(r.status).toBe(200);
    const text = await r.text();
    expect(text.split("\r\n")[0]).toContain("Judging pair");
    expect(text).not.toMatch(/@/);
    expect((await call("/sheet/abcdefabcdefabcdefabcdefabcdefab")).status).toBe(404);
  });
});

describe("pairs (review fixes)", () => {
  const marks = (n: number) => ({ marks: { originality: n, technical: n, theme: n, communication: n } });
  it("only the entry's own pair finishes it; a hidden entry still gets a slot", async () => {
    const admin = await login("admin-demo", "Organizer");
    await call("/judge/schedule", { body: { action: "clear" }, cookie: admin.cookie });
    await call("/judge/settings", {
      method: "PUT",
      body: { judges: ["Pa One", "Pa Two", "Pb One"], rooms: { names: ["RA", "RB"], start: "2026-11-16T14:00:00-05:00", slotMinutes: 3, judgeRooms: { "Pa One": "RA", "Pa Two": "RA", "Pb One": "RB" } } },
      cookie: admin.cookie,
    });
    const doc = await ctx.db.read("entries", { fresh: true });
    for (const id of Object.keys(doc.entries)) await call(`/judge/entries/${id}`, { method: "DELETE", cookie: admin.cookie });
    const a = await create({ title: "Room A Team" });
    await call(`/entries/${a.id}/submit`, { body: {}, key: a.key });
    const h = await create({ title: "Hidden Team" });
    await call(`/entries/${h.id}/submit`, { body: {}, key: h.key });
    await call(`/judge/entries/${h.id}`, { method: "PATCH", body: { hidden: true }, cookie: admin.cookie });
    await call("/judge/schedule", { body: { action: "make" }, cookie: admin.cookie });
    const st = await ctx.db.read("settings", { fresh: true });
    expect(st.schedule?.[h.id]).toBeTruthy();
    // Put team A in RA for the test.
    await ctx.db.mutate("settings", (x) => {
      x.schedule![a.id] = { room: "RA", at: "2026-11-16T19:00:00.000Z" };
    });
    const pa1 = await login("judge-demo", "Pa One");
    const pa2 = await login("judge-demo", "Pa Two");
    const pb1 = await login("judge-demo", "Pb One");
    await call(`/judge/entries/${a.id}/score`, { method: "PUT", body: marks(10), cookie: pb1.cookie });
    await call(`/judge/entries/${a.id}/score`, { method: "PUT", body: marks(20), cookie: pa1.cookie });
    let card = (await call("/judge/entries", { cookie: pa2.cookie })).json;
    expect(card.cards.find((c: { id: string }) => c.id === a.id).scoreCount).toBe(1); // the outsider's mark doesn't count toward it
    expect(card.nextToMark).toBe(a.id);
    expect((await call("/judge/entries", { cookie: pb1.cookie })).json.nextToMark).not.toBe(a.id);
    await call(`/judge/entries/${a.id}/score`, { method: "PUT", body: marks(15), cookie: pa2.cookie });
    card = (await call("/judge/entries", { cookie: pa2.cookie })).json;
    expect(card.cards.find((c: { id: string }) => c.id === a.id).scoreCount).toBe(2);
    const row = (await call("/judge/results", { cookie: admin.cookie })).json.rows.find((r: { id: string }) => r.id === a.id);
    expect(row.average).toBe(70); // the pair's marks only
    expect(row.complete).toBe(true);
    await call("/judge/schedule", { body: { action: "clear" }, cookie: admin.cookie });
    await call("/judge/settings", { method: "PUT", body: { judges: [], rooms: { names: ["WFL632", "WFL634", "WFL637"], judgeRooms: {} } }, cookie: admin.cookie });
  });
});
