import { motion, useInView } from "framer-motion";
import { useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionWrapperProps {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  id?: string;
}

const SectionWrapper = ({ children, className, contentClassName, id }: SectionWrapperProps) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, amount: 0.35 });

  return (
    <section
      ref={ref}
      id={id}
      className={cn("relative z-10 flex min-h-screen items-center", className)}
    >
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
        transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
        className={cn("w-full max-w-xl px-6 md:px-12", contentClassName)}
      >
        {children}
      </motion.div>
    </section>
  );
};

export default SectionWrapper;
