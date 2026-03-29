import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface MorphingObjectProps {
  scrollProgress: number;
}

const MorphingObject = ({ scrollProgress }: MorphingObjectProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const wireframeRef = useRef<THREE.LineSegments>(null);

  // Create icosahedron geometry with different detail levels
  const baseGeometry = useMemo(() => new THREE.IcosahedronGeometry(2, 3), []);
  const wireframeGeometry = useMemo(() => new THREE.IcosahedronGeometry(2.05, 2), []);
  const edgesGeometry = useMemo(() => new THREE.EdgesGeometry(wireframeGeometry), [wireframeGeometry]);

  useFrame((state) => {
    if (!meshRef.current || !wireframeRef.current) return;

    const t = state.clock.getElapsedTime();

    // Smooth rotation tied to scroll + ambient
    meshRef.current.rotation.x = scrollProgress * Math.PI * 0.5 + t * 0.05;
    meshRef.current.rotation.y = scrollProgress * Math.PI * 0.8 + t * 0.08;
    wireframeRef.current.rotation.copy(meshRef.current.rotation);

    // Scale morphing based on scroll
    const baseScale = 1 + scrollProgress * 0.3;
    const breathe = Math.sin(t * 0.5) * 0.02;
    const scale = baseScale + breathe;
    meshRef.current.scale.setScalar(scale);
    wireframeRef.current.scale.setScalar(scale);

    // Morph vertices based on scroll
    const positions = meshRef.current.geometry.attributes.position;
    const basePositions = baseGeometry.attributes.position;

    for (let i = 0; i < positions.count; i++) {
      const bx = basePositions.getX(i);
      const by = basePositions.getY(i);
      const bz = basePositions.getZ(i);

      const noise = Math.sin(bx * 2 + t * 0.3) * Math.cos(by * 2 + t * 0.2) * Math.sin(bz * 2 + t * 0.4);
      const morphAmount = 0.15 * (1 - scrollProgress * 0.5);

      positions.setXYZ(
        i,
        bx + noise * morphAmount,
        by + noise * morphAmount * 0.8,
        bz + noise * morphAmount * 0.6
      );
    }
    positions.needsUpdate = true;
    meshRef.current.geometry.computeVertexNormals();

    // Material transitions
    const solidMat = meshRef.current.material as THREE.MeshPhysicalMaterial;
    solidMat.opacity = THREE.MathUtils.lerp(0.05, 0.35, scrollProgress);
    solidMat.roughness = THREE.MathUtils.lerp(0.6, 0.15, scrollProgress);
    solidMat.metalness = THREE.MathUtils.lerp(0.1, 0.8, scrollProgress);

    const wireMat = wireframeRef.current.material as THREE.LineBasicMaterial;
    wireMat.opacity = THREE.MathUtils.lerp(0.6, 0.2, scrollProgress);
  });

  return (
    <group>
      {/* Solid surface */}
      <mesh ref={meshRef} geometry={baseGeometry.clone()}>
        <meshPhysicalMaterial
          color="#aaaaaa"
          transparent
          opacity={0.1}
          roughness={0.5}
          metalness={0.3}
          transmission={0.4}
          thickness={1.5}
          envMapIntensity={0.5}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Wireframe overlay */}
      <lineSegments ref={wireframeRef} geometry={edgesGeometry}>
        <lineBasicMaterial
          color="#666666"
          transparent
          opacity={0.5}
          linewidth={1}
        />
      </lineSegments>
    </group>
  );
};

export default MorphingObject;
