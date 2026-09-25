import { Suspense, lazy, useCallback, useEffect, useRef, useState, type MouseEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, useInView, useMotionValue, useMotionValueEvent, useScroll, useTransform } from "framer-motion";
import { ArrowDown } from "lucide-react";
import { useHydrated } from "@/hooks/useHydrated";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";
import { focusTarget } from "@/lib/focusTarget";
import { CTA, HERO } from "@/content/copy";
import HeroPoster, { HallPlaques } from "./HeroPoster";
import SceneBoundary from "./SceneBoundary";
import { restShot, type PhoneFrame } from "./frame";
import { COPY_OUT, CTA_OUT, GLOW_IN, GLOW_PEAK, SPILL_IN } from "./timeline";
import "./hero.css";

// three.js + postprocessing are heavy: split them from the shell and load
// them only once the page has loaded and gone idle. The poster (on phones,
// the CSS hall) is the hero until the scene is up, and stays it without
// WebGL (and on phones, with reduced motion).
const GalleryScene = lazy(() => import("./GalleryScene"));

/** The 3D stage layout: 768px wide and more than 500px tall. hero.css keys the
 *  same switch on this query, so markup never branches on it. Shorter windows
 *  (a phone held sideways, 844x390, 932x430) get the CSS hall laid out side by
 *  side instead: the stage's type would fill their height and the door's
 *  Enter slab would land on the prize line. */
const STAGE_QUERY = "(min-width: 768px) and (min-height: 501px)";
/** The CSS hall laid out side by side (hero.css): a phone held sideways. The
 *  phone scene then centres the hall on the hall's column, beside the type. */
const SIDE_QUERY = "(max-height: 500px) and (min-aspect-ratio: 4/3)";

const NEXT = "glance";
/** The Enter click's glide down the page on desktop, in ms (plays the dolly). */
const GLIDE_MS = 2400;

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const easeInOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;

/** The poster door's placement, set on the stage from the rest shot. */
const DOOR_VARS = ["--hall-door-mid", "--hall-door-h", "--hall-cta-mid"] as const;

type IdleWindow = Window & {
  requestIdleCallback?: (cb: () => void, options?: { timeout: number }) => number;
  cancelIdleCallback?: (handle: number) => void;
};

/** Lerped cursor parallax for the poster type (the "wiggle"). Effect-driven,
 *  only for a mouse or pen: a touch screen has no cursor to follow. */
function useTypeParallax(enabled: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!enabled || !window.matchMedia("(pointer: fine)").matches) {
      el.style.transform = "";
      return;
    }
    let raf = 0;
    let tx = 0;
    let ty = 0;
    let cx = 0;
    let cy = 0;
    const onMove = (e: PointerEvent) => {
      tx = (e.clientX / window.innerWidth - 0.5) * 2;
      ty = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    const loop = () => {
      const dx = tx - cx;
      const dy = ty - cy;
      // Settled: skip the style write until the cursor moves again.
      if (Math.abs(dx) > 0.0005 || Math.abs(dy) > 0.0005) {
        cx += dx * 0.055;
        cy += dy * 0.055;
        el.style.transform = `translate3d(${cx * -14}px, ${cy * -10}px, 0) rotateX(${cy * 2.2}deg) rotateY(${cx * -2.4}deg)`;
      }
      raf = requestAnimationFrame(loop);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    raf = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, [enabled]);
  return ref;
}

/** Whether this browser can make a WebGL context at all. Checked once, when
 *  the scene is about to load; without it the poster simply stays the hero
 *  (and the console stays clean instead of logging three.js's failure). */
function canUseWebGL() {
  try {
    const probe = document.createElement("canvas");
    const gl = probe.getContext("webgl2") ?? probe.getContext("webgl");
    if (!gl) return false;
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return true;
  } catch {
    return false;
  }
}

/** Scroll the window to `to` over `ms`, cancelled by any user input. */
function glide(to: number, ms: number, done: () => void) {
  const root = document.documentElement;
  const from = window.scrollY;
  const prevBehavior = root.style.scrollBehavior;
  // html is `scroll-behavior: smooth`; each step must land instantly.
  root.style.scrollBehavior = "auto";
  const t0 = performance.now();
  let raf = 0;
  let over = false;
  const inputs = ["wheel", "touchstart", "keydown", "pointerdown"] as const;
  const stop = () => {
    if (over) return;
    over = true;
    cancelAnimationFrame(raf);
    root.style.scrollBehavior = prevBehavior;
    inputs.forEach((type) => window.removeEventListener(type, stop));
  };
  const step = (now: number) => {
    const k = clamp01((now - t0) / ms);
    window.scrollTo(0, from + (to - from) * easeInOutSine(k));
    if (k < 1) raf = requestAnimationFrame(step);
    else {
      stop();
      done();
    }
  };
  inputs.forEach((type) => window.addEventListener(type, stop, { passive: true }));
  raf = requestAnimationFrame(step);
}

/** Whether a media query matches, tracked. False on the server and the
 *  first render, so the markup never branches on it. */
function useMedia(query: string) {
  const [match, setMatch] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const update = () => setMatch(mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, [query]);
  return match;
}

/**
 * The home page's hero: the 3D gallery hall, and the page's only <h1>.
 *
 * Server and first render: a composed CSS poster of the hall (door glow,
 * floor, drafting grid) with the overlay copy and a real Enter link, so the
 * prerendered HTML and visitors without WebGL get a complete hero.
 *
 * Phones (below 768px) and short landscape windows (500px tall or less, a
 * phone held sideways) lay that poster out as a CSS hall: the copy, then the
 * lit door with the Enter slab, then every hall sponsor as a small plaque
 * grid on the floor, in the flow so the door can never sit on the copy
 * (upright: stacked; sideways: the copy on the left, the hall beside it).
 * Once the page is idle the lite scene (GalleryScene `lite`: low pixel
 * ratio, no reflection pass, one half-resolution bloom) fades in over it:
 * upright, the whole stage with the phone shot (frame.ts), the door under
 * the type and eight plinths down the floor above the Register bar;
 * sideways, the hall's column. No scroll dolly on phones, just the idle
 * drift; the CSS hall stays without WebGL or with reduced motion.
 *
 * From 768px wide and 501px tall (STAGE_QUERY) the scene loads once the page
 * is idle and crossfades in over
 * the poster, whose door and slab are placed from the same camera maths
 * (frame.ts). With motion allowed the section is 160svh behind a sticky
 * stage and scroll drives the entry (timeline.ts): the copy lifts away, the
 * camera walks up the runway past the sponsor plaques and stops square on
 * the lit door, whose warm light then rises around it (a glow with dark
 * edges, never a flat field) and carries on into the top of #glance.
 * Reduced motion gets a plain 100svh hero (a CSS-only switch, so SSR matches).
 */
export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const hydrated = useHydrated();
  const reduced = useReducedMotionSafe();
  // Active only while a real part of the hero is on screen: Enter lands the
  // visitor at #glance with the hero's last 88px tucked under the nav, which
  // is not worth a full reflector + bloom frame 60 times a second.
  const inView = useInView(sectionRef, { margin: "-20% 0px 0px 0px" });
  const location = useLocation();
  const navigate = useNavigate();

  // The 3D stage layout (STAGE_QUERY), and the sideways CSS hall
  // (SIDE_QUERY). False on the server and the first render, like the CSS
  // hall it starts from.
  const wide = useMedia(STAGE_QUERY);
  const side = useMedia(SIDE_QUERY);
  const [idle, setIdle] = useState(false);
  const [webgl, setWebgl] = useState<boolean | null>(null);
  const [ready, setReady] = useState(false);
  const planRef = useRef<HTMLDivElement>(null);
  // Phones get the lite scene, and only with motion allowed: reduced motion
  // keeps the still CSS hall.
  const lite = !wide;
  const wants = hydrated && (wide || !reduced);

  // Load the scene after the page's `load` and an idle moment (the poster
  // covers the wait).
  useEffect(() => {
    if (!wants || idle) return;
    const w = window as IdleWindow;
    let cancelled = false;
    let handle = 0;
    let timer = 0;
    const go = () => {
      if (cancelled) return;
      setWebgl((known) => known ?? canUseWebGL());
      setIdle(true);
    };
    const schedule = () => {
      if (w.requestIdleCallback) handle = w.requestIdleCallback(go, { timeout: 2000 });
      else timer = window.setTimeout(go, 300);
    };
    if (document.readyState === "complete") schedule();
    else window.addEventListener("load", schedule, { once: true });
    return () => {
      cancelled = true;
      window.removeEventListener("load", schedule);
      if (handle) w.cancelIdleCallback?.(handle);
      window.clearTimeout(timer);
    };
  }, [wants, idle]);

  const scene = wants && idle && webgl === true;
  useEffect(() => {
    if (!scene) setReady(false);
  }, [scene]);

  const dolly = hydrated && wide && !reduced;

  // Scroll progress through the tall section, held at 0 whenever there is
  // no dolly (phones, reduced motion), so nothing scroll-driven ever shows.
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end end"] });
  const progress = useMotionValue(0);
  const dollyRef = useRef(false);
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    progress.set(dollyRef.current ? clamp01(v) : 0);
  });
  useEffect(() => {
    dollyRef.current = dolly;
    progress.set(dolly ? clamp01(scrollYProgress.get()) : 0);
  }, [dolly, progress, scrollYProgress]);

  const copyOpacity = useTransform(progress, COPY_OUT, [1, 0]);
  const copyY = useTransform(progress, COPY_OUT, ["0vh", "-6vh"]);
  // The door's light, rising around it once the camera has nearly stopped.
  // Held well under 1 and shaped in hero.css so the frame's edges stay dark.
  const glowOpacity = useTransform(progress, GLOW_IN, [0, GLOW_PEAK]);
  const glowScale = useTransform(progress, GLOW_IN, [0.82, 1]);
  const spillOpacity = useTransform(progress, SPILL_IN, [0, 1]);
  // The poster's Enter slab steps aside as the walk starts, like the scene's
  // own, so a desktop without WebGL never has the door's light wash over it.
  // On an inner wrapper: the outer class still hands over to the scene.
  const ctaOpacity = useTransform(progress, CTA_OUT, [1, 0]);
  const ctaVisibility = useTransform(progress, (v) => (v >= CTA_OUT[1] ? "hidden" : "inherit"));
  const ctaPointer = useTransform(progress, (v) => (v > (CTA_OUT[0] + CTA_OUT[1]) / 2 ? "none" : "auto"));

  const typeRef = useTypeParallax(hydrated && !reduced && inView);

  // Where the poster type ends, for the scene (it keeps the plaque rows, or
  // upright the door, clear under it) and for the poster's own door, which
  // is placed where the scene will draw it. Layout offsets, not rects: the
  // type carries a cursor-parallax transform and lifts with scroll.
  const copyFloor = useMotionValue(0);
  // The phone scene's frame, from the CSS hall it replaces: the room the
  // Register bar leaves at the bottom (the hall plan's bottom padding) and,
  // sideways, the hall's column (the scene centres the hall on it).
  const [phoneFrame, setPhoneFrame] = useState<PhoneFrame | null>(null);
  useEffect(() => {
    const stage = stageRef.current;
    const plan = planRef.current;
    if (!scene || !lite || !stage || !plan || typeof ResizeObserver === "undefined") {
      setPhoneFrame(null);
      return;
    }
    const measure = () => {
      const bottomPx = Math.round(parseFloat(getComputedStyle(plan).paddingBottom) || 0);
      const column = side ? { left: plan.offsetLeft, width: plan.offsetWidth } : null;
      setPhoneFrame((f) =>
        f &&
        f.bottomPx === bottomPx &&
        f.column?.left === column?.left &&
        f.column?.width === column?.width
          ? f
          : { bottomPx, column },
      );
    };
    const ro = new ResizeObserver(measure);
    ro.observe(stage);
    ro.observe(plan);
    measure();
    return () => ro.disconnect();
  }, [scene, lite, side]);

  useEffect(() => {
    const stage = stageRef.current;
    const block = typeRef.current;
    if (!(wide || scene) || !stage || !block || typeof ResizeObserver === "undefined") return;
    const measure = () => {
      const W = stage.clientWidth;
      const H = stage.clientHeight;
      if (!W || !H) return;
      // Sideways the hall stands beside the type, not under it: only the
      // nav is over it (the hall plan's top padding clears the nav).
      const plan = planRef.current;
      if (side && plan) {
        copyFloor.set(Math.max(0, (parseFloat(getComputedStyle(plan).paddingTop) || 0) - 10) / H);
        return;
      }
      let top = 0;
      let el: HTMLElement | null = block;
      while (el && el !== stage) {
        top += el.offsetTop;
        el = el.offsetParent as HTMLElement | null;
      }
      if (el !== stage) return;
      const floor = (top + block.offsetHeight) / H;
      copyFloor.set(floor);
      if (!wide) return;
      const shot = restShot(W / H, floor, H);
      stage.style.setProperty(DOOR_VARS[0], `${(((shot.rimTop + shot.rimBottom) / 2) * H).toFixed(1)}px`);
      stage.style.setProperty(DOOR_VARS[1], `${((shot.rimBottom - shot.rimTop) * H).toFixed(1)}px`);
      stage.style.setProperty(DOOR_VARS[2], `${(shot.cta * H).toFixed(1)}px`);
    };
    const ro = new ResizeObserver(measure);
    ro.observe(stage);
    ro.observe(block);
    measure();
    return () => {
      ro.disconnect();
      DOOR_VARS.forEach((p) => stage.style.removeProperty(p));
    };
  }, [wide, side, scene, copyFloor, typeRef]);

  const onReady = useCallback(() => setReady(true), []);
  const onFail = useCallback(() => setReady(false), []);

  const enter = useCallback(
    (event: MouseEvent<HTMLAnchorElement>) => {
      if (
        event.defaultPrevented ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        event.button !== 0
      ) {
        return;
      }
      const target = document.getElementById(NEXT);
      if (!target) return;
      event.preventDefault();
      // window.scrollTo ignores scroll-padding, so clear the nav by hand with
      // the same value (html's scroll-padding-top, src/index.css).
      const margin = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
      const to = Math.max(0, target.getBoundingClientRect().top + window.scrollY - margin);
      // Land like a native in-page jump: focus on the section, then the hash.
      const land = () => {
        focusTarget(target);
        navigate(
          { pathname: location.pathname, search: location.search, hash: `#${NEXT}` },
          { replace: location.hash === `#${NEXT}` },
        );
      };
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        const root = document.documentElement;
        const prev = root.style.scrollBehavior;
        root.style.scrollBehavior = "auto";
        window.scrollTo(0, to);
        root.style.scrollBehavior = prev;
        land();
      } else if (dollyRef.current) {
        // Scroll drives the dolly, so a long, even glide plays the walk to the door.
        glide(to, GLIDE_MS, land);
      } else {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        land();
      }
    },
    [location.hash, location.pathname, location.search, navigate],
  );

  return (
    <section
      id="top"
      ref={sectionRef}
      aria-labelledby="hero-title"
      className="hall-section relative min-h-[100svh] bg-background"
    >
      {/* Layout (in flow, sideways or the sticky 3D stage) is set in hero.css
          on STAGE_QUERY, so the server render already has the right one. */}
      <div ref={stageRef} data-ready={ready || undefined} className="hall-stage isolate min-h-[100svh] overflow-hidden">
        <HeroPoster />

        {/* poster type: eyebrow, the page's one h1, prize. In the flow
            on phones (the hall follows it, or stands beside it sideways),
            over the hall on the stage. */}
        <div className="hall-type-layer pointer-events-none z-20 [perspective:1200px]">
          <motion.div style={{ opacity: copyOpacity, y: copyY }} className="hall-type-pad">
            {/* The door is dead centre at every landscape aspect, so on the
                stage the type is held to the left 40% of the window, whatever
                its width. */}
            <div ref={typeRef} className="hall-type w-fit will-change-transform">
              <p className="mono-label flex items-center gap-3 !text-foreground/80 max-[379px]:gap-2.5 max-[379px]:!tracking-[0.17em]">
                <span aria-hidden="true" className="inline-block h-1.5 w-1.5 shrink-0 bg-ember" />
                <span>{HERO.eyebrow}</span>
              </p>
              {/* Capped by height too, so a short laptop window (1366x657)
                  keeps room under the type for the hall. */}
              <h1
                id="hero-title"
                className="hall-type__title display-giant mt-4 text-[clamp(2.75rem,min(6.4vw,11.5svh),8.5rem)] leading-[0.88] max-md:[@media(max-height:760px)]:text-[2.5rem] [@media(max-height:760px)]:mt-3"
              >
                <span className="block whitespace-nowrap">{HERO.h1[0]}</span>{" "}
                <span className="block whitespace-nowrap">{HERO.h1[1]}</span>
              </h1>
              <p className="hall-type__prize mt-5 max-w-[36rem] font-mono text-[11px] uppercase leading-relaxed tracking-[0.18em] text-foreground/80 md:mt-5 md:max-w-[min(36rem,37vw)] xl:text-xs [@media(max-height:760px)]:mt-3">
                <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="hall-type__pool font-display text-[clamp(1.5rem,2.05vw,2.2rem)] leading-none tracking-normal text-ember">
                    {HERO.prize.pool}
                  </span>{" "}
                  <span>{HERO.prize.rest}</span>
                </span>
              </p>
            </div>
          </motion.div>
        </div>

        {/* The hall's floor plan. Phones: the lit door with the Enter slab on
            it, then the sponsor plaques, under the type (sideways: beside it).
            On the stage: the poster's Enter slab over the poster door, until
            the scene brings its own (glued to the 3D door) and this one steps
            aside. */}
        <div ref={planRef} className="hall-plan">
          <div className="hall-plan__doorway">
            <div aria-hidden="true" className="hall-door hall-plan__door" />
            <div className="hall-cta hall-cta--poster">
              <motion.div
                style={{ opacity: ctaOpacity, visibility: ctaVisibility, pointerEvents: ctaPointer }}
                className="hall-cta__fade"
              >
                <a href={`#${NEXT}`} onClick={enter} aria-label={CTA.enter} className="hall-cta__btn">
                  <span>{CTA.enter}</span>
                  <ArrowDown aria-hidden="true" size={18} strokeWidth={1.5} />
                </a>
              </motion.div>
            </div>
          </div>
          <HallPlaques />
        </div>

        {scene && (
          <div
            data-lite={lite || undefined}
            className="hall-scene absolute inset-0 z-[5] transition-opacity [transition-duration:900ms] ease-out"
            style={{ opacity: ready ? 1 : 0 }}
          >
            <SceneBoundary onFail={onFail}>
              <Suspense fallback={null}>
                <GalleryScene
                  progress={progress}
                  reduced={reduced}
                  active={inView}
                  copyFloor={copyFloor}
                  onEnter={enter}
                  onReady={onReady}
                  lite={lite}
                  phoneFrame={phoneFrame}
                />
              </Suspense>
            </SceneBoundary>
          </div>
        )}

        {/* cinematic edge darkening, and a soft scrim under the poster type */}
        <div aria-hidden="true" className="scene-vignette pointer-events-none absolute inset-0 z-10" />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(70%_60%_at_8%_22%,hsl(220_8%_3%/0.6),transparent_70%)]"
        />

        {/* the door's light, rising around it at the end of the walk (desktop dolly only) */}
        <motion.div aria-hidden="true" style={{ opacity: glowOpacity, scale: glowScale }} className="hall-glow z-30" />
        {/* the stage's lower edge melts into the page as the light comes up */}
        <motion.div
          aria-hidden="true"
          style={{ opacity: spillOpacity }}
          className="pointer-events-none absolute inset-x-0 bottom-0 z-30 h-[18%] bg-gradient-to-b from-transparent to-background"
        />
      </div>

      {/* the same light spilling onto the top of the next section */}
      <motion.div
        aria-hidden="true"
        style={{ opacity: spillOpacity }}
        className="pointer-events-none absolute inset-x-0 top-full h-[70svh] bg-[radial-gradient(60%_55%_at_50%_0%,hsl(24_100%_50%/0.22),transparent_75%)]"
      />
    </section>
  );
}
