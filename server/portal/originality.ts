// Originality checks, computed fresh from the current entries every time a
// judge or the team looks (so a duplicate that appears later shows on both).
// See src/portal/shared/checks.ts for the principles: evidence only, judges
// and organizers decide, teams get a neutral note and a chance to explain.
import { AI_GENERATORS, EXPORTERS, SOURCE_SITES, type Check } from "../../src/portal/shared/checks.js";
import { publicCredit, type EntryRecord } from "../../src/portal/shared/schema.js";

/** Default theme reveal: the 9:10 AM opening (src/config/site.ts TIMES.opening). */
export const DEFAULT_REVEAL = "2026-11-16T09:10:00-05:00";

const slug = (s: string) => s.replace(/[^A-Za-z0-9]/g, "").slice(0, 24) || "x";
const when = (iso: string) =>
  // A date-only value ("2025-03-14") parses as UTC midnight: show it as that date, not the evening before in Toronto.
  /T00:00:00(\.000)?Z$/.test(iso)
    ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })
    : new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", timeZone: "America/Toronto" });

const near = (a: number, b: number, tol: number) => Math.abs(a - b) <= tol * Math.max(Math.abs(a), Math.abs(b), 1e-9);

export function originalityChecks(e: EntryRecord, all: EntryRecord[], revealAt: string): Check[] {
  const checks: Check[] = [];
  const model = e.files.find((f) => f.slot === "model");
  const others = all.filter((o) => o.id !== e.id);

  // 1. The same file as another team's.
  if (model?.sha256) {
    for (const o of others) {
      const om = o.files.find((f) => f.slot === "model");
      if (om?.sha256 && om.sha256 === model.sha256) {
        checks.push({
          id: `dup${o.id}`,
          kind: "duplicate",
          level: "review",
          title: "Same model file as another entry",
          detail: `Byte-for-byte identical to the model in “${o.title}” (${publicCredit(o)}${o.submittedAt ? `, submitted ${when(o.submittedAt)}` : ", draft"}).`,
          teamNote: "Your model file is identical to a file another team uploaded.",
        });
      }
    }
  }

  // 2. Practically the same geometry (e.g. the same model re-exported).
  if (e.measure && e.measure.triangles > 50) {
    for (const o of others) {
      const om = o.measure;
      if (!om || checks.some((c) => c.id === `dup${o.id}`)) continue;
      const same =
        om.triangles === e.measure.triangles &&
        near(om.area, e.measure.area, 0.002) &&
        near(Math.max(om.w, om.d, om.h), Math.max(e.measure.w, e.measure.d, e.measure.h), 0.002) &&
        (om.volume === null || e.measure.volume === null || near(om.volume, e.measure.volume, 0.002));
      if (same) {
        checks.push({
          id: `sim${o.id}`,
          kind: "similar",
          level: "review",
          title: "Same geometry as another entry",
          detail: `Same triangle count (${om.triangles.toLocaleString("en-CA")}), surface area and size as the model in “${o.title}” (${publicCredit(o)}), within 0.2%.`,
          teamNote: "Your model's geometry matches another team's model almost exactly.",
        });
      }
    }
  }

  // 3-5. What the file's own metadata says.
  const meta = model?.meta;
  const metaText = [meta?.generator, meta?.author, meta?.text].filter(Boolean).join(" · ");
  if (metaText) {
    const site = SOURCE_SITES.find(([re]) => re.test(metaText));
    if (site) {
      checks.push({
        id: `src${slug(site[1])}`,
        kind: "source",
        level: "review",
        title: `File metadata mentions ${site[1]}`,
        detail: `${site[1]} is a site for downloading models. The model file says: “${metaText.slice(0, 160)}”.`,
        teamNote: `Your model file's metadata mentions ${site[1]}, a site for downloading models.`,
      });
    }
    const ai = AI_GENERATORS.find(([re]) => re.test(metaText));
    if (ai) {
      const disclosed = e.aiUse === "some";
      checks.push({
        id: `ai${slug(ai[1])}`,
        kind: "ai",
        level: disclosed ? "info" : "review",
        title: disclosed ? `Made with ${ai[1]} (disclosed)` : `Made with ${ai[1]}, not disclosed`,
        detail: disclosed
          ? `The model file's metadata names ${ai[1]}, an AI 3D generator. The team disclosed: “${e.aiNote}”.`
          : `The model file's metadata names ${ai[1]}, an AI 3D generator, but the form says no AI tools were used. File says: “${metaText.slice(0, 160)}”.`,
        teamNote: disclosed
          ? ""
          : `Your model file's metadata says it was made with ${ai[1]}, an AI 3D generator, but the form says no AI tools were used. If you used it, set AI tools to "Used some" and say how.`,
      });
    }
    const declared = new Set(e.software.map((s) => s.toLowerCase()));
    const exporter = EXPORTERS.find(([re]) => re.test(meta?.generator ?? ""));
    if (exporter && !declared.has(exporter[1].toLowerCase()) && !e.software.includes("Other")) {
      checks.push({
        id: `sw${slug(exporter[1])}`,
        kind: "software",
        level: "info",
        title: `Exported from ${exporter[1]}`,
        detail: `The file says ${exporter[1]} exported it; the team listed ${e.software.join(", ") || "no software"}. Often just a conversion step.`,
        teamNote: "",
      });
    }
  }

  // 6. A creation date before the theme was revealed. Two hours of slack for clocks and time zones.
  if (meta?.created) {
    const created = Date.parse(meta.created);
    const reveal = Date.parse(revealAt);
    if (!Number.isNaN(created) && created < reveal - 2 * 3600 * 1000) {
      checks.push({
        id: `created${created}`,
        kind: "created",
        level: "review",
        title: "File dated before the theme reveal",
        detail: `The model file says it was created ${when(meta.created)}; the theme was revealed ${when(revealAt)}. Some exporters copy a template's date, so ask the team.`,
        teamNote: `Your model file says it was created on ${when(meta.created)}, before the theme was revealed. If that date is wrong (some exporters copy a template's date), say so below.`,
      });
    }
  }

  // 7. No evidence of the process at all: context for judges, not a flag.
  if (e.status === "submitted") {
    const shots = e.files.filter((f) => f.slot === "progress").length;
    const source = e.files.some((f) => f.slot === "source");
    if (!shots && !e.cadLink && !source) {
      checks.push({
        id: "noprocess",
        kind: "process",
        level: "info",
        title: "No process evidence",
        detail: "No sketches or progress shots, CAD link or project file. Ask them to show their feature tree when they present.",
        teamNote: "",
      });
    }
  }

  return checks;
}
