// The sponsor wall, shared by the sponsor section, the 3D hero and the
// JSON-LD `sponsor` list. One list, so a logo added here shows up everywhere.
//
// Every logo is a cut-out rendered as a one-colour bone knockout (see
// `.sponsor-logo` in index.css, and the canvas knockout in the 3D hero), so
// only a file's alpha matters. `maxH`/`maxW` balance the marks optically on
// the flat wall: a wide wordmark and a square crest can't share one cap.
//
// Adding a sponsor: key the white/cream plate out of the file to real
// transparency and trim the empty margin first, and give an SVG explicit
// width/height, or it lands as a lit rectangle / zero-size image.
import stratasysLogo from "@/components/sponsor-images/Stratasys.png";
import agileLogo from "@/components/sponsor-images/agile.png";
import georgebrownLogo from "@/components/sponsor-images/georgebrown.png";
import shop3dcaLogo from "@/components/sponsor-images/shop3dca.png";
import wlmacLogo from "@/components/sponsor-images/wlmac.png";
import scrimbaLogo from "@/components/sponsor-images/scrimba.svg";
import asepriteLogo from "@/components/sponsor-images/aseprite.png";
import chatforceLogo from "@/components/sponsor-images/chatforce.svg";
// Applied Precision 3D's own site header is a plain type wordmark; this file sets those words.
import appliedPrecisionLogo from "@/components/sponsor-images/appliedprecision.svg";
// Altair redirects to Siemens now: one Siemens mark stands for both.
import siemensLogo from "@/components/sponsor-images/siemens.svg";
import trimechLogo from "@/components/sponsor-images/trimech.svg";
import ansysLogo from "@/components/sponsor-images/ansys.svg";
// George Brown Polytechnic's entrepreneurship hub. A plain type wordmark,
// "startGBC" (lowercase "start", capital "GBC", the brand's own spelling),
// set in Archivo at weight 700 and outlined to paths (fontTools), so it
// renders the same as an <img> and as a canvas texture. No George Brown mark:
// George Brown Polytechnic has its own logo right beside it.
import startgbcLogo from "@/components/sponsor-images/startgbc.svg";
// Featured speaker (Julie Smithson, CEO). White brand PNG from the marketing
// repo (sponsors/_source/brand/hi/metavrse-white.png), trimmed to 640px.
import metavrseLogo from "@/components/sponsor-images/metavrse.png";

// The flat walls (SponsorMarquee, the partner LogoWall) show each raster
// logo as a WebP cut to twice its largest size on the wall (the cap at
// --logo-k 0.8), with every pixel white and only the alpha kept (the knockout
// filter repaints it anyway): a few KB each instead of up to 28 KB. The 3D
// hall keeps the full-size PNGs above for its plaque textures. Made with
// sharp: resize (lanczos3), RGB to white, webp quality 75 / alphaQuality 80
// (shop3dca: lossless). SVGs serve both.
import agileWall from "@/components/sponsor-images/wall/agile.webp";
import asepriteWall from "@/components/sponsor-images/wall/aseprite.webp";
import georgebrownWall from "@/components/sponsor-images/wall/georgebrown.webp";
import metavrseWall from "@/components/sponsor-images/wall/metavrse.webp";
import shop3dcaWall from "@/components/sponsor-images/wall/shop3dca.webp";
import stratasysWall from "@/components/sponsor-images/wall/stratasys.webp";
import wlmacWall from "@/components/sponsor-images/wall/wlmac.webp";

export interface Sponsor {
  name: string;
  /** Full-size file: the 3D hall's plaque texture. */
  logo: string;
  /**
   * The flat walls' file, and its pixel size (the <img> width/height
   * attributes: CSS still sizes it, by maxH/maxW).
   */
  wall: { src: string; width: number; height: number };
  href: string;
  /** Optical caps for the flat wall, in px. */
  maxH: number;
  maxW: number;
  /**
   * A small mono name set under the mark on the flat wall, for a symbol-only
   * logo that carries no readable name of its own (a crest, a bare icon).
   * Wordmarks leave it off. The link's accessible name stays `name`.
   */
  caption?: string;
  /**
   * Stands in the hero hall. Every sponsor does except a speaker-only one
   * (METAVRSE: their part is a featured talk). Where each one stands is
   * HALL_ORDER below, not this list's order.
   */
  hero?: boolean;
}

export const SPONSORS: Sponsor[] = [
  { name: "Shop3D.ca", logo: shop3dcaLogo, wall: { src: shop3dcaWall, width: 245, height: 34 }, href: "https://shop3d.ca/", maxH: 40, maxW: 228, hero: true },
  { name: "George Brown Polytechnic", logo: georgebrownLogo, wall: { src: georgebrownWall, width: 226, height: 134 }, href: "https://www.georgebrown.ca/", maxH: 84, maxW: 200, hero: true },
  { name: "startGBC", logo: startgbcLogo, wall: { src: startgbcLogo, width: 739, height: 120 }, href: "https://www.georgebrown.ca/startgbc", maxH: 34, maxW: 196, hero: true },
  { name: "Siemens", logo: siemensLogo, wall: { src: siemensLogo, width: 595, height: 142 }, href: "https://www.siemens.com/", maxH: 34, maxW: 210, hero: true },
  { name: "Ansys", logo: ansysLogo, wall: { src: ansysLogo, width: 609, height: 192 }, href: "https://www.ansys.com/", maxH: 52, maxW: 190, hero: true },
  { name: "TriMech Group", logo: trimechLogo, wall: { src: trimechLogo, width: 157, height: 39 }, href: "https://trimech.com/", maxH: 44, maxW: 212, hero: true },
  { name: "Stratasys", logo: stratasysLogo, wall: { src: stratasysWall, width: 378, height: 114 }, href: "https://www.stratasys.com/", maxH: 72, maxW: 236, hero: true },
  { name: "Scrimba", logo: scrimbaLogo, wall: { src: scrimbaLogo, width: 1350, height: 120 }, href: "https://scrimba.com/", maxH: 22, maxW: 236, hero: true },
  { name: "Aseprite", logo: asepriteLogo, wall: { src: asepriteWall, width: 252, height: 103 }, href: "https://www.aseprite.org/", maxH: 64, maxW: 176, hero: true },
  { name: "Applied Precision 3D", logo: appliedPrecisionLogo, wall: { src: appliedPrecisionLogo, width: 664, height: 82 }, href: "https://www.appliedprecision.ca/", maxH: 32, maxW: 236, hero: true },
  { name: "Chatforce", logo: chatforceLogo, wall: { src: chatforceLogo, width: 2920, height: 560 }, href: "https://chatforce.com/", maxH: 44, maxW: 228, hero: true },
  // Speaker-only (a featured talk): on the sponsor wall, not in the hero hall.
  { name: "METAVRSE", logo: metavrseLogo, wall: { src: metavrseWall, width: 311, height: 48 }, href: "https://metavrse.com/", maxH: 30, maxW: 210 },
  // Symbol-only marks: captioned, so the wall names them.
  {
    name: "Agile Manufacturing",
    logo: agileLogo,
    wall: { src: agileWall, width: 378, height: 55 },
    href: "https://agile-manufacturing.com/",
    // Full wordmark from agile-manufacturing.com (was the bare symbol).
    maxH: 36,
    maxW: 236,
    hero: true,
  },
  // "WLMAC": the school's own short name (wlmac.ca, and the club's name in site.ts).
  { name: "William Lyon Mackenzie CI", logo: wlmacLogo, wall: { src: wlmacWall, width: 180, height: 160 }, href: "https://wlmac.ca/", maxH: 100, maxW: 200, caption: "WLMAC", hero: true },
];

/**
 * The hero hall, in slot order (frame.ts): the first eight stand on plinths
 * (LANDSCAPE_SLOTS / PORTRAIT_SLOTS / PHONE_SLOTS, whose indices keep the same
 * neighbours in every layout), the rest hang on the lit back wall beside and
 * over the door (wallFor). Slot 1 and slot 5 stand side by side, so
 * startGBC stands right next to George Brown Polytechnic; the host school's
 * crest hangs over the door (the last wall slot). Phones show the eight plinths only.
 */
const HALL_ORDER = [
  "Shop3D.ca",
  "George Brown Polytechnic",
  "TriMech Group",
  "Siemens",
  "Ansys",
  "startGBC",
  "Stratasys",
  "Scrimba",
  "Aseprite",
  "Applied Precision 3D",
  "Chatforce",
  "Agile Manufacturing",
  // Last slot = the sign over the door: the host school.
  "William Lyon Mackenzie CI",
] as const;

const byName = new Map(SPONSORS.map((s) => [s.name, s]));
export const HERO_SPONSORS: Sponsor[] = HALL_ORDER.map((name) => {
  const s = byName.get(name);
  if (!s || !s.hero) throw new Error(`HALL_ORDER: no hall sponsor named ${name}`);
  return s;
});

/**
 * The CSS hall's plaque grid (phones without WebGL or with reduced motion):
 * every hall sponsor, five across, in the sponsor list's order (startGBC
 * right after George Brown Polytechnic) with the host school's crest moved
 * up into the first row, as it stands on a front plinth in the 3D hall.
 */
export const GRID_SPONSORS: Sponsor[] = (() => {
  const rest = SPONSORS.filter((s) => s.hero && s.name !== "William Lyon Mackenzie CI");
  const crest = byName.get("William Lyon Mackenzie CI");
  return crest ? [...rest.slice(0, 3), crest, ...rest.slice(3)] : rest;
})();
