import { motion, useReducedMotion } from "framer-motion";
import { Link } from "react-router-dom";
import { EVERY_BUILDER, GRAND_PRIZE_VALUE, PRIZE_EXTRAS, PRIZE_POOL } from "@/config/site";
import {
  InfiniteSlider,
  InfiniteSliderContent,
  InfiniteSliderItem,
  InfiniteSliderControl,
} from "@/components/core/infinite-slider";

// Import sponsor logos
import stratasysLogo from "@/components/sponsor-images/Stratasys.png";
import agileLogo from "@/components/sponsor-images/agile.png";
import georgebrownLogo from "@/components/sponsor-images/georgebrown.png";
import shop3dcaLogo from "@/components/sponsor-images/shop3dca.png";
import wlmacLogo from "@/components/sponsor-images/wlmac.png";
import scrimbaLogo from "@/components/sponsor-images/scrimba.svg";
import asepriteLogo from "@/components/sponsor-images/aseprite.png";
import chatforceLogo from "@/components/sponsor-images/chatforce.svg";
// Applied Precision 3D's own site header is a plain type wordmark; this file sets those words.
import appliedPrecisionLogo from "@/components/sponsor-images/appliedprecision.svg";
import siemensLogo from "@/components/sponsor-images/siemens.svg";
// Altair redirects to Siemens now — one Siemens mark stands for both.
import trimechLogo from "@/components/sponsor-images/trimech.svg";
import ansysLogo from "@/components/sponsor-images/ansys.svg";

/**
 * Every logo is a cut-out rendered as a one-colour bone knockout (see
 * `.sponsor-logo` in index.css), so the wall reads as one set on the dark
 * concrete instead of five different plates. `maxH`/`maxW` balance them
 * optically — a wide wordmark and a square crest can't share a single cap —
 * and are applied through `min(…, 100%)` so a cap tuned for a wide desktop
 * slide can never overflow a narrow one and collide with its neighbour.
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
    maxH: 72,
    maxW: 236,
  },
  {
    name: "Siemens",
    logo: siemensLogo,
    href: "https://www.siemens.com/",
    maxH: 34,
    maxW: 210,
  },
  {
    name: "George Brown College",
    logo: georgebrownLogo,
    href: "https://www.georgebrown.ca/",
    maxH: 84,
    maxW: 200,
  },
  {
    // TODO: swap in a higher-resolution Shop3D.ca mark — this file is 245px wide.
    name: "Shop3D.ca",
    logo: shop3dcaLogo,
    href: "https://shop3d.ca/",
    maxH: 40,
    maxW: 228,
  },
  {
    name: "Ansys",
    logo: ansysLogo,
    href: "https://www.ansys.com/",
    maxH: 52,
    maxW: 190,
  },
  {
    name: "Scrimba",
    logo: scrimbaLogo,
    href: "https://scrimba.com/",
    maxH: 22,
    maxW: 236,
  },
  {
    name: "TriMech Group",
    logo: trimechLogo,
    href: "https://trimech.com/",
    maxH: 44,
    maxW: 212,
  },
  {
    name: "Aseprite",
    logo: asepriteLogo,
    href: "https://www.aseprite.org/",
    maxH: 64,
    maxW: 176,
  },
  {
    name: "Applied Precision 3D",
    logo: appliedPrecisionLogo,
    href: "https://www.appliedprecision.ca/",
    maxH: 32,
    maxW: 236,
  },
  {
    name: "Chatforce",
    logo: chatforceLogo,
    href: "https://chatforce.com/",
    maxH: 44,
    maxW: 228,
  },
  {
    name: "Agile Manufacturing",
    logo: agileLogo,
    href: "https://agile-manufacturing.com/",
    maxH: 86,
    maxW: 190,
  },
  {
    name: "William Lyon Mackenzie CI",
    logo: wlmacLogo,
    href: "https://wlmac.ca/",
    maxH: 100,
    maxW: 200,
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
      className="sponsor-logo flex min-h-[120px] w-full items-center justify-center p-4 sm:min-h-[150px] focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-ember"
    >
      <img
        src={sponsor.logo}
        alt={sponsor.name}
        className="h-auto w-auto object-contain"
        // The optical cap, but never wider than the slide holding it.
        style={{ maxHeight: sponsor.maxH, maxWidth: `min(${sponsor.maxW}px, 100%)` }}
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
    <section id="sponsors" className="relative z-10 border-t border-line px-5 py-16 md:px-10 md:py-32">
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
          Sponsors are the reason there is food, swag and a {PRIZE_POOL} prize
          table for a hall full of young designers. The wall is going up right
          now: logos land here as partners confirm.
        </motion.p>

        {/* The wall: a rail you can let run or walk yourself, plus the open slot. */}
        <motion.div {...reveal(0.18)} className="mt-12 grid grid-cols-1 items-stretch gap-5 lg:grid-cols-4">

          {/* The rail spans the first three columns; the open slot holds the fourth.
              The control strip sits *inside* <InfiniteSlider> so the step buttons
              can reach its context — and so a pointer resting on them holds the
              marquee still, the same way it does over the logos themselves. */}
          <div className="flex min-h-[200px] flex-col border border-dashed border-line bg-background/40 lg:col-span-3">
            {reduce ? (
              // A stopped marquee would park most of the logos out of sight, so
              // reduced motion lays the whole wall out on an even grid instead —
              // no rail, so nothing to step through either.
              <>
                <p className="border-b border-dashed border-line px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.24em] text-concrete">
                  {SPONSORS.length} on the wall
                </p>
                <ul className="grid w-full flex-1 grid-cols-2 items-center gap-6 p-4 sm:grid-cols-3">
                  {SPONSORS.map((sponsor) => (
                    <li key={sponsor.name} className="flex justify-center">
                      <SponsorLogo sponsor={sponsor} />
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              /* Holds still on hover or keyboard focus — the logos are links. */
              <InfiniteSlider pauseOnHover gap={24} className="flex flex-1 flex-col">
                <div className="flex items-center justify-between gap-4 border-b border-dashed border-line px-4 py-2.5">
                  <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-concrete">
                    {SPONSORS.length} on the wall
                    <span className="sm:hidden"> · swipe</span>
                    <span className="hidden sm:inline"> · drag to browse</span>
                  </span>
                  <span className="flex gap-2">
                    <InfiniteSliderControl direction="prev" />
                    <InfiniteSliderControl direction="next" />
                  </span>
                </div>

                {/* The mask belongs on this static box, not on the track Embla
                    transforms — otherwise the fade slides along with the logos. */}
                <div className="sponsor-rail flex flex-1 items-center overflow-hidden">
                  <InfiniteSliderContent>
                    {/* The loop opens a hole as it wraps unless the track runs well past
                        a screenful — a second, inert pass keeps the
                        wall continuous without repeating it to screen readers. */}
                    {[...SPONSORS, ...SPONSORS].map((sponsor, index) => {
                      const isEcho = index >= SPONSORS.length;
                      return (
                        <InfiniteSliderItem
                          key={`${sponsor.name}-${index}`}
                          aria-hidden={isEcho || undefined}
                          // Two marks to a phone screen: enough that the rail reads
                          // as a wall, few enough that each one is still legible.
                          className="flex shrink-0 basis-1/2 items-center justify-center p-4 md:basis-1/3"
                        >
                          <SponsorLogo sponsor={sponsor} inert={isEcho} />
                        </InfiniteSliderItem>
                      );
                    })}
                  </InfiniteSliderContent>
                </div>
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
          <dl className="grid gap-x-10 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-[0.3em] text-ember/90">1st place</dt>
              <dd className="mt-2 font-mono text-[11px] uppercase tracking-[0.14em] text-foreground/80">
                Snapmaker J1S ({GRAND_PRIZE_VALUE}) + 6 spools
              </dd>
            </div>
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-[0.3em] text-ember/90">Up for grabs</dt>
              <dd className="mt-2 font-mono text-[11px] uppercase tracking-[0.14em] text-foreground/80">
                {PRIZE_EXTRAS.map((p) => (
                  <span key={p.item} className="block">
                    {p.item}
                  </span>
                ))}
              </dd>
            </div>
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-[0.3em] text-ember/90">Every builder</dt>
              <dd className="mt-2 font-mono text-[11px] uppercase tracking-[0.14em] text-foreground/80">
                {EVERY_BUILDER.map((p) => p.short).join(" · ")}
              </dd>
            </div>
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-[0.3em] text-ember/90">Prize pool</dt>
              <dd className="mt-2 font-mono text-[11px] uppercase tracking-[0.14em] text-foreground/80">
                {PRIZE_POOL} in sponsor prizes
              </dd>
            </div>
          </dl>
        </motion.div>
      </div>
    </section>
  );
}
