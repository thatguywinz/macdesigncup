import { useId } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import Reveal from "@/components/motion/Reveal";
import RegisterButton from "@/components/RegisterButton";
import { REGISTER_PATH } from "@/config/site";
import { PATHS } from "@/content/copy";
import { cn } from "@/lib/utils";
import PathGlyph from "./PathGlyph";

/** The action's arrow link, stretched over its whole route (after:inset-0). */
const ACTION =
  "focus-ember inline-flex min-h-[44px] items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-foreground/85 transition-colors after:absolute after:inset-0 after:content-[''] hover:text-ember";
const ARROW = <ArrowRight aria-hidden="true" size={16} strokeWidth={1.5} className="shrink-0 text-ember" />;
/** The route name; its sizes carry their own line height (a bare text-* size would drop leading-none). */
const LABEL = "font-display uppercase text-foreground";
const LINE = "font-body font-light leading-snug text-concrete";

/**
 * "Pick your path": two routes on a ruled band inside At a glance. The wide
 * one is students and teachers together (they fill in the same form), with
 * the ember rule, the combined drawing and the Register button; the narrow
 * one is partners, hatched like the sponsor wall's open slot. Phones: the
 * register route stacks (drawing, then words and arrow, the whole route a
 * link; the sticky bar holds the button), the partner route is one row.
 */
export default function PathBand({ className }: { className?: string }) {
  const r = PATHS.routes;
  const regLine = useId();
  const partnerLine = useId();
  return (
    <nav aria-label={PATHS.label} className={cn("relative", className)}>
      <p className="mb-2 flex items-center gap-2.5 font-mono text-[10px] uppercase tracking-[0.28em] text-concrete md:mb-3">
        <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rotate-45 border border-ember" />
        {PATHS.label}
      </p>
      <ul className="grid border-y border-bone/15 md:grid-cols-[minmax(0,1.85fr)_minmax(0,1fr)]">
        <Reveal
          as="li"
          y={12}
          className={cn(
            "relative flex flex-col gap-3 border-b border-bone/12 pb-4 pl-3 pt-4 md:border-b-0 md:px-7 md:pb-6 md:pt-7 lg:px-9 min-[1400px]:flex-row min-[1400px]:items-end min-[1400px]:gap-9",
            // the ember rule: down the left on phones, along the top from md
            "before:absolute before:inset-y-0 before:left-0 before:w-px before:bg-ember/70 md:before:inset-x-0 md:before:bottom-auto md:before:h-px md:before:w-auto",
            "md:bg-[radial-gradient(80%_80%_at_15%_0%,hsl(var(--ember)/0.09),transparent_70%)]",
          )}
        >
          <PathGlyph kind="together" delay={0.1} className="h-16 w-auto self-start md:h-[5.5rem] min-[1400px]:mb-1 min-[1400px]:h-[8.5rem] min-[1400px]:self-end" />
          <div className="flex min-w-0 flex-1 items-center gap-4 md:flex-col md:items-start md:gap-0">
            <div className="min-w-0 flex-1">
              <p className={cn(LABEL, "text-[1.45rem]/none md:text-[2rem]/none xl:text-[2.4rem]/none")}>{r.register.label}</p>
              <p id={regLine} className={cn(LINE, "mt-1 max-w-[30ch] text-[13px] md:mt-2 md:text-[15px]")}>
                {r.register.line}
              </p>
            </div>
            <div className="shrink-0 md:mt-4">
              {/* Phones: the whole route is the link (the sticky bar holds the button). */}
              <Link to={REGISTER_PATH} aria-describedby={regLine} className={cn(ACTION, "md:hidden")}>
                <span className="sr-only">{r.register.cta}</span>
                {ARROW}
              </Link>
              <RegisterButton aria-describedby={regLine} className="hidden px-6 py-3.5 text-[11px] md:inline-flex">
                {r.register.cta}
              </RegisterButton>
            </div>
          </div>
        </Reveal>

        <Reveal
          as="li"
          delay={0.1}
          y={12}
          className="relative flex items-center gap-4 py-3 md:draft-hatch md:flex-col md:items-start md:justify-end md:gap-0 md:border-l md:border-dashed md:border-ember/40 md:px-7 md:pb-6 md:pt-7 lg:px-9"
        >
          <PathGlyph kind="partners" delay={0.2} className="w-[4.25rem] md:h-[4.5rem] md:w-auto" />
          <div className="min-w-0 flex-1 md:mt-4 md:flex-none">
            <p className={cn(LABEL, "text-[1.45rem]/none md:text-[2rem]/none xl:text-[2.4rem]/none")}>{r.partners.label}</p>
            <p id={partnerLine} className={cn(LINE, "mt-1 text-[13px] md:mt-2 md:text-[15px]")}>
              {r.partners.line}
            </p>
          </div>
          <div className="shrink-0 md:mt-3">
            <Link to="/partner" aria-describedby={partnerLine} className={ACTION}>
              <span className="max-md:sr-only">{r.partners.cta}</span>
              {ARROW}
            </Link>
          </div>
        </Reveal>
      </ul>
    </nav>
  );
}
