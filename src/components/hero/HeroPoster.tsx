import { HALL_STILLS } from "./still";

/**
 * The hall without WebGL: a dark gallery, the lit door at the end of it, the
 * floor catching its light. It is
 * what the prerendered page, no-JS visitors and devices without WebGL see,
 * and it stays under the 3D canvas as its fallback. Pure CSS, decorative.
 * On phones the hall is a still of the 3D scene instead (HallStill).
 */
export default function HeroPoster() {
  return (
    <div aria-hidden="true" className="hall-poster">
      <div className="hall-poster__floor" />
      <div className="hall-door hall-poster__door" />
    </div>
  );
}

/** The stage layout (Hero.tsx STAGE_QUERY) and the phone held sideways
 *  (SIDE_QUERY): the stage draws its own poster, so it fetches no still. */
const STAGE_MEDIA = "(min-width: 768px) and (min-height: 501px)";
const SIDE_MEDIA = "(max-height: 500px) and (min-aspect-ratio: 4/3)";
/** A 1x1 transparent GIF: what the stage "loads" instead of a still. */
const BLANK = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

/**
 * Phones (the CSS hall): a still of the live 3D hall, rendered from the phone
 * scene itself by scripts/hero-still.mjs, so the hero looks 3D from the first
 * paint. hero.css scales and places it the way the scene frames the hall
 * (the door's rim under the type, the plinths above the Register bar), so
 * when the live scene loads on the first touch it crossfades in over the
 * same picture. It stays the hall with reduced motion or without WebGL.
 * Low priority: the h1 is the page's first paint that matters.
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
          {...{ fetchpriority: "low" }}
        />
      </picture>
    </div>
  );
}
