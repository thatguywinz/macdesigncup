import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, ArrowUpRight, KeyRound } from "lucide-react";
import { RESOURCE_GUIDES, RESOURCES_FOLDER_URL, type ResourceGuide } from "@/config/site";
import { BREADCRUMBS, NAV, RESOURCES_PAGE } from "@/content/copy";
import DisplayHeading from "@/components/motion/DisplayHeading";
import Reveal from "@/components/motion/Reveal";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import Breadcrumbs from "@/pages/partner/components/Breadcrumbs";

const TEXT_LINK =
  "focus-ember inline-flex min-h-11 items-center gap-1 text-ember underline underline-offset-4 transition-colors hover:text-foreground sm:min-h-0";

/**
 * One guide as a drawing sheet: its number in ember, the program set large
 * (the card's visual anchor), the guide's own table of contents as a ruled
 * list, then the page count and the Open button pinned to the bottom so the
 * three sheets line up however long their lists run.
 */
function GuideSheet({ guide, index }: { guide: ResourceGuide; index: number }) {
  const headingId = `guide-${index}`;
  return (
    <Reveal
      as="li"
      y={16}
      delay={0.08 * index}
      className="group relative flex flex-col border border-bone/10 bg-foreground/[0.02] p-6 transition-colors duration-300 hover:border-ember/50 md:p-8"
    >
      {/* corner ticks, like a plotted sheet */}
      <span aria-hidden="true" className="pointer-events-none absolute left-0 top-0 h-3 w-3 border-l border-t border-ember" />
      <span aria-hidden="true" className="pointer-events-none absolute bottom-0 right-0 h-3 w-3 border-b border-r border-ember" />

      <div className="flex items-baseline justify-between gap-4">
        <span aria-hidden="true" className="font-display text-[2.5rem] leading-none text-ember md:text-[3rem]">
          {String(index + 1).padStart(2, "0")}
        </span>
        <span className="font-mono text-xs uppercase tracking-[0.18em] text-concrete">{RESOURCES_PAGE.guide}</span>
      </div>

      <h2
        id={headingId}
        className="mt-6 font-display text-[clamp(2.75rem,5vw,4rem)] uppercase leading-[0.9] tracking-[0.01em] text-foreground"
      >
        {guide.software}
      </h2>

      <ol aria-labelledby={headingId} className="mt-6 grow">
        {guide.topics.map((topic, i) => (
          <li
            key={topic}
            className="grid grid-cols-[2rem_minmax(0,1fr)] border-t border-bone/10 py-2.5 font-body text-[15px] leading-snug text-foreground/80"
          >
            <span aria-hidden="true" className="font-mono text-xs leading-[1.6] text-concrete">
              {String(i + 1).padStart(2, "0")}
            </span>
            {topic}
          </li>
        ))}
      </ol>

      <div className="mt-6 flex items-center justify-between gap-4 border-t border-bone/10 pt-5">
        <span className="font-mono text-xs uppercase tracking-[0.18em] text-concrete">
          {guide.pages} {RESOURCES_PAGE.pages} · PDF
        </span>
        <a
          href={guide.pdf}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${RESOURCES_PAGE.open}: ${guide.software} ${NAV.newTab}`}
          className="btn-ghost focus-ember inline-flex min-h-11 items-center gap-2 px-4 py-2"
        >
          {RESOURCES_PAGE.open}
          <ArrowUpRight aria-hidden="true" size={14} strokeWidth={1.5} />
        </a>
      </div>
    </Reveal>
  );
}

/**
 * /resources: the club's study guides, one sheet per program (in the manner
 * of FBLA Canada's CNLC resources page: a short list, grouped, each a link).
 * The heading and access note are plain markup above the fold.
 */
export default function Resources() {
  return (
    <div className="relative min-h-screen bg-background">
      <SiteNav />
      <main id="main" className="relative z-10">
        <section
          aria-labelledby="resources-h1"
          className="relative px-5 pb-20 pt-[calc(var(--nav-h)+1.25rem)] md:px-10 md:pb-28 md:pt-[calc(var(--nav-h)+2rem)] lg:px-16"
        >
          <div className="relative mx-auto w-full max-w-[1300px]">
            <Breadcrumbs
              items={[{ label: BREADCRUMBS.home, to: "/" }, { label: BREADCRUMBS.resources }]}
              className="mb-8 md:mb-12"
            />

            <div className="grid gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-end lg:gap-16">
              <DisplayHeading as="h1" id="resources-h1" reveal={false} size="hero" lines={RESOURCES_PAGE.h1} />
              <div className="max-w-[34rem]">
                <p className="font-body text-lg leading-relaxed text-foreground/75 md:text-xl">{RESOURCES_PAGE.intro}</p>
                <p className="mt-4 flex items-start gap-3 font-body text-[15px] leading-snug text-foreground/85">
                  <KeyRound aria-hidden="true" size={16} strokeWidth={1.5} className="mt-[0.1rem] shrink-0 text-ember" />
                  {RESOURCES_PAGE.access}
                </p>
              </div>
            </div>

            <ul className="mt-12 grid gap-5 md:mt-16 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
              {RESOURCE_GUIDES.map((guide, i) => (
                <GuideSheet key={guide.software} guide={guide} index={i} />
              ))}
            </ul>

            <div className="mt-10 grid gap-4 border-t border-bone/10 pt-6 md:mt-14 md:grid-cols-[minmax(0,1fr)_auto] md:items-start md:gap-10">
              <p className="max-w-[40rem] font-body text-[15px] leading-relaxed text-concrete">{RESOURCES_PAGE.other}</p>
              <div className="flex flex-col gap-2 font-body text-[15px] sm:flex-row sm:flex-wrap sm:gap-x-8 md:justify-end">
                <a href={RESOURCES_FOLDER_URL} target="_blank" rel="noopener noreferrer" className={TEXT_LINK}>
                  {RESOURCES_PAGE.folder}
                  <ArrowUpRight aria-hidden="true" size={14} strokeWidth={1.5} />
                  <span className="sr-only">{NAV.newTab}</span>
                </a>
                <span className="text-concrete">
                  {RESOURCES_PAGE.faqLead}{" "}
                  <Link to="/#faq" className={TEXT_LINK}>
                    {RESOURCES_PAGE.faqLink}
                    <ArrowRight aria-hidden="true" size={14} strokeWidth={1.5} />
                  </Link>
                </span>
                <Link
                  to="/"
                  className="focus-ember inline-flex min-h-11 items-center gap-2 text-foreground/70 transition-colors hover:text-foreground sm:min-h-0"
                >
                  <ArrowLeft aria-hidden="true" size={14} strokeWidth={1.5} />
                  {RESOURCES_PAGE.back}
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
