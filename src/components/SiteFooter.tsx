import { useId, type MouseEvent, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowUp, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { CONTACT_EMAIL, EVENT_FULL, REGISTER_PATH, VENUE_MAP_URL } from "@/config/site";
import { CTA, FOOTER, NAV } from "@/content/copy";
import LionMark from "./LionMark";
import SectionLink from "./SectionLink";
import NavAnchor from "./nav/NavAnchor";
import { SECTION_LINKS } from "./nav/sectionLinks";
import { useIsHome } from "./nav/useIsHome";
import { WhoRegistersSr } from "./nav/WhoRegisters";

const LINK =
  "focus-ember inline-flex min-h-[44px] items-center gap-1.5 font-body text-[15px] transition-colors md:min-h-[32px]";

// Building, institution / street, city: two lines, each part kept together.
const [ADDR_A, ADDR_B, ADDR_C, ADDR_D] = FOOTER.addressLines;

function Label({ className, children }: { className?: string; children: ReactNode }) {
  return <p className={cn("font-body text-sm text-concrete", className)}>{children}</p>;
}

function AddressPair({ first, second }: { first: string; second: string }) {
  return (
    <span className="block">
      <span className="whitespace-nowrap lg:block">
        {first}
        <span className="lg:hidden">,</span>
      </span>{" "}
      <span className="whitespace-nowrap lg:block">{second}</span>
    </span>
  );
}

/** "#top" is the hero on the home page; elsewhere, the top of the document. */
function BackToTop({ className, children }: { className: string; children: ReactNode }) {
  const isHome = useIsHome();
  if (isHome) {
    return (
      <SectionLink href="#top" className={className}>
        {children}
      </SectionLink>
    );
  }
  const toTop = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  };
  return (
    <a href="#top" onClick={toTop} className={className}>
      {children}
    </a>
  );
}

/**
 * The site footer: the lockup and who runs it; Where (a real `<address>`
 * with its map link), When and Contact; the section links (+ Partner with us
 * and Register now); then copyright and Back to top. Works on every route:
 * section links go to `/#id` away from home.
 *
 * Register now (CTA.register, the one Register wording) is a plain index
 * link here, not a Register button: the final CTA right above carries the
 * button. Screen readers still get the who-registers note as the link's
 * description. The lion is the still frame.
 */
export default function SiteFooter() {
  const noteId = useId();

  return (
    <footer data-site-footer="" className="relative z-10 border-t border-bone/10 bg-background">
      <div className="px-5 pb-6 pt-12 md:px-10 md:pb-8 md:pt-16 lg:px-16">
        <div className="mx-auto max-w-[1300px]">
          <div className="grid gap-9 md:grid-cols-2 md:gap-x-12 lg:grid-cols-12 lg:gap-x-10">
            <div className="lg:col-span-4">
              <div className="flex items-center gap-3">
                <LionMark animated={false} className="h-9 w-9 shrink-0 md:h-10 md:w-10" />
                <p className="flex flex-col">
                  <span className="font-display text-xl uppercase leading-none tracking-[0.02em] text-foreground">
                    {NAV.mark}
                  </span>
                  <span className="mt-1 font-body text-[13px] leading-none text-foreground/65">{EVENT_FULL}</span>
                </p>
              </div>
              <p className="mt-4 max-w-[36ch] font-body text-[15px] leading-relaxed text-concrete">
                {FOOTER.descriptor}
              </p>
            </div>

            <div className="lg:col-span-3">
              <Label>{FOOTER.labels.where}</Label>
              <address className="mt-2 font-body text-[15px] not-italic leading-relaxed text-foreground/85">
                <AddressPair first={ADDR_A} second={ADDR_B} />
                <AddressPair first={ADDR_C} second={ADDR_D} />
              </address>
              <a
                href={VENUE_MAP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(LINK, "text-ember underline decoration-ember/40 underline-offset-4 hover:decoration-ember")}
              >
                {CTA.map}
                <ArrowUpRight aria-hidden="true" size={14} strokeWidth={1.5} />
                <span className="sr-only">{NAV.newTab}</span>
              </a>
            </div>

            <div className="grid content-start gap-6 lg:col-span-3">
              <div>
                <Label>{FOOTER.labels.when}</Label>
                <p className="mt-2 font-body text-[15px] leading-relaxed text-foreground/85">
                  {/* One line per part: the date, then the start time. */}
                  {FOOTER.when.split(" · ").map((part) => (
                    <span key={part} className="block">
                      {part}
                    </span>
                  ))}
                </p>
              </div>
              <div>
                <Label>{FOOTER.labels.contact}</Label>
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="focus-ember mt-1 inline-flex min-h-[44px] items-center break-all font-body lg:break-normal text-[15px] text-foreground/85 underline decoration-bone/30 underline-offset-4 transition-colors hover:text-ember hover:decoration-ember md:min-h-[32px]"
                >
                  {CONTACT_EMAIL}
                </a>
              </div>
            </div>

            <nav aria-labelledby={`${noteId}-sections`} className="lg:col-span-2">
              <Label>
                <span id={`${noteId}-sections`}>{FOOTER.labels.sections}</span>
              </Label>
              <ul className="mt-1 grid grid-cols-2 gap-x-6 md:mt-2 md:grid-cols-1">
                {SECTION_LINKS.map((l) => (
                  <li key={l.href}>
                    <NavAnchor href={l.href} className={cn(LINK, "text-foreground/75 hover:text-foreground")}>
                      {l.label}
                    </NavAnchor>
                  </li>
                ))}
                <li>
                  <Link to="/partner" className={cn(LINK, "text-foreground/75 hover:text-foreground")}>
                    {CTA.partner}
                  </Link>
                </li>
                <li>
                  <Link
                    to={REGISTER_PATH}
                    aria-describedby={noteId}
                    className={cn(LINK, "text-foreground/75 hover:text-foreground")}
                  >
                    {CTA.register}
                  </Link>
                  <WhoRegistersSr id={noteId} />
                </li>
              </ul>
            </nav>
          </div>

          <div className="mt-10 flex items-center justify-between gap-4 border-t border-bone/10 pt-2 font-body text-[13px] text-concrete md:mt-14">
            <p>{FOOTER.copyright}</p>
            <BackToTop className="focus-ember inline-flex min-h-[44px] items-center gap-1.5 transition-colors hover:text-foreground">
              <ArrowUp aria-hidden="true" size={14} strokeWidth={1.5} />
              {FOOTER.backToTop}
            </BackToTop>
          </div>
        </div>
      </div>
    </footer>
  );
}
