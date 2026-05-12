import { Environment, Lightformer } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import type { MotionValue } from "framer-motion";
import { useRef } from "react";
import * as THREE from "three";
import MorphingAssembly from "./MorphingAssembly";

interface StorySceneProps {
  scrollYProgress: MotionValue<number>;
  cameraX: MotionValue<number>;
  cameraY: MotionValue<number>;
  isMobile: boolean;
}

const StoryScene = ({ scrollYProgress, cameraX, cameraY, isMobile }: StorySceneProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const { camera } = useThree();

  useFrame((state, delta) => {
    const progress = scrollYProgress.get();
    const driftX = cameraX.get();
    const driftY = cameraY.get();

    camera.position.x = THREE.MathUtils.damp(camera.position.x, driftX, 2.5, delta);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, driftY, 2.5, delta);
    camera.position.z = THREE.MathUtils.damp(camera.position.z, 7, 2.5, delta);
    camera.lookAt(0, 0, 0);

    if (groupRef.current) {
      const idle = Math.sin(state.clock.elapsedTime * 0.35) * 0.04;
      groupRef.current.rotation.y = idle + progress * 0.4;
      groupRef.current.rotation.x = idle * 0.4 + progress * 0.15;
    }
  });

  return (
    <>
      <ambientLight intensity={0.45} />
      <directionalLight position={[4, 4, 6]} intensity={0.7} />
      <directionalLight position={[-4, -2, 4]} intensity={0.35} />
      <pointLight position={[0, 2.5, 4]} intensity={0.4} />
      <Environment resolution={64}>
        <Lightformer intensity={1.2} position={[0, 4, 6]} scale={[6, 4, 1]} />
        <Lightformer intensity={0.7} position={[-5, 2, -4]} scale={[4, 3, 1]} />
        <Lightformer intensity={0.6} position={[5, -2, -2]} scale={[3, 2, 1]} />
      </Environment>
      <group ref={groupRef}>
        <MorphingAssembly scrollYProgress={scrollYProgress} isMobile={isMobile} />
      </group>
    </>
  );
};

export default StoryScene;
