import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import type { MotionValue } from "framer-motion";
import { useMemo, useRef } from "react";
import * as THREE from "three";

interface MorphingAssemblyProps {
  scrollYProgress: MotionValue<number>;
  isMobile: boolean;
}

type StageName = "car" | "bridge" | "medical" | "robot" | "final";

const stageStops = [0, 0.23, 0.48, 0.72, 0.9, 1];
const stageNames: StageName[] = ["car", "bridge", "medical", "robot", "final"];

const partScales: [number, number, number][] = [
  [2.2, 0.6, 1],
  [1.2, 0.8, 0.9],
  [1.0, 0.45, 0.8],
  [1.0, 0.45, 0.8],
  [0.5, 0.5, 0.5],
  [0.5, 0.5, 0.5],
  [0.5, 0.5, 0.5],
  [0.5, 0.5, 0.5],
  [2.0, 0.25, 0.2],
  [2.0, 0.25, 0.2],
  [0.4, 0.9, 0.4],
  [0.4, 0.9, 0.4],
];

const partAccents = [
  false,
  false,
  false,
  false,
  true,
  true,
  true,
  true,
  false,
  false,
  true,
  true,
];

const explodeDirections: [number, number, number][] = [
  [0, 0, 0],
  [0, 1, 0],
  [-1, 0, 0],
  [1, 0, 0],
  [0, -1, 0],
  [0, -1, 0],
  [0, -1, 0],
  [0, -1, 0],
  [0, 0, 1],
  [0, 0, -1],
  [0, 1, 0],
  [0, 1, 0],
];

const stagePositions: Record<StageName, [number, number, number][]> = {
  car: [
    [0, 0, 0],
    [0.1, 0.55, 0],
    [-1.1, 0.2, 0],
    [1.1, 0.15, 0],
    [-1.0, -0.45, 0.7],
    [-1.0, -0.45, -0.7],
    [1.0, -0.45, 0.7],
    [1.0, -0.45, -0.7],
    [0, 0.15, 1.0],
    [0, 0.15, -1.0],
    [-0.3, 0.25, 0],
    [0.3, 0.25, 0],
  ],
  bridge: [
    [0, -0.1, 0],
    [-1.8, 0.6, 0],
    [0, -0.1, 0],
    [1.8, 0.6, 0],
    [-1.8, -0.8, 0.6],
    [-1.8, -0.8, -0.6],
    [1.8, -0.8, 0.6],
    [1.8, -0.8, -0.6],
    [-0.9, 0.2, 0.6],
    [0.9, 0.2, -0.6],
    [-0.6, 0.4, 0],
    [0.6, 0.4, 0],
  ],
  medical: [
    [0, -0.1, 0],
    [0.4, 0.3, 0],
    [-0.4, 0.3, 0],
    [0, 0.6, 0],
    [-0.5, -0.3, 0.4],
    [-0.5, -0.3, -0.4],
    [0.5, -0.3, 0.4],
    [0.5, -0.3, -0.4],
    [0, 0.1, 0.6],
    [0, 0.1, -0.6],
    [-0.2, 0.5, 0.2],
    [0.2, 0.5, -0.2],
  ],
  robot: [
    [0, -0.8, 0],
    [0, 0.0, 0],
    [0, 0.6, 0],
    [0.4, 1.1, 0],
    [-0.4, -0.9, 0.6],
    [-0.4, -0.9, -0.6],
    [0.4, -0.9, 0.6],
    [0.4, -0.9, -0.6],
    [0.7, 1.4, 0.5],
    [0.7, 1.4, -0.5],
    [-0.6, 0.3, 0.3],
    [0.6, 0.3, -0.3],
  ],
  final: [
    [0, 0, 0],
    [0.8, 0.2, 0],
    [-0.8, 0.2, 0],
    [0, -0.6, 0],
    [1.0, -0.3, 0.5],
    [1.0, -0.3, -0.5],
    [-1.0, -0.3, 0.5],
    [-1.0, -0.3, -0.5],
    [0, 0.8, 0.7],
    [0, 0.8, -0.7],
    [0.4, 0.6, 0],
    [-0.4, 0.6, 0],
  ],
};

const stageRotations: Record<StageName, [number, number, number][]> = {
  car: partScales.map(() => [0, 0, 0]),
  bridge: partScales.map((_, index) =>
    index === 8 || index === 9 ? [0, 0, Math.PI / 2] : [0, 0, 0]
  ),
  medical: partScales.map(() => [0, 0, 0]),
  robot: partScales.map((_, index) =>
    index === 3 ? [0, 0.4, 0] : [0, 0, 0]
  ),
  final: partScales.map(() => [0, 0, 0]),
};

const stageScaleMultipliers: Record<StageName, number> = {
  car: 1,
  bridge: 1.05,
  medical: 0.7,
  robot: 1.15,
  final: 0.85,
};

const smoothstep = (t: number) => t * t * (3 - 2 * t);

const getStageData = (progress: number) => {
  const clamped = THREE.MathUtils.clamp(progress, 0, 1);
  let stageIndex = 0;
  for (let i = 0; i < stageStops.length - 1; i += 1) {
    if (clamped >= stageStops[i] && clamped <= stageStops[i + 1]) {
      stageIndex = i;
      break;
    }
  }
  const start = stageStops[stageIndex];
  const end = stageStops[stageIndex + 1];
  const local = (clamped - start) / (end - start || 1);

  return {
    stageIndex,
    local,
    fromStage: stageNames[stageIndex],
    toStage: stageNames[Math.min(stageIndex + 1, stageNames.length - 1)],
  };
};

const getExplodeStrength = (stage: StageName, local: number) => {
  if (stage === "car") {
    return smoothstep(Math.max(0, (local - 0.2) / 0.8)) * 0.4;
  }
  if (stage === "bridge") {
    return smoothstep(Math.max(0, (local - 0.55) / 0.45)) * 0.85;
  }
  if (stage === "medical") {
    return 0.25;
  }
  if (stage === "robot") {
    return smoothstep(Math.max(0, (local - 0.5) / 0.5)) * 0.75;
  }
  return 0;
};

const getWireOpacity = (stage: StageName, local: number) => {
  if (stage === "bridge") {
    return THREE.MathUtils.lerp(0.9, 0.2, smoothstep(local));
  }
  if (stage === "medical") {
    return 0.35;
  }
  if (stage === "robot") {
    return 0.25;
  }
  return 0.45;
};

const getSolidOpacity = (stage: StageName, local: number) => {
  if (stage === "bridge") {
    return THREE.MathUtils.lerp(0.15, 0.85, smoothstep(local));
  }
  if (stage === "final") {
    return THREE.MathUtils.lerp(0.5, 0.9, smoothstep(local));
  }
  return 0.85;
};

const MorphingAssembly = ({ scrollYProgress, isMobile }: MorphingAssemblyProps) => {
  const { nodes } = useGLTF("/models/mdc-part.gltf");
  const geometry = (nodes.Part as THREE.Mesh).geometry;
  const partRefs = useRef<THREE.Group[]>([]);

  const baseMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#EAEAEA",
        roughness: 0.65,
        metalness: 0.1,
        transparent: true,
      }),
    []
  );
  const accentMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#3B82F6",
        roughness: 0.4,
        metalness: 0.5,
        transparent: true,
      }),
    []
  );
  const wireMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: "#94A3B8",
        wireframe: true,
        transparent: true,
        opacity: 0.35,
      }),
    []
  );

  useFrame((_, delta) => {
    const progress = scrollYProgress.get();
    const { stageIndex, local, fromStage, toStage } = getStageData(progress);
    const transition = smoothstep(local);
    const mobileScale = isMobile ? 0.88 : 1;
    const explodeStrength = getExplodeStrength(fromStage, local) * (isMobile ? 0.45 : 1);
    const wireOpacity = isMobile ? 0 : getWireOpacity(fromStage, local);
    const solidOpacity = getSolidOpacity(fromStage, local);

    baseMaterial.opacity = solidOpacity;
    accentMaterial.opacity = solidOpacity;
    wireMaterial.opacity = wireOpacity;

    const fromPositions = stagePositions[fromStage];
    const toPositions = stagePositions[toStage];
    const fromRotations = stageRotations[fromStage];
    const toRotations = stageRotations[toStage];
    const fromScaleMultiplier = stageScaleMultipliers[fromStage];
    const toScaleMultiplier = stageScaleMultipliers[toStage];

    partRefs.current.forEach((part, index) => {
      if (!part) return;

      const fromPos = fromPositions[index];
      const toPos = toPositions[index];
      const targetX = THREE.MathUtils.lerp(fromPos[0], toPos[0], transition);
      const targetY = THREE.MathUtils.lerp(fromPos[1], toPos[1], transition);
      const targetZ = THREE.MathUtils.lerp(fromPos[2], toPos[2], transition);

      const explode = explodeDirections[index];
      const explodeX = targetX + explode[0] * explodeStrength;
      const explodeY = targetY + explode[1] * explodeStrength;
      const explodeZ = targetZ + explode[2] * explodeStrength;

      part.position.x = THREE.MathUtils.damp(part.position.x, explodeX, 6, delta);
      part.position.y = THREE.MathUtils.damp(part.position.y, explodeY, 6, delta);
      part.position.z = THREE.MathUtils.damp(part.position.z, explodeZ, 6, delta);

      const fromRot = fromRotations[index];
      const toRot = toRotations[index];
      const rotX = THREE.MathUtils.lerp(fromRot[0], toRot[0], transition);
      const rotY = THREE.MathUtils.lerp(fromRot[1], toRot[1], transition);
      const rotZ = THREE.MathUtils.lerp(fromRot[2], toRot[2], transition);

      part.rotation.x = THREE.MathUtils.damp(part.rotation.x, rotX, 6, delta);
      part.rotation.y = THREE.MathUtils.damp(part.rotation.y, rotY, 6, delta);
      part.rotation.z = THREE.MathUtils.damp(part.rotation.z, rotZ, 6, delta);

      const baseScale = partScales[index];
      const scaleFactor = THREE.MathUtils.lerp(fromScaleMultiplier, toScaleMultiplier, transition) * mobileScale;
      const targetScaleX = baseScale[0] * scaleFactor;
      const targetScaleY = baseScale[1] * scaleFactor;
      const targetScaleZ = baseScale[2] * scaleFactor;

      part.scale.x = THREE.MathUtils.damp(part.scale.x, targetScaleX, 6, delta);
      part.scale.y = THREE.MathUtils.damp(part.scale.y, targetScaleY, 6, delta);
      part.scale.z = THREE.MathUtils.damp(part.scale.z, targetScaleZ, 6, delta);
    });
  });

  const partsToRender = partScales.map((scale, index) => ({
    key: `part-${index}`,
    accent: partAccents[index],
    scale,
    index,
  }));

  const visibleCount = isMobile ? 8 : partsToRender.length;

  return (
    <>
      {partsToRender.slice(0, visibleCount).map((part) => (
        <group
          key={part.key}
          ref={(node) => {
            if (node) partRefs.current[part.index] = node;
          }}
        >
          <mesh geometry={geometry} material={part.accent ? accentMaterial : baseMaterial} />
          {!isMobile && <mesh geometry={geometry} material={wireMaterial} />}
        </group>
      ))}
    </>
  );
};

useGLTF.preload("/models/mdc-part.gltf");

export default MorphingAssembly;
