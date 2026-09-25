import type { ReactNode } from "react";
import Sheet from "@/components/blueprint/Sheet";
import WireSolid from "@/components/blueprint/WireSolid";
import DisplayHeading from "@/components/motion/DisplayHeading";
import DrawPath from "@/components/motion/DrawPath";
import Reveal from "@/components/motion/Reveal";
import { EXPECTED_STUDENTS, GRADES, VENUE_CITY, VENUE_INSTITUTION } from "@/config/site";
import PathGlyph from "@/sections/glance/PathGlyph";
import { cn } from "@/lib/utils";

/** A waterfront skyline with the tower: the city the students live in. */
function Skyline({ className }: { className?: string }) {
  const strokes: { d: string; c: string }[] = [
    { d: "M8 72 V46 H22 V72 M26 72 V36 H40 V72 M44 72 V54 H58 V72", c: "stroke-bone/70" },
    { d: "M102 72 V42 H116 V72 M120 72 V52 H134 V72 M138 72 V44 H152 V72", c: "stroke-bone/70" },
    { d: "M77.6 72 L79.2 31 M82.4 72 L80.8 31 M74.5 31 H85.5 L83.5 24 H76.5 Z M80 24 V3", c: "stroke-bone/85" },
    { d: "M30 42 H36 M30 50 H36 M106 48 H112 M106 56 H112", c: "stroke-bone/30" },
    { d: "M14 78 H42 M62 78 H98 M118 78 H146", c: "stroke-bone/30" },
    { d: "M0 72 H160", c: "stroke-ember" },
  ];
  return (
    <svg viewBox="0 0 160 82" aria-hidden="true" focusable="false" className={cn("overflow-visible", className)}>
      {strokes.map((s, i) => (
        <DrawPath key={i} d={s.d} strokeWidth={1.25} strokeLinejoin="round" className={s.c} delay={0.1 + i * 0.12} duration={0.9} />
      ))}
    </svg>
  );
}

interface StatementProps {
  figure: ReactNode;
  label: string;
  sub: string;
  art: ReactNode;
  big?: boolean;
  className?: string;
  delay?: number;
}

function Statement({ figure, label, sub, art, big, className, delay = 0 }: StatementProps) {
  return (
    <Reveal
      as="li"
      delay={delay}
      className={cn(
        // Phones: drawing | words. From lg: a column, the drawing on top.
        "relative flex items-center gap-5 border-bone/15 py-5 max-lg:border-b max-lg:last:border-b-0 md:gap-8 lg:flex-col lg:items-start lg:justify-end lg:gap-6 lg:px-10 lg:py-10 lg:first:pl-0 lg:[&:not(:first-child)]:border-l",
        className,
      )}
    >
      <div
        className={cn(
          "flex shrink-0 items-end lg:w-full",
          big ? "w-[7rem] md:w-[10rem] lg:h-[8.5rem]" : "w-[5.5rem] md:w-[8rem] lg:h-[6.5rem]",
        )}
      >
        {art}
      </div>
      <div className="min-w-0">
        <p
          className={cn(
            "font-display uppercase leading-[0.85] text-ember",
            big ? "text-[clamp(4.25rem,2.5rem+5vw,8.5rem)]" : "text-[clamp(2.6rem,1.6rem+2.6vw,4.5rem)]",
          )}
        >
          {figure}
        </p>
        <h3
          className={cn(
            "mt-2 font-display uppercase leading-none text-foreground md:mt-3",
            big ? "text-[1.45rem] md:text-[2.1rem]" : "text-[1.3rem] md:text-[1.75rem]",
          )}
        >
          {label}
        </h3>
        <p className="mt-2 font-mono text-[10px] uppercase leading-relaxed tracking-[0.18em] text-concrete md:text-[11px]">
          {sub}
        </p>
      </div>
    </Reveal>
  );
}

/**
 * Why it matters, as three statements instead of paragraphs: who partners
 * reach (TDSB high schoolers and their teachers), what it builds (STEM
 * through design, its underrated side) and where (their own city), on one
 * ruled band. The first is wider with the biggest figure; each has its own
 * line drawing.
 */
export default function WhyPartnerSection() {
  return (
    <Sheet id="why" eyebrow="Why it matters">
      <DisplayHeading lines={["Make it real."]} outline="real." />

      <ul className="mt-6 grid border-y border-bone/15 md:mt-10 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <Statement
          big
          // TODO(owner): EXPECTED_STUDENTS (site.ts) is the planned head count; confirm before launch.
          figure={EXPECTED_STUDENTS}
          label="TDSB high schoolers"
          sub={`Grades ${GRADES}, with their teachers`}
          art={<PathGlyph kind="teachers" className="w-full lg:h-full lg:w-auto" />}
        />
        <Statement
          delay={0.1}
          figure="3D"
          label="STEM through design"
          sub="The underrated side of STEM"
          art={<WireSolid shape="icosahedron" size="var(--ws)" mobile accent className="[--wire-a:0.5] [--ws:5.5rem] md:[--ws:6.5rem]" />}
        />
        <Statement
          delay={0.18}
          figure="1 day"
          label="In their own city"
          sub={`${VENUE_INSTITUTION}, ${VENUE_CITY}`}
          art={<Skyline className="w-full lg:h-full lg:w-auto" />}
        />
      </ul>
    </Sheet>
  );
}
