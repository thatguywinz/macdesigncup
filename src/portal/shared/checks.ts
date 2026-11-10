// ─────────────────────────────────────────────
// Submission portal · measurements, the size spec, and originality checks.
//
// Measurements: what the viewer measures from the model itself (size,
// volume, surface area, closed or not), converted to millimetres with the
// units the team picked. CAD speed-modelling tournaments judge accuracy the
// same way: the model's measured volume or mass against a target, within a
// tolerance (TooTallToby, the Fresno ROP 3D CAD contest).
//
// Originality checks: evidence, never verdicts. Each check names exactly what
// it found ("this file's metadata says it was made with Meshy"), is shown to
// judges and organizers, and a "review" check waits for an organizer to clear
// or confirm it. Nothing is rejected automatically and no team is told it
// cheated: metadata can be missing or wrong, and a false accusation against a
// student costs more than a missed one. Teams see a neutral note and can
// explain.
// ─────────────────────────────────────────────

export const UNITS = ["mm", "cm", "m", "in"] as const;
export type Units = (typeof UNITS)[number];
export const MM_PER: Record<Units, number> = { mm: 1, cm: 10, m: 1000, in: 25.4 };

/** What the viewer measured, in millimetres. */
export interface Measure {
  w: number;
  d: number;
  h: number;
  /** mm³; null when the mesh isn't closed (volume is only meaningful for a solid). */
  volume: number | null;
  /** mm² */
  area: number;
  triangles: number;
  /** Every edge is shared by exactly two triangles: a watertight solid. */
  closed: boolean;
}

/** An optional size spec organizers can set for the theme. All in mm / cm³. */
export interface Spec {
  maxW: number | null;
  maxD: number | null;
  maxH: number | null;
  /** Target volume in cm³, with a ± percentage tolerance. */
  volume: { target: number; tolerancePct: number } | null;
  note: string;
}

export const emptySpec = (): Spec => ({ maxW: null, maxD: null, maxH: null, volume: null, note: "" });

export const hasSpec = (s: Spec | null | undefined): s is Spec =>
  !!s && (s.maxW !== null || s.maxD !== null || s.maxH !== null || s.volume !== null);

export interface SpecLine {
  label: string;
  ok: boolean | null;
  text: string;
}

const r1 = (n: number) => (n >= 100 ? Math.round(n).toString() : Number(n.toFixed(1)).toString());

/** Each spec line against a measurement. `ok: null` means it can't be checked (open mesh). */
export function specCheck(m: Measure, s: Spec): SpecLine[] {
  const out: SpecLine[] = [];
  const dim = (label: string, value: number, max: number | null) => {
    if (max === null) return;
    out.push({ label, ok: value <= max * 1.001, text: `${r1(value)} mm (limit ${r1(max)} mm)` });
  };
  // Footprint compared either way round: a model turned 90° still fits.
  if (s.maxW !== null && s.maxD !== null) {
    const [a, b] = [Math.max(m.w, m.d), Math.min(m.w, m.d)];
    const [ma, mb] = [Math.max(s.maxW, s.maxD), Math.min(s.maxW, s.maxD)];
    out.push({ label: "Footprint", ok: a <= ma * 1.001 && b <= mb * 1.001, text: `${r1(m.w)} × ${r1(m.d)} mm (limit ${r1(s.maxW)} × ${r1(s.maxD)} mm)` });
  } else {
    dim("Width", m.w, s.maxW);
    dim("Depth", m.d, s.maxD);
  }
  dim("Height", m.h, s.maxH);
  if (s.volume) {
    const target = s.volume.target;
    if (m.volume === null) {
      out.push({ label: "Volume", ok: null, text: `can't measure: the mesh isn't closed (target ${r1(target)} cm³)` });
    } else {
      const cm3 = m.volume / 1000;
      const off = ((cm3 - target) / target) * 100;
      out.push({
        label: "Volume",
        ok: Math.abs(off) <= s.volume.tolerancePct + 1e-9,
        text: `${r1(cm3)} cm³ (target ${r1(target)} ± ${s.volume.tolerancePct}%, ${off >= 0 ? "+" : ""}${off.toFixed(1)}%)`,
      });
    }
  }
  return out;
}

/** "131 × 133 × 150 mm" */
export const formatMeasure = (m: Measure) => `${r1(m.w)} × ${r1(m.d)} × ${r1(m.h)} mm`;

// ── Originality checks ────────────────────────

/** What a file's own metadata says about where it came from. */
export interface FileMeta {
  /** Exporter / generator string (GLB asset.generator, STL header, OBJ comment, 3MF Application). */
  generator?: string;
  /** Creation date the file claims (3MF CreationDate, ...). ISO. */
  created?: string;
  author?: string;
  /** Other free text found in the file's header or comments. */
  text?: string;
}

export type CheckLevel = "review" | "info";

export interface Check {
  /** Stable for the same finding, so an organizer's review sticks. */
  id: string;
  kind: "duplicate" | "similar" | "source" | "ai" | "created" | "software" | "process";
  level: CheckLevel;
  title: string;
  /** The exact evidence. */
  detail: string;
  /** What the team sees (neutral, never names another team). Empty: not shown to the team. */
  teamNote: string;
}

export interface CheckReview {
  status: "cleared" | "confirmed";
  by: string;
  at: string;
  note: string;
}

/** Download sites. A generator or header naming one is worth a look. */
export const SOURCE_SITES: [RegExp, string][] = [
  [/sketchfab/i, "Sketchfab"],
  [/thingiverse/i, "Thingiverse"],
  [/printables/i, "Printables"],
  [/turbosquid/i, "TurboSquid"],
  [/cgtrader/i, "CGTrader"],
  [/myminifactory/i, "MyMiniFactory"],
  [/grabcad/i, "GrabCAD"],
  [/poly\.?pizza/i, "Poly Pizza"],
  [/free3d/i, "Free3D"],
  [/cults3d/i, "Cults3D"],
  [/makerworld/i, "MakerWorld"],
  [/traceparts/i, "TraceParts"],
  [/3dcontentcentral/i, "3D ContentCentral"],
];

/** Text-to-3D / image-to-3D generators. Allowed by the rules, but should be disclosed. */
// Whole words only, and specific forms of generic words: a false flag on a
// student is the failure to avoid ("Onshape" must not read as "Shap-E",
// "tripod" as "Tripo", a garden "trellis" as TRELLIS).
export const AI_GENERATORS: [RegExp, string][] = [
  [/\bmeshy\b/i, "Meshy"],
  [/\btripo(?:\s*ai|3d|sr|\s*studio)?\b/i, "Tripo"],
  [/\brodin\b|\bhyper3d\b|\bdeemos\b/i, "Rodin (Hyper3D)"],
  [/\bluma\s*(?:ai|genie)\b/i, "Luma Genie"],
  [/\bcsm\.ai\b|\bcommon sense machines\b|\bcube\s*by\s*csm\b/i, "CSM Cube"],
  [/\bshap-e\b/i, "Shap-E"],
  [/\bpoint-e\b/i, "Point-E"],
  [/\bhunyuan\s*3d\b/i, "Hunyuan3D"],
  [/\btrellis(?:-?3d|\s*ai)\b|\bmicrosoft\s*trellis\b/i, "TRELLIS"],
  [/\bkaedim\b/i, "Kaedim"],
  [/\bspline\s*ai\b/i, "Spline AI"],
];

/** Exporter strings -> the software they come from (for the "declared software" note). */
export const EXPORTERS: [RegExp, string][] = [
  [/blender/i, "Blender"],
  [/fusion|autodesk\s*(fusion|360)|a360/i, "Fusion 360"],
  [/onshape/i, "Onshape"],
  [/tinkercad/i, "Tinkercad"],
  [/\bmaya\b/i, "Maya"],
  [/solid\s*edge/i, "Solid Edge"],
  [/solidworks/i, "SolidWorks"],
  [/sketchup/i, "SketchUp"],
];

export const CAD_LINK_HINT = "Onshape, Fusion (a360.co), Tinkercad, 3DEXPERIENCE or Google Drive";
