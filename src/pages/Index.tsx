import { useEffect, useState } from "react";
import { useScroll, useReducedMotion } from "framer-motion";
import SketchStudio from "@/components/SketchStudio";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import MobileRegisterBar from "@/components/MobileRegisterBar";
import RegisterButton from "@/components/RegisterButton";
import TimelineSection from "@/sections/TimelineSection";
import FAQSection from "@/sections/FAQSection";

/** Reusable SVG filters that give crisp elements a hand-drawn wobble. */
function SketchDefs() {
  return (
    <svg width="0" height="0" className="absolute" aria-hidden="true">
      <defs>
        <filter id="roughen">
          <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="2" seed="7" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="3" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <filter id="roughen-strong">
          <feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="2" seed="4" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="5" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
    </svg>
  );
}

const Index = () => {
  const reduced = !!useReducedMotion();
  const { scrollYProgress } = useScroll();

  return (
    <div className="relative min-h-screen bg-background">
      <SketchDefs />
      {/* fixed drafting-table ground */}
      <div className="paper-grid pointer-events-none fixed inset-0 z-0 opacity-70" aria-hidden="true" />
      <div
        className="pointer-events-none fixed inset-0 z-0"
        aria-hidden="true"
        style={{ background: "radial-gradient(120% 90% at 50% 0%, transparent 40%, rgba(8,8,10,0.85) 100%)" }}
      />
      <div className="grain-overlay" aria-hidden="true" />

      <SiteNav />

      <main id="main" className="relative z-10">
        <Hero progress={scrollYProgress} reduced={reduced} />
        <ProcessStrip />
        <WhySection />
        <TimelineSection />
        <FAQSection />
        <CTASection />
      </main>

      <SiteFooter />
      <MobileRegisterBar />
    </div>
  );
};

/* ── HERO ─────────────────────────────────────────────────────── */
function Hero({ progress, reduced }: { progress: ReturnType<typeof useScroll>["scrollYProgress"]; reduced: boolean }) {
  const [pct, setPct] = useState(reduced ? 100 : 0);
  useEffect(() => {
    if (reduced) return;
    const t0 = performance.now();
    let id = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / 2400);
      setPct(Math.round(p * 100));
      if (p < 1) id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [reduced]);

  return (
    <section className="relative mx-auto grid min-h-[100svh] max-w-[1500px] grid-cols-1 items-center gap-6 px-5 pb-16 pt-24 md:px-10 lg:grid-cols-[1.02fr_0.98fr] lg:pt-20">
      {/* left — copy */}
      <div className="order-2 lg:order-1">
        <div className="mb-6 flex items-center gap-3">
          <span className="inline-block h-2 w-2 animate-[blink_1.6s_steps(1)_infinite] rounded-full bg-marker" />
          <span className="mono-label !text-foreground/70">Mac Design Cup 2026 — 3D Design Hackathon</span>
        </div>

        <h1 className="display-hero text-foreground">
          <span className="block">Build</span>
          <span className="block"><span className="wire-text-marker">something</span></span>
          <span className="block">from nothing.</span>
        </h1>

        <p className="mt-7 max-w-md font-body text-base font-light leading-relaxed text-muted-foreground md:text-lg">
          One day. One prompt. A blank file and whatever you can dream up — modeled,
          rendered and shipped in 3D. No experience required.
        </p>

        <div className="mt-9 flex flex-wrap items-center gap-4">
          <RegisterButton className="px-7 py-3.5">
            Claim your spot
            <span aria-hidden> ↗</span>
          </RegisterButton>
          <span className="hand hand-ink">it's free — obviously</span>
        </div>

        {/* facts row */}
        <div className="mt-11 flex flex-wrap gap-x-8 gap-y-3 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
          <Fact k="Who" v="TDSB · GTA" />
          <Fact k="Where" v="George Brown" />
          <Fact k="Cost" v="$0.00" />
          <Fact k="Prizes" v="Cash + swag" />
        </div>
      </div>

      {/* right — the build viewport */}
      <div className="relative order-1 lg:order-2">
        <div className="relative mx-auto aspect-square w-full max-w-[560px]">
          <SketchStudio progress={progress} reducedMotion={reduced} />

          {/* HUD — top-left */}
          <div className="pointer-events-none absolute left-2 top-2 font-mono text-[10px] uppercase tracking-[0.18em] text-foreground/70">
            <div className="flex items-center gap-2">
              <span className="inline-block h-1.5 w-1.5 animate-[blink_1.2s_steps(1)_infinite] rounded-full bg-marker" />
              MODEL_01 · WIP
            </div>
            <div className="mt-1 text-muted-foreground">rendering… {pct}%</div>
          </div>
          {/* HUD — top-right */}
          <div className="pointer-events-none absolute right-2 top-2 text-right font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            <div>icosa.01</div>
            <div className="mt-1">12 V · 30 E</div>
          </div>
          {/* HUD — bottom-right coords */}
          <div className="pointer-events-none absolute bottom-2 right-2 text-right font-mono text-[10px] tracking-[0.12em] text-muted-foreground">
            (0.000, 0.000, 0.000)
          </div>

          {/* marker notes */}
          <span className="hand pointer-events-none absolute right-0 top-[22%] rotate-tiny-r text-sm">
            still rendering ↴
          </span>
          <span className="hand hand-ink pointer-events-none absolute left-1 top-[46%] text-sm">
            your idea → here
          </span>
        </div>
      </div>
    </section>
  );
}

function Fact({ k, v }: { k: string; v: string }) {
  return (
    <span className="flex items-baseline gap-2">
      <span className="text-foreground/40">{k}</span>
      <span className="text-foreground">{v}</span>
    </span>
  );
}

/* ── PROCESS STRIP ────────────────────────────────────────────── */
function ProcessStrip() {
  const steps = [
    { n: "01", t: "Idea", d: "A prompt drops. You riff." },
    { n: "02", t: "Sketch", d: "Block it out, rough and fast." },
    { n: "03", t: "Model", d: "Build it in 3D — any tool." },
    { n: "04", t: "Ship", d: "Render, present, win." },
  ];
  return (
    <section className="border-y border-border/70 bg-panel/40">
      <div className="mx-auto grid max-w-[1500px] grid-cols-2 md:grid-cols-4">
        {steps.map((s, i) => (
          <div key={s.n} className={`relative px-5 py-8 md:px-8 md:py-10 ${i < 3 ? "md:border-r border-border/70" : ""} ${i < 2 ? "border-b md:border-b-0 border-border/70" : ""} ${i === 2 ? "border-r md:border-r border-border/70" : ""}`}>
            <div className="font-mono text-[11px] tracking-[0.2em] text-marker">{s.n}</div>
            <div className="mt-2 font-display text-xl font-bold uppercase tracking-tight text-foreground md:text-2xl">{s.t}</div>
            <div className="mt-1.5 font-body text-sm font-light text-muted-foreground">{s.d}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── WHY / PITCH ──────────────────────────────────────────────── */
function WhySection() {
  const cards = [
    { k: "No experience? Good.", d: "Half the field has never opened Blender. You'll learn more in one day than a month of tutorials.", note: "seriously — come" },
    { k: "Real stakes.", d: "Cash prizes, a panel of judges, and your work on a screen in front of everyone. It counts.", note: "no pressure ✳" },
    { k: "Free everything.", d: "Free to enter, free food all day, free swag to take home. Just bring a laptop and an idea.", note: "yes, actually free" },
  ];
  return (
    <section id="why" className="relative mx-auto max-w-[1500px] px-5 py-24 md:px-10 md:py-32">
      <div className="mb-14 flex items-baseline gap-4">
        <span className="font-mono text-xs tracking-[0.22em] text-muted-foreground">[ WHY JOIN ]</span>
        <span className="h-px flex-1 bg-border" />
      </div>
      <h2 className="display-scene mb-4 text-foreground">
        From a blank file<br />to <span className="wire-text">something real.</span>
      </h2>
      <div className="mt-14 grid gap-6 md:grid-cols-3">
        {cards.map((c, i) => (
          <div key={i} className={`relative border border-border bg-panel/60 p-7 ${i % 2 ? "rotate-tiny" : "rotate-tiny-r"}`}>
            <div className="font-mono text-[11px] tracking-[0.2em] text-marker">0{i + 1}</div>
            <h3 className="mt-3 font-display text-xl font-bold tracking-tight text-foreground">{c.k}</h3>
            <p className="mt-3 font-body text-sm font-light leading-relaxed text-muted-foreground">{c.d}</p>
            <span className="hand absolute -bottom-3 right-4 text-sm">{c.note}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── CTA ──────────────────────────────────────────────────────── */
function CTASection() {
  return (
    <section id="register-cta" className="relative border-t border-border">
      <div className="paper-grid-fine pointer-events-none absolute inset-0 opacity-40" />
      <div className="relative mx-auto max-w-[1500px] px-5 py-28 text-center md:px-10 md:py-36">
        <span className="mono-label">Registration open</span>
        <h2 className="display-hero mx-auto mt-6 max-w-4xl text-foreground">
          Come build the<br /><span className="wire-text-marker">unbuildable.</span>
        </h2>
        <div className="mt-10 flex flex-col items-center gap-4">
          <RegisterButton className="px-10 py-4 text-sm">
            Claim your spot
            <span aria-hidden> ↗</span>
          </RegisterButton>
          <span className="hand text-base">spots are limited — don't sleep on it</span>
        </div>
      </div>
    </section>
  );
}

export default Index;
