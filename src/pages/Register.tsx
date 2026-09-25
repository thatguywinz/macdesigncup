import { useEffect, useId, useRef, useState, type SyntheticEvent } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, ArrowUpRight, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { REGISTRATION_EMBED_URL, REGISTRATION_URL } from "@/config/site";
import { BREADCRUMBS, REGISTER_PAGE } from "@/content/copy";
import DisplayHeading from "@/components/motion/DisplayHeading";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import Breadcrumbs from "@/pages/partner/components/Breadcrumbs";

// Tally's widget runtime. It finds every iframe[data-tally-src], sets its src
// when it nears the viewport, and (with dynamicHeight=1 in the embed URL)
// resizes the iframe to the form's height as the visitor moves through it.
// https://developers.tally.so/widgets/examples/react
const TALLY_SCRIPT = "https://tally.so/widgets/embed.js";
/** The iframe's height until Tally sizes it, and for good if the script is
 *  blocked: tall enough to use the first page of the form without guessing. */
const FALLBACK_HEIGHT = 720;
/** Give up on the widget script after this long and load the form directly. */
const SCRIPT_TIMEOUT_MS = 8000;
/** Show the iframe after this long even if its load event never arrived. */
const REVEAL_FALLBACK_MS = 12000;

declare global {
  interface Window {
    Tally?: { loadEmbeds: () => void };
  }
}

/**
 * One form for everyone, said in one line. Plain elements: this sits above
 * the fold, so nothing waits on JavaScript.
 */
function PathRows({ className }: { className?: string }) {
  return (
    <p
      className={cn(
        "flex items-center gap-3 font-body text-[15px] leading-snug text-foreground/85",
        className,
      )}
    >
      <Users aria-hidden="true" size={16} strokeWidth={1.5} className="shrink-0 text-ember" />
      {REGISTER_PAGE.oneForm}
    </p>
  );
}

/** "Questions first? Read the FAQ": under the paths on desktop, under the form below `lg`. */
function FaqLine({ className }: { className?: string }) {
  return (
    <p className={cn("font-body text-[15px] text-concrete", className)}>
      {REGISTER_PAGE.faqLead}{" "}
      <Link
        to="/#faq"
        className="focus-ember inline-flex min-h-11 items-center gap-1 text-ember underline underline-offset-4 transition-colors hover:text-foreground sm:min-h-0"
      >
        {REGISTER_PAGE.faqLink}
        <ArrowRight aria-hidden="true" size={14} strokeWidth={1.5} />
      </Link>
    </p>
  );
}

/**
 * The live Tally form in a plain frame. Server HTML carries the iframe with
 * `data-tally-src` (no `src`), so the prerendered page never loads Tally
 * itself; after mount the widget script sets the src and takes over the
 * height. If the script is blocked or never arrives, the iframe gets its src
 * directly and keeps a usable minimum height; the new-tab link below the
 * plate covers everything else (including no JavaScript at all).
 *
 * TODO(owner): the form's own look is set in Tally, not here. In the form's
 * Design settings set the button colour to ember #FF7214 with dark text
 * (#090A0C), text to bone #E9E1CE and the font to Archivo (a Google Font, free
 * in Tally), so the Submit button stops rendering in Tally's default violet.
 * Keep transparentBackground=1 in the embed URL. The "Made with Tally" badge
 * goes only with Tally Pro; never clip or hide it from here (free-plan terms,
 * and with dynamicHeight a clip could cut off the Submit row).
 */
function TallyPlate() {
  const plateId = useId();
  const frame = useRef<HTMLIFrameElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [direct, setDirect] = useState(false);

  // Never leave the form hidden: if its load event is somehow missed, show the
  // frame anyway once the page has had time to load it.
  useEffect(() => {
    const safety = window.setTimeout(() => setLoaded(true), REVEAL_FALLBACK_MS);
    return () => window.clearTimeout(safety);
  }, []);

  useEffect(() => {
    let settled = false;
    const loadDirect = () => {
      const el = frame.current;
      if (el && !el.getAttribute("src") && el.dataset.tallySrc) el.src = el.dataset.tallySrc;
      setDirect(true);
    };
    const run = () => {
      if (settled) return;
      settled = true;
      if (window.Tally) window.Tally.loadEmbeds();
      else loadDirect();
    };

    if (window.Tally) {
      run();
      return;
    }

    let script = document.querySelector<HTMLScriptElement>(`script[src="${TALLY_SCRIPT}"]`);
    if (script?.dataset.state === "error") {
      run();
      return;
    }
    if (!script) {
      script = document.createElement("script");
      script.src = TALLY_SCRIPT;
      script.async = true;
      script.addEventListener("load", () => script && (script.dataset.state = "loaded"), { once: true });
      script.addEventListener("error", () => script && (script.dataset.state = "error"), { once: true });
      document.body.appendChild(script);
    }
    script.addEventListener("load", run);
    script.addEventListener("error", run);
    const timer = window.setTimeout(() => {
      if (!window.Tally) run();
    }, SCRIPT_TIMEOUT_MS);

    return () => {
      settled = true;
      window.clearTimeout(timer);
      script?.removeEventListener("load", run);
      script?.removeEventListener("error", run);
    };
  }, []);

  // Tally renames the iframe after its form's internal title ("... Indication
  // of Interest"); keep ours, which says what the frame is on this page.
  useEffect(() => {
    const el = frame.current;
    if (!el) return;
    const keep = () => {
      if (el.title !== REGISTER_PAGE.formTitle) el.title = REGISTER_PAGE.formTitle;
    };
    const observer = new MutationObserver(keep);
    observer.observe(el, { attributes: true, attributeFilter: ["title"] });
    return () => observer.disconnect();
  }, []);

  // An iframe with no src fires a load for about:blank; only a real page counts.
  const onLoad = (event: SyntheticEvent<HTMLIFrameElement>) => {
    if (event.currentTarget.getAttribute("src")) setLoaded(true);
  };

  return (
    <section aria-labelledby={plateId} className="relative border border-bone/10">
      <h2 id={plateId} className="sr-only">
        {REGISTER_PAGE.plate}
      </h2>

      <div className="relative px-2 pb-3 pt-2 md:px-4 md:pb-5">
        {!loaded && (
          <div className="pointer-events-none absolute inset-x-4 top-6 md:inset-x-6" role="status">
            <p className="font-body text-sm text-concrete">{REGISTER_PAGE.loading}</p>
            <span aria-hidden="true" className="mt-3 block h-px w-full overflow-hidden bg-foreground/10">
              <span className="block h-px w-1/4 bg-ember/80 animate-[loader-sweep_1.6s_ease-in-out_infinite] motion-reduce:animate-none" />
            </span>
          </div>
        )}
        <iframe
          ref={frame}
          data-tally-src={REGISTRATION_EMBED_URL}
          title={REGISTER_PAGE.formTitle}
          loading="lazy"
          width="100%"
          height={FALLBACK_HEIGHT}
          frameBorder={0}
          marginHeight={0}
          marginWidth={0}
          onLoad={onLoad}
          className={cn(
            "relative block w-full border-0 transition-opacity duration-500",
            loaded ? "opacity-100" : "opacity-0",
            direct && "min-h-[640px]",
          )}
        />
      </div>
    </section>
  );
}

/**
 * /register: what, when and where, who registers and what the form asks each
 * of them, then the live Tally form. Desktop reads left to right (who
 * registers, then the form beside it, above the fold). The two notes are one
 * row each so the form starts on a phone's first screen. The first-screen copy is
 * plain markup, not <Reveal>: it is the phone's LCP and must not wait for
 * hydration.
 */
export default function Register() {
  return (
    <div className="relative min-h-screen bg-background">
      <SiteNav />
      <main id="main" className="relative z-10">
        <section
          aria-labelledby="register-h1"
          className="relative px-5 pb-20 pt-[calc(var(--nav-h)+1.25rem)] md:px-10 md:pb-28 md:pt-[calc(var(--nav-h)+2rem)] lg:px-16"
        >
          <div className="relative mx-auto w-full max-w-[1300px]">
            <Breadcrumbs
              items={[{ label: BREADCRUMBS.home, to: "/" }, { label: BREADCRUMBS.register }]}
              className="mb-8 md:mb-12"
            />

            <div className="grid gap-6 md:gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-16 xl:gap-20">
              {/* who registers */}
              <div>
                <DisplayHeading as="h1" id="register-h1" reveal={false} lines={REGISTER_PAGE.h1} />
                <p className="mt-4 max-w-[34rem] font-body text-lg leading-relaxed text-foreground/75 md:mt-5 md:text-xl">
                  {REGISTER_PAGE.intro}
                </p>

                <PathRows className="mt-5 max-w-[34rem] md:mt-6" />

                <FaqLine className="mt-6 hidden lg:block" />
              </div>

              {/* the form */}
              <div className="lg:pt-2">
                <TallyPlate />
                {/* Below lg the FAQ line waits under the form, so the form starts on the first screen. */}
                <FaqLine className="mt-5 lg:hidden" />
                <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="font-body text-[15px] text-concrete">
                    {REGISTER_PAGE.fallbackLead}{" "}
                    <a
                      href={REGISTRATION_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="focus-ember inline-flex min-h-11 items-center gap-1 text-ember underline underline-offset-4 transition-colors hover:text-foreground sm:min-h-0"
                    >
                      {REGISTER_PAGE.fallbackLink}
                      <ArrowUpRight aria-hidden="true" size={14} strokeWidth={1.5} />
                    </a>
                  </p>
                  <Link
                    to="/"
                    className="focus-ember inline-flex min-h-11 items-center gap-2 font-body text-[15px] text-foreground/70 transition-colors hover:text-foreground sm:min-h-0"
                  >
                    <ArrowLeft aria-hidden="true" size={14} strokeWidth={1.5} />
                    {REGISTER_PAGE.back}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
