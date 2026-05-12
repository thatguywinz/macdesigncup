import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

interface TimelineStepProps {
  step: string;
  title: string;
  index: number;
}

const TimelineStep = ({ step, title, index }: TimelineStepProps) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, amount: 0.5 });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: -30 }}
      animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -30 }}
      transition={{ duration: 0.6, delay: index * 0.15 }}
      className="flex items-center gap-6 py-4"
    >
      <div className="glass-panel w-12 h-12 flex items-center justify-center flex-shrink-0">
        <span className="font-body text-sm font-semibold text-foreground">{step}</span>
      </div>
      <span className="font-body text-lg md:text-xl font-light tracking-wide text-foreground">{title}</span>
    </motion.div>
  );
};

export default TimelineStep;
