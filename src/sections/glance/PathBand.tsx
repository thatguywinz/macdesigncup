import { useId } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import Reveal from "@/components/motion/Reveal";
import RegisterButton from "@/components/RegisterButton";
import { REGISTER_PATH } from "@/config/site";
import { PATHS } from "@/content/copy";
import { cn } from "@/lib/utils";

const TITLE = "font-body text-xl font-semibold tracking-[-0.01em] text-foreground md:text-2xl";
const LINE = "mt-1 font-body text-[15px] leading-snug text-concrete md:text-base";
/** An arrow link, stretched over its whole route (after:inset-0). */
const ACTION =
  "focus-ember inline-flex min-h-[44px] items-center gap-2 font-body text-[15px] font-medium text-foreground transition-colors after:absolute after:inset-0 after:content-[''] hover:text-ember";

/**
 * The two routes, side by side from md: students and teachers (one form,
 * the Register button) and partners (to /partner). Phones: the register
 * route is one arrow link (the sticky bar holds the button).
 */
export default function PathBand({ className }: { className?: string }) {
  const r = PATHS.routes;
  const regLine = useId();
  const partnerLine = useId();
  return (
    <nav aria-label={PATHS.label} className={cn("relative", className)}>
      <ul className="grid gap-8 md:grid-cols-2 md:gap-16">
        <Reveal as="li" y={12} className="relative flex items-end justify-between gap-6">
          <div className="min-w-0">
            <p className={TITLE}>{r.register.label}</p>
            <p id={regLine} className={LINE}>
              {r.register.line}
            </p>
          </div>
          <Link to={REGISTER_PATH} aria-describedby={regLine} className={cn(ACTION, "shrink-0 md:hidden")}>
            <span className="sr-only">{r.register.cta}</span>
            <ArrowRight aria-hidden="true" size={18} strokeWidth={1.5} className="text-ember" />
          </Link>
          <RegisterButton aria-describedby={regLine} className="hidden shrink-0 px-6 py-3 md:inline-flex">
            {r.register.cta}
          </RegisterButton>
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
