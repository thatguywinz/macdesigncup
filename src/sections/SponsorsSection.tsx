import { motion, useReducedMotion } from "framer-motion";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
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

/**
 * Every logo is a cut-out rendered as a one-colour bone knockout (see
 * `.sponsor-logo` in index.css), so the wall reads as one set on the dark
 * concrete instead of five different plates. `size` balances them optically —
 * a wide wordmark and a square crest can't share a single cap.
 *
 * Adding a sponsor: key the white/cream plate out of the file to real
 * transparency and trim the empty margin first, or it lands here as a lit
 * rectangle floating on the concrete.
 */
const SPONSORS = [
  {
    name: "Stratasys",
    logo: stratasysLogo,
    href: "https://www.stratasys.com/",
    size: "max-h-[72px] max-w-[236px]",
  },
  {
    name: "Agile Manufacturing",
    logo: agileLogo,
    href: "https://agile-manufacturing.com/",
    size: "max-h-[86px] max-w-[190px]",
  },
  {
    name: "George Brown College",
    logo: georgebrownLogo,
    href: "https://www.georgebrown.ca/",
    size: "max-h-[84px] max-w-[200px]",
  },
  {
    // TODO: swap in a higher-resolution Shop3D.ca mark — this file is 245px wide.
    name: "Shop3D.ca",
    logo: shop3dcaLogo,
    href: "https://shop3d.ca/",
    size: "max-h-[40px] max-w-[228px]",
  },
  {
    name: "William Lyon Mackenzie CI",
    logo: wlmacLogo,
    href: "https://wlmac.ca/",
    size: "max-h-[100px] max-w-[200px]",
  },
];

const EASE = [0.22, 1, 0.36, 1];

function SponsorLogo({
  sponsor,
  inert = false,
}: {
  sponsor: (typeof SPONSORS)[number];
  /** Part of the rail's duplicated tail: visible, but not for keyboards or AT. */
  inert?: boolean;
}) {
  return (
    <a
      href={sponsor.href}
      target="_blank"
      rel="noopener noreferrer"
      tabIndex={inert ? -1 : undefined}
      className="sponsor-logo flex min-h-[150px] w-full items-center justify-center p-4 focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-ember"
    >
      <img
        src={sponsor.logo}
        alt={sponsor.name}
        className={cn("h-auto w-auto object-contain", sponsor.size)}
        loading="lazy"
      />
    </a>
  );
}

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
          <div className="lg:col-span-3 border border-dashed border-line bg-background/40 flex items-center overflow-hidden min-h-[200px]">
            {reduce ? (
              // A stopped marquee would park three of five logos out of sight,
              // so reduced motion gets the whole wall laid out instead.
              <ul className="flex w-full flex-wrap items-center justify-center gap-x-6 gap-y-2 p-4">
                {SPONSORS.map((sponsor) => (
                  <li key={sponsor.name} className="flex w-[240px] max-w-full justify-center">
                    <SponsorLogo sponsor={sponsor} />
                  </li>
                ))}
              </ul>
            ) : (
              /* Holds still on hover or keyboard focus — the logos are links. */
              <InfiniteSlider pauseOnHover gap={24} className="sponsor-rail w-full">
                <InfiniteSliderContent>
                  {/* Five slides is barely more than a screenful, so the loop
                      opens a hole as it wraps — a second, inert pass keeps the
                      wall continuous without repeating it to screen readers. */}
                  {[...SPONSORS, ...SPONSORS].map((sponsor, index) => {
                    const isEcho = index >= SPONSORS.length;
                    return (
                      <InfiniteSliderItem
                        key={`${sponsor.name}-${index}`}
                        aria-hidden={isEcho || undefined}
                        // Phone slides stop just short of full width, so the rail
                        // reads as a wall in motion instead of one clipped logo.
                        className="basis-[85%] sm:basis-1/2 md:basis-1/3 shrink-0 flex items-center justify-center p-4"
                      >
                        <SponsorLogo sponsor={sponsor} inert={isEcho} />
                      </InfiniteSliderItem>
                    );
                  })}
                </InfiniteSliderContent>
              </InfiniteSlider>
            )}
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
        <motion.div {...reveal(0.26)} className="mt-12 border-t border-line pt-8">
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
        </motion.div>
      </div>
    </section>
  );
}
