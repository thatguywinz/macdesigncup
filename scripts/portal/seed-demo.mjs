// Fills the local portal with sample entries the way a team would: through
// the real form in a real browser (so every entry gets a viewer-captured
// thumbnail), then has two judges mark them. For demos and screenshots on a
// local preview only; it refuses to run against anything but localhost.
//
//   npm run dev                      (in one terminal)
//   node scripts/portal/make-demo-models.mjs
//   node scripts/portal/seed-demo.mjs [http://localhost:8080]
import fs from "node:fs";
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
    sketches: true,
  },
  // These four should trip the originality checks (see make-demo-models.mjs).
  {
    file: "tidal-lamp.glb",
    title: "Wave Lamp",
    members: [["Chris Patel", "Northern SS", "11"]],
    software: ["Blender"],
    summary: "A lamp with a rippled shade inspired by waves, sized for a bedside table and printable without supports.",
  },
  {
    file: "dragon-knot.glb",
    title: "Dragon Knot",
    members: [["Riley Brooks", "Lawrence Park CI", "10"]],
    software: ["Blender"],
    summary: "A knotted sculpture that represents the theme as one continuous line that never ends or breaks.",
  },
  {
    file: "ripple-vase.glb",
    title: "Ripple Vase",
    members: [["Jamie Fox", "Northview Heights SS", "9"]],
    software: ["Tinkercad"],
    summary: "A vase whose rippled walls catch light, designed for single-wall vase-mode printing.",
  },
  {
    file: "shelf-bracket.3mf",
    title: "Shelf Bracket",
    members: [["Morgan Lee", "York Mills CI", "12"]],
    software: ["Fusion 360"],
    summary: "A braced shelf bracket that holds a 10 kg shelf with the least plastic, tuned with a diagonal brace.",
    up: "z",
  },
];

// Honest entries check in sketches during the day before submitting.
for (const e of DEMO_ENTRIES.slice(0, 6)) e.sketches = true;

/**
 * Sample "sketch" screenshots for the demo: a blueprint-style 2D profile and
 * a feature-tree panel, drawn as SVG and screenshotted. Stand-ins for the
 * screenshots real teams upload. Returns the two PNG paths.
 */
export async function makeSketches(page, e) {
  const dir = path.join(models, "sketches");
  fs.mkdirSync(dir, { recursive: true });
  const slug = e.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const seed = [...e.title].reduce((a, c) => a + c.charCodeAt(0), 0);
  const pts = Array.from({ length: 9 }, (_, i) => [80 + i * 70, 300 - 60 * Math.sin((i + seed) * 0.7) - i * 12]);
  const poly = pts.map((p) => p.join(",")).join(" ");
  const grid = Array.from({ length: 40 }, (_, i) => `<line x1="${i * 25}" y1="0" x2="${i * 25}" y2="450" stroke="#1d3150" stroke-width="1"/><line x1="0" y1="${i * 25}" x2="900" y2="${i * 25}" stroke="#1d3150" stroke-width="1"/>`).join("");
  const sketch = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="450" style="background:#0d1b2e;font-family:Segoe UI,Arial">${grid}
    <text x="24" y="36" fill="#9fb7d9" font-size="18">Sketch 1 · Front plane · ${e.title} (sample)</text>
    <polyline points="${poly}" fill="none" stroke="#e8f0ff" stroke-width="3"/>
    <line x1="80" y1="390" x2="640" y2="390" stroke="#ff8a3d" stroke-width="2"/><text x="330" y="380" fill="#ff8a3d" font-size="18">${40 + (seed % 60)} mm</text>
    <line x1="40" y1="${pts[8][1]}" x2="40" y2="${pts[0][1]}" stroke="#ff8a3d" stroke-width="2"/><text x="48" y="230" fill="#ff8a3d" font-size="18">R${8 + (seed % 12)}</text>
    ${pts.map((p) => `<circle cx="${p[0]}" cy="${p[1]}" r="5" fill="#0d1b2e" stroke="#7fb2ff" stroke-width="2"/>`).join("")}
  </svg>`;
  const features = ["Sketch 1", "Extrude 1", "Sketch 2", "Revolve 1", "Fillet 1", "Shell 1", "Pattern 1", "Chamfer 2"].slice(0, 5 + (seed % 4));
  const tree = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="450" style="background:#f3f4f6;font-family:Segoe UI,Arial">
    <rect x="0" y="0" width="300" height="450" fill="#ffffff" stroke="#d1d5db"/>
    <text x="20" y="34" fill="#111827" font-size="17" font-weight="600">Features (${features.length}) · sample</text>
    ${features.map((f, i) => `<rect x="14" y="${52 + i * 40}" width="272" height="32" rx="4" fill="${i === features.length - 1 ? "#dbeafe" : "#ffffff"}"/><text x="28" y="${73 + i * 40}" fill="#374151" font-size="16">${f}</text>`).join("")}
    <polygon points="${pts.map((p) => `${p[0] * 0.55 + 380},${p[1] * 0.8 + 40}`).join(" ")} 732,380 424,380" fill="#cbd5e1" stroke="#475569" stroke-width="2"/>
    <text x="330" y="430" fill="#6b7280" font-size="14">${e.title}, work in progress</text>
  </svg>`;
  const out = [];
  for (const [i, svg] of [sketch, tree].entries()) {
    await page.setContent(`<html><body style="margin:0">${svg}</body></html>`);
    const file = path.join(dir, `${slug}-${i + 1}.png`);
    await page.locator("svg").screenshot({ path: file });
    out.push(file);
  }
  return out;
}

export async function submitViaForm(page, e, sketchPage) {
  const sketches = e.sketches && sketchPage ? await makeSketches(sketchPage, e) : [];
  await page.goto(`${BASE}/submit`);
  await page.getByLabel("Entry code").fill("MDC-DEMO");
  await page.getByLabel("Title of your design").fill(e.title);
  // Step 2: the video. Samples upload a turntable recorded with the site's viewer.
  const slug = e.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const video = path.join(models, "videos", `${slug}.webm`);
  if (fs.existsSync(video)) {
    await page.getByText("Upload the file", { exact: true }).click();
    await page.getByLabel("Choose video file").setInputFiles(video);
  }
  await page.getByLabel("How it answers the theme").fill(e.summary);
  await page.getByLabel("Your presentation").fill(e.presentation ?? `1. What ${e.title} is and the problem it solves
2. How it answers the theme
3. A walk around the model and its key parts
4. What we'd change with more time`);
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
  // Check in the sketches first (Save draft), the way a team would mid-morning.
  if (sketches.length) {
    await page.getByLabel("Choose sketches and progress shots").setInputFiles(sketches);
    await page.getByRole("button", { name: "Save draft" }).click();
    await page.getByText(/^Draft saved at/).waitFor({ timeout: 60_000 });
  }
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
  const sketchPage = await ctx.newPage();
  for (const e of DEMO_ENTRIES) {
    const l = await submitViaForm(page, e, sketchPage);
    links.push({ title: e.title, ...l });
    console.log(`submitted ${e.title}: ${l.share}`);
  }
  const score = (seed) => (i) => {
    if ((i === 5 && seed === 2) || i > 8) return null; // leave some for the live demo
    const v = (k) => 5 + ((i * 7 + k * 3 + seed) % 5);
    return { Theme: v(1), Creativity: v(2), "Technical skill": v(3), Presentation: v(4) };
  };
  const jctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await judge(await jctx.newPage(), "Judge Rivera", "judge-demo", score(1));
  const jctx2 = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await judge(await jctx2.newPage(), "Judge Thompson", "judge-demo", score(2));
  // A sample size spec, so the spec check shows up across entries.
  const h = { "Content-Type": "application/json", "X-Portal": "1" };
  const login = await fetch(`${BASE}/api/portal/judge/login`, { method: "POST", headers: h, body: JSON.stringify({ name: "Organizer Demo", passcode: "admin-demo" }) });
  const cookie = (login.headers.get("set-cookie") ?? "").split(";")[0];
  await fetch(`${BASE}/api/portal/judge/settings`, {
    method: "PUT",
    headers: { ...h, Cookie: cookie },
    body: JSON.stringify({ publicListing: "all", spec: { maxW: 300, maxD: 300, maxH: 300, volume: null, note: "Fits in a 300 mm cube (demo spec)" } }),
  });
  await browser.close();
  // The teams' links, so a demo can open a team's own edit page (local only, git-ignored).
  fs.writeFileSync(path.join(root, ".data", "demo-links.json"), JSON.stringify(links, null, 2));
  console.log(JSON.stringify(links, null, 2));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
