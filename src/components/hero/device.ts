/* Whether this device should run the live 3D hall at all. No three.js here:
   the page shell asks before it loads the scene chunk. Without the live
   scene the hero keeps its still of the hall (HeroPoster), which is the
   same picture, so saying no costs the visitor only the motion. */

type Nav = Navigator & {
  connection?: { saveData?: boolean };
  deviceMemory?: number;
};

/** What the page may do: `live` the scene; `still` keep the still. */
export type HallChoice = "live" | "still";

/** A test hook: scripts/hero-still.mjs renders the stills with "live" (the
 *  scene at full quality, no frame-rate guard, whatever the machine), and
 *  "still" or "guard" (every check but the CPU probe, so the frame-rate guard
 *  itself can be watched) and "light" (the light tier, unguarded) help
 *  verify the fallbacks. */
export type HallForce = "live" | "light" | "still" | "guard" | undefined;
export const hallForce = (): HallForce =>
  typeof window === "undefined" ? undefined : (window as Window & { __MDC_HALL?: HallForce }).__MDC_HALL;

/**
 * A few milliseconds of the arithmetic a frame of the hall is made of (4x4
 * matrix products over typed arrays), timed. About 1.3 ms on a recent
 * desktop; a device five times slower than that could not draw the hall
 * smoothly, and loading three.js alone would stall it for seconds. The
 * median of five runs (after one to warm up), so a one-off pause does not
 * count against the device, nor one lucky run for it.
 */
export function cpuProbe(): number {
  const a = new Float32Array(16);
  const b = new Float32Array(16);
  const out = new Float32Array(16);
  for (let i = 0; i < 16; i++) {
    a[i] = (i % 5) * 0.1 + 0.3;
    b[i] = (i % 3) * 0.2 - 0.1;
  }
  const times: number[] = [];
  let sink = 0;
  // one untimed run to warm the JIT, then five timed
  for (let run = 0; run < 6; run++) {
    const t0 = performance.now();
    for (let n = 0; n < 12000; n++) {
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          out[r * 4 + c] =
            a[r * 4] * b[c] + a[r * 4 + 1] * b[4 + c] + a[r * 4 + 2] * b[8 + c] + a[r * 4 + 3] * b[12 + c];
        }
      }
      a[n & 15] = out[(n * 7) & 15] * 0.5 + 0.25;
      sink += out[n & 15];
    }
    if (run > 0) times.push(performance.now() - t0);
  }
  times.sort((x, y) => x - y);
  // keep the loop from being optimised away
  return times[2] + (sink === Number.MIN_VALUE ? 1e-9 : 0);
}

/** The probe's time, ms, over which the device is too slow for the hall. */
export const CPU_SLOW_MS = 6;

/**
 * Whether to run the live hall. `phone` is the CSS hall layout (a phone,
 * upright or sideways). Says no with Save-Data on, with 2 GB of memory or
 * less, on a phone with four cores or fewer, or when the CPU probe runs
 * several times slower than a recent laptop. Reduced motion is decided by
 * the caller (it can change while the page is open).
 */
export function hallChoice(phone: boolean): HallChoice {
  const force = hallForce();
  if (force === "live" || force === "light") return "live";
  if (force === "still") return "still";
  const nav = navigator as Nav;
  if (nav.connection?.saveData) return "still";
  if (typeof nav.deviceMemory === "number" && nav.deviceMemory <= 2) return "still";
  if (phone && (nav.hardwareConcurrency || 8) <= 4) return "still";
  if (force === "guard") return "live";
  return cpuProbe() > CPU_SLOW_MS ? "still" : "live";
}
