// ─────────────────────────────────────────────
// The 8-scene storyboard, transcribed 1:1 from `3d designathon reference.png`.
// scrollYProgress (0→1) maps across these 8 scenes; the 3D object and CAD
// overlay both key off the same normalized `stops`.
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

export interface Dim {
  value: string;
  axis: "x" | "y";
}

export interface Scene {
  id: number;
  num: string; // "01"…"08"
  key: SceneKey;
  eyebrow?: string;
  heading: string;
  lines: string[];
  dims?: Dim[];
  note?: string; // e.g. MAT_01
}

export const SCENES: Scene[] = [
  {
    id: 1,
    num: "01",
    key: "hero",
    eyebrow: "Mac Design Cup 2026",
    heading: "MAC DESIGN CUP 2026",
    lines: ["From a single point,", "everything is built."],
  },
  {
    id: 2,
    num: "02",
    key: "sketch",
    heading: "SKETCH",
    lines: ["Ideas take shape.", "Lines have purpose."],
  },
  {
    id: 3,
    num: "03",
    key: "form",
    heading: "FORM",
    lines: ["Structure defines", "what's possible."],
    dims: [
      { value: "72.18", axis: "y" },
      { value: "98.32", axis: "x" },
    ],
  },
  {
    id: 4,
    num: "04",
    key: "material",
    heading: "MATERIAL",
    lines: ["Surface. Texture.", "Character emerges."],
    note: "MAT_01",
  },
  {
    id: 5,
    num: "05",
    key: "prototype",
    heading: "PROTOTYPE",
    lines: ["Refine. Test.", "Iterate."],
    dims: [
      { value: "120.00", axis: "y" },
      { value: "85.00", axis: "x" },
    ],
  },
  {
    id: 6,
    num: "06",
    key: "resolved",
    heading: "RESOLVED",
    lines: ["Present your best.", "Make it real."],
  },
  {
    id: 7,
    num: "07",
    key: "yourturn",
    heading: "YOUR TURN",
    lines: ["Build beyond", "what exists."],
  },
  {
    id: 8,
    num: "08",
    key: "origin",
    heading: "THE ORIGIN\nIS YOURS.",
    lines: [],
  },
];

// Normalized scroll position (0→1) at which each scene is centered.
// 8 evenly-spaced stops.
export const SCENE_STOPS = SCENES.map((_, i) => i / (SCENES.length - 1));

// Progress rail shows 01–07 (per the reference) — scene 08 is the CTA/outro.
export const RAIL_COUNT = 7;
