import { Suspense, lazy, useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { CLUB, KICKER } from "@/config/site";
import type { GatePhase } from "./GalleryScene";

// The 3D chunk (three.js + postprocessing) is heavy — load it split from the shell.
const GalleryCanvas = lazy(() => import("./GalleryScene"));

interface HeroGateProps {
  onEntered: () => void;
}

/** Lerped cursor parallax for the poster type — the "wiggle". */
function useTypeParallax(reduced: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (reduced) return;
    let raf = 0;
    let tx = 0, ty = 0, cx = 0, cy = 0;
    const onMove = (e: PointerEvent) => {
      tx = (e.clientX / window.innerWidth - 0.5) * 2;
      ty = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    const loop = () => {
      cx += (tx - cx) * 0.055;
      cy += (ty - cy) * 0.055;
      if (ref.current) {
        ref.current.style.transform =
          `translate3d(${cx * -16}px, ${cy * -11}px, 0) rotateX(${cy * 2.4}deg) rotateY(${cx * -2.6}deg)`;
      }
      raf = requestAnimationFrame(loop);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    raf = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, [reduced]);
  return ref;
}

function GateLoader() {
  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-background">
      <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
        MDC_2026 · opening the gallery
      </span>
      <span className="block h-px w-40 overflow-hidden bg-border">
        <span className="block h-full w-1/3 animate-[loader-sweep_1.1s_ease-in-out_infinite] bg-[hsl(var(--ember))]" />
      </span>
    </div>
  );
}

/**
 * The gated cinematic hero. The only exit is the ENTER THE CHALLENGE button
 * anchored to the portal inside the 3D scene; scrolling and keys just nudge
 * the visitor toward the door.
 */
export default function HeroGate({ onEntered }: HeroGateProps) {
  const reduced = !!useReducedMotion();
  const [phase, setPhase] = useState<GatePhase>("locked");
  const [nudge, setNudge] = useState(0);
  const [mounted, setMounted] = useState(false);
  const lastNudge = useRef(0);
  const typeRef = useTypeParallax(reduced);
  const lite = useRef(
    typeof window !== "undefined" && window.matchMedia("(max-width: 768px)").matches,
  ).current;

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const enter = useCallback(() => {
    setPhase((p) => {
      if (p === "entering") return p;
      return "entering";
    });
  }, []);

  // Scrolling (or paging) down walks the visitor through the door; anything
  // else that tries to move the page just flashes the guidance.
  useEffect(() => {
    if (phase !== "locked") return;
    const bump = () => {
      const now = Date.now();
      if (now - lastNudge.current < 700) return;
      lastNudge.current = now;
      setNudge((n) => n + 1);
    };
    const onWheel = (e: WheelEvent) => {
      if (e.deltaY > 0) enter();
      else bump();
    };
    let touchY: number | null = null;
    const onTouchStart = (e: TouchEvent) => {
      touchY = e.touches[0]?.clientY ?? null;
    };
    const onTouchMove = (e: TouchEvent) => {
      const y = e.touches[0]?.clientY ?? null;
      if (touchY !== null && y !== null && touchY - y > 24) enter();
      else bump();
    };
    const onKey = (e: KeyboardEvent) => {
      if (["ArrowDown", "PageDown", "End", " "].includes(e.key)) enter();
      else if (["ArrowUp", "PageUp", "Home"].includes(e.key)) bump();
    };
    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("keydown", onKey);
    };
  }, [phase, enter]);

  useEffect(() => {
    if (phase !== "entering") return;
    const t = setTimeout(onEntered, reduced ? 350 : 2050);
    return () => clearTimeout(t);
  }, [phase, reduced, onEntered]);

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden bg-background transition-opacity duration-700"
      style={{ opacity: mounted ? 1 : 0 }}
    >
      {/* Keyboard/AT escape hatch — same destination, no ceremony. */}
      <button
        type="button"
        onClick={onEntered}
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[80] focus:bg-[hsl(var(--ember))] focus:px-4 focus:py-2 focus:font-mono focus:text-xs focus:uppercase focus:tracking-widest focus:text-black"
      >
        Skip intro and enter the site
      </button>

      {/* 3D hall */}
      <div className="absolute inset-0">
        <Suspense fallback={<GateLoader />}>
          <GalleryCanvas phase={phase} reduced={reduced} lite={lite} nudge={nudge} onEnter={enter} />
        </Suspense>
      </div>

      {/* cinematic edge darkening over the render */}
      <div className="scene-vignette pointer-events-none absolute inset-0 z-10" aria-hidden="true" />
      <div className="grain-overlay" aria-hidden="true" />

      {/* poster type — parallaxes against the camera */}
      <div
        className="pointer-events-none absolute inset-0 z-20 transition-all duration-1000"
        style={{
          perspective: "1200px",
          opacity: phase === "entering" ? 0 : 1,
          transform: phase === "entering" ? "translateY(-6vh)" : undefined,
        }}
      >
        <div ref={typeRef} className="absolute left-[4vw] top-[9vh] will-change-transform md:left-[4.5vw] md:top-[10vh]">
          <p className="mono-label mb-4 flex items-center gap-3 !text-foreground/70">
            <span className="inline-block h-1.5 w-1.5 animate-[blink_1.6s_steps(1)_infinite] rounded-full bg-[hsl(var(--ember))]" />
            {KICKER} · {CLUB}
          </p>
          <h1 className="display-giant text-[clamp(2.9rem,9.2vw,11.5rem)] leading-[0.88]">
            <span className="block">Mackenzie</span>
            <span className="block">Design Cup</span>
          </h1>
          <p className="display-giant mt-3 text-[clamp(1rem,2.5vw,3.1rem)] tracking-[0.05em] text-foreground/90">
            Build the Impossible
          </p>
        </div>

        <div
          className="absolute right-[4vw] top-[9vh] hidden text-right font-mono text-[10px] uppercase leading-relaxed tracking-[0.22em] text-muted-foreground md:block"
          aria-hidden="true"
        >
          <div>Est. 2026</div>
          <div className="text-[hsl(var(--ember))]">⦿ gate locked</div>
        </div>
      </div>

      {/* enter transition: ember flood, then white-hot */}
      <div
        className="pointer-events-none absolute inset-0 z-30"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(38% 52% at 50% 54%, hsl(32 100% 62%) 0%, hsl(24 100% 50%) 38%, hsl(14 92% 34% / 0.9) 62%, transparent 100%)",
          opacity: phase === "entering" ? 1 : 0,
          transform: phase === "entering" ? "scale(2.6)" : "scale(1)",
          transition: reduced
            ? "opacity 0.3s ease"
            : "opacity 0.9s ease-in 0.7s, transform 1.3s cubic-bezier(0.5,0,0.8,1) 0.7s",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 z-40 bg-[#fff7ea]"
        aria-hidden="true"
        style={{
          opacity: phase === "entering" ? 1 : 0,
          transition: reduced ? "opacity 0.3s ease" : "opacity 0.45s ease-in 1.55s",
        }}
      />
    </div>
  );
}
