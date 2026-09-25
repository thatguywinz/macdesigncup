import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { REGISTER_PATH } from "@/config/site";
import { NOT_FOUND } from "@/content/copy";
import BlueprintBackdrop from "@/components/blueprint/BlueprintBackdrop";
import CropMarks from "@/components/blueprint/CropMarks";
import Dimension from "@/components/blueprint/Dimension";
import { SheetEyebrow, SHEET_COUNT } from "@/components/blueprint/Sheet";
import Reveal from "@/components/motion/Reveal";
import RegisterBlock from "@/components/RegisterBlock";
import SiteFooter from "@/components/SiteFooter";
import SiteNav from "@/components/SiteNav";

/** The drawing set's real sheets, as an index. */
const INDEX: ReadonlyArray<{ label: string; to: string }> = [
  { label: NOT_FOUND.links.home, to: "/" },
  { label: NOT_FOUND.links.register, to: REGISTER_PATH },
  { label: NOT_FOUND.links.faq, to: "/#faq" },
  { label: NOT_FOUND.links.partner, to: "/partner" },
];

const pad2 = (n: number) => String(n).padStart(2, "0");

/**
 * The missing sheet itself: an empty, hatched drawing plate (the drafting
 * mark for "nothing here") with 404 set across it and a dimension that reads
 * as a sheet number outside the set. Decorative apart from the heading.
 */
function MissingSheet({ children }: { children: ReactNode }) {
  return (
    <div className="relative">
      <div className="draft-hatch relative border border-dashed border-foreground/25 px-6 py-6 md:px-10 md:py-14">
        <CropMarks inset={-9} className="hidden md:block" />
        {children}
      </div>
      <Dimension
        label={`${NOT_FOUND.sheet} / ${pad2(SHEET_COUNT)}`}
        tone="ember"
        className="mt-4 md:mt-5"
      />
    </div>
  );
}

/**
 * 404. Keeps the one line, then everything that does exist: the Register
 * call to action and an index of the real pages. Fits a phone screen
 * without scrolling. The route is noindex (set by the head table).
 */
const NotFound = () => {
  return (
    <div className="relative flex min-h-[100svh] flex-col bg-background">
      <BlueprintBackdrop />
      <SiteNav />
      <main
        id="main"
        className="relative z-10 flex flex-1 items-center px-5 pb-12 pt-[calc(var(--nav-h)+1.25rem)] md:px-10 md:pb-20 md:pt-[calc(var(--nav-h)+2.5rem)] lg:px-16"
      >
        <div className="mx-auto grid w-full max-w-[1100px] items-center gap-6 md:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] md:gap-14 lg:gap-20">
          <MissingSheet>
            <h1 className="text-center font-display text-[clamp(6.5rem,3.2rem+13vw,13rem)] uppercase leading-[0.86] tracking-[0.01em] text-foreground">
              4<span className="wire-text">0</span>4
            </h1>
          </MissingSheet>

          <div>
            <SheetEyebrow className="!mb-5 md:!mb-7">{NOT_FOUND.eyebrow}</SheetEyebrow>
            <Reveal
              as="p"
              className="font-display text-[1.75rem] uppercase leading-[1] text-foreground md:text-[2.5rem]"
            >
              {NOT_FOUND.line}
            </Reveal>

            {/* The button plus who registers (teachers for a group, students
                with a teacher from their school), as on every Register CTA. */}
            <RegisterBlock className="mt-6 gap-4 md:mt-9 md:gap-5" />

            <nav aria-labelledby="nf-index" className="mt-6 md:mt-10">
              <p id="nf-index" className="font-mono text-[10px] uppercase tracking-[0.24em] text-concrete">
                {NOT_FOUND.index}
              </p>
              <ol className="mt-2 border-t border-foreground/10">
                {INDEX.map((item, i) => (
                  <li key={item.to} className="border-b border-foreground/10">
                    <Link
                      to={item.to}
                      className="focus-ember group flex min-h-11 items-center gap-4 py-2 font-mono text-[11px] uppercase tracking-[0.22em] text-foreground/85 transition-colors hover:text-ember"
                    >
                      <span aria-hidden="true" className="w-6 text-ember/80">
                        {pad2(i + 1)}
                      </span>
                      <span className="flex-1">{item.label}</span>
                      <ArrowRight
                        aria-hidden="true"
                        size={14}
                        strokeWidth={1.5}
                        className="text-foreground/40 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-ember motion-reduce:transition-none"
                      />
                    </Link>
                  </li>
                ))}
              </ol>
            </nav>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
};

export default NotFound;
