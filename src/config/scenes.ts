// ─────────────────────────────────────────────
// Mac Design Cup 2026 — the scroll story.
//
// One 3D object evolves from a single point → wireframe → solid → finished
// build. Each scene fuses that design-process stage with a REAL fact about the
// event, so the words and the object always say the same thing.
//
// scrollYProgress (0→1) maps across these 8 scenes; the 3D object, CAD overlay
// and this copy all key off the same normalized stops.
// ─────────────────────────────────────────────

export type SceneKey =
  | "hero"
  | "sketch"
  | "form"
  | "material"
  | "prototype"
  | "resolved"
  | "yourturn"
  | "origin";

export interface Scene {
  id: number;
  num: string; // "01"…"08"
  key: SceneKey;
  eyebrow?: string;
  heading: string; // may contain "\n" for a hard line break
  sub?: string; // one short supporting line
  tags?: string[]; // mono "spec chips" — bold, scannable facts
  meta?: string; // small mono caption (e.g. a venue tag)
}

export const SCENES: Scene[] = [
  {
    id: 1,
    num: "01",
    key: "hero",
    eyebrow: "3D Design Hackathon",
    heading: "MAC DESIGN\nCUP 2026",
    sub: "One prompt. One day. Built entirely in 3D.",
  },
  {
    id: 2,
    num: "02",
    key: "sketch",
    heading: "A HACKATHON,\nFOR 3D.",
    sub: "Get a theme on the day and design your answer from scratch.",
  },
  {
    id: 3,
    num: "03",
    key: "form",
    heading: "OPEN TO\nTHE GTA.",
    sub: "Open to TDSB high schoolers, right across the Greater Toronto Area. No experience needed.",
  },
  {
    id: 4,
    num: "04",
    key: "material",
    heading: "AT GEORGE\nBROWN.",
    sub: "Hosted at the downtown campus, backed by our sponsors.",
    meta: "George Brown College · Downtown Toronto",
  },
  {
    id: 5,
    num: "05",
    key: "prototype",
    heading: "BUILD\nIT LIVE.",
    sub: "Blender, Fusion, CAD — any tool. One day on the clock.",
  },
  {
    id: 6,
    num: "06",
    key: "resolved",
    heading: "REAL\nPRIZES.",
    sub: "Cash on the line — and every part of the day is on us.",
    tags: ["Cash Prizes", "Free Food", "Free Swag", "Free Entry"],
  },
  {
    id: 7,
    num: "07",
    key: "yourturn",
    heading: "YOUR TURN.",
    sub: "Bring an idea. Leave with something you built.",
  },
  {
    id: 8,
    num: "08",
    key: "origin",
    heading: "THE ORIGIN\nIS YOURS.",
  },
];

// Normalized scroll position (0→1) at which each scene is centered.
// 8 evenly-spaced stops.
export const SCENE_STOPS = SCENES.map((_, i) => i / (SCENES.length - 1));

// Progress rail shows 01–07 (per the reference) — scene 08 is the CTA/outro.
export const RAIL_COUNT = 7;
