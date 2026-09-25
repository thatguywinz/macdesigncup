import { GRID_SPONSORS } from "@/config/sponsors";

/**
 * The hall without WebGL: a dark gallery, the lit door at the end of it, the
 * floor catching its light and the faint drafting grid on the walls. It is
 * what the prerendered page, no-JS visitors and devices without WebGL see,
 * and it stays under the 3D canvas as its fallback. Pure CSS, decorative.
 * On phones the door is drawn by the hall plan instead (Hero.tsx), in the
 * flow under the type.
 */
export default function HeroPoster() {
  return (
    <div aria-hidden="true" className="hall-poster">
      <div className="hall-poster__grid draft-grid draft-grid-fade" />
      <div className="hall-poster__floor" />
      <div className="hall-door hall-poster__door" />
    </div>
  );
}

/** The share of the flat wall's optical caps (sponsors.ts maxW/maxH, px)
 *  a logo gets on a phone plaque. */
const CAP = 0.36;

/**
 * Phones without the 3D hall: every hall sponsor (GRID_SPONSORS) as a small plaque on the hall
 * floor in front of the door, a tidy grid of plinths like the 3D hall's
 * (five across, the last row centred), each a dark slab with the logo in
 * bone (the flat sponsor wall's knockout filter). The sponsor section
 * further down names and links every sponsor, so this is decorative.
 */
export function HallPlaques() {
  return (
    <ul aria-hidden="true" className="hall-plan__plaques">
      {GRID_SPONSORS.map((s) => (
        <li key={s.name} className="hall-plan__plaque">
          <span className="hall-plan__slab">
            <img
              src={s.logo}
              alt={s.name}
              loading="lazy"
              decoding="async"
              draggable={false}
              style={{ maxWidth: `min(${s.maxW * CAP}px, 84%)`, maxHeight: `min(${s.maxH * CAP}px, 66%)` }}
            />
          </span>
          <span className="hall-plan__plinth" />
        </li>
      ))}
    </ul>
  );
}
