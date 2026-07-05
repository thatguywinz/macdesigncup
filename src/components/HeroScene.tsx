import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import type { MotionValue } from "framer-motion";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { keyframe } from "@/lib/anim";
import { buildPaneledGeometry } from "@/lib/paneled-geometry";
import { useIsMobile } from "@/hooks/use-mobile";

// 8 scene stops across scroll 0→1
const S = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => i / 7);

// Push the object right-of-centre (desktop) so it clears the left text column
// and aligns with the CAD overlay anchor (~63%). Centered on mobile.
const OBJECT_X = 1.15;

interface SceneProps {
  progress: MotionValue<number>;
  reducedMotion: boolean;
  isMobile: boolean;
}

function Objects({ progress, reducedMotion, isMobile }: SceneProps) {
  const objX = isMobile ? 0 : OBJECT_X;
  const objY = isMobile ? 1.4 : 0; // lift the object into the upper band on phones
  const rotRef = useRef<THREE.Group>(null);
  const isoSolidRef = useRef<THREE.Mesh>(null);
  const isoWireRef = useRef<THREE.LineSegments>(null);
  const paneledRef = useRef<THREE.Mesh>(null);
  const gridRef = useRef<THREE.LineSegments>(null);
  const pedestalRef = useRef<THREE.Mesh>(null);
  const originRef = useRef<THREE.Mesh>(null);
  const keyLightRef = useRef<THREE.PointLight>(null);
  const rimLightRef = useRef<THREE.PointLight>(null);

  const isoSolidGeo = useMemo(() => new THREE.IcosahedronGeometry(2, 3), []);
  const isoEdgesGeo = useMemo(
    () => new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(2.02, 2)),
    [],
  );
  const paneledGeo = useMemo(() => buildPaneledGeometry(2, 2, 0.16, 0.07, true, -0.4), []);
  const gridGeo = useMemo(() => (new THREE.GridHelper(30, 30).geometry as THREE.BufferGeometry), []);

  useFrame((state, delta) => {
    const raw = progress.get();
    const p = reducedMotion ? snap(raw) : raw;
    const t = state.clock.getElapsedTime();
    const rot = rotRef.current;
    if (!rot) return;

    // rotation + scale
    rot.rotation.y = p * Math.PI * 1.15 + (reducedMotion ? 0 : t * 0.045);
    rot.rotation.x = keyframe(p, [[0, 0.05], [S[3], -0.1], [S[5], -0.22], [1, 0.05]]);
    const scale = keyframe(p, [
      [0, 1.0], [S[1], 0.9], [S[2], 1.05], [S[3], 1.05], [S[4], 0.8], [S[5], 0.78], [S[6], 0.55], [1, 0.95],
    ]);
    rot.scale.setScalar(scale + (reducedMotion ? 0 : Math.sin(t * 0.5) * 0.006));
    // lower the object onto the pedestal for the resolved product shot
    rot.position.y = keyframe(p, [[S[4] + 0.02, 0], [S[5], -0.72], [S[5] + 0.05, 0]]);

    // icosphere solid — faces fill (form) → full metallic (material) → gone by prototype
    const solid = isoSolidRef.current!.material as THREE.MeshStandardMaterial;
    solid.opacity = keyframe(p, [
      [0, 0.05], [S[1], 0.02], [S[2], 0.34], [S[3], 0.98], [S[4] - 0.02, 0.2], [S[4], 0.0],
    ]);
    solid.metalness = keyframe(p, [[0, 0.1], [S[2], 0.45], [S[3], 0.95]]);
    solid.roughness = keyframe(p, [[0, 0.7], [S[2], 0.4], [S[3], 0.15]]);
    isoSolidRef.current!.visible = solid.opacity > 0.001;

    // icosphere wireframe
    const wire = isoWireRef.current!.material as THREE.LineBasicMaterial;
    wire.opacity = keyframe(p, [
      [0, 0.85], [S[1], 0.4], [S[2], 0.72], [S[3], 0.28], [S[4], 0.0], [S[6], 0.0], [0.94, 0.0], [1, 0.5],
    ]);
    isoWireRef.current!.visible = wire.opacity > 0.001;

    // paneled specimen — cross-fades in over material→prototype, holds to resolved
    const pan = paneledRef.current!.material as THREE.MeshStandardMaterial;
    pan.opacity = keyframe(p, [[S[3], 0.0], [S[4], 1.0], [S[5], 1.0], [S[5] + 0.06, 0.0]]);
    paneledRef.current!.visible = pan.opacity > 0.001;

    // grid floor
    const gridMat = gridRef.current!.material as THREE.LineBasicMaterial;
    gridMat.opacity = keyframe(p, [[S[3] + 0.03, 0.0], [S[4], 0.3], [S[5], 0.36], [S[6], 0.42], [0.96, 0.0]]);
    gridRef.current!.visible = gridMat.opacity > 0.001;

    // pedestal (resolved)
    const ped = pedestalRef.current!.material as THREE.MeshStandardMaterial;
    ped.opacity = keyframe(p, [[S[4], 0.0], [S[5] - 0.03, 0.0], [S[5], 1.0], [S[5] + 0.06, 0.0]]);
    pedestalRef.current!.visible = ped.opacity > 0.001;

    // origin point glow (hero + your-turn)
    const oMat = originRef.current!.material as THREE.MeshBasicMaterial;
    oMat.opacity = keyframe(p, [
      [0, 1.0], [0.055, 0.12], [S[4], 0.0], [S[6], 1.0], [S[6] + 0.08, 1.0], [0.97, 0.2],
    ]);
    const pulse = reducedMotion ? 1 : 0.78 + Math.sin(t * 2.4) * 0.22;
    originRef.current!.scale.setScalar((0.9 + oMat.opacity * 0.5) * pulse);
    originRef.current!.visible = oMat.opacity > 0.001;

    // resolved product lighting
    const key = keyframe(p, [[S[4], 0.0], [S[5], 9.0], [S[5] + 0.06, 0.0]]);
    const rim = keyframe(p, [[S[4], 0.0], [S[5], 5.0], [S[5] + 0.06, 0.0]]);
    if (keyLightRef.current) keyLightRef.current.intensity = key;
    if (rimLightRef.current) rimLightRef.current.intensity = rim;
  });

  return (
    <group position={[objX, objY, 0]}>
      {/* rotating object */}
      <group ref={rotRef}>
        <mesh ref={isoSolidRef} geometry={isoSolidGeo}>
          <meshPhysicalMaterial
            color="#c3cce6"
            flatShading
            transparent
            opacity={0.05}
            metalness={0.55}
            roughness={0.28}
            iridescence={1}
            iridescenceIOR={1.35}
            clearcoat={0.6}
            envMapIntensity={1.8}
          />
        </mesh>
        <lineSegments ref={isoWireRef} geometry={isoEdgesGeo}>
          <lineBasicMaterial color="#9db8ff" transparent opacity={0.85} />
        </lineSegments>
        <mesh ref={paneledRef} geometry={paneledGeo} visible={false}>
          <meshPhysicalMaterial
            color="#39415c"
            flatShading
            transparent
            opacity={0}
            metalness={0.9}
            roughness={0.28}
            iridescence={0.7}
            iridescenceIOR={1.3}
            clearcoat={0.5}
            envMapIntensity={1.7}
          />
        </mesh>
      </group>

      {/* static staging */}
      <lineSegments ref={gridRef} geometry={gridGeo} position={[0, -1.7, 0]} visible={false}>
        <lineBasicMaterial color="#3a3f48" transparent opacity={0} />
      </lineSegments>
      <mesh ref={pedestalRef} position={[0, -1.3, 0]} visible={false}>
        <cylinderGeometry args={[1.45, 1.7, 0.4, 72]} />
        <meshStandardMaterial color="#0c0d10" transparent opacity={0} metalness={0.4} roughness={0.55} />
      </mesh>

      {/* origin point */}
      <mesh ref={originRef}>
        <sphereGeometry args={[0.08, 20, 20]} />
        <meshBasicMaterial color="#7cc0ff" transparent opacity={1} toneMapped={false} />
      </mesh>
      <pointLight position={[0, 0, 0.6]} intensity={0.5} color="#4da3ff" distance={4} />

      {/* resolved product lights — colored for a premium studio look */}
      <pointLight ref={keyLightRef} position={[0.8, 3, 2.6]} intensity={0} distance={16} decay={2} color="#eaf1ff" />
      <pointLight ref={rimLightRef} position={[-1.8, 1.2, -3]} intensity={0} distance={13} decay={2} color="#1fd6ec" />
    </group>
  );
}

/** Camera dolly driven by scroll. */
function Rig({ progress, reducedMotion, isMobile }: SceneProps) {
  const { camera } = useThree();
  const zMul = isMobile ? 1.85 : 1;
  useFrame((_, delta) => {
    const p = reducedMotion ? snap(progress.get()) : progress.get();
    const z = keyframe(p, [[0, 6.2], [S[3], 5.4], [S[4], 5.7], [S[5], 5.6], [S[6], 6.4], [1, 6.6]]) * zMul;
    const y = keyframe(p, [[0, 0], [S[5], 0.15], [S[6], 0.35], [1, 0]]);
    const lookY = keyframe(p, [[0, 0], [S[5], -0.32], [S[6], -0.35], [1, 0]]);
    // Keep the camera looking at world origin so the object (offset to +OBJECT_X)
    // renders right-of-centre, clearing the left text column.
    if (reducedMotion) {
      // fully static — snap to the (scene-snapped) target, no damping jitter
      camera.position.set(0, y, z);
    } else {
      camera.position.x = THREE.MathUtils.damp(camera.position.x, 0, 3, delta);
      camera.position.y = THREE.MathUtils.damp(camera.position.y, y, 3, delta);
      camera.position.z = THREE.MathUtils.damp(camera.position.z, z, 3, delta);
    }
    camera.lookAt(0, lookY, 0);
  });
  return null;
}

function snap(p: number) {
  return Math.round(p * 7) / 7;
}

interface HeroSceneProps {
  progress: MotionValue<number>;
  reducedMotion?: boolean;
}

export default function HeroScene({ progress, reducedMotion = false }: HeroSceneProps) {
  const isMobile = useIsMobile();
  return (
    <div className="fixed inset-0 z-0" aria-hidden="true">
      <div
        className="absolute inset-0"
        style={{
          background: isMobile
            ? "radial-gradient(120% 55% at 50% 28%, rgba(45,80,155,0.32) 0%, rgba(20,30,60,0.1) 38%, rgba(6,7,14,0) 58%, rgba(5,6,12,0.96) 100%)"
            : "radial-gradient(85% 80% at 63% 44%, rgba(45,80,160,0.34) 0%, rgba(22,34,72,0.12) 34%, rgba(6,7,14,0) 56%, rgba(4,5,11,0.94) 100%)",
        }}
      />
      <Canvas
        camera={{ position: [0, 0, 6.2], fov: 42 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      >
        <ambientLight intensity={0.3} />
        <directionalLight position={[5, 5, 6]} intensity={0.8} color="#dbe6ff" />
        <directionalLight position={[-5, -2, 3]} intensity={0.4} color="#5a8bff" />
        <Environment resolution={96}>
          <Lightformer intensity={1.7} position={[0, 4, 6]} scale={[8, 5, 1]} color="#e6efff" />
          <Lightformer intensity={1.3} position={[-6, 2, -4]} scale={[5, 5, 1]} color="#3d84ff" />
          <Lightformer intensity={1.0} position={[6, -1, -2]} scale={[4, 4, 1]} color="#1fd6ec" />
          <Lightformer intensity={0.8} position={[0, -5, 3]} scale={[5, 3, 1]} color="#8f6bff" />
        </Environment>
        <Objects progress={progress} reducedMotion={reducedMotion} isMobile={isMobile} />
        <Rig progress={progress} reducedMotion={reducedMotion} isMobile={isMobile} />
      </Canvas>
    </div>
  );
}
