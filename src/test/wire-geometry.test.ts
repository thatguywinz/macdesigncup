import { describe, expect, it } from "vitest";
import { getSolid, projectSolid, VIEW_EXTENT, type WireShape } from "@/components/blueprint/wireGeometry";

const segments = (d: string) => (d.match(/M/g) ?? []).length;
const coords = (d: string) => (d.match(/-?\d+(\.\d+)?/g) ?? []).map(Number);

describe("wireGeometry", () => {
  it("draws a cube seen from above-front with 9 visible and 3 hidden edges", () => {
    const { visible, hidden, accent } = projectSolid(getSolid("cube"), Math.PI / 4, 0.5);
    expect(segments(visible) + segments(accent)).toBe(9);
    expect(segments(hidden)).toBe(3);
  });

  it("gives a cylinder exactly two silhouette lines and hides the back of its base rim", () => {
    const solid = getSolid("cylinder");
    const rims = solid.edges.filter((e) => e.hard).length; // 2 rims x 36 segments
    const { visible, hidden, accent } = projectSolid(solid, 0.3, 0.5);
    const drawnRim = segments(visible) - 2 + segments(accent);
    expect(segments(hidden)).toBeGreaterThan(10);
    expect(drawnRim + segments(hidden)).toBe(rims);
  });

  it("is deterministic (server and client render the same path)", () => {
    const a = projectSolid(getSolid("icosahedron"), 0.62, 0.5);
    const b = projectSolid(getSolid("icosahedron"), 0.62, 0.5);
    expect(a).toEqual(b);
  });

  it("keeps every shape inside the viewBox at any pose", () => {
    const shapes: WireShape[] = ["cube", "octahedron", "icosahedron", "cylinder", "cone", "prism"];
    for (const shape of shapes) {
      for (let yaw = 0; yaw < Math.PI * 2; yaw += 0.7) {
        for (const pitch of [-0.6, 0, 0.5, 1]) {
          const { visible, hidden, accent } = projectSolid(getSolid(shape), yaw, pitch);
          expect(segments(visible)).toBeGreaterThan(0);
          for (const n of coords(visible + hidden + accent)) {
            expect(Math.abs(n)).toBeLessThanOrEqual(VIEW_EXTENT);
          }
        }
      }
    }
  });
});
