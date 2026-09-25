// Renders the stills of the 3D hall and writes src/components/hero/still.ts
// with where the door (and on phones the nearest plinths and the Enter
// label) sits in each, so the page lays each still where the live scene will
// draw the same hall:
//   public/hero/hall-phone.{webp,avif}  phones upright, 390x844 @2x
//   public/hero/hall-side.{webp,avif}   phones held sideways, 844x390 @2x
//   public/hero/stage-<band>.{webp,avif} the stage (768px+ wide, 501px+
//     tall), one per aspect band (frame.ts STAGE_BANDS: 21:9, 16:10, 4:3,
//     5:4 and upright tablets)
//
// Every visitor sees a still first: phones until their first touch or
// scroll, the stage until the live scene is drawing, and anyone whose device
// never gets the live scene (no WebGL, slow, reduced motion, Save-Data) for
// good (Hero.tsx). Re-run after anything that changes the hall: a sponsor
// added or re-ordered (src/config/sponsors.ts), the scene (GalleryScene,
// LogoPlaques, WirePrinter) or its framing (frame.ts). HERO_STILL_ONLY=a,b
// re-renders only those (e.g. stage-land), keeping the rest:
//
//   npm run build && node scripts/hero-still.mjs && npm run build
//
// (the second build copies the new stills into dist). It serves the built
// dist/, opens it in a headed Chromium (headless Chromium may draw WebGL
// black), forces the scene to load, waits for it to settle, hides everything
// but the canvas and screenshots it. Encoding uses ffmpeg (libwebp, libaom)
// when it is on PATH; without it the WebP is encoded by Chromium itself and
// no AVIF is made. Needs Node 22.18+ (it imports frame.ts directly).
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "@playwright/test";

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(repo, "dist");
const outDir = path.join(repo, "public", "hero");
const moduleOut = path.join(repo, "src", "components", "hero", "still.ts");
const PORT = Number(process.env.HERO_STILL_PORT || 8391);
/** Largest acceptable file, bytes: a still must not cost the page its LCP. */
const PHONE_BUDGET = 90 * 1024;
const STAGE_BUDGET = 140 * 1024;

const { phoneShot, restShot, STAGE_BANDS } = await import(
  pathToFileURL(path.join(repo, "src", "components", "hero", "frame.ts")).href
);

const ONLY = process.env.HERO_STILL_ONLY ? new Set(process.env.HERO_STILL_ONLY.split(",")) : null;
const SHOTS = [
  { name: "hall-phone", width: 390, height: 844, dpr: 2, phone: true },
  { name: "hall-side", width: 844, height: 390, dpr: 2, phone: true },
  ...STAGE_BANDS.map((b) => ({ name: `stage-${b.name}`, band: b.name, ...b.capture, phone: false })),
];
const moduleText = fs.existsSync(moduleOut) ? fs.readFileSync(moduleOut, "utf8") : "";

if (!fs.existsSync(path.join(dist, "index.html"))) {
  console.error("hero-still: dist/index.html not found. Run `npm run build` first.");
  process.exit(1);
}
fs.mkdirSync(outDir, { recursive: true });
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "hero-still-"));
const hasFfmpeg = spawnSync("ffmpeg", ["-hide_banner", "-version"], { stdio: "ignore" }).status === 0;

const server = spawn(process.execPath, [path.join(repo, "scripts", "serve-dist.mjs"), "dist", String(PORT)], {
  cwd: repo,
  stdio: "ignore",
});
const base = `http://localhost:${PORT}/`;
for (let i = 0; ; i++) {
  try {
    if ((await fetch(base)).ok) break;
  } catch {
    /* not up yet */
  }
  if (i > 100) throw new Error("hero-still: the dist server did not start");
  await new Promise((r) => setTimeout(r, 100));
}

/** Everything but the scene's canvas: the overlay copy, the nav, the sticky
 *  Register bar, the scene's own Enter slab, the vignette and any old still. */
const CANVAS_ONLY = `
  body * { visibility: hidden !important; }
  .hall-scene, .hall-scene canvas { visibility: visible !important; }
  .hall-scene .hall-enter, .hall-scene .hall-enter * { visibility: hidden !important; }
`;

function ffmpeg(args) {
  const r = spawnSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", ...args], { encoding: "utf8" });
  if (r.status !== 0) throw new Error(`ffmpeg failed: ${r.stderr}`);
}

/** WebP at the best quality under budget; AVIF too when ffmpeg can. */
async function encode(page, png, name, BUDGET) {
  const webp = path.join(outDir, `${name}.webp`);
  const avif = path.join(outDir, `${name}.avif`);
  let size = Infinity;
  for (let q = 82; q >= 40 && size > BUDGET; q -= 6) {
    if (hasFfmpeg) {
      ffmpeg(["-i", png, "-c:v", "libwebp", "-quality", String(q), "-compression_level", "6", "-preset", "picture", webp]);
    } else {
      const b64 = await page.evaluate(
        async ({ src, quality }) => {
          const img = new Image();
          img.src = src;
          await img.decode();
          const c = document.createElement("canvas");
          c.width = img.naturalWidth;
          c.height = img.naturalHeight;
          c.getContext("2d").drawImage(img, 0, 0);
          return c.toDataURL("image/webp", quality).split(",")[1];
        },
        { src: `data:image/png;base64,${fs.readFileSync(png).toString("base64")}`, quality: q / 100 },
      );
      fs.writeFileSync(webp, Buffer.from(b64, "base64"));
    }
    size = fs.statSync(webp).size;
    console.log(`  ${name}.webp q${q}: ${(size / 1024).toFixed(1)} KB`);
  }
  let hasAvif = false;
  if (hasFfmpeg) {
    let aSize = Infinity;
    for (let crf = 22; crf <= 48 && aSize > BUDGET * 0.6; crf += 4) {
      ffmpeg(["-i", png, "-c:v", "libaom-av1", "-still-picture", "1", "-crf", String(crf), "-b:v", "0", "-cpu-used", "3", "-pix_fmt", "yuv420p", "-frames:v", "1", avif]);
      aSize = fs.statSync(avif).size;
      console.log(`  ${name}.avif crf${crf}: ${(aSize / 1024).toFixed(1)} KB`);
    }
    hasAvif = aSize < size;
  }
  if (!hasAvif) fs.rmSync(avif, { force: true });
  return hasAvif;
}

const stills = {};
const stage = {};
try {
  for (const shot of SHOTS) {
    if (ONLY && !ONLY.has(shot.name)) continue;
    // A fresh browser per viewport: a reused one can hand back a black canvas.
    const browser = await chromium.launch({ headless: false, args: ["--window-position=0,0"] });
    try {
      const context = await browser.newContext({
        viewport: { width: shot.width, height: shot.height },
        deviceScaleFactor: shot.dpr,
        isMobile: shot.phone,
        hasTouch: shot.phone,
        reducedMotion: "no-preference",
      });
      // The live scene at full quality whatever this machine measures like
      // (Hero.tsx skips it or steps it down on slow devices).
      await context.addInitScript(() => {
        window.__MDC_HALL = "live";
        window.__hallLogos = { n: 0, at: 0 };
        window.addEventListener("hall:logo", () => {
          window.__hallLogos.n += 1;
          window.__hallLogos.at = performance.now();
        });
      });
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (e) => errors.push(String(e)));
      await page.goto(base, { waitUntil: "load" });
      // Phones load the scene on the first touch or scroll: stand in for it,
      // until the page has hydrated and is listening.
      for (let i = 0; !(await page.$(".hall-scene")); i++) {
        if (i > 120) throw new Error(`hero-still: the scene never loaded at ${shot.width}x${shot.height}`);
        await page.evaluate(() => window.dispatchEvent(new Event("pointerdown")));
        await page.waitForTimeout(250);
      }
      await page.waitForSelector(".hall-stage[data-ready]", { state: "attached", timeout: 60_000 });
      await page.waitForLoadState("networkidle");
      // Every logo onto its plaque (they are painted one per idle moment):
      // none new for 2.5 s. Then the 900ms crossfade over.
      await page.waitForFunction(
        () => window.__hallLogos.n > 0 && performance.now() - window.__hallLogos.at > 2500,
        null,
        { timeout: 60_000, polling: 250 },
      );
      const logos = await page.evaluate(() => window.__hallLogos.n);
      await page.waitForTimeout(1000);
      await page.addStyleTag({ content: CANVAS_ONLY });
      await page.waitForTimeout(250);

      // The scene's own frame, measured the way Hero.tsx measures it.
      const m = await page.evaluate(() => {
        const stage = document.querySelector(".hall-stage");
        const plan = document.querySelector(".hall-plan");
        const type = document.querySelector(".hall-type");
        const W = stage.clientWidth;
        const H = stage.clientHeight;
        const cs = getComputedStyle(plan);
        const side = matchMedia("(max-height: 500px) and (min-aspect-ratio: 4/3)").matches;
        let floor;
        if (side) floor = Math.max(0, (parseFloat(cs.paddingTop) || 0) - 10) / H;
        else {
          let top = 0;
          let el = type;
          while (el && el !== stage) {
            top += el.offsetTop;
            el = el.offsetParent;
          }
          floor = (top + type.offsetHeight) / H;
        }
        const btn = document.querySelector(".hall-scene .hall-enter__door")?.getBoundingClientRect();
        return {
          W,
          H,
          side,
          floor: Math.round(floor * 500) / 500,
          bottomPx: Math.round(parseFloat(cs.paddingBottom) || 0),
          column: side ? { left: plan.offsetLeft, width: plan.offsetWidth } : null,
          liveCta: btn ? (btn.top + btn.height / 2) / H : null,
          liveDoor: btn ? [btn.top / H, btn.bottom / H] : null,
        };
      });
      const png = path.join(tmp, `${shot.name}.png`);
      await page.screenshot({ path: png, clip: { x: 0, y: 0, width: m.W, height: m.H } });
      const avif = await encode(page, png, shot.name, shot.phone ? PHONE_BUDGET : STAGE_BUDGET);
      const round = (v) => Math.round(v * 10000) / 10000;
      const files = {
        src: `/hero/${shot.name}.webp`,
        avif: avif ? `/hero/${shot.name}.avif` : null,
        width: Math.round(m.W * shot.dpr),
        height: Math.round(m.H * shot.dpr),
      };
      if (shot.phone) {
        const fit = m.column ? m.column.width / m.H : m.W / m.H;
        const s = phoneShot(fit, m.floor, m.H, m.bottomPx);
        stills[m.side ? "side" : "phone"] = {
          ...files,
          // the type's clearance line (the door rim's guard sits on it), the
          // nearest plinths' feet and the Enter label: shares of the height
          a: round(Math.min(0.92, m.floor + 22 / m.H)),
          b: round(s.feet),
          c: round(s.cta),
          // the door rim's top and bottom
          t: round(s.rimTop),
          u: round(s.rimBottom),
          // the hall's centre line, a share of the width
          x: round(m.column ? (m.column.left + m.column.width / 2) / m.W : 0.5),
          // height per px of the width the plinth files are fitted to
          r: round(m.H / (m.column ? m.column.width : m.W)),
        };
        console.log(
          `${shot.name}: ${m.W}x${m.H} kind=${s.kind} floor=${m.floor} bottom=${m.bottomPx}px logos=${logos}`,
          `rim ${s.rimTop.toFixed(4)}..${s.rimBottom.toFixed(4)} (live door ${m.liveDoor?.map((v) => v.toFixed(4)).join("..")})`,
          errors.length ? `\n  page errors: ${errors.join(" | ")}` : "",
        );
      } else {
        const s = restShot(m.W / m.H, m.floor, m.H);
        stage[shot.band] = { ...files, rimTop: round(s.rimTop), rimBottom: round(s.rimBottom) };
        console.log(
          `${shot.name}: ${m.W}x${m.H} floor=${m.floor} logos=${logos}`,
          `rim ${s.rimTop.toFixed(4)}..${s.rimBottom.toFixed(4)} (live door ${m.liveDoor?.map((v) => v.toFixed(4)).join("..")})`,
          errors.length ? `\n  page errors: ${errors.join(" | ")}` : "",
        );
      }
      if (errors.length) process.exitCode = 1;
    } finally {
      await browser.close();
    }
  }
} finally {
  server.kill();
  fs.rmSync(tmp, { recursive: true, force: true });
}

// A partial run (HERO_STILL_ONLY) keeps the other entries from the last one.
const previous = (name) => {
  const m = moduleText.match(new RegExp(`export const ${name} = ([\\s\\S]*?) as const;`));
  return m ? JSON.parse(m[1]) : {};
};
const phoneStills = { ...previous("HALL_STILLS"), ...stills };
const stageStills = { ...previous("STAGE_STILLS"), ...stage };
fs.writeFileSync(
  moduleOut,
  `// Generated by scripts/hero-still.mjs: do not edit by hand, re-run it.
// The stills of the 3D hall (public/hero).
//
// HALL_STILLS, the phone stills, and where the hall sits in each: a = the
// type's clearance line (the door rim's guard), b = the nearest plinths'
// feet, c = the Enter label, t and u = the door rim's top and bottom, as
// shares of the still's height; x = the hall's centre line as a share of its
// width; r = its height per px of the width the plinth files were fitted to.
// hero.css lays the still with them.
export const HALL_STILLS = ${JSON.stringify(phoneStills, null, 2)} as const;

// STAGE_STILLS, one per aspect band (frame.ts STAGE_BANDS): the door rim's
// top and bottom as shares of the still's height. Hero.tsx lays the still
// with them (frame.ts layStill) so its door lands on the live scene's.
export const STAGE_STILLS = ${JSON.stringify(stageStills, null, 2)} as const;
`,
);
console.log(`wrote ${path.relative(repo, moduleOut)} and public/hero/`);
