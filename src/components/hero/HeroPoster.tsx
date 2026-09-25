import { STAGE_BANDS, STAGE_MEDIA, bandMedia } from "./frame";
import { HALL_STILLS, STAGE_STILLS } from "./still";

/**
 * The dark gallery air behind everything: the page's ground before a still
 * of the hall has loaded (and under the live scene). Pure CSS, decorative.
 * The hall itself is always a rendered picture of the 3D scene: a still
 * (HallStill on phones, StageStill on the stage) until the live scene draws,
 * and for good when it never will.
 */
export default function HeroPoster() {
  return <div aria-hidden="true" className="hall-poster" />;
}

/** The phone held sideways (Hero.tsx SIDE_QUERY). */
const SIDE_MEDIA = "(max-height: 500px) and (min-aspect-ratio: 4/3)";
/** A 1x1 transparent GIF: what a layout "loads" instead of another's still. */
const BLANK = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

/** Low priority: the h1 is the page's first paint that matters. */
const LOW = { fetchpriority: "low" } as Record<string, string>;

/**
 * Phones (the CSS hall): a still of the live 3D hall, rendered from the phone
 * scene itself by scripts/hero-still.mjs, so the hero looks 3D from the first
 * paint. hero.css scales and places it the way the scene frames the hall
 * (the door's rim under the type, the plinths above the Register bar), so
 * when the live scene loads on the first touch it crossfades in over the
 * same picture. It stays the hall whenever the live scene does not run.
 */
export function HallStill() {
  const { phone, side } = HALL_STILLS;
  return (
    <div aria-hidden="true" className="hall-still">
      <picture>
        <source media={STAGE_MEDIA} srcSet={BLANK} width={1} height={1} />
        {side.avif && (
          <source media={SIDE_MEDIA} type="image/avif" srcSet={side.avif} width={side.width} height={side.height} />
        )}
        <source media={SIDE_MEDIA} type="image/webp" srcSet={side.src} width={side.width} height={side.height} />
        {phone.avif && <source type="image/avif" srcSet={phone.avif} width={phone.width} height={phone.height} />}
        <img
          src={phone.src}
          width={phone.width}
          height={phone.height}
          alt=""
          decoding="async"
          draggable={false}
          {...LOW}
        />
      </picture>
    </div>
  );
}

/**
 * The stage (768px wide and 501px tall and up): a still of the live scene
 * for the window's aspect band (frame.ts STAGE_BANDS), rendered by
 * scripts/hero-still.mjs. hero.css centres it, fitted to the stage's width
 * (or an upright tablet's height), and Hero.tsx then slides and scales it so
 * its door lands where the live scene draws it (frame.ts layStill). It is
 * the hall until the live scene is drawing, which crossfades in over it,
 * and stays the hall when the scene never runs or gives up (no WebGL, a
 * slow device, a lost context, reduced motion). Phones fetch none.
 */
export function StageStill() {
  return (
    <div aria-hidden="true" className="stage-still">
      <picture>
        {STAGE_BANDS.flatMap((b) => {
          const s = STAGE_STILLS[b.name as keyof typeof STAGE_STILLS];
          const media = bandMedia(b);
          return [
            s.avif ? (
              <source
                key={`${b.name}-avif`}
                media={media}
                type="image/avif"
                srcSet={s.avif}
                width={s.width}
                height={s.height}
              />
            ) : null,
            <source
              key={`${b.name}-webp`}
              media={media}
              type="image/webp"
              srcSet={s.src}
              width={s.width}
              height={s.height}
            />,
          ];
        })}
        <img src={BLANK} width={1} height={1} alt="" decoding="async" draggable={false} {...LOW} />
      </picture>
    </div>
  );
}
