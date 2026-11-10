// @vitest-environment node
import { describe, expect, it } from "vitest";
import { sniff } from "./sniff";
import { parseEntry, publicCredit, shortName } from "../../src/portal/shared/schema";
import { checkFile, safeFileName } from "../../src/portal/shared/formats";
import { cleanMarks, totalOf } from "../../src/portal/shared/judging";

const bytes = (s: string) => new Uint8Array(Buffer.from(s));

describe("sniff", () => {
  it("knows a GLB, PNG, ZIP, ASCII STL and OBJ", () => {
    expect(sniff("glb", bytes("glTF\x02\x00\x00\x00"), 100)).toBeNull();
    expect(sniff("png", new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), 8)).toBeNull();
    expect(sniff("3mf", new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0, 0]), 6)).toBeNull();
    expect(sniff("stl", bytes("solid cube\n facet normal 0 0 1\n"), 40)).toBeNull();
    expect(sniff("obj", bytes("# Blender\nv 0 0 0\nv 1 0 0\nf 1 2 3\n"), 40)).toBeNull();
  });
  it("catches renamed files and markup", () => {
    expect(sniff("glb", bytes("PK\x03\x04"), 4)).toMatch(/glTF/);
    expect(sniff("obj", bytes("<!doctype html><script>"), 30)).toBeTruthy();
    expect(sniff("png", bytes("GIF89a"), 6)).toBeTruthy();
    expect(sniff("step", bytes("<html>"), 6)).toBeTruthy();
    expect(sniff("step", bytes("ISO-10303-21;"), 13)).toBeNull();
  });
});

describe("shared form rules", () => {
  it("credits first names and initials only", () => {
    expect(shortName("Avery Lin")).toBe("Avery L.");
    expect(shortName("Mo")).toBe("Mo");
    expect(publicCredit({ credit: "names", teamName: "", members: [{ name: "A B", school: "", grade: "9" }, { name: "C D", school: "", grade: "9" }, { name: "E F G", school: "", grade: "9" }] })).toBe(
      "A B., C D. and E G.",
    );
    expect(publicCredit({ credit: "team", teamName: "Gearheads", members: [] })).toBe("Gearheads");
  });
  it("strips control characters and caps team size", () => {
    const r = parseEntry({ title: "Hi\u0000there", members: Array(5).fill({ name: "x", school: "y", grade: "9" }) });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.members).toMatch(/1 to 4/);
  });
  it("makes storage-safe names and checks types", () => {
    expect(safeFileName("../../etc/passwd")).toBe("etc-passwd");
    expect(safeFileName("Bracket v2 (final).STL")).toBe("Bracket-v2-final.stl");
    expect(checkFile("model", "a.exe", 10)).toMatch(/isn't accepted/);
    expect(checkFile("model", "a.glb", 10)).toBeNull();
  });
  it("totals marks only when complete", () => {
    expect(totalOf({ theme: 5 })).toBeNull();
    expect(totalOf(cleanMarks({ theme: 5, creativity: 5, technical: 5, presentation: "5", junk: 9 }))).toBe(20);
    expect(cleanMarks({ theme: 0, creativity: 99 })).toEqual({ theme: 1, creativity: 10 });
  });
});
