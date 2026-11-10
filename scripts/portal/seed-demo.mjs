// Fills the local portal with sample entries the way a team would: through
// the real form in a real browser (so every entry gets a viewer-captured
// thumbnail), then has two judges mark them. For demos and screenshots on a
// local preview only; it refuses to run against anything but localhost.
//
//   npm run dev                      (in one terminal)
//   node scripts/portal/make-demo-models.mjs
//   node scripts/portal/seed-demo.mjs [http://localhost:8080]
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const BASE = process.env.PORTAL_BASE || (process.argv[2]?.startsWith("http") ? process.argv[2] : "http://localhost:8080");
if (!/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(BASE)) {
  console.error("seed-demo only runs against a local preview (http://localhost:...).");
  process.exit(1);
}
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const models = path.join(root, ".data", "demo-models");

// Sample entries. The people are made up.
export const DEMO_ENTRIES = [
  {
    file: "tidal-lamp.glb",
    title: "Tidal Lamp",
    members: [["Avery Lin", "William Lyon Mackenzie CI", "11"]],
    software: ["Blender"],
    summary: "A bedside lamp whose shade ripples like a wave caught mid-break. The ripples throw a moving pattern of light on the wall when the shade turns.",
    process: "The shade is one lathe profile with a sine displacement, so it can be 3D printed in vase mode with no supports.",
  },
  {
    file: "planetary-gearbox.stl",
    title: "Pocket Planetary Gearbox",
    members: [["Sam Okafor", "Earl Haig SS", "12"], ["Priya Nair", "Earl Haig SS", "12"]],
    team: "Gear Grinders",
    software: ["Fusion 360"],
    summary: "A 4:1 planetary reduction small enough to fit a hobby motor, printable in one go with print-in-place planets.",
    up: "z",
  },
  {
    file: "wind-turbine.glb",
    title: "Rooftop Turbine",
    members: [["Jordan Mei", "Northern SS", "10"]],
    software: ["Onshape"],
    summary: "A three-blade turbine sized for a school roof, with a hub you can swap for different blade pitches to test in a wind tunnel.",
  },
  {
    file: "folding-stool.obj",
    title: "Tripod Stool",
    members: [["Noor Haddad", "Marc Garneau CI", "9"], ["Leo Chen", "Marc Garneau CI", "9"], ["Ana Silva", "Marc Garneau CI", "10"]],
    software: ["Tinkercad", "Blender"],
    summary: "Three legs and a ring that locks them. It folds flat for a backpack and stands steady on uneven ground.",
    ai: "Asked an AI chat for typical stool seat heights.",
  },
  {
    file: "phone-stand.stl",
    title: "One-Piece Phone Stand",
    members: [["Maya Roberts", "Don Mills CI", "11"]],
    software: ["Solid Edge"],
    summary: "A single bent profile that holds a phone at a viewing angle and leaves room for the charging cable underneath.",
    up: "z",
  },
  {
    file: "tensegrity-table.glb",
    title: "Floating Table",
    members: [["Ethan Park", "Victoria Park CI", "12"], ["Zara Ali", "Victoria Park CI", "11"]],
    team: "Tension Lab",
    software: ["Fusion 360", "SolidWorks"],
    summary: "A tensegrity side table: the top seems to float, held by one cable in the middle and four at the corners.",
  },
];

export async function submitViaForm(page, e) {
  await page.goto(`${BASE}/submit`);
  await page.getByLabel("Entry code").fill("MDC-DEMO");
  await page.getByLabel("Title").fill(e.title);
  await page.getByLabel("How it answers the theme").fill(e.summary);
  if (e.process) await page.getByLabel("What to look for").fill(e.process);
  await page.getByLabel("Choose 3d model").setInputFiles(path.join(models, e.file));
  for (let i = 0; i < e.members.length; i++) {
    if (i > 0) await page.getByRole("button", { name: "Add a team member" }).click();
    const [name, school, grade] = e.members[i];
    await page.getByRole("textbox", { name: i === 0 ? "Full name" : `Member ${i + 1} full name`, exact: true }).fill(name);
    await page.getByLabel("School").nth(i).fill(school);
    await page.getByLabel("Grade").nth(i).selectOption(grade);
  }
  if (e.team) await page.getByRole("textbox", { name: /Team name/ }).fill(e.team);
  await page.getByLabel(/Contact email/).fill(`${e.members[0][0].split(" ")[0].toLowerCase()}@example.com`);
  for (const s of e.software) await page.locator("label.p-chip", { hasText: new RegExp(`^${s}$`) }).click();
  if (e.ai) {
    await page.getByText("Used some").click();
    await page.getByLabel("What did AI help with?").fill(e.ai);
  }
  if (e.team) await page.getByText("Team name", { exact: true }).click();
  // Wait for the preview to draw the model, then fix its orientation if needed.
  await page.locator(".viewer-readout").waitFor({ timeout: 30_000 });
  if (e.up === "z") await page.getByRole("button", { name: /Switch to Z up/ }).click();
  await page.waitForTimeout(600);
  await page.getByLabel(/We modelled this/).check();
  await page.getByRole("button", { name: "Submit entry" }).click();
  await page.getByLabel(/^Share link/).waitFor({ timeout: 90_000 });
  const share = await page.getByLabel(/^Share link/).inputValue();
  const edit = await page.getByLabel("Edit link").inputValue();
  return { share, edit };
}

export async function judge(page, name, passcode, marksFor) {
  await page.goto(`${BASE}/judge`);
  await page.getByLabel("Your name").fill(name);
  await page.getByLabel("Passcode").fill(passcode);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.getByRole("heading", { name: "Entries" }).waitFor();
  const hrefs = await page.locator("a.j-card").evaluateAll((as) => as.map((a) => a.getAttribute("href")));
  for (const [i, href] of hrefs.entries()) {
    const marks = marksFor(i);
    if (!marks) continue;
    await page.goto(`${BASE}${href}`);
    await page.getByRole("heading", { name: "Your marks" }).waitFor();
    for (const [criterion, v] of Object.entries(marks)) {
      await page.getByRole("radiogroup", { name: new RegExp(`^${criterion}`) }).getByRole("radio", { name: `${v} out of 10` }).click();
    }
    await page.getByRole("button", { name: /Save marks|^Save$/ }).first().click();
    await page.getByText(/^Saved /).waitFor();
  }
}

async function main() {
  // System Chrome: no Playwright browser download needed.
  const browser = await chromium.launch({ channel: process.env.PW_CHANNEL || "chrome", args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await ctx.newPage();
  const links = [];
  for (const e of DEMO_ENTRIES) {
    const l = await submitViaForm(page, e);
    links.push({ title: e.title, ...l });
    console.log(`submitted ${e.title}: ${l.share}`);
  }
  const score = (seed) => (i) => {
    if (i === 5 && seed === 2) return null; // leave one for judge two to do live
    const v = (k) => 5 + ((i * 7 + k * 3 + seed) % 5);
    return { Theme: v(1), Creativity: v(2), "Technical skill": v(3), Presentation: v(4) };
  };
  const jctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await judge(await jctx.newPage(), "Judge Rivera", "judge-demo", score(1));
  const jctx2 = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await judge(await jctx2.newPage(), "Judge Thompson", "judge-demo", score(2));
  await browser.close();
  console.log(JSON.stringify(links, null, 2));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
