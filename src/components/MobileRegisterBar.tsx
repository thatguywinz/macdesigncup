import { useEffect, useId, useRef } from "react";
import { NAV } from "@/content/copy";
import RegisterButton from "./RegisterButton";
import { WhoRegistersShort } from "./nav/WhoRegisters";

/** What the bar steps aside for: the final CTA and the footer. */
const AWAY_FROM = ["#register", "[data-site-footer]"];

/**
 * Phones only: the one sticky Register, pinned to the bottom of the screen,
 * with who registers beside it in two short lines ("Teachers sign up
 * students" / "Students bring a teacher"), which also describe the button.
 * Through Prizes, Sponsors, The day and FAQ it is the only Register a phone
 * shows, so it carries the teacher/student rule itself.
 *
 * It slides away while the final CTA (#register) or the footer is on screen,
 * so a phone never shows two Register buttons at once, and comes back when
 * you scroll up. The switch is written straight to the DOM from an
 * IntersectionObserver (no React state); while away the bar is `inert`, so
 * it can't be tabbed to. Server render: shown.
 */
export default function MobileRegisterBar() {
  const barRef = useRef<HTMLElement>(null);
  const captionId = useId();

  useEffect(() => {
    const bar = barRef.current;
    if (!bar || typeof IntersectionObserver === "undefined") return;
    const targets = AWAY_FROM.map((s) => document.querySelector(s)).filter((el): el is Element => el !== null);
    if (targets.length === 0) return;

    const onScreen = new Set<Element>();
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) onScreen.add(e.target);
        else onScreen.delete(e.target);
      }
      const away = onScreen.size > 0;
      bar.toggleAttribute("data-away", away);
      bar.inert = away;
    });
    targets.forEach((t) => io.observe(t));
    return () => io.disconnect();
  }, []);

  // A labelled landmark, so nothing on the page sits outside one.
  return (
    <aside
      ref={barRef}
      aria-label={NAV.registerBar}
      className="fixed inset-x-0 bottom-0 z-50 border-t border-bone/15 bg-background/90 backdrop-blur-md transition-[transform,opacity] duration-500 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] data-[away]:pointer-events-none data-[away]:translate-y-full data-[away]:opacity-0 motion-reduce:transition-none md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-center gap-3 px-4 py-2.5 min-[380px]:gap-4">
        <WhoRegistersShort
          id={captionId}
          className="min-w-0 flex-1 border-l border-ember/70 pl-2.5"
        />
        <RegisterButton aria-describedby={captionId} className="min-h-[48px] shrink-0 px-5 py-3.5 text-[11px]" />
      </div>
    </aside>
  );
}
