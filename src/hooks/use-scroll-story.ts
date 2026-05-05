import { useScroll, useTransform } from "framer-motion";

export const useScrollStory = () => {
  const { scrollYProgress } = useScroll();
  const cameraX = useTransform(scrollYProgress, [0, 1], [0.4, -0.35]);
  const cameraY = useTransform(scrollYProgress, [0, 1], [0.15, -0.2]);
  const storyProgress = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return { scrollYProgress, storyProgress, cameraX, cameraY };
};
