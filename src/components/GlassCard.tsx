import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

interface GlassCardProps {
  text: string;
  index: number;
}

const GlassCard = ({ text, index }: GlassCardProps) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, amount: 0.5 });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.6, delay: index * 0.2 }}
      className="glass-panel p-8 md:p-10"
    >
      <p className="section-subheading text-xl md:text-2xl">{text}</p>
    </motion.div>
  );
};

export default GlassCard;
