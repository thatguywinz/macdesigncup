import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { RESOURCE_GUIDES, RESOURCES_FOLDER_URL, type ResourceGuide } from "@/config/site";
import { BREADCRUMBS, NAV, RESOURCES_PAGE } from "@/content/copy";
import DisplayHeading from "@/components/motion/DisplayHeading";
import Reveal from "@/components/motion/Reveal";
import SoftwareLogo from "@/components/SoftwareLogo";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import Breadcrumbs from "@/pages/partner/components/Breadcrumbs";

const TEXT_LINK =
  "focus-ember inline-flex min-h-11 items-center gap-1 font-body text-[15px] text-ember underline underline-offset-4 transition-colors hover:text-foreground";

/**
 * One guide, the way the prize sheet reads: the program's mark, a small grey
 * label, the program's name, what it covers in one quiet line, and the link.
 */
function Guide({ guide, index }: { guide: ResourceGuide; index: number }) {
  const headingId = `guide-${index}`;
  return (
    <Reveal as="li" y={16} delay={0.08 * index} className="flex flex-col border-t border-bone/10 pt-8">
      <SoftwareLogo name={guide.software} className="h-14 w-14 text-bone md:h-16 md:w-16" />
      <p className="mt-8 font-body text-sm text-concrete">
        {guide.pages} {RESOURCES_PAGE.pages}
      </p>
      <h2 id={headingId} className="mt-1 font-body text-2xl font-medium tracking-[-0.015em] text-foreground md:text-[1.75rem]">
        {guide.software}
      </h2>
      <p className="mt-3 grow font-body text-[15px] leading-relaxed text-foreground/65">{guide.topics.join(" · ")}</p>
      <a
        href={guide.pdf}
        target="_blank"
        rel="noopener noreferrer"
        aria-describedby={headingId}
        className={`${TEXT_LINK} mt-4 self-start`}
      >
        {RESOURCES_PAGE.open}
        <ArrowUpRight aria-hidden="true" size={14} strokeWidth={1.5} />
        <span className="sr-only">{NAV.newTab}</span>
      </a>
    </Reveal>
  );
}

/**
 * /resources: the club's study guides, one column per program. Laid out like
 * /register (breadcrumb, heading, one line), then the guides with room around
 * them, then a single closing line.
 */
export default function Resources() {
  return (
    <div className="relative min-h-screen bg-background">
      <SiteNav />
      <main id="main" className="relative z-10">
        <section
          aria-labelledby="resources-h1"
          className="relative px-5 pb-24 pt-[calc(var(--nav-h)+1.25rem)] md:px-10 md:pb-32 md:pt-[calc(var(--nav-h)+2rem)] lg:px-16"
        >
          <div className="relative mx-auto w-full max-w-[1300px]">
            <Breadcrumbs
              items={[{ label: BREADCRUMBS.home, to: "/" }, { label: BREADCRUMBS.resources }]}
              className="mb-8 md:mb-12"
            />

            <DisplayHeading as="h1" id="resources-h1" reveal={false} lines={RESOURCES_PAGE.h1} />
            <p className="mt-4 max-w-[34rem] font-body text-lg leading-relaxed text-foreground/75 md:mt-5 md:text-xl">
              {RESOURCES_PAGE.intro}
            </p>

            <ul className="mt-14 grid gap-12 md:mt-20 md:grid-cols-3 md:gap-10 lg:gap-16">
              {RESOURCE_GUIDES.map((guide, i) => (
                <Guide key={guide.software} guide={guide} index={i} />
              ))}
            </ul>

            <div className="mt-16 flex flex-col gap-2 border-t border-bone/10 pt-6 md:mt-24 md:flex-row md:items-center md:justify-between md:gap-8">
              <p className="font-body text-[15px] text-concrete">{RESOURCES_PAGE.other}</p>
              <div className="flex flex-wrap gap-x-8">
                <Link to="/#rules" className={TEXT_LINK}>
                  {RESOURCES_PAGE.rulesLink}
                  <ArrowRight aria-hidden="true" size={14} strokeWidth={1.5} />
                </Link>
                <a href={RESOURCES_FOLDER_URL} target="_blank" rel="noopener noreferrer" className={TEXT_LINK}>
                  {RESOURCES_PAGE.folder}
                  <ArrowUpRight aria-hidden="true" size={14} strokeWidth={1.5} />
                  <span className="sr-only">{NAV.newTab}</span>
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
