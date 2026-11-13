// A made-up entry for trying the judge screen before the day: organizers
// checking what judges see, judges warming up. It lives only in the browser;
// marks given to it are never sent anywhere.
import type { JudgeEntry } from "../../shared/schema";

export const PRACTICE_ID = "practice";

export function practiceEntry(): JudgeEntry {
  const now = new Date().toISOString();
  return {
    id: PRACTICE_ID,
    status: "submitted",
    createdAt: now,
    submittedAt: now,
    late: false,
    title: "Sample entry: wind turbine",
    teamName: "Practice team",
    members: [
      { name: "Sample Student", school: "Sample school", grade: "11" },
      { name: "Second Student", school: "Sample school", grade: "11" },
    ],
    contactEmail: "",
    software: ["Fusion 360"],
    softwareOther: "",
    summary:
      "This is a made-up entry so you can see how marking works. Teams write a few words here on what they made and how it fits the theme; read it while they set up.",
    process: "",
    aiUse: "none",
    aiNote: "",
    credit: "team",
    creditLine: "Practice team",
    shareable: false,
    original: true,
    upAxis: "y",
    units: "mm",
    cadLink: "",
    videoLink: "",
    presentation: "",
    filesNote: "",
    hidden: true,
    gallery: false,
    award: "",
    unlocked: false,
    files: [{ id: "practice-model", slot: "model", name: "sample-model.glb", ext: "glb", size: 85264, url: "/portal/practice/sample-model.glb" }],
    myScore: null,
    scoreCount: 0,
    measure: null,
    checks: [],
    modelMeta: null,
    videoCheck: null,
    slot: null,
  };
}
