import { useEffect, useRef, useState, type ReactNode } from "react";
import { flushSync } from "react-dom";
import { Link, useLocation } from "react-router-dom";
import { ArrowUpRight, ChevronDown, Plus } from "lucide-react";
import Sheet from "@/components/blueprint/Sheet";
import DisplayHeading from "@/components/motion/DisplayHeading";
import Reveal from "@/components/motion/Reveal";
import { SECTION_OFFSETS, useSectionProgress } from "@/components/motion/useSectionProgress";
import { cn } from "@/lib/utils";
import { CONTACT_EMAIL, REGISTER_PATH, VENUE_MAP_URL } from "@/config/site";
import { CTA, FAQS, NAV, SECTIONS, type Faq } from "@/content/copy";
import QuestionMarkDrawing from "./faq/QuestionMarkDrawing";
import { COUNTS, FAQ_LIMIT, FAQ_MORE, FILTERS, faqId, revealState, shows, type Filter } from "./faq/faqList";

const s = SECTIONS.faq;
const MAILTO = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(s.more.subject)}`;
const LIST_ID = "faq-questions";
const BY_ID = new Map<string, Faq>(FAQS.map((f) => [faqId(f.q), f]));

// Without JavaScript the "Show all" control can't run: show every question
// and drop the control. Rendered inside <noscript>, like DaySection's.
const NOSCRIPT_CSS = `#${LIST_ID}>[data-faq-extra]{display:block!important}[data-faq-toggle]{display:none!important}`;

/**
 * A question row is on screen when its filter shows it (no `hidden`) and it
 * is not folded under "Show all" (`data-faq-extra` inside a list marked
 * `data-collapsed`).
 */
const isShown = (item: HTMLElement) =>
  !item.hidden && !(item.hasAttribute("data-faq-extra") && item.parentElement?.hasAttribute("data-collapsed"));

// The phrase in an answer that becomes a link to the registration page
// (the "Can I register myself?" and "How do I register my students?"
// answers). Only the words turn into a link: the paragraph's text stays
// character for character the FAQS string the FAQPage JSON-LD quotes.
const REGISTER_PHRASE = "registration form";

function Answer({ text }: { text: string }): ReactNode {
  const at = text.indexOf(REGISTER_PHRASE);
  if (at < 0) return text;
  return (
    <>
      {text.slice(0, at)}
      <Link
        to={REGISTER_PATH}
        className="focus-ember text-foreground underline decoration-ember/60 underline-offset-4 transition-colors hover:text-ember hover:decoration-ember"
      >
        {REGISTER_PHRASE}
      </Link>
      {text.slice(at + REGISTER_PHRASE.length)}
    </>
  );
}

/**
 * 06 · FAQ. Left: the heading, a question mark drafted as an extruded 3D
 * letterform (it builds itself as the section scrolls in), and the "More
 * questions?" box. Right: All / Students / Teachers filter chips over a list
 * of native <details>, so every answer is in the prerendered HTML (the
 * FAQPage JSON-LD quotes the same FAQS strings).
 *
 * The list shows the first FAQ_LIMIT questions of the current filter and a
 * "Show all N questions" row. Nothing is unmounted, so crawlers read every
 * answer. A filter the reader picks sets `hidden` on the rows it leaves out
 * (the default, All, leaves none). The limit does not use `hidden`: rows past
 * it carry `data-faq-extra`, and a stylesheet rule folds them away while the
 * list carries `data-collapsed`. Text extractors (Readability and the AI
 * fetchers built on it) drop `hidden` elements but not stylesheet-hidden
 * ones, so all sixteen answers reach them. Showing all moves focus to the
 * first question it revealed. Each item has an id (`faq-what-does-it-cost`);
 * a hash or a link that lands on a folded or filtered-out one switches the
 * filter or expands the list, opens it, and scrolls to it.
 */
export default function FAQSection() {
  const [filter, setFilter] = useState<Filter>("all");
  const [expanded, setExpanded] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const filterRef = useRef<Filter>(filter);
  const pendingRef = useRef<string | null>(null);
  const progress = useSectionProgress(gridRef, SECTION_OFFSETS.enter);
  const location = useLocation();

  useEffect(() => {
    filterRef.current = filter;
  }, [filter]);

  // Deep links: the URL's hash on load and on every navigation (router or a
  // plain in-page anchor). Open the targeted question; if it is hidden,
  // change what's shown and scroll to it once it's laid out (below).
  useEffect(() => {
    const reveal = (hash: string) => {
      if (hash.length < 2) return;
      let id: string;
      try {
        id = decodeURIComponent(hash.slice(1));
      } catch {
        return;
      }
      const item = document.getElementById(id)?.closest<HTMLDetailsElement>("details[data-faq]");
      const faq = item && BY_ID.get(item.id);
      if (!item || !faq) return;
      item.open = true;
      if (isShown(item)) return; // on screen already: App's hash effect scrolls to it
      const next = revealState(faq, filterRef.current);
      pendingRef.current = item.id;
      setFilter(next.filter);
      if (next.expand) setExpanded(true);
    };
    reveal(location.hash);
    const onHash = () => reveal(window.location.hash);
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [location.hash, location.key]);

  useEffect(() => {
    const id = pendingRef.current;
    if (!id) return;
    const item = document.getElementById(id);
    if (!item || !isShown(item)) return;
    pendingRef.current = null;
    requestAnimationFrame(() => {
      item.scrollIntoView({ block: "start" });
      item.querySelector("summary")?.focus({ preventScroll: true });
    });
  }, [filter, expanded]);

  const total = COUNTS[filter];
  const collapsible = total > FAQ_LIMIT;

  // Expanding puts the new rows before the control in reading order, so
  // focus moves to the first of them (it sits where the control was, so the
  // page barely moves); otherwise the next Tab would skip all of them.
  // Collapsing removes rows above the control: keep the control where the
  // reader's pointer is instead of letting the page jump under it.
  const toggle = () => {
    const btn = toggleRef.current;
    const before = btn?.getBoundingClientRect().top ?? 0;
    const collapsing = expanded;
    flushSync(() => setExpanded(!collapsing));
    if (!collapsing) {
      const rows = document.querySelectorAll<HTMLElement>(`#${LIST_ID} > details:not([hidden])`);
      rows[FAQ_LIMIT]?.querySelector("summary")?.focus();
      return;
    }
    if (btn) {
      const delta = btn.getBoundingClientRect().top - before;
      if (Math.abs(delta) > 1) window.scrollBy(0, delta);
    }
  };

  let n = 0;

  return (
    <Sheet id="faq" eyebrow={s.eyebrow}>
      <div
        ref={gridRef}
        className="grid grid-cols-1 gap-6 md:gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16 xl:gap-24"
      >
        {/* Left (lg+): heading, drawing and the direct line, sticky beside the
            list where the whole column fits on screen. Below lg the wrapper
            dissolves (display: contents) so the questions come straight after
            the heading and the "More questions?" box last. */}
        <div className="contents lg:block lg:self-start [@media(min-width:1024px)_and_(min-height:840px)]:sticky [@media(min-width:1024px)_and_(min-height:840px)]:top-[calc(var(--nav-h)+2.5rem)]">
          <div className="relative order-1 lg:order-none">
            <DisplayHeading lines={s.lines} outline={s.outline} className="relative z-10" />
            {/* Below lg it stands beside the heading (absolute: it adds no
                height); from lg it sits under it in the left column. */}
            <div className="pointer-events-none absolute -top-2 right-0 w-[84px] sm:w-[112px] md:-top-6 md:w-[150px] lg:static lg:mt-8 lg:w-[190px]">
              <QuestionMarkDrawing progress={progress} />
            </div>
          </div>

          {/* Phones: a two-row card, the title with Ask us beside it, the
              line under both. md+: title, line, button stacked. Reading order
              is title, line, button everywhere (grid placement only moves
              the button up on phones). */}
          <Reveal
            delay={0.1}
            className="order-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 border border-bone/20 bg-background/60 p-4 max-w-sm md:flex md:flex-col md:items-start md:p-7 lg:order-none lg:mt-8"
          >
            <p className="col-start-1 row-start-1 flex items-center gap-2 font-mono text-[11px] font-bold uppercase leading-none tracking-[0.18em] text-ember min-[400px]:gap-2.5 min-[400px]:tracking-[0.26em]">
              <span aria-hidden="true" className="h-px w-3 shrink-0 bg-ember min-[400px]:w-4" />
              {s.more.title}
            </p>
            <p className="col-span-2 row-start-2 mt-2.5 font-body text-sm font-light leading-normal text-foreground/80 md:mt-4 md:leading-relaxed">
              {s.more.body}
            </p>
            <a
              href={MAILTO}
              className="btn-ghost focus-ember col-start-2 row-start-1 min-h-[44px] px-4 py-2.5 min-[400px]:px-5 md:mt-6 md:px-6 md:py-3"
            >
              {s.more.cta}
              <ArrowUpRight aria-hidden="true" size={14} strokeWidth={1.5} />
            </a>
          </Reveal>
        </div>

        {/* right: filters, the questions, and the show-all row */}
        <div className="order-2 lg:order-none">
          {/* Phones: a full-width segmented control of three equal chips
              (it fits a 320px column); sm+: sized to its labels. */}
          <div role="group" aria-label={s.filterLabel} className="flex border border-bone/25 bg-background/60 sm:inline-flex">
            {FILTERS.map((key) => {
              const on = filter === key;
              return (
                <button
                  key={key}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setFilter(key)}
                  className={cn(
                    "focus-ember relative flex min-h-[44px] flex-1 items-center justify-center gap-2 border-l border-bone/25 px-2 font-mono text-[11px] uppercase tracking-[0.12em] transition-colors first:border-l-0 sm:flex-none sm:px-4 sm:tracking-[0.2em] md:px-5",
                    on ? "bg-ember/10 text-ember" : "text-foreground/70 hover:text-foreground",
                  )}
                >
                  {on && <span aria-hidden="true" className="absolute inset-x-0 -bottom-px h-px bg-ember" />}
                  {s.filters[key]}
                  <span className={cn("tabular-nums", on ? "text-ember/80" : "text-concrete")}>{COUNTS[key]}</span>
                </button>
              );
            })}
          </div>

          {/* Rows past the limit fold away through the list's data-collapsed
              (a stylesheet rule, never `hidden`: see the note above). Keep
              words like "extra" out of these class names: Readability drops
              any element whose class or id matches its "unlikely" list
              (extra, footer, menu, sponsor, ...), and it would drop the list. */}
          <div
            id={LIST_ID}
            data-collapsed={expanded ? undefined : ""}
            className="group/faq mt-4 border-t border-bone/20 md:mt-8"
          >
            {FAQS.map((faq) => {
              const inFilter = shows(faq, filter);
              const pos = inFilter ? ++n : 0;
              const extra = inFilter && pos > FAQ_LIMIT;
              return (
                <details
                  key={faq.q}
                  id={faqId(faq.q)}
                  data-faq=""
                  data-faq-extra={extra ? "" : undefined}
                  hidden={!inFilter}
                  className={cn(
                    "group border-b border-bone/15",
                    extra && "group-data-[collapsed]/faq:hidden",
                  )}
                >
                  {/* Phones: 52px rows (the whole row is the tap target) with
                      the question at 16px, so every question in the first
                      eight holds one line at 390px. md+: the roomier row. */}
                  <summary className="focus-ember flex min-h-[52px] cursor-pointer list-none items-center gap-3 py-2.5 md:min-h-[64px] md:gap-6 md:py-4 [&::-webkit-details-marker]:hidden">
                    <span className="w-8 shrink-0 font-mono text-[10px] tabular-nums tracking-[0.06em] text-ember/80 md:w-10 md:text-[11px] md:tracking-[0.12em]">
                      Q.{String(pos).padStart(2, "0")}
                    </span>
                    <span className="flex-1 font-display text-base uppercase leading-tight tracking-[0.01em] text-foreground transition-colors group-hover:text-ember group-open:text-ember md:text-lg">
                      {faq.q}
                    </span>
                    <span
                      aria-hidden="true"
                      className="flex h-7 w-7 shrink-0 items-center justify-center border border-bone/25 text-foreground/80 transition-[transform,border-color,color] duration-300 group-open:rotate-45 group-open:border-ember group-open:text-ember motion-reduce:transition-none md:h-8 md:w-8"
                    >
                      <Plus size={16} strokeWidth={1.5} />
                    </span>
                  </summary>
                  <div className="ml-11 border-l border-ember/40 pb-5 pl-4 pr-1 group-open:animate-in group-open:fade-in-0 group-open:slide-in-from-top-1 group-open:duration-500 motion-reduce:animate-none md:ml-[4rem] md:pb-7 md:pl-5 md:pr-12">
                    <p className="max-w-[62ch] font-body text-[15px] font-light leading-relaxed text-foreground/80">
                      <Answer text={faq.a} />
                    </p>
                    {faq.map && (
                      <a
                        href={VENUE_MAP_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="focus-ember mt-2 inline-flex min-h-[44px] items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.2em] text-ember transition-colors hover:text-foreground"
                      >
                        {CTA.map}
                        <ArrowUpRight aria-hidden="true" size={14} strokeWidth={1.5} />
                        <span className="sr-only">{NAV.newTab}</span>
                      </a>
                    )}
                  </div>
                </details>
              );
            })}
          </div>

          {collapsible && (
            <button
              ref={toggleRef}
              type="button"
              data-faq-toggle=""
              aria-expanded={expanded}
              aria-controls={LIST_ID}
              onClick={toggle}
              className="focus-ember group flex min-h-[52px] w-full items-center gap-3 border-b border-bone/15 py-2.5 text-left md:min-h-[60px] md:gap-6 md:py-3"
            >
              <span
                aria-hidden="true"
                className="w-8 shrink-0 font-mono text-[10px] tabular-nums tracking-[0.06em] text-ember/80 md:w-10 md:text-[11px] md:tracking-[0.12em]"
              >
                {expanded ? "" : `+${total - FAQ_LIMIT}`}
              </span>
              <span className="flex-1 font-mono text-xs font-bold uppercase tracking-[0.22em] text-foreground/85 transition-colors group-hover:text-ember">
                {expanded ? FAQ_MORE.showFewer : FAQ_MORE.showAll.replace("{n}", String(total))}
              </span>
              <span
                aria-hidden="true"
                className="flex h-7 w-7 shrink-0 items-center justify-center border border-ember/60 text-ember transition-colors group-hover:bg-ember/10 md:h-8 md:w-8"
              >
                <ChevronDown
                  size={16}
                  strokeWidth={1.5}
                  className={cn("transition-transform duration-300 motion-reduce:transition-none", expanded && "rotate-180")}
                />
              </span>
            </button>
          )}
          <noscript dangerouslySetInnerHTML={{ __html: `<style>${NOSCRIPT_CSS}</style>` }} />
        </div>
      </div>
    </Sheet>
  );
}
