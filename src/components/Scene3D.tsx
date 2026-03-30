import { Canvas } from '@react-three/fiber';

import MorphingObject from './MorphingObject';

interface Scene3DProps {
  scrollProgress: number;
}

const Scene3D = ({ scrollProgress }: Scene3DProps) => {
  return (
    <div className="fixed inset-0 z-0">
      <Canvas
        camera={{ position: [0, 0, 6], fov: 45 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 5, 5]} intensity={0.6} />
        <directionalLight position={[-3, -3, 2]} intensity={0.3} />
        <pointLight position={[0, 3, 4]} intensity={0.4} color="#ffffff" />
        {/* Removed Environment preset to avoid HDR fetch errors */}
        <MorphingObject scrollProgress={scrollProgress} />
      </Canvas>
    </div>
  );
};

export default Scene3D;
