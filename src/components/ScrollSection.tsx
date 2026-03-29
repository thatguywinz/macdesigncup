import { motion, useInView } from 'framer-motion';
import { useRef, type ReactNode } from 'react';

interface ScrollSectionProps {
  children: ReactNode;
  className?: string;
  id?: string;
}

const ScrollSection = ({ children, className = '', id }: ScrollSectionProps) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, amount: 0.3 });

  return (
    <section
      ref={ref}
      id={id}
      className={`min-h-screen flex items-center justify-center relative z-10 ${className}`}
    >
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
        transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="w-full max-w-5xl mx-auto px-6 md:px-12"
      >
        {children}
      </motion.div>
    </section>
  );
};

export default ScrollSection;
