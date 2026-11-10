// @vitest-environment node
// Originality checks, size spec and drafts, through the real API.
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import type { AddressInfo } from "node:net";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { strToU8, zipSync } from "three/examples/jsm/libs/fflate.module.js";
import { createContext } from "./handler";
import { resetRateLimits } from "./http";
import { inspectModel } from "./inspect";
import { dispatch, type PortalContext } from "./routes";
import { specCheck } from "../../src/portal/shared/checks";

let server: http.Server;
let base = "";
let dir = "";
let ctx: PortalContext;
const clock = Date.parse("2026-11-16T13:00:00-05:00");

/** A minimal GLB whose JSON chunk carries an asset.generator. */
function glb(generator: string, extra = ""): Buffer {
  let json = JSON.stringify({ asset: { version: "2.0", generator }, extras: { note: extra } });
  while (json.length % 4) json += " ";
  const out = Buffer.alloc(20 + json.length);
  out.write("glTF", 0);
  out.writeUInt32LE(2, 4);
  out.writeUInt32LE(out.length, 8);
  out.writeUInt32LE(json.length, 12);
  out.writeUInt32LE(0x4e4f534a, 16);
  out.write(json, 20);
  return out;
}

function threeMf(created: string): Buffer {
  const model = `<?xml version="1.0"?><model unit="millimeter" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02"><metadata name="Application">PrusaSlicer</metadata><metadata name="CreationDate">${created}</metadata><resources/><build/></model>`;
  return Buffer.from(zipSync({ "3D/3dmodel.model": strToU8(model) }));
}

function stl(header: string, tris = 1): Buffer {
  const b = Buffer.alloc(84 + 50 * tris);
  b.write(header.slice(0, 80), 0);
  b.writeUInt32LE(tris, 80);
  return b;
}

const entry = (over: Record<string, unknown> = {}) => ({
  title: "Entry",
  teamName: "",
  members: [{ name: "Avery Lin", school: "WLMAC", grade: "11" }],
  contactEmail: "a@example.com",
  software: ["Blender"],
  softwareOther: "",
  summary: "A design that answers the theme in a clear way.",
  process: "",
  aiUse: "none",
  aiNote: "",
  credit: "names",
  shareable: true,
  original: true,
  upAxis: "y",
  units: "mm",
  cadLink: "",
  filesNote: "",
  ...over,
});

async function call(p: string, o: { method?: string; body?: unknown; key?: string; cookie?: string } = {}) {
  const method = o.method ?? (o.body !== undefined ? "POST" : "GET");
  const headers: Record<string, string> = method !== "GET" ? { "X-Portal": "1", "Content-Type": "application/json" } : {};
  if (o.key) headers["X-Edit-Key"] = o.key;
  if (o.cookie) headers.Cookie = o.cookie;
  const res = await fetch(`${base}/api/portal${p}`, { method, headers, body: o.body === undefined ? undefined : JSON.stringify(o.body) });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test responses are read loosely
  const json: any = await res.json().catch(() => ({}));
  return { status: res.status, json, headers: res.headers };
}

async function submit(over: Record<string, unknown>, file: { name: string; bytes: Buffer }, measure?: Record<string, unknown>) {
  const c = await call("/entries", { body: { code: "MDC-DEMO", entry: entry(over), measure } });
  expect(c.status).toBe(201);
  const { id, editKey: key } = c.json;
  const s = await call(`/entries/${id}/files`, { body: { slot: "model", name: file.name, size: file.bytes.length }, key });
  expect(s.status).toBe(200);
  await fetch(new URL(s.json.ticket.url, base), { method: "PUT", body: file.bytes, headers: { "X-Portal": "1" } });
  expect((await call(`/entries/${id}/files/${s.json.fileId}/complete`, { body: {}, key })).status).toBe(200);
  expect((await call(`/entries/${id}/submit`, { body: {}, key })).status).toBe(200);
  return { id: id as string, key: key as string };
}

let admin = "";
const judgeEntry = async (id: string) => (await call(`/judge/entries/${id}`, { cookie: admin })).json.entry;

beforeAll(async () => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), "portal-orig-"));
  delete process.env.VERCEL;
  ctx = createContext({ localRoot: dir, now: () => clock });
  server = http.createServer((req, res) => void dispatch(ctx, req, res));
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", () => r()));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  const r = await call("/judge/login", { body: { name: "Organizer", passcode: "admin-demo" } });
  admin = (r.headers.get("set-cookie") ?? "").split(";")[0];
});
afterAll(() => {
  server?.close();
  fs.rmSync(dir, { recursive: true, force: true });
});
beforeEach(() => resetRateLimits());

describe("file metadata", () => {
  it("reads GLB generators, STL headers and 3MF dates", () => {
    expect(inspectModel("glb", glb("Sketchfab-16.4")).generator).toBe("Sketchfab-16.4");
    expect(inspectModel("stl", stl("Exported from Blender-4.2")).generator).toMatch(/Blender/);
    expect(inspectModel("3mf", threeMf("2025-04-02")).created).toBe("2025-04-02T00:00:00.000Z");
    expect(inspectModel("obj", Buffer.from("# Blender 4.2\nv 0 0 0\n")).generator).toBe("Blender 4.2");
    expect(inspectModel("glb", Buffer.from("garbage"))).toEqual({});
  });
});

describe("originality checks", () => {
  it("flags the same file submitted by two teams, on both, without naming them to the teams", async () => {
    const file = { name: "lamp.glb", bytes: glb("Khronos glTF Blender I/O v4.2") };
    const a = await submit({ title: "Lamp A" }, file);
    const b = await submit({ title: "Lamp B", members: [{ name: "Sam Okafor", school: "Earl Haig", grade: "12" }] }, file);
    const ja = await judgeEntry(a.id);
    const jb = await judgeEntry(b.id);
    expect(ja.checks.find((c: { kind: string }) => c.kind === "duplicate").detail).toMatch(/Lamp B/);
    expect(jb.checks.find((c: { kind: string }) => c.kind === "duplicate").detail).toMatch(/Lamp A/);
    const own = (await call(`/entries/${b.id}`, { key: b.key })).json.entry;
    expect(own.notices).toEqual(["Your model file is identical to a file another team uploaded."]);
    expect(JSON.stringify(own)).not.toMatch(/Lamp A|Avery/);
  });

  it("flags an AI generator only when the team said no AI, and a download site always", async () => {
    const hidden = await submit({ title: "Vase" }, { name: "vase.glb", bytes: glb("Meshy AI v4") });
    const told = await submit({ title: "Vase 2", aiUse: "some", aiNote: "Meshy for a first draft of the shape" }, { name: "vase2.glb", bytes: glb("Meshy AI v4 ", "x") });
    const site = await submit({ title: "Dragon" }, { name: "dragon.glb", bytes: glb("Sketchfab-16.4") });
    const ai1 = (await judgeEntry(hidden.id)).checks.find((c: { kind: string }) => c.kind === "ai");
    const ai2 = (await judgeEntry(told.id)).checks.find((c: { kind: string }) => c.kind === "ai");
    expect(ai1.level).toBe("review");
    expect(ai2.level).toBe("info");
    expect((await judgeEntry(site.id)).checks.find((c: { kind: string }) => c.kind === "source").title).toMatch(/Sketchfab/);
  });

  it("flags a file dated before the theme reveal, with slack for clocks", async () => {
    const old = await submit({ title: "Old bracket" }, { name: "b.3mf", bytes: threeMf("2025-04-02T10:00:00Z") });
    const sameDay = await submit({ title: "New bracket" }, { name: "c.3mf", bytes: threeMf("2026-11-16T13:30:00Z") }); // 8:30 AM Toronto: within 2 h of 9:10
    expect((await judgeEntry(old.id)).checks.some((c: { kind: string }) => c.kind === "created")).toBe(true);
    expect((await judgeEntry(sameDay.id)).checks.some((c: { kind: string }) => c.kind === "created")).toBe(false);
  });

  it("finds nothing on an ordinary entry", async () => {
    const ok = await submit({ title: "Plain", cadLink: "https://cad.onshape.com/documents/abc" }, { name: "p.stl", bytes: stl("Onshape", 3) });
    expect((await judgeEntry(ok.id)).checks.filter((c: { level: string }) => c.level === "review")).toEqual([]);
  });

  it("lets organizers clear a check, which hides the team's notice", async () => {
    const e = await submit({ title: "Clear me" }, { name: "d.glb", bytes: glb("Sketchfab-1") });
    const check = (await judgeEntry(e.id)).checks.find((c: { kind: string }) => c.kind === "source");
    const r = await call(`/judge/entries/${e.id}/checks/${check.id}`, { method: "PUT", body: { status: "cleared" }, cookie: admin });
    expect(r.status).toBe(200);
    expect(r.json.entry.checks.find((c: { id: string }) => c.id === check.id).review.status).toBe("cleared");
    expect((await call(`/entries/${e.id}`, { key: e.key })).json.entry.notices).toEqual([]);
    const judge = (await call("/judge/login", { body: { name: "Judge Z", passcode: "judge-demo" } })).headers.get("set-cookie")!.split(";")[0];
    expect((await call(`/judge/entries/${e.id}/checks/${check.id}`, { method: "PUT", body: { status: "cleared" }, cookie: judge })).status).toBe(403);
  });
});

describe("judges list on the sign-in page", () => {
  it("offers the listed names when signed out, and nothing else", async () => {
    await call("/judge/settings", { method: "PUT", cookie: admin, body: { judges: ["Jamie McIntyre", "Ken Wan"] } });
    const out = await call("/judge/me");
    expect(out.json).toEqual({ role: null, roster: ["Jamie McIntyre", "Ken Wan"] });
    const signedIn = await call("/judge/me", { cookie: admin });
    expect(signedIn.json.roster).toBeUndefined();
    expect((await call("/judge/login", { body: { name: "ken wan", passcode: "judge-demo" } })).status).toBe(200);
    await call("/judge/settings", { method: "PUT", cookie: admin, body: { judges: [] } });
  });
});

describe("no false flags from near-miss words", () => {
  it("doesn't read Onshape, a tripod or a garden trellis as AI generators", async () => {
    const { AI_GENERATORS, SOURCE_SITES } = await import("../../src/portal/shared/checks");
    const innocent = ["Onshape", "Exported by Onshape 1.180", "Tripod stool v2", "garden trellis panel", "endpoint-ellipse", "Blender 4.2", "SolidWorks 2025", "Fusion 360 STL export"];
    for (const text of innocent) {
      expect(AI_GENERATORS.find(([re]) => re.test(text))?.[1], text).toBeUndefined();
      expect(SOURCE_SITES.find(([re]) => re.test(text))?.[1], text).toBeUndefined();
    }
    for (const [text, name] of [["Meshy AI v4", "Meshy"], ["Tripo3D", "Tripo"], ["TRELLIS-3D", "TRELLIS"], ["Hunyuan3D-2", "Hunyuan3D"]]) {
      expect(AI_GENERATORS.find(([re]) => re.test(text))?.[1]).toBe(name);
    }
  });
});

describe("drafts, links and the spec", () => {
  it("saves a draft with only a title, but won't submit it incomplete", async () => {
    const c = await call("/entries", { body: { code: "MDC-DEMO", draft: true, entry: { title: "Early save" } } });
    expect(c.status).toBe(201);
    expect(c.json.entry.status).toBe("draft");
    expect((await call(`/entries/${c.json.id}/submit`, { body: {}, key: c.json.editKey })).status).toBe(422);
    expect((await call("/entries", { body: { code: "MDC-DEMO", entry: { title: "Not a draft" } } })).status).toBe(422);
  });

  it("takes progress shots on a draft and stamps each with the server's time", async () => {
    const c = await call("/entries", { body: { code: "MDC-DEMO", draft: true, entry: { title: "Sketching" } } });
    const png = Buffer.from("89504e470d0a1a0a0000000d4948445200000001000000010806000000", "hex");
    const s = await call(`/entries/${c.json.id}/files`, { body: { slot: "progress", name: "sketch1.png", size: png.length }, key: c.json.editKey });
    expect(s.status).toBe(200);
    await fetch(new URL(s.json.ticket.url, base), { method: "PUT", body: png, headers: { "X-Portal": "1" } });
    const done = await call(`/entries/${c.json.id}/files/${s.json.fileId}/complete`, { body: {}, key: c.json.editKey });
    expect(done.json.entry.files[0].slot).toBe("progress");
    expect(done.json.entry.files[0].uploadedAt).toBe(new Date(clock).toISOString());
  });

  it("only accepts CAD links on known hosts", async () => {
    expect((await call("/entries", { body: { code: "MDC-DEMO", entry: entry({ cadLink: "https://evil.example/x" }) } })).json.errors.cadLink).toBeTruthy();
    expect((await call("/entries", { body: { code: "MDC-DEMO", entry: entry({ cadLink: "javascript:alert(1)" }) } })).status).toBe(422);
    expect((await call("/entries", { body: { code: "MDC-DEMO", entry: entry({ cadLink: "https://a360.co/3abc" }) } })).status).toBe(201);
  });

  it("stores a spec and checks measurements against it", async () => {
    const r = await call("/judge/settings", { method: "PUT", cookie: admin, body: { spec: { maxW: 150, maxD: 150, maxH: 150, volume: { target: 200, tolerancePct: 2 }, note: "Fits in a 150 mm cube" } } });
    expect(r.status).toBe(200);
    expect((await call("/status")).json.spec.maxH).toBe(150);
    const lines = specCheck({ w: 120, d: 160, h: 140, volume: 203_000, area: 1, triangles: 10, closed: true }, r.json.spec);
    expect(lines.find((l) => l.label === "Footprint")!.ok).toBe(false);
    expect(lines.find((l) => l.label === "Height")!.ok).toBe(true);
    expect(lines.find((l) => l.label === "Volume")!.ok).toBe(true); // +1.5%
    // Turned 90°: 160 × 120 doesn't fit 150 either way; 140 × 120 does.
    expect(specCheck({ w: 140, d: 120, h: 10, volume: null, area: 1, triangles: 1, closed: false }, r.json.spec)[0].ok).toBe(true);
    await call("/judge/settings", { method: "PUT", cookie: admin, body: { spec: null } });
    expect((await call("/status")).json.spec).toBeNull();
  });

  it("keeps a sane measurement and drops a nonsense one", async () => {
    const good = await call("/entries", { body: { code: "MDC-DEMO", entry: entry(), measure: { w: 10, d: 20, h: 30, volume: 5000, area: 900, triangles: 12, closed: true } } });
    expect((await judgeEntry(good.json.id)).measure.h).toBe(30);
    const bad = await call("/entries", { body: { code: "MDC-DEMO", entry: entry(), measure: { w: "x", d: -1 } } });
    expect((await judgeEntry(bad.json.id)).measure).toBeNull();
  });
});
