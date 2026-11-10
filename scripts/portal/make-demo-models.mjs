// Builds a handful of sample models for trying the portal locally: one per
// viewer format family (GLB with materials, binary STL, OBJ), shaped like
// things students make at a design competition. Output: .data/demo-models/.
//
//   node scripts/portal/make-demo-models.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { STLExporter } from "three/examples/jsm/exporters/STLExporter.js";
import { OBJExporter } from "three/examples/jsm/exporters/OBJExporter.js";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const out = path.join(root, ".data", "demo-models");
fs.mkdirSync(out, { recursive: true });

// GLTFExporter wants FileReader (browser API) to pack a GLB.
globalThis.FileReader ??= class {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((buf) => {
      this.result = buf;
      this.onloadend?.();
    });
  }
  readAsDataURL(blob) {
    blob.arrayBuffer().then((buf) => {
      this.result = `data:${blob.type || "application/octet-stream"};base64,${Buffer.from(buf).toString("base64")}`;
      this.onloadend?.();
    });
  }
};

const mat = (color, roughness = 0.5, metalness = 0) => new THREE.MeshStandardMaterial({ color, roughness, metalness });

function writeGlb(name, scene) {
  return new Promise((resolve, reject) => {
    new GLTFExporter().parse(
      scene,
      (buf) => {
        fs.writeFileSync(path.join(out, name), Buffer.from(buf));
        resolve();
      },
      reject,
      { binary: true },
    );
  });
}

function writeStl(name, object) {
  const dv = new STLExporter().parse(object, { binary: true });
  fs.writeFileSync(path.join(out, name), Buffer.from(dv.buffer, dv.byteOffset, dv.byteLength));
}

function writeObj(name, object) {
  fs.writeFileSync(path.join(out, name), new OBJExporter().parse(object));
}

// ── 1. Tidal Lamp (GLB, Y-up, materials) ──────
{
  const scene = new THREE.Scene();
  const shadeProfile = [];
  for (let i = 0; i <= 40; i++) {
    const t = i / 40;
    shadeProfile.push(new THREE.Vector2(38 + 22 * Math.sin(t * Math.PI) + 4 * Math.sin(t * Math.PI * 6), 60 + t * 90));
  }
  const shadeGeo = new THREE.LatheGeometry(shadeProfile, 96);
  // Ripple the shade like a wave.
  const p = shadeGeo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const a = Math.atan2(z, x);
    const r = 1 + 0.06 * Math.sin(a * 9 + y * 0.08);
    p.setXYZ(i, x * r, y, z * r);
  }
  shadeGeo.computeVertexNormals();
  const shade = new THREE.Mesh(shadeGeo, new THREE.MeshStandardMaterial({ color: 0xff7a2a, roughness: 0.35, side: THREE.DoubleSide, emissive: 0x3a1200 }));
  const base = new THREE.Mesh(new THREE.CylinderGeometry(46, 52, 14, 96), mat(0xe8dfc8, 0.4));
  base.position.y = 7;
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(4, 4, 60, 32), mat(0x2b2d33, 0.3, 0.8));
  stem.position.y = 40;
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(14, 32, 16), new THREE.MeshStandardMaterial({ color: 0xfff1d6, emissive: 0xffc27a, emissiveIntensity: 0.6 }));
  bulb.position.y = 92;
  scene.add(shade, base, stem, bulb);
  await writeGlb("tidal-lamp.glb", scene);
}

// ── 2. Planetary Gearbox (STL, Z-up like a CAD export) ─
function gear(teeth, radius, depth, toothH) {
  const shape = new THREE.Shape();
  const steps = teeth * 4;
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    const phase = i % 4;
    const r = phase === 1 || phase === 2 ? radius + toothH : radius;
    const x = Math.cos(a) * r, y = Math.sin(a) * r;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  const hole = new THREE.Path();
  hole.absarc(0, 0, radius * 0.22, 0, Math.PI * 2, true);
  shape.holes.push(hole);
  return new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: 0.6, bevelSize: 0.5, bevelSegments: 2, curveSegments: 4 });
}
{
  const parts = [];
  const sun = gear(12, 14, 10, 3);
  parts.push(sun);
  for (let k = 0; k < 3; k++) {
    const g = gear(10, 11, 10, 3);
    const a = (k / 3) * Math.PI * 2;
    g.translate(Math.cos(a) * 29, Math.sin(a) * 29, 0);
    parts.push(g);
  }
  // Ring with inner teeth (approximated as a thick ring) and a carrier plate.
  const ringShape = new THREE.Shape();
  ringShape.absarc(0, 0, 58, 0, Math.PI * 2, false);
  const inner = new THREE.Path();
  inner.absarc(0, 0, 46, 0, Math.PI * 2, true);
  ringShape.holes.push(inner);
  parts.push(new THREE.ExtrudeGeometry(ringShape, { depth: 10, bevelEnabled: false, curveSegments: 64 }));
  const plate = new THREE.CylinderGeometry(58, 58, 4, 96);
  plate.rotateX(Math.PI / 2);
  plate.translate(0, 0, -3);
  parts.push(plate);
  const shaft = new THREE.CylinderGeometry(3, 3, 40, 24);
  shaft.rotateX(Math.PI / 2);
  shaft.translate(0, 0, 14);
  parts.push(shaft);
  const merged = mergeGeometries(parts.map((g) => g.toNonIndexed()), false);
  writeStl("planetary-gearbox.stl", new THREE.Mesh(merged));
}

// ── 3. Folding Stool (OBJ, Y-up) ──────────────
{
  const group = new THREE.Group();
  const seat = new THREE.Mesh(new THREE.CylinderGeometry(160, 160, 24, 64));
  seat.position.y = 450;
  group.add(seat);
  for (let k = 0; k < 3; k++) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(28, 470, 40));
    const a = (k / 3) * Math.PI * 2;
    leg.position.set(Math.cos(a) * 95, 225, Math.sin(a) * 95);
    leg.rotation.z = Math.cos(a) * 0.18;
    leg.rotation.x = -Math.sin(a) * 0.18;
    group.add(leg);
  }
  const ring = new THREE.Mesh(new THREE.TorusGeometry(110, 8, 12, 64));
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 170;
  group.add(ring);
  group.updateMatrixWorld(true);
  writeObj("folding-stool.obj", group);
}

// ── 4. Wind Turbine (GLB, materials) ──────────
{
  const scene = new THREE.Scene();
  const white = mat(0xf2efe8, 0.45);
  const tower = new THREE.Mesh(new THREE.CylinderGeometry(3, 7, 160, 48), white);
  tower.position.y = 80;
  const nacelle = new THREE.Mesh(new THREE.CapsuleGeometry(7, 22, 8, 24), white);
  nacelle.rotation.z = Math.PI / 2;
  nacelle.position.set(4, 162, 0);
  const hub = new THREE.Mesh(new THREE.SphereGeometry(6, 24, 16), mat(0xff6a14, 0.4));
  hub.position.set(-12, 162, 0);
  scene.add(tower, nacelle, hub);
  for (let k = 0; k < 3; k++) {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(2, 78, 9), white);
    blade.geometry.translate(0, 42, 0);
    const pivot = new THREE.Group();
    pivot.position.set(-13, 162, 0);
    pivot.rotation.x = (k / 3) * Math.PI * 2 + 0.3;
    pivot.add(blade);
    scene.add(pivot);
  }
  const pad = new THREE.Mesh(new THREE.CylinderGeometry(22, 24, 4, 48), mat(0x6b6e75, 0.9));
  pad.position.y = 2;
  scene.add(pad);
  await writeGlb("wind-turbine.glb", scene);
}

// ── 5. Phone Stand (STL, Z-up) ────────────────
{
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.lineTo(90, 0);
  shape.lineTo(90, 6);
  shape.lineTo(20, 6);
  shape.lineTo(62, 92);
  shape.lineTo(56, 95);
  shape.lineTo(12, 10);
  shape.lineTo(12, 22);
  shape.lineTo(4, 22);
  shape.lineTo(0, 0);
  const geo = new THREE.ExtrudeGeometry(shape, { depth: 70, bevelEnabled: true, bevelThickness: 1.5, bevelSize: 1.2, bevelSegments: 3 });
  geo.rotateX(Math.PI / 2); // profile stands up in Z
  writeStl("phone-stand.stl", new THREE.Mesh(geo));
}

// ── 6. Tensegrity Table (GLB) ─────────────────
{
  const scene = new THREE.Scene();
  const wood = mat(0xb07a4a, 0.6);
  const top = new THREE.Mesh(new THREE.BoxGeometry(220, 14, 220), wood);
  top.position.y = 300;
  const bottom = new THREE.Mesh(new THREE.BoxGeometry(220, 14, 220), wood);
  bottom.position.y = 7;
  const armA = new THREE.Mesh(new THREE.BoxGeometry(20, 190, 20), wood);
  armA.position.set(0, 100, -80);
  const armA2 = new THREE.Mesh(new THREE.BoxGeometry(20, 20, 120), wood);
  armA2.position.set(0, 185, -30);
  const armB = new THREE.Mesh(new THREE.BoxGeometry(20, 190, 20), wood);
  armB.position.set(0, 207, 80);
  const armB2 = new THREE.Mesh(new THREE.BoxGeometry(20, 20, 120), wood);
  armB2.position.set(0, 122, 30);
  scene.add(top, bottom, armA, armA2, armB, armB2);
  const wire = mat(0x1d1f24, 0.25, 0.9);
  for (const [x, z] of [[-100, -100], [100, -100], [-100, 100], [100, 100]]) {
    const c = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 286, 8), wire);
    c.position.set(x, 150, z);
    scene.add(c);
  }
  const c = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 60, 8), wire);
  c.position.set(0, 155, 0);
  scene.add(c);
  await writeGlb("tensegrity-table.glb", scene);
}

// ── Files that should trip the originality checks (for the demo) ─────────
// Their metadata is set the way the real tools write it, so the checks can
// be shown working. They are sample files, not anyone's work.

/** Rewrites a GLB's asset.generator (the string exporters stamp in). */
function setGlbGenerator(name, generator) {
  const file = path.join(out, name);
  const buf = fs.readFileSync(file);
  const jsonLen = buf.readUInt32LE(12);
  const json = JSON.parse(buf.subarray(20, 20 + jsonLen).toString("utf8"));
  json.asset.generator = generator;
  let text = JSON.stringify(json);
  while (Buffer.byteLength(text) % 4) text += " ";
  const jsonBuf = Buffer.from(text);
  const rest = buf.subarray(20 + jsonLen);
  const head = Buffer.alloc(20);
  head.write("glTF", 0);
  head.writeUInt32LE(2, 4);
  head.writeUInt32LE(20 + jsonBuf.length + rest.length, 8);
  head.writeUInt32LE(jsonBuf.length, 12);
  head.writeUInt32LE(0x4e4f534a, 16);
  fs.writeFileSync(file, Buffer.concat([head, jsonBuf, rest]));
}

// 7. "Dragon Knot": metadata says it came from Sketchfab.
{
  const scene = new THREE.Scene();
  const knot = new THREE.Mesh(new THREE.TorusKnotGeometry(50, 16, 220, 32, 2, 3), mat(0x2f8f6a, 0.35, 0.2));
  knot.position.y = 72;
  const base = new THREE.Mesh(new THREE.CylinderGeometry(40, 46, 10, 64), mat(0x2b2d33, 0.5));
  base.position.y = 5;
  scene.add(knot, base);
  await writeGlb("dragon-knot.glb", scene);
  setGlbGenerator("dragon-knot.glb", "Sketchfab-16.4.0");
}

// 8. "Ripple Vase": metadata says Meshy (an AI text-to-3D tool).
{
  const scene = new THREE.Scene();
  const pts = [];
  for (let i = 0; i <= 50; i++) {
    const t = i / 50;
    pts.push(new THREE.Vector2(22 + 18 * Math.sin(t * Math.PI * 1.2) + 3 * Math.sin(t * 40), t * 140));
  }
  const vase = new THREE.Mesh(new THREE.LatheGeometry(pts, 80), new THREE.MeshStandardMaterial({ color: 0x6b8cff, roughness: 0.3, side: THREE.DoubleSide }));
  scene.add(vase);
  await writeGlb("ripple-vase.glb", scene);
  setGlbGenerator("ripple-vase.glb", "Meshy AI v4 (meshy.ai)");
}

// 9. "Shelf Bracket": a 3MF whose CreationDate is from 2025.
{
  const { zipSync, strToU8 } = await import("three/examples/jsm/libs/fflate.module.js");
  const parts = [new THREE.BoxGeometry(80, 6, 30), new THREE.BoxGeometry(6, 80, 30)];
  parts[0].translate(40, 3, 15);
  parts[1].translate(3, 40, 15);
  const brace = new THREE.BoxGeometry(70, 6, 20);
  brace.rotateZ(-Math.PI / 4);
  brace.translate(30, 30, 15);
  parts.push(brace);
  const geo = mergeGeometries(parts.map((g) => g.toNonIndexed()), false);
  const p = geo.attributes.position;
  const verts = [];
  const tris = [];
  for (let i = 0; i < p.count; i++) verts.push(`<vertex x="${p.getX(i).toFixed(3)}" y="${p.getZ(i).toFixed(3)}" z="${p.getY(i).toFixed(3)}"/>`);
  for (let i = 0; i < p.count; i += 3) tris.push(`<triangle v1="${i}" v2="${i + 2}" v3="${i + 1}"/>`);
  const model = `<?xml version="1.0" encoding="UTF-8"?><model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02"><metadata name="Application">PrusaSlicer-2.8.1</metadata><metadata name="CreationDate">2025-03-14</metadata><metadata name="Title">Shelf bracket</metadata><resources><object id="1" type="model"><mesh><vertices>${verts.join("")}</vertices><triangles>${tris.join("")}</triangles></mesh></object></resources><build><item objectid="1"/></build></model>`;
  const zip = zipSync({
    "[Content_Types].xml": strToU8('<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/></Types>'),
    "_rels/.rels": strToU8('<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/></Relationships>'),
    "3D/3dmodel.model": strToU8(model),
  });
  fs.writeFileSync(path.join(out, "shelf-bracket.3mf"), zip);
}

for (const f of fs.readdirSync(out)) console.log(`${f}  ${(fs.statSync(path.join(out, f)).size / 1024).toFixed(0)} KB`);
