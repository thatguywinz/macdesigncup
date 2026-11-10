// Turns a model file's bytes into a three.js object, ready for the stage:
// centred on the origin, standing on the floor (y = 0), with its real-size
// bounding box measured before anything is moved. Loaders are imported on
// demand so a GLB never pulls in the OBJ parser and vice versa.
import * as THREE from "three";
import type { ViewableExt } from "../shared/formats";

export interface LoadedModel {
  object: THREE.Object3D;
  /** Width (x), height (y), depth (z) in the file's own units, after the up-axis fix. */
  size: THREE.Vector3;
  triangles: number;
  /** The file brought its own materials (GLB, 3MF, coloured PLY). */
  hasMaterials: boolean;
}

/** Bone porcelain, the club's lion: what an unshaded STL or OBJ wears. */
export function porcelain(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color: 0xe6dcc4, roughness: 0.42, metalness: 0.05, side: THREE.DoubleSide });
}

function meshFrom(geometry: THREE.BufferGeometry, material?: THREE.Material): THREE.Mesh {
  if (!geometry.attributes.normal) geometry.computeVertexNormals();
  return new THREE.Mesh(geometry, material ?? porcelain());
}

export async function parseModel(ext: ViewableExt, data: ArrayBuffer): Promise<{ object: THREE.Object3D; hasMaterials: boolean }> {
  switch (ext) {
    case "glb": {
      const [{ GLTFLoader }, { DRACOLoader }] = await Promise.all([
        import("three/examples/jsm/loaders/GLTFLoader.js"),
        import("three/examples/jsm/loaders/DRACOLoader.js"),
      ]);
      const loader = new GLTFLoader();
      const draco = new DRACOLoader();
      draco.setDecoderPath("/portal/draco/");
      draco.setDecoderConfig({ type: "wasm" });
      loader.setDRACOLoader(draco);
      try {
        const gltf = await loader.parseAsync(data, "");
        return { object: gltf.scene, hasMaterials: true };
      } finally {
        draco.dispose();
      }
    }
    case "stl": {
      const { STLLoader } = await import("three/examples/jsm/loaders/STLLoader.js");
      const geometry = new STLLoader().parse(data);
      // Binary STLs from some tools carry per-face colours.
      const coloured = !!geometry.attributes.color;
      const material = coloured ? new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.5, side: THREE.DoubleSide }) : undefined;
      return { object: meshFrom(geometry, material), hasMaterials: coloured };
    }
    case "obj": {
      const { OBJLoader } = await import("three/examples/jsm/loaders/OBJLoader.js");
      const text = new TextDecoder().decode(data);
      const group = new OBJLoader().parse(text);
      // Without its .mtl an OBJ has placeholder materials: give it porcelain.
      group.traverse((o) => {
        if ((o as THREE.Mesh).isMesh) (o as THREE.Mesh).material = porcelain();
        if ((o as THREE.LineSegments).isLineSegments || (o as THREE.Points).isPoints) o.visible = false;
      });
      return { object: group, hasMaterials: false };
    }
    case "3mf": {
      const { ThreeMFLoader } = await import("three/examples/jsm/loaders/3MFLoader.js");
      const group = new ThreeMFLoader().parse(data);
      return { object: group, hasMaterials: true };
    }
    case "ply": {
      const { PLYLoader } = await import("three/examples/jsm/loaders/PLYLoader.js");
      const geometry = new PLYLoader().parse(data);
      const coloured = !!geometry.attributes.color;
      // PLYLoader indexes any file that has faces; no index means a bare point cloud.
      if (!geometry.index) throw new Error("This PLY file is a point cloud, not a mesh. Export it with faces.");
      const material = coloured ? new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.5, side: THREE.DoubleSide }) : undefined;
      return { object: meshFrom(geometry, material), hasMaterials: coloured };
    }
  }
}

function countTriangles(object: THREE.Object3D): number {
  let n = 0;
  object.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh || !mesh.geometry) return;
    const g = mesh.geometry;
    n += (g.index ? g.index.count : g.attributes.position.count) / 3;
  });
  return Math.round(n);
}

/**
 * Stands the model up and centres it. Z-up files (most CAD exports, all
 * STLs from Fusion and Onshape) are turned so +Z points up the screen.
 */
export function prepareModel(object: THREE.Object3D, hasMaterials: boolean, upAxis: "y" | "z"): LoadedModel {
  const root = new THREE.Group();
  const pivot = new THREE.Group();
  pivot.add(object);
  if (upAxis === "z") pivot.rotation.x = -Math.PI / 2;
  root.add(pivot);
  object.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (mesh.isMesh) {
      mesh.castShadow = true;
      mesh.receiveShadow = true;
    }
  });
  root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(root);
  if (box.isEmpty()) throw new Error("This file has no visible geometry.");
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  // Centre on x/z, rest on the floor.
  pivot.position.set(-center.x, -box.min.y, -center.z);
  root.updateMatrixWorld(true);
  return { object: root, size, triangles: countTriangles(object), hasMaterials };
}

/** Fetches a file with progress (0..1). */
export async function fetchBytes(url: string, onProgress?: (p: number) => void, signal?: AbortSignal): Promise<ArrayBuffer> {
  const res = await fetch(url, { signal, credentials: "same-origin" });
  if (!res.ok) throw new Error(res.status === 403 ? "This link has expired. Reload the page." : `Couldn't download the model (${res.status}).`);
  const total = Number(res.headers.get("content-length")) || 0;
  if (!res.body || !total || !onProgress) return res.arrayBuffer();
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let loaded = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    loaded += value.length;
    onProgress(Math.min(1, loaded / total));
  }
  const out = new Uint8Array(loaded);
  let at = 0;
  for (const c of chunks) {
    out.set(c, at);
    at += c.length;
  }
  return out.buffer;
}

export function disposeObject(object: THREE.Object3D) {
  object.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.geometry?.dispose();
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const m of mats) {
      if (!m) continue;
      for (const v of Object.values(m)) if (v instanceof THREE.Texture) v.dispose();
      m.dispose();
    }
  });
}

/** "128.4 × 64 × 22.5" with sensible precision for the model's scale. */
export function formatDims(size: THREE.Vector3): string {
  const max = Math.max(size.x, size.y, size.z);
  const digits = max >= 100 ? 0 : max >= 10 ? 1 : 2;
  const f = (n: number) => Number(n.toFixed(digits)).toString();
  return `${f(size.x)} × ${f(size.z)} × ${f(size.y)}`;
}
