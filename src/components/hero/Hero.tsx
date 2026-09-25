import { Suspense, lazy, useCallback, useEffect, useRef, useState, type CSSProperties, type MouseEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, useInView, useMotionValue, useMotionValueEvent, useScroll, useTransform } from "framer-motion";
import { useHydrated } from "@/hooks/useHydrated";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";
import { focusTarget } from "@/lib/focusTarget";
import { HERO } from "@/content/copy";
import HeroPoster, { HallStill, StageStill } from "./HeroPoster";
import EnterDoor from "./EnterDoor";
import { HALL_STILLS, STAGE_STILLS } from "./still";
import SceneBoundary from "./SceneBoundary";
import { STAGE_BANDS, bandMedia, layStill, restShot, type PhoneFrame } from "./frame";
import { hallChoice, hallForce } from "./device";
import { COPY_OUT, CTA_OUT, SPILL_IN } from "./timeline";
import "./hero.css";

// three.js + postprocessing are heavy: split them from the shell and load
// them only once the page has loaded and gone idle (phones: on the first
// touch or scroll), and only on a device that can draw them (device.ts).
// A still of the 3D hall is the hero until the scene is drawing, and stays
// it whenever the scene does not run or gives up.
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

/** Where the hall sits in each phone still (still.ts), as custom properties
 *  for hero.css, which lays the still and the Enter door on its door with
 *  them. On the hall plan, so both share them. */
const HALL_STILL_VARS = Object.fromEntries(
  (["phone", "side"] as const).flatMap((kind) =>
    (["a", "b", "c", "t", "u", "x", "r"] as const).map((k) => [`--still-${kind}-${k}`, String(HALL_STILLS[kind][k])]),
  ),
) as CSSProperties;

/** Each band's still, as custom properties for hero.css (which picks the
 *  band's set with the same media queries): its aspect ratio, and its door
 *  rim's middle and height as shares of its height. */
const STAGE_STILL_VARS = Object.fromEntries(
  STAGE_BANDS.flatMap((b) => {
    const s = STAGE_STILLS[b.name as keyof typeof STAGE_STILLS];
    return [
      [`--ss-${b.name}-ar`, (s.width / s.height).toFixed(4)],
      [`--ss-${b.name}-m`, ((s.rimTop + s.rimBottom) / 2).toFixed(4)],
      [`--ss-${b.name}-h`, (s.rimBottom - s.rimTop).toFixed(4)],
    ];
  }),
) as CSSProperties;

/** Set on the stage from the rest shot: the stage still's slide and scale
 *  (frame.ts layStill), and where its door is, for the Enter door on it. */
const STAGE_VARS = ["--stage-still-dy", "--stage-still-k", "--hall-door-mid", "--hall-door-h"] as const;

/** How long the scene takes to fade out over the still when it gives up. */
const FADE_MS = 900;

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

/** Whether the tab is visible, tracked (true on the server). */
function usePageVisible() {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const update = () => setVisible(document.visibilityState !== "hidden");
    update();
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);
  return visible;
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
 * Every layout opens on a still of the rendered 3D hall (scripts/
 * hero-still.mjs), in the prerendered HTML already, with the overlay copy
 * and the Enter door: the lit door itself is the link (EnterDoor), laid
 * over the still's door. The live scene crossfades in over the same
 * picture once it is drawing, and the still stays the hero whenever it does
 * not run: no WebGL, reduced motion, Save-Data, a low-memory or slow device
 * (device.ts). Once running, the scene watches its frame rate: a device that
 * cannot hold it steps down to the light tier (GalleryScene `tier`), then,
 * if even that is too slow or the WebGL context is lost, the scene fades
 * back out to the still and stops.
 *
 * Phones (below 768px) and short landscape windows (500px tall or less, a
 * phone held sideways) lay the hero out as a CSS hall: the copy, then the
 * hall plan (upright: stacked; sideways: the copy on the left, the hall
 * beside it), which shows a still of the phone scene (HallStill) placed the
 * way the scene frames it. On the first touch or scroll the lite scene
 * (GalleryScene `lite`: low pixel ratio, no reflection pass, one
 * half-resolution bloom) crossfades in over the same picture: upright, the
 * whole stage with the phone shot (frame.ts), the door under the type and
 * eight plinths down the floor above the Register bar; sideways, the hall's
 * column. No scroll dolly on phones, just an idle drift that eases in once
 * the scene is up.
 *
 * From 768px wide and 501px tall (STAGE_QUERY) the stage shows the still for
 * its aspect band (StageStill), slid and scaled so its door lands where the
 * scene will draw it (frame.ts layStill); the scene loads once the page is
 * idle and crossfades in over it. With motion allowed the section is 160svh
 * behind a sticky stage and scroll drives the entry (timeline.ts): the copy
 * lifts away, the camera walks up the runway past the sponsor plaques and
 * stops square on the lit door, and the stage's lower edge melts into the
 * page. Reduced motion gets a plain 100svh hero (a CSS-only switch, so SSR
 * matches) on the still.
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
  // The scene's quality tier, and whether it has given up for this visit
  // (too slow even light, a lost context, a crash): it then fades out over
  // the still (`failed`) and is unmounted (`gone`).
  const [tier, setTier] = useState<0 | 1>(() => (hallForce() === "light" ? 1 : 0));
  const [failed, setFailed] = useState(false);
  const [gone, setGone] = useState(false);
  const visible = usePageVisible();
  const planRef = useRef<HTMLDivElement>(null);
  // Phones get the lite scene. Reduced motion keeps the still everywhere.
  const lite = !wide;
  const wants = hydrated && !reduced;

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
      // A device that cannot draw the hall keeps the still (device.ts).
      setWebgl((known) => known ?? (hallChoice(lite) === "live" && canUseWebGL()));
      setIdle(true);
    };
    const idleGo = () => {
      if (w.requestIdleCallback) handle = w.requestIdleCallback(go, { timeout: 2000 });
      else timer = window.setTimeout(go, 300);
    };
    // Phones: three.js costs seconds of main thread on a mid-range CPU, so the
    // still of the hall stays until the visitor first touches or scrolls, then
    // the live 3D crossfades in over it. Desktop loads it once the page is idle.
    const INTERACT = ["pointerdown", "touchstart", "scroll", "keydown", "wheel"] as const;
    const onInteract = () => {
      INTERACT.forEach((t) => window.removeEventListener(t, onInteract));
      idleGo();
    };
    const schedule = () => {
      if (lite) INTERACT.forEach((t) => window.addEventListener(t, onInteract, { passive: true, once: true }));
      else idleGo();
    };
    if (document.readyState === "complete") schedule();
    else window.addEventListener("load", schedule, { once: true });
    return () => {
      cancelled = true;
      window.removeEventListener("load", schedule);
      INTERACT.forEach((t) => window.removeEventListener(t, onInteract));
      if (handle) w.cancelIdleCallback?.(handle);
      window.clearTimeout(timer);
    };
  }, [wants, idle, lite]);

  const scene = wants && idle && webgl === true && !gone;
  useEffect(() => {
    if (!scene) setReady(false);
  }, [scene]);

  // Giving up: the scene fades out over the still, then unmounts (which
  // stops its frame loop and frees the WebGL context).
  const fallBack = useCallback(() => {
    setFailed(true);
    setReady(false);
  }, []);
  useEffect(() => {
    if (!failed) return;
    const t = window.setTimeout(() => setGone(true), FADE_MS);
    return () => window.clearTimeout(t);
  }, [failed]);
  const onSlow = useCallback(() => {
    if (tier === 0) setTier(1);
    else fallBack();
  }, [tier, fallBack]);

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
      // Where the live scene will draw the door, and the still laid so its
      // own door is there too; the poster's Enter door goes on the still's.
      const shot = restShot(W / H, floor, H);
      const band = STAGE_BANDS.find((b) => window.matchMedia(bandMedia(b)).matches);
      const still = band && STAGE_STILLS[band.name as keyof typeof STAGE_STILLS];
      let mid = ((shot.rimTop + shot.rimBottom) / 2) * H;
      let doorH = (shot.rimBottom - shot.rimTop) * H;
      if (band && still) {
        const lay = layStill(W, H, band.fit, still, shot);
        stage.style.setProperty(STAGE_VARS[0], `${lay.dy.toFixed(1)}px`);
        stage.style.setProperty(STAGE_VARS[1], lay.k.toFixed(4));
        mid = lay.doorMid;
        doorH = lay.doorH;
      }
      stage.style.setProperty(STAGE_VARS[2], `${mid.toFixed(1)}px`);
      stage.style.setProperty(STAGE_VARS[3], `${doorH.toFixed(1)}px`);
    };
    const ro = new ResizeObserver(measure);
    ro.observe(stage);
    ro.observe(block);
    measure();
    return () => {
      ro.disconnect();
      STAGE_VARS.forEach((p) => stage.style.removeProperty(p));
    };
  }, [wide, side, scene, copyFloor, typeRef]);

  const onReady = useCallback(() => setReady(true), []);

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
      <div
        ref={stageRef}
        data-ready={ready || undefined}
        data-hall={failed ? "fallback" : ready ? "live" : "still"}
        className="hall-stage isolate min-h-[100svh] overflow-hidden"
        style={STAGE_STILL_VARS}
      >
        <HeroPoster />
        <StageStill />

        {/* poster type: eyebrow, the page's one h1, prize. In the flow
            on phones (the hall follows it, or stands beside it sideways),
            over the hall on the stage. */}
        <div className="hall-type-layer pointer-events-none z-20 [perspective:1200px]">
          <motion.div style={{ opacity: copyOpacity, y: copyY }} className="hall-type-pad">
            {/* The door is dead centre at every landscape aspect, so on the
                stage the type is held to the left 40% of the window, whatever
                its width. */}
            <div ref={typeRef} className="hall-type w-fit will-change-transform">
              <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-foreground/80 md:text-xs">
                {HERO.eyebrow}
              </p>
              {/* Capped by height too, so a short laptop window (1366x657)
                  keeps room under the type for the hall. */}
              <h1
                id="hero-title"
                className="hall-type__title display-giant mt-4 text-[clamp(2.4rem,min(5.45vw,9.8svh),7.25rem)] leading-[0.9] max-md:[@media(max-height:760px)]:text-[2.2rem] [@media(max-height:760px)]:mt-3"
              >
                <span className="block whitespace-nowrap">{HERO.h1[0]}</span>{" "}
                <span className="block whitespace-nowrap">{HERO.h1[1]}</span>
              </h1>
              <p className="hall-type__prize mt-5 max-w-[34rem] font-body text-base leading-snug text-foreground/85 md:max-w-[min(34rem,37vw)] md:text-lg [@media(max-height:760px)]:mt-3">
                <span className="hall-type__pool font-semibold text-ember">{HERO.prize.pool}</span> {HERO.prize.rest}
              </p>
            </div>
          </motion.div>
        </div>

        {/* The hall's floor plan. Phones: the still of the 3D hall under the
            type (sideways: beside it). Both layouts: the Enter door laid over
            the still's door. It steps aside once the scene brings its own
            (glued to the 3D door), and comes back if the scene gives up. */}
        <div ref={planRef} className="hall-plan" style={HALL_STILL_VARS}>
          <HallStill />
          <div className="hall-plan__doorway">
            <div className="hall-enter hall-enter--poster">
              <motion.div
                style={{ opacity: ctaOpacity, visibility: ctaVisibility, pointerEvents: ctaPointer }}
                className="hall-enter__fade"
              >
                <EnterDoor onEnter={enter} />
              </motion.div>
            </div>
          </div>
        </div>

        {scene && (
          <div
            data-lite={lite || undefined}
            data-tier={tier}
            className="hall-scene absolute inset-0 z-[5] transition-opacity [transition-duration:900ms] ease-out"
            style={{ opacity: ready && !failed ? 1 : 0 }}
          >
            <SceneBoundary onFail={fallBack}>
              <Suspense fallback={null}>
                <GalleryScene
                  progress={progress}
                  reduced={reduced}
                  active={inView && visible && !failed}
                  copyFloor={copyFloor}
                  onEnter={enter}
                  onReady={onReady}
                  lite={lite}
                  phoneFrame={phoneFrame}
                  tier={tier}
                  guard={hallForce() !== "live" && hallForce() !== "light"}
                  onSlow={onSlow}
                  onLost={fallBack}
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

        {/* the stage's lower edge melts into the page as the light comes up */}
        <motion.div
          aria-hidden="true"
          style={{ opacity: spillOpacity }}
          className="pointer-events-none absolute inset-x-0 bottom-0 z-30 h-[18%] bg-gradient-to-b from-transparent to-background"
        />
      </div>
    </section>
  );
}
