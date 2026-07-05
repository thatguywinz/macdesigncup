import { motion, useTransform, type MotionValue } from "framer-motion";
import { SCENES, type Scene } from "@/config/scenes";
import { MODEL_NO, TAGLINE } from "@/config/site";
import RegisterButton from "./RegisterButton";

const N = SCENES.length; // 8
const stopFor = (i: number) => i / (N - 1);

interface SceneStackProps {
  progress: MotionValue<number>;
}

/**
 * The pinned text layer. A tall track provides the scroll distance; the sticky
 * child holds all 8 scenes stacked, cross-fading by scroll progress while the
 * centered 3D object morphs behind them. Text is centered under the object so
 * the object stays the hero of the frame.
 */
export default function SceneStack({ progress }: SceneStackProps) {
  return (
    <div className="sticky top-0 h-screen w-full overflow-hidden">
      {SCENES.map((scene, i) => (
        <SceneText key={scene.id} scene={scene} index={i} progress={progress} />
      ))}
    </div>
  );
}

function SceneText({
  scene,
  index,
  progress,
}: {
  scene: Scene;
  index: number;
  progress: MotionValue<number>;
}) {
  const center = stopFor(index);
  // Tight cross-fade: because every heading is centered in the same spot, one
  // must clear before the next appears — otherwise two large headings ghost
  // through each other mid-scroll. Windows barely overlap (~half the 1/7 gap).
  const opacity = useTransform(
    progress,
    [center - 0.072, center - 0.045, center + 0.045, center + 0.072],
    [0, 1, 1, 0],
  );
  const y = useTransform(progress, [center - 0.08, center, center + 0.08], [34, 0, -34]);

  const isHero = scene.key === "hero";
  const isFinal = scene.key === "origin";

  return (
    <motion.section
      id={`scene-${scene.num}`}
      style={{ opacity }}
      className="absolute inset-0"
      aria-label={`Scene ${scene.num} — ${scene.heading.replace("\n", " ")}`}
    >
      {/* scene number — top-left technical marker */}
      <div className="absolute left-5 top-24 flex items-center gap-3 md:left-10 md:top-28">
        <span className="font-mono text-xs tracking-[0.25em] text-muted-foreground">{scene.num}</span>
        <span className="h-px w-10 bg-border" />
      </div>

      {/* centered content column — anchored to the lower band, under the object */}
      <motion.div
        style={{ y }}
        className="absolute inset-x-0 bottom-[10vh] flex flex-col items-center px-6 text-center md:bottom-[9vh]"
      >
        {isHero && scene.eyebrow && (
          <div className="mb-6 flex items-center gap-3">
            <span
              className="h-2 w-2 rounded-full shadow-[0_0_16px_hsl(214_100%_62%)]"
              style={{ background: "linear-gradient(120deg,hsl(214 100% 62%),hsl(187 95% 56%))" }}
            />
            <span className="mono-label !tracking-[0.34em] !text-foreground/80">{scene.eyebrow}</span>
          </div>
        )}

        {isHero ? (
          <h1 className="display-hero text-foreground text-glow">
            <span className="block">Mac Design</span>
            <span className="block">Cup <span className="text-gradient">2026</span></span>
          </h1>
        ) : isFinal ? (
          <h2 className="display-hero text-foreground text-glow">
            <span className="block">The Origin</span>
            <span className="block text-gradient">Is Yours.</span>
          </h2>
        ) : (
          <h2 className="display-scene text-gradient text-glow">
            {scene.heading.split("\n").map((line, i) => (
              <span key={i} className="block">
                {line}
              </span>
            ))}
          </h2>
        )}

        {/* one-line supporting copy */}
        {scene.sub && (
          <p className="mt-6 max-w-xl font-body text-base font-light leading-relaxed tracking-wide text-muted-foreground md:text-lg">
            {scene.sub}
          </p>
        )}

        {/* spec chips — bold, scannable facts (scene 06) */}
        {scene.tags && (
          <ul className="mt-7 flex flex-wrap items-center justify-center gap-2.5">
            {scene.tags.map((t) => (
              <li
                key={t}
                className="rounded-sm border border-sketch/30 bg-sketch/[0.06] px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-foreground/85"
              >
                {t}
              </li>
            ))}
          </ul>
        )}

        {/* small venue caption (scene 04) */}
        {scene.meta && (
          <div className="mt-6 font-mono text-[10px] uppercase tracking-[0.28em] text-sketch/90">
            {scene.meta}
          </div>
        )}

        {/* hero scroll cue */}
        {isHero && (
          <div className="mt-11 flex flex-col items-center gap-2.5">
            <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-muted-foreground">
              Scroll to begin
            </span>
            <span className="inline-flex h-7 w-5 items-start justify-center rounded-full border border-foreground/25 pt-1.5">
              <span className="inline-block h-1.5 w-1.5 animate-scroll-cue rounded-full bg-foreground/70" />
            </span>
          </div>
        )}

        {/* final CTA — scene 08 */}
        {isFinal && (
          <>
            <div className="mt-9">
              <RegisterButton className="px-9 py-4 text-sm">
                Register Now
                <span aria-hidden> ↗</span>
              </RegisterButton>
            </div>
            <div className="mt-8 font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
              {MODEL_NO} · {TAGLINE}
            </div>
          </>
        )}
      </motion.div>
    </motion.section>
  );
}
