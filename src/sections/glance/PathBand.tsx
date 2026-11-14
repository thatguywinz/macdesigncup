import { useId } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import Reveal from "@/components/motion/Reveal";
import { SUBMIT_PATH } from "@/config/site";
import { PATHS } from "@/content/copy";
import { cn } from "@/lib/utils";

const TITLE = "font-body text-xl font-semibold tracking-[-0.01em] text-foreground md:text-2xl";
const LINE = "mt-1 font-body text-[15px] leading-snug text-concrete md:text-base";
/** An arrow link, stretched over its whole route (after:inset-0). */
const ACTION =
  "focus-ember inline-flex min-h-[44px] items-center gap-2 font-body text-[15px] font-medium text-foreground transition-colors after:absolute after:inset-0 after:content-[''] hover:text-ember";

/**
 * The two routes, side by side from md: competitors (to /submit) and
 * partners (to /partner), each one arrow link stretched over its route. The
 * Submit here button sits with the clock just above (phones: the sticky bar),
 * so this band never shows a second one. /submit is served by the portal
 * build, so its link is a plain anchor, not a router link.
 */
export default function PathBand({ className }: { className?: string }) {
  const r = PATHS.routes;
  const submitLine = useId();
  const partnerLine = useId();
  return (
    <nav aria-label={PATHS.label} className={cn("relative", className)}>
      <ul className="grid gap-8 md:grid-cols-2 md:gap-16">
        <Reveal as="li" y={12} className="relative flex items-end justify-between gap-6">
          <div className="min-w-0">
            <p className={TITLE}>{r.submit.label}</p>
            <p id={submitLine} className={LINE}>
              {r.submit.line}
            </p>
          </div>
          <a href={SUBMIT_PATH} aria-describedby={submitLine} className={cn(ACTION, "shrink-0")}>
            <span className="max-md:sr-only">{r.submit.cta}</span>
            <ArrowRight aria-hidden="true" size={18} strokeWidth={1.5} className="text-ember" />
          </a>
        </Reveal>

        <Reveal as="li" delay={0.08} y={12} className="relative flex items-end justify-between gap-6">
          <div className="min-w-0">
            <p className={TITLE}>{r.partners.label}</p>
            <p id={partnerLine} className={LINE}>
              {r.partners.line}
            </p>
          </div>
          <Link to="/partner" aria-describedby={partnerLine} className={cn(ACTION, "shrink-0")}>
            <span className="max-md:sr-only">{r.partners.cta}</span>
            <ArrowRight aria-hidden="true" size={18} strokeWidth={1.5} className="text-ember" />
          </Link>
        </Reveal>
      </ul>
    </nav>
  );
}
