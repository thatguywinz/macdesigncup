import { motion, useReducedMotion } from "framer-motion";
import { CONTACT_EMAIL } from "@/config/site";
import { Link } from "react-router-dom";
import {
  InfiniteSlider,
  InfiniteSliderContent,
  InfiniteSliderItem,
} from "@/components/core/infinite-slider";

// Import sponsor logos
import stratasysLogo from "@/components/sponsor-images/Stratasys.png";
import agileLogo from "@/components/sponsor-images/agile.png";
import georgebrownLogo from "@/components/sponsor-images/georgebrown.png";
import shop3dcaLogo from "@/components/sponsor-images/shop3dca.png";
import wlmacLogo from "@/components/sponsor-images/wlmac.png";

const SPONSORS = [
  { name: "Stratasys", logo: stratasysLogo },
  { name: "Agile", logo: agileLogo },
  { name: "George Brown College", logo: georgebrownLogo },
  { name: "Shop3D.ca", logo: shop3dcaLogo },
  { name: "WLMac", logo: wlmacLogo },
];

const EASE = [0.22, 1, 0.36, 1];

export default function SponsorsSection() {
  const reduce = useReducedMotion();

  const reveal = (delay = 0) => ({
    initial: reduce ? false : ({ opacity: 0, y: 22 } as const),
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-80px" } as const,
    transition: { duration: 0.8, ease: EASE, delay },
  });

  return (
    <section id="sponsors" className="relative z-10 border-t border-line px-5 py-24 md:px-10 md:py-32">
      <div className="mx-auto max-w-[1300px]">
        {/* Header */}
        <div className="mb-6 flex items-baseline gap-4">
          <span className="mono-label whitespace-nowrap !text-foreground/70">[ 03 · Sponsors & Prizes ]</span>
          <span className="ember-rule flex-1 opacity-40" aria-hidden="true" />
        </div>

        <motion.h2 {...reveal()} className="display-scene mb-8">
          <span className="block">The sponsor</span>
          <span className="wire-text block">wall.</span>
        </motion.h2>

        <motion.p
          {...reveal(0.1)}
          className="max-w-xl font-body text-base font-light leading-relaxed text-concrete"
        >
          Food, swag and awards for a hall full of young designers happen because
          sponsors put their name on the wall. The wall is going up right now:
          logos land here as partners confirm.
        </motion.p>

        {/* Sponsor Grid: Slots 1-3 Infinite Carousel + Slot 4 "Your Logo Here" */}
        <motion.div {...reveal(0.18)} className="mt-12 grid grid-cols-1 lg:grid-cols-4 gap-5 items-stretch">
          
          {/* Infinite Carousel (Spans first 3 columns) */}
          <div className="lg:col-span-3 border border-dashed border-line bg-background/40 flex items-center overflow-hidden min-h-[150px]">
            <InfiniteSlider speedOnHover={20} gap={24} className="w-full">
              <InfiniteSliderContent>
                {SPONSORS.map((sponsor, index) => (
                  <InfiniteSliderItem
                    key={index}
                    className="basis-full sm:basis-1/2 md:basis-1/3 shrink-0 flex items-center justify-center p-4"
                  >
                    <div className="flex min-h-[120px] w-full items-center justify-center bg-background/20 p-4 rounded-[4px]">
                      <img
                        src={sponsor.logo}
                        alt={sponsor.name}
                        className="max-h-16 max-w-[140px] object-contain"
                      />
                    </div>
                  </InfiniteSliderItem>
                ))}
              </InfiniteSliderContent>
            </InfiniteSlider>
          </div>

          {/* S.04 "Your Logo Here" Stationary Card (4th Column) */}
          <Link
            to="/partner"
            className="group flex min-h-[150px] flex-col items-center justify-center gap-3 border border-dashed border-ember/50 bg-background/40 p-6 transition-all duration-300 hover:border-ember hover:shadow-[0_0_36px_hsl(24_100%_54%/0.15)] lg:col-span-1"
          >
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ember/90">S.04</span>
            <span className="font-display text-center text-xl uppercase tracking-[0.02em] text-foreground transition-colors group-hover:text-ember">
              Your logo here<br />
              Become a Partner ↗
            </span>
          </Link>
        </motion.div>

        {/* Prizes Ledger Footer */}
        <motion.div
          {...reveal(0.26)}
          className="mt-12 flex flex-col gap-6 border-t border-line pt-8 md:flex-row md:items-center md:justify-between"
        >
          <dl className="flex flex-wrap gap-x-10 gap-y-4">
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-[0.3em] text-ember/90">Top builds</dt>
              <dd className="mt-2 font-mono text-[11px] uppercase tracking-[0.14em] text-foreground/80">
                Awards, on stage
              </dd>
            </div>
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-[0.3em] text-ember/90">Every builder</dt>
              <dd className="mt-2 font-mono text-[11px] uppercase tracking-[0.14em] text-foreground/80">
                Swag + food
              </dd>
            </div>
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-[0.3em] text-ember/90">Full prize table</dt>
              <dd className="mt-2 font-mono text-[11px] uppercase tracking-[0.14em] text-foreground/80">
                Drops with the sponsor lineup
              </dd>
            </div>
          </dl>
          <a
            href={`mailto:${CONTACT_EMAIL}?subject=Sponsoring%20the%20Mac%20Design%20Cup`}
            className="btn-ghost shrink-0 px-7 py-3.5"
          >
            Sponsor the cup ↗
          </a>
        </motion.div>
      </div>
    </section>
  );
}