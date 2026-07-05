import { motion, useTransform, type MotionValue } from "framer-motion";
import { SCENES, type Scene } from "@/config/scenes";
import { EVENT_NAME, MODEL_NO, TAGLINE } from "@/config/site";
import RegisterButton from "./RegisterButton";

const N = SCENES.length; // 8
const stopFor = (i: number) => i / (N - 1);

interface SceneStackProps {
  progress: MotionValue<number>;
}

/**
 * The pinned text layer. A tall track provides the scroll distance; the sticky
 * child holds all 8 scenes stacked, cross-fading by scroll progress while the
 * fixed 3D object morphs underneath.
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
  const opacity = useTransform(
    progress,
    [center - 0.085, center - 0.035, center + 0.035, center + 0.085],
    [0, 1, 1, 0],
  );
  const y = useTransform(progress, [center - 0.09, center, center + 0.09], [34, 0, -34]);

  const isHero = scene.key === "hero";
  const isFinal = scene.key === "origin";

  return (
    <motion.section
      id={`scene-${scene.num}`}
      style={{ opacity }}
      className="absolute inset-0"
      aria-label={`Scene ${scene.num} — ${scene.heading.replace("\n", " ")}`}
    >
      {/* scene number — top-left */}
      <div className="absolute left-5 top-24 flex items-center gap-3 md:left-10 md:top-28">
        <span className="font-mono text-xs tracking-[0.2em] text-muted-foreground">{scene.num}</span>
        <span className="h-px w-8 bg-border" />
      </div>

      {/* content column — center-left */}
      <motion.div
        style={{ y }}
        className="absolute left-5 top-1/2 w-[90%] max-w-[44rem] -translate-y-1/2 md:left-10 lg:left-16"
      >
        {scene.eyebrow && isHero && (
          <div className="mb-6 flex items-center gap-3">
            <span
              className="h-2 w-2 rounded-full shadow-[0_0_16px_hsl(214_100%_62%)]"
              style={{ background: "linear-gradient(120deg,hsl(214 100% 62%),hsl(187 95% 56%))" }}
            />
            <span className="mono-label !tracking-[0.3em] !text-foreground/75">{scene.eyebrow}</span>
          </div>
        )}

        {isHero ? (
          <h1 className="display-hero whitespace-nowrap text-foreground text-glow">
            Mac Design<br />Cup <span className="text-gradient">2026</span>
          </h1>
        ) : isFinal ? (
          <h2 className="display-hero text-foreground text-glow">
            <span className="block">The Origin</span>
            <span className="block text-gradient">Is Yours.</span>
          </h2>
        ) : (
          <h2 className="display-scene text-gradient text-glow">{scene.heading}</h2>
        )}

        {/* sub-copy */}
        {scene.lines.length > 0 && (
          <p className="mt-5 font-body text-base font-light leading-relaxed tracking-wide text-muted-foreground md:text-lg">
            {scene.lines.map((l, i) => (
              <span key={i} className="block">
                {l}
              </span>
            ))}
          </p>
        )}

        {/* material swatches — scene 04 */}
        {scene.key === "material" && <Swatches note={scene.note} />}

        {/* hero scroll cue */}
        {isHero && (
          <div className="mt-12 flex items-center gap-3">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-foreground/30">
              <span className="inline-block h-2 w-2 animate-scroll-cue rounded-full bg-foreground/70" />
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
              Scroll to begin
            </span>
          </div>
        )}

        {/* final CTA — scene 08 */}
        {isFinal && (
          <>
            <div className="mt-8">
              <RegisterButton className="px-8 py-4 text-sm">
                Register Now
                <span aria-hidden> ↗</span>
              </RegisterButton>
            </div>
            <div className="mt-10 font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
              {MODEL_NO} · {TAGLINE}
            </div>
          </>
        )}
      </motion.div>
    </motion.section>
  );
}

function Swatches({ note }: { note?: string }) {
  const swatches = ["#12151f", "#39415c", "#6b7690", "#e5e9f5"];
  return (
    <div className="mt-8 flex items-center gap-4">
      <div className="flex items-center gap-2">
        {swatches.map((c) => (
          <span
            key={c}
            className="h-7 w-7 rounded-sm border border-white/12"
            style={{ background: c }}
          />
        ))}
        <span
          className="h-7 w-7 rounded-sm"
          style={{
            background: "linear-gradient(120deg,hsl(214 100% 62%),hsl(187 95% 56%))",
            boxShadow: "0 0 0 1px hsl(187 95% 56% / 0.8), 0 0 18px hsl(214 100% 62% / 0.6)",
          }}
        />
      </div>
      {note && <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground">{note}</span>}
    </div>
  );
}
