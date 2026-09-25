import { useId, type MouseEvent, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ArrowUp, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { CONTACT_EMAIL, EVENT_FULL, REGISTER_PATH, VENUE_MAP_URL } from "@/config/site";
import { CTA, FOOTER, NAV } from "@/content/copy";
import CropMarks from "./blueprint/CropMarks";
import LionMark from "./LionMark";
import SectionLink from "./SectionLink";
import NavAnchor from "./nav/NavAnchor";
import { SECTION_LINKS } from "./nav/sectionLinks";
import { useIsHome } from "./nav/useIsHome";
import { WhoRegistersSr } from "./nav/WhoRegisters";

const LINK =
  "focus-ember inline-flex min-h-[44px] items-center gap-2 font-mono text-[11px] uppercase tracking-[0.12em] transition-colors md:min-h-[32px] md:tracking-[0.18em]";

const RULE = "border-bone/15";

// Building, institution / street, city: two lines below lg (the cell is
// full width there), four in lg's narrow column. Each part keeps together.
const [ADDR_A, ADDR_B, ADDR_C, ADDR_D] = FOOTER.addressLines;

/** A title-block field label: an ember tick and the name in mono caps. */
function Label({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <p
      className={cn(
        "flex items-center gap-2.5 font-mono text-[10px] uppercase leading-none tracking-[0.26em] text-concrete",
        className,
      )}
    >
      <span aria-hidden="true" className="h-px w-3 bg-ember/70" />
      {children}
    </p>
  );
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
 * The site footer as a CAD title block: the ruled box in a drawing's corner
 * that says what the drawing is, where, when and who to call. Cells: the
 * lion lockup and descriptor; Where (a real `<address>`, the map link on its
 * label row), When and Contact; the section links 01 to 06 (+ Partner with
 * us and Register now); then a strip with the copyright, the model number
 * and tagline, and Back to top. Works on every route: section links go to
 * `/#id` away from home.
 *
 * Phones get the compact block: the descriptor's first sentence only (the
 * rest repeats the hero), Where / When / Contact stacked in one cell with
 * the address on two lines, the links in a two-column grid, and one strip
 * row (the model line repeats the "Build the Impossible." heading above it,
 * so it shows from md). md and up keep one ruled cell per field.
 *
 * Register now (CTA.register, the one Register wording) is a plain index
 * link here, not a Register button: the final CTA right above carries the
 * button and the who-registers note (the phone bar steps aside for both). Screen readers still get the note as the link's
 * description. The lion is the still frame: its one nod would play while the
 * footer is far below the fold, where nobody sees it.
 */
export default function SiteFooter() {
  const noteId = useId();

  return (
    <footer data-site-footer="" className="relative z-10 overflow-hidden bg-background">
      {/* molten seam where the hall ends */}
      <div className="ember-rule opacity-70" aria-hidden="true" />

      <div className="relative px-5 pb-3 pt-4 md:px-10 md:pb-8 md:pt-9 lg:px-16">
        <div className="relative mx-auto max-w-[1300px]">
          <CropMarks
            inset={-1}
            className="max-md:[&>.crop-mark]:[--crop-gap:4px] max-md:[&>.crop-mark]:[--crop-len:8px]"
          />
          <div className="border border-bone/25">
            {/* row 1: title | where, when, contact */}
            <div className="grid lg:grid-cols-12">
              <div className={cn("border-b px-4 py-3.5 md:px-7 md:py-5 lg:col-span-5 lg:border-b-0 lg:border-r", RULE)}>
                <div className="flex items-center gap-3 md:gap-4">
                  <LionMark animated={false} className="h-8 w-8 shrink-0 md:h-12 md:w-12" />
                  {/* Phones: one row, MDC then the full name on its baseline. */}
                  <p className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1 md:flex-col md:flex-nowrap md:items-start md:gap-0">
                    <span className="font-display text-[1.5rem] uppercase leading-none tracking-[0.02em] text-foreground md:text-[1.875rem]">
                      {NAV.mark}
                    </span>
                    <span className="font-mono text-[10px] uppercase leading-none tracking-[0.24em] text-foreground/70 md:mt-2">
                      {EVENT_FULL}
                    </span>
                  </p>
                </div>
                <p className="mt-2.5 max-w-[40ch] font-body text-[13px] font-light leading-normal text-concrete md:mt-4 md:text-sm md:leading-relaxed">
                  {FOOTER.descriptor}
                </p>
              </div>

              {/* Phones: one cell, the three fields stacked. md: Where full
                  width over When | Contact. lg: Where beside When over
                  Contact, as in the title block's right-hand columns. */}
              <div className="grid gap-y-2.5 px-4 py-3.5 md:grid-cols-2 md:gap-y-0 md:p-0 lg:col-span-7 lg:grid-cols-[3fr_4fr] lg:grid-rows-[auto_1fr]">
                <div className={cn("md:col-span-2 md:border-b md:px-7 md:py-5 lg:col-span-1 lg:row-span-2 lg:border-b-0 lg:border-r", RULE)}>
                  <div className="flex items-center justify-between gap-4">
                    <Label>{FOOTER.labels.where}</Label>
                    {/* The label row carries the map link, so it adds no
                        line; the negative margins keep a 44px (32px md+)
                        target without making the row taller. */}
                    <a
                      href={VENUE_MAP_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(LINK, "-my-[17px] shrink-0 gap-1.5 text-ember hover:text-foreground md:-my-[11px]")}
                    >
                      {CTA.map}
                      <ArrowUpRight aria-hidden="true" size={14} strokeWidth={1.5} />
                      <span className="sr-only">{NAV.newTab}</span>
                    </a>
                  </div>
                  <address className="mt-1.5 font-body text-[13px] not-italic leading-normal text-foreground/85 md:mt-3 md:text-sm md:leading-relaxed">
                    <AddressPair first={ADDR_A} second={ADDR_B} />
                    <AddressPair first={ADDR_C} second={ADDR_D} />
                  </address>
                </div>

                <div className={cn("md:border-r md:px-7 md:py-5 lg:border-b lg:border-r-0", RULE)}>
                  <Label>{FOOTER.labels.when}</Label>
                  <p className="mt-1.5 font-body text-[13px] leading-normal text-foreground/85 md:mt-3 md:text-sm md:leading-relaxed">
                    {/* Breaks at the middot, never inside the date or the time. */}
                    {FOOTER.when.split(" · ").map((part, i) => (
                      <span key={part}>
                        {i > 0 && " · "}
                        <span className="whitespace-nowrap">{part}</span>
                      </span>
                    ))}
                  </p>
                </div>

                <div className="md:px-7 md:py-5">
                  <Label>{FOOTER.labels.contact}</Label>
                  {/* A 44px target on phones, laid out at its text height:
                      the text sits 6px under the label like the other fields. */}
                  <a
                    href={`mailto:${CONTACT_EMAIL}`}
                    className="focus-ember -mb-3 -mt-1.5 flex min-h-[44px] w-fit items-center break-all font-body text-[13px] leading-normal text-foreground/85 underline decoration-bone/30 underline-offset-4 transition-colors hover:text-ember hover:decoration-ember md:mb-0 md:mt-3 md:min-h-0 md:text-sm md:leading-relaxed"
                  >
                    {CONTACT_EMAIL}
                  </a>
                </div>
              </div>
            </div>

            {/* row 2: the links */}
            <div className={cn("border-t px-4 py-1 md:px-7 md:py-5", RULE)}>
              <Label className="max-md:sr-only md:mb-4">{FOOTER.labels.sections}</Label>
              {/* Phones: two columns, the first sized to its longest link
                  so "Partner with us" holds one line at 360px; md+: one
                  wrapping row. */}
              <ul className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-6 md:flex md:flex-wrap md:items-center md:gap-x-8 md:gap-y-1">
                {SECTION_LINKS.map((l) => (
                  <li key={l.href}>
                    <NavAnchor href={l.href} className={cn(LINK, "text-foreground/75 hover:text-ember")}>
                      {l.label}
                    </NavAnchor>
                  </li>
                ))}
                <li>
                  <Link to="/partner" className={cn(LINK, "text-foreground/75 hover:text-ember")}>
                    {CTA.partner}
                    <ArrowRight aria-hidden="true" size={14} strokeWidth={1.5} />
                  </Link>
                </li>
                <li>
                  <Link
                    to={REGISTER_PATH}
                    aria-describedby={noteId}
                    className={cn(LINK, "text-foreground/75 hover:text-ember")}
                  >
                    {CTA.register}
                    <ArrowRight aria-hidden="true" size={14} strokeWidth={1.5} />
                  </Link>
                  <WhoRegistersSr id={noteId} />
                </li>
              </ul>
            </div>

            {/* row 3: the strip: copyright | back to top. */}
            <div
              className={cn(
                "grid grid-cols-[1fr_auto] border-t font-mono text-[10px] uppercase tracking-[0.1em] text-concrete min-[400px]:tracking-[0.14em] md:tracking-[0.18em] lg:tracking-[0.22em]",
                RULE,
              )}
            >
              <p className={cn("flex min-h-[44px] items-center border-r px-4 md:min-h-[48px] md:px-5 lg:px-7", RULE)}>
                {FOOTER.copyright}
              </p>
              <div className="flex min-h-[44px] items-center justify-end px-4 md:min-h-[48px] md:px-5 lg:px-7">
                <BackToTop className="focus-ember inline-flex min-h-[44px] items-center gap-1.5 text-foreground/75 transition-colors hover:text-ember md:gap-2">
                  <ArrowUp aria-hidden="true" size={14} strokeWidth={1.5} />
                  {FOOTER.backToTop}
                </BackToTop>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
