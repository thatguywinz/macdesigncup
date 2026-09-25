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
// George Brown Polytechnic's entrepreneurship hub. Official SVG from
// georgebrown.ca/startgbc (subsite logo), viewBox cropped to the StartGBC
// wordmark (the lockup's George Brown mark already has its own cell), width/height
// added. Brand spelling in copy: "startGBC".
import startgbcLogo from "@/components/sponsor-images/startgbc.svg";
// Featured speaker (Julie Smithson, CEO). White brand PNG from the marketing
// repo (sponsors/_source/brand/hi/metavrse-white.png), trimmed to 640px.
import metavrseLogo from "@/components/sponsor-images/metavrse.png";

export interface Sponsor {
  name: string;
  logo: string;
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
  /** Shown on a plinth in the 3D hero hall. Order in this list is hall order. */
  hero?: boolean;
}

export const SPONSORS: Sponsor[] = [
  { name: "Shop3D.ca", logo: shop3dcaLogo, href: "https://shop3d.ca/", maxH: 40, maxW: 228, hero: true },
  { name: "George Brown Polytechnic", logo: georgebrownLogo, href: "https://www.georgebrown.ca/", maxH: 84, maxW: 200, hero: true },
  { name: "startGBC", logo: startgbcLogo, href: "https://www.georgebrown.ca/startgbc", maxH: 34, maxW: 200, hero: true },
  { name: "Siemens", logo: siemensLogo, href: "https://www.siemens.com/", maxH: 34, maxW: 210, hero: true },
  { name: "Ansys", logo: ansysLogo, href: "https://www.ansys.com/", maxH: 52, maxW: 190, hero: true },
  { name: "TriMech Group", logo: trimechLogo, href: "https://trimech.com/", maxH: 44, maxW: 212, hero: true },
  { name: "Stratasys", logo: stratasysLogo, href: "https://www.stratasys.com/", maxH: 72, maxW: 236, hero: true },
  { name: "Scrimba", logo: scrimbaLogo, href: "https://scrimba.com/", maxH: 22, maxW: 236, hero: true },
  { name: "Aseprite", logo: asepriteLogo, href: "https://www.aseprite.org/", maxH: 64, maxW: 176 },
  { name: "Applied Precision 3D", logo: appliedPrecisionLogo, href: "https://www.appliedprecision.ca/", maxH: 32, maxW: 236 },
  { name: "Chatforce", logo: chatforceLogo, href: "https://chatforce.com/", maxH: 44, maxW: 228 },
  { name: "METAVRSE", logo: metavrseLogo, href: "https://metavrse.com/", maxH: 30, maxW: 210 },
  // Symbol-only marks: captioned, so the wall names them.
  {
    name: "Agile Manufacturing",
    logo: agileLogo,
    href: "https://agile-manufacturing.com/",
    maxH: 64,
    maxW: 190,
    caption: "Agile Manufacturing",
  },
  // "WLMAC": the school's own short name (wlmac.ca, and the club's name in site.ts).
  { name: "William Lyon Mackenzie CI", logo: wlmacLogo, href: "https://wlmac.ca/", maxH: 100, maxW: 200, caption: "WLMAC" },
];

export const HERO_SPONSORS = SPONSORS.filter((s) => s.hero);
