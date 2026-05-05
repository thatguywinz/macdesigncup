import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import type { MotionValue } from "framer-motion";
import StoryScene from "./StoryScene";
import Fallback3D from "./Fallback3D";

interface SceneCanvasProps {
  scrollYProgress: MotionValue<number>;
  cameraX: MotionValue<number>;
  cameraY: MotionValue<number>;
}

const SceneCanvas = ({ scrollYProgress, cameraX, cameraY }: SceneCanvasProps) => {
  const isMobile = useIsMobile();

  return (
    <div
      className={cn(
        "pointer-events-none relative z-0 h-[45vh] w-full",
        "md:fixed md:right-0 md:top-0 md:h-full md:w-[60%]"
      )}
    >
      <Canvas
        camera={{ position: [0, 0, 7], fov: 42 }}
        dpr={isMobile ? 1 : [1, 1.3]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        style={{ background: "transparent" }}
        fallback={<Fallback3D />}
      >
        <Suspense fallback={null}>
          <StoryScene
            scrollYProgress={scrollYProgress}
            cameraX={cameraX}
            cameraY={cameraY}
            isMobile={isMobile}
          />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default SceneCanvas;
