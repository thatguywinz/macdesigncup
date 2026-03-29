import { motion } from 'framer-motion';

const HeroSection = () => {
  return (
    <section className="min-h-screen flex flex-col items-center justify-center relative z-10">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5, delay: 0.3 }}
        className="text-center"
      >
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="section-text tracking-[0.3em] uppercase mb-6"
        >
          Mackenzie Design Cup
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="text-7xl md:text-9xl lg:text-[12rem] font-display font-medium tracking-tighter leading-none text-foreground"
        >
          MDC 2026
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1.2 }}
          className="section-text mt-8 tracking-[0.2em] uppercase text-base"
        >
          Design the Future
        </motion.p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 2 }}
        className="absolute bottom-12 flex flex-col items-center gap-2"
      >
        <span className="section-text text-sm tracking-[0.2em] uppercase">Scroll</span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          className="w-px h-8 bg-accent"
        />
      </motion.div>
    </section>
  );
};

export default HeroSection;
