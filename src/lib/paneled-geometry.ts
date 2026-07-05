import * as THREE from "three";

/**
 * Build a "paneled specimen" geometry procedurally from an icosphere — no
 * downloaded models. Each triangular face of the icosphere is inset toward its
 * centroid and pushed out along its normal, producing discrete beveled panels
 * with dark gaps between them (the reference's prototype/resolved object).
 *
 * @param radius   base icosphere radius
 * @param detail   icosphere subdivision (2 = chunky panels, 3 = finer)
 * @param inset    0..0.5 fraction each panel shrinks toward its centroid
 * @param extrude  how far panels push out along their normal
 * @param hemisphere if true, keep only the upper dome (y >= cut)
 * @param cut      hemisphere cut height in local units
 */
export function buildPaneledGeometry(
  radius = 2,
  detail = 2,
  inset = 0.14,
  extrude = 0.06,
  hemisphere = true,
  cut = -0.35,
): THREE.BufferGeometry {
  const src = new THREE.IcosahedronGeometry(radius, detail);
  const pos = src.attributes.position;
  const triCount = pos.count / 3;

  const outPositions: number[] = [];
  const outNormals: number[] = [];

  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  const centroid = new THREE.Vector3();
  const normal = new THREE.Vector3();
  const ab = new THREE.Vector3();
  const ac = new THREE.Vector3();

  for (let t = 0; t < triCount; t++) {
    a.fromBufferAttribute(pos, t * 3 + 0);
    b.fromBufferAttribute(pos, t * 3 + 1);
    c.fromBufferAttribute(pos, t * 3 + 2);

    centroid.copy(a).add(b).add(c).multiplyScalar(1 / 3);

    // Drop faces below the hemisphere cut (based on centroid height).
    if (hemisphere && centroid.y < cut) continue;

    // Face normal.
    ab.subVectors(b, a);
    ac.subVectors(c, a);
    normal.crossVectors(ab, ac).normalize();

    // Inset each vertex toward the centroid, then extrude along the normal.
    const push = normal.clone().multiplyScalar(extrude);
    const ia = a.clone().lerp(centroid, inset).add(push);
    const ib = b.clone().lerp(centroid, inset).add(push);
    const ic = c.clone().lerp(centroid, inset).add(push);

    // Top face of the panel.
    outPositions.push(ia.x, ia.y, ia.z, ib.x, ib.y, ib.z, ic.x, ic.y, ic.z);
    outNormals.push(
      normal.x, normal.y, normal.z,
      normal.x, normal.y, normal.z,
      normal.x, normal.y, normal.z,
    );

    // Bevel walls connecting the inset panel back toward the original edge ring,
    // so panels read as raised plates rather than floating triangles.
    const oa = a.clone().lerp(centroid, inset * 0.35);
    const ob = b.clone().lerp(centroid, inset * 0.35);
    const oc = c.clone().lerp(centroid, inset * 0.35);
    const ring = [
      [ia, ib, ob, oa],
      [ib, ic, oc, ob],
      [ic, ia, oa, oc],
    ];
    for (const [p0, p1, p2, p3] of ring) {
      const wn = new THREE.Vector3()
        .subVectors(p1, p0)
        .cross(new THREE.Vector3().subVectors(p3, p0))
        .normalize();
      // two triangles per quad
      outPositions.push(p0.x, p0.y, p0.z, p1.x, p1.y, p1.z, p2.x, p2.y, p2.z);
      outPositions.push(p0.x, p0.y, p0.z, p2.x, p2.y, p2.z, p3.x, p3.y, p3.z);
      for (let k = 0; k < 6; k++) outNormals.push(wn.x, wn.y, wn.z);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(outPositions, 3));
  geo.setAttribute("normal", new THREE.Float32BufferAttribute(outNormals, 3));
  geo.computeBoundingSphere();
  src.dispose();
  return geo;
}
