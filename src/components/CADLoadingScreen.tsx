import { useEffect, useRef, useState, useCallback } from 'react';

/* ─────────────────────────────────────────────
   Timing constants (ms)
───────────────────────────────────────────── */
const PHASE_LINE_DRAW   = 1800;   // line extends + counter counts
const PHASE_ROTATE      = 2200;   // line rotates 360° painting circle
const PHASE_EXPAND      = 1400;   // circle blooms to fullscreen
const PHASE_DONE        = 200;    // hold before unmount

const CAD_BLUE  = '#4da3ff';
const CAD_DARK  = '#cbd0d8';   // light annotations on the dark ground
const BG_COLOR  = '#0a0a0a';

/* ease helpers */
const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

const easeInOutQuad = (t: number) =>
  t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

const easeInOutCubic2 = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

/* ─────────────────────────────────────────────
   Component
───────────────────────────────────────────── */
interface CADLoadingScreenProps {
  onComplete: () => void;
}

type Phase = 'line' | 'rotate' | 'expand' | 'done';

const CADLoadingScreen = ({ onComplete }: CADLoadingScreenProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef<number>(0);
  const startRef  = useRef<number>(0);
  const phaseRef  = useRef<Phase>('line');

  // snapshot of the painted circle canvas for expand phase
  const snapshotRef = useRef<HTMLCanvasElement | null>(null);

  const [phase, setPhase] = useState<Phase>('line');
  const doneRef = useRef(false);

  // guard so onComplete only fires once (skip / animation / timeout / reduced-motion)
  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    try { sessionStorage.setItem('mdc_intro_seen', '1'); } catch { /* ignore */ }
    onComplete();
  }, [onComplete]);

  /* ── derive radius from viewport ── */
  const getRadius = () => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    // radius long enough to reach right edge from center
    return Math.min(vw * 0.38, 380);
  };

  /* ── draw a single frame ── */
  const draw = useCallback((timestamp: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    const W = canvas.width;
    const H = canvas.height;
    const cx = W / 2;
    const cy = H / 2;
    const R  = getRadius();

    const elapsed = timestamp - startRef.current;

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, W, H);

    /* ══════════════════════════════
       PHASE: line
       ══════════════════════════════ */
    if (phaseRef.current === 'line') {
      const t    = Math.min(elapsed / PHASE_LINE_DRAW, 1);
      const ease = easeInOutCubic(t);
      const lineLen = ease * R;
      const value   = ease * 100;

      drawCenterPoint(ctx, cx, cy);
      drawRadiusLine(ctx, cx, cy, lineLen);
      drawDimensionAnnotation(ctx, cx, cy, lineLen, value);
      drawStatusText(ctx, W, H, 'SKETCHING RADIUS...');

      if (t >= 1) {
        phaseRef.current = 'rotate';
        startRef.current = timestamp;
        setPhase('rotate');
      }
    }

    /* ══════════════════════════════
       PHASE: rotate  (sweep circle)
       ══════════════════════════════ */
    else if (phaseRef.current === 'rotate') {
      const t    = Math.min(elapsed / PHASE_ROTATE, 1);
      const ease = easeInOutQuad(t);
      const sweepAngle = ease * Math.PI * 2;   // 0 → 2π

      // Arc starts at angle 0 (East / 3-o'clock) to match the horizontal radius line
      const ARC_START = 0;

      /* filled sector — grows as the line sweeps clockwise */
      if (sweepAngle > 0) {
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, R, ARC_START, ARC_START + sweepAngle);
        ctx.closePath();
        ctx.fillStyle = `${CAD_BLUE}18`;         // very low opacity fill
        ctx.fill();
      }

      /* arc outline drawn so far */
      ctx.beginPath();
      ctx.arc(cx, cy, R, ARC_START, ARC_START + sweepAngle);
      ctx.strokeStyle = CAD_BLUE;
      ctx.lineWidth   = 1.2;
      ctx.stroke();

      /* rotating radius line — starts horizontal (East), sweeps clockwise */
      const lineAngle = ARC_START + sweepAngle;
      const endX = cx + R * Math.cos(lineAngle);
      const endY = cy + R * Math.sin(lineAngle);

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(endX, endY);
      ctx.strokeStyle = CAD_BLUE;
      ctx.lineWidth   = 1.2;
      ctx.stroke();

      /* center point */
      drawCenterPoint(ctx, cx, cy);

      /* dimension annotation — fades out as the swept sector covers it.
         The sector physically reaches y = cy + 28 at sweepAngle ≈ atan2(28, R) ≈ 0.08 rad.
         We give a generous 0 → 0.28 rad window so it feels natural to the eye. */
      const dimAlpha = Math.max(0, 1 - sweepAngle / 0.28);
      if (dimAlpha > 0) {
        ctx.save();
        ctx.globalAlpha = dimAlpha;
        drawDimensionAnnotation(ctx, cx, cy, R, 100);
        ctx.restore();
      }

      drawStatusText(ctx, W, H, 'GENERATING CIRCLE SKETCH...');

      /* embossed curved text — reveals as sweep passes each character */
      drawCurvedText(
        ctx, 'WLMAC 3D Design Club',
        cx, cy, R - 38,
        3 * Math.PI / 2,  // centered at 12-o'clock (top)
        true,             // isTop: rotation = θ + π/2 (chars face outward = upright at top)
        sweepAngle
      );
      drawCurvedText(
        ctx, 'Mackenzie Design Cup 2026',
        cx, cy, R - 38,
        Math.PI / 2,      // centered at 6-o'clock (bottom)
        false,            // isBottom: rotation = θ − π/2 (chars face outward = upright at bottom)
        sweepAngle
      );

      /* cross-hair tick at start of arc */
      drawStartTick(ctx, cx, cy, R);

      if (t >= 1) {
        // snapshot the finished circle for use during expand
        const snap = document.createElement('canvas');
        snap.width  = W;
        snap.height = H;
        snap.getContext('2d')!.drawImage(canvas, 0, 0);
        snapshotRef.current = snap;

        phaseRef.current = 'expand';
        startRef.current = timestamp;
        setPhase('expand');
      }
    }

    /* ══════════════════════════════
       PHASE: expand — resolve the sketch by fading it out over the dark
       ground so it cross-dissolves into the (dark) 3D hero. No cyan flash.
       ══════════════════════════════ */
    else if (phaseRef.current === 'expand') {
      const t    = Math.min(elapsed / PHASE_EXPAND, 1);
      const ease = easeInOutCubic2(t);

      if (snapshotRef.current) {
        ctx.save();
        ctx.globalAlpha = 1 - ease;
        // subtle settle: the sketch lifts slightly toward the object
        const s = 1 + ease * 0.04;
        ctx.translate(cx, cy);
        ctx.scale(s, s);
        ctx.translate(-cx, -cy);
        ctx.drawImage(snapshotRef.current, 0, 0);
        ctx.restore();
      }

      if (t >= 1) {
        phaseRef.current = 'done';
        setPhase('done');
        startRef.current = timestamp;
      }
    }

    /* ══════════════════════════════
       PHASE: done — hold on dark, then hand off
       ══════════════════════════════ */
    else if (phaseRef.current === 'done') {
      if (elapsed >= PHASE_DONE) {
        finish();
        return; // stop RAF
      }
      // dark ground already painted at the top of draw()
    }

    rafRef.current = requestAnimationFrame(draw);
  }, [finish]);

  /* ── resize handler ── */
  const resize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }, []);

  useEffect(() => {
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    let seen = false;
    try { seen = sessionStorage.getItem('mdc_intro_seen') === '1'; } catch { /* ignore */ }

    resize();
    window.addEventListener('resize', resize);

    // Reduced motion or already seen this session: skip the ritual, hand off fast.
    if (reduced || seen) {
      const tid = setTimeout(finish, reduced ? 450 : 150);
      return () => {
        clearTimeout(tid);
        window.removeEventListener('resize', resize);
      };
    }

    startRef.current = performance.now();
    rafRef.current = requestAnimationFrame(draw);
    const fallback = setTimeout(finish, 9000); // safety net if a frame stalls

    return () => {
      cancelAnimationFrame(rafRef.current);
      clearTimeout(fallback);
      window.removeEventListener('resize', resize);
    };
  }, [draw, resize, finish]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: BG_COLOR,
        overflow: 'hidden',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{ display: 'block', width: '100%', height: '100%' }}
      />
      <button
        type="button"
        onClick={finish}
        aria-label="Skip intro"
        style={{
          position: 'absolute',
          bottom: 22,
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '8px 18px',
          fontFamily: '"Space Mono", ui-monospace, monospace',
          fontSize: 10,
          letterSpacing: '0.24em',
          textTransform: 'uppercase',
          color: 'rgba(226,229,234,0.55)',
          background: 'transparent',
          border: '1px solid rgba(226,229,234,0.18)',
          borderRadius: 3,
          cursor: 'pointer',
        }}
      >
        Skip intro →
      </button>
    </div>
  );
};

/* ─────────────────────────────────────────────
   Drawing helpers
───────────────────────────────────────────── */

function drawCenterPoint(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
  // crosshair dot
  ctx.beginPath();
  ctx.arc(cx, cy, 3.5, 0, Math.PI * 2);
  ctx.fillStyle = CAD_BLUE;
  ctx.fill();

  // tiny crosshair lines
  ctx.beginPath();
  ctx.moveTo(cx - 10, cy); ctx.lineTo(cx + 10, cy);
  ctx.moveTo(cx, cy - 10); ctx.lineTo(cx, cy + 10);
  ctx.strokeStyle = `${CAD_BLUE}88`;
  ctx.lineWidth = 0.8;
  ctx.stroke();
}

function drawRadiusLine(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, len: number
) {
  if (len < 1) return;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + len, cy);
  ctx.strokeStyle = CAD_BLUE;
  ctx.lineWidth   = 1.2;
  ctx.setLineDash([]);
  ctx.stroke();

  // endpoint dot
  ctx.beginPath();
  ctx.arc(cx + len, cy, 2.5, 0, Math.PI * 2);
  ctx.fillStyle = CAD_BLUE;
  ctx.fill();
}

function drawDimensionAnnotation(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  lineLen: number,
  value: number
) {
  if (lineLen < 10) return;

  const yOff = 28;         // distance below the radius line
  const yd   = cy + yOff;
  const x1   = cx;
  const x2   = cx + lineLen;

  ctx.strokeStyle = CAD_DARK;
  ctx.lineWidth   = 0.8;
  ctx.setLineDash([]);

  // extension lines (vertical ticks dropping from radius endpoints)
  const extLen = 14;
  ctx.beginPath();
  ctx.moveTo(x1, cy + 4);  ctx.lineTo(x1, yd + extLen * 0.4);
  ctx.moveTo(x2, cy + 4);  ctx.lineTo(x2, yd + extLen * 0.4);
  ctx.stroke();

  // horizontal dimension line
  ctx.beginPath();
  ctx.moveTo(x1, yd);
  ctx.lineTo(x2, yd);
  ctx.stroke();

  // arrowheads
  const arrowLen  = 8;
  const arrowWing = 3;

  // left arrow (pointing left)
  ctx.beginPath();
  ctx.moveTo(x1, yd);
  ctx.lineTo(x1 + arrowLen, yd - arrowWing);
  ctx.lineTo(x1 + arrowLen, yd + arrowWing);
  ctx.closePath();
  ctx.fillStyle = CAD_DARK;
  ctx.fill();

  // right arrow (pointing right)
  ctx.beginPath();
  ctx.moveTo(x2, yd);
  ctx.lineTo(x2 - arrowLen, yd - arrowWing);
  ctx.lineTo(x2 - arrowLen, yd + arrowWing);
  ctx.closePath();
  ctx.fill();

  // label
  const midX = (x1 + x2) / 2;
  ctx.font         = '11px "Segoe UI", ui-monospace, monospace';
  ctx.fillStyle    = CAD_DARK;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText(`${value.toFixed(2)} mm`, midX, yd - 5);

  // "R" label on the radius line itself
  if (lineLen > 50) {
    ctx.font         = '10px "Segoe UI", ui-monospace, monospace';
    ctx.fillStyle    = `${CAD_BLUE}CC`;
    ctx.textBaseline = 'bottom';
    ctx.fillText('R', midX, cy - 6);
  }
}

function drawStartTick(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, R: number
) {
  // small tick at 3-o'clock (East) — where the arc starts to match the horizontal line
  const x = cx + R;
  const y = cy;
  ctx.beginPath();
  ctx.moveTo(x, y - 5);
  ctx.lineTo(x, y + 5);
  ctx.strokeStyle = `${CAD_BLUE}88`;
  ctx.lineWidth = 0.8;
  ctx.stroke();
}

function drawStatusText(
  ctx: CanvasRenderingContext2D,
  W: number, H: number,
  text: string
) {
  ctx.font         = '11px "Segoe UI", ui-monospace, monospace';
  ctx.fillStyle    = `${CAD_DARK}66`;
  ctx.textAlign    = 'left';
  ctx.textBaseline = 'bottom';
  ctx.fillText(text, 24, H - 24);

  // version tag bottom-right
  ctx.textAlign = 'right';
  ctx.fillText('AUTOSKETCH v2.6.1', W - 24, H - 24);
}

/* ─────────────────────────────────────────────
   Curved embossed text helper

   isTop=true  → characters centered at centerAngle, angles increase left→right.
                 rotation = θ + π/2 → chars face outward (right-side-up at top)
   isTop=false → characters centered at centerAngle, angles decrease left→right
                 so char[0] is at the highest angle (left side) and reads correctly.
                 rotation = θ − π/2 → chars face outward (right-side-up at bottom)

   Reveal: each character becomes visible as sweepAngle passes its canvas angle.
─────────────────────────────────────────────── */
function drawCurvedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number, cy: number,
  r: number,
  centerAngle: number,
  isTop: boolean,
  sweepAngle: number
) {
  const fontSize     = 24;
  const letterSpacing = 3.5;   // extra px between glyphs

  ctx.save();
  ctx.font         = `300 ${fontSize}px "Segoe UI", Arial, sans-serif`;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';

  // Measure each character's advance width at the chosen font
  const chars  = text.split('');
  const widths = chars.map(c => ctx.measureText(c).width + letterSpacing);
  const totalWidth = widths.reduce((a, b) => a + b, 0) - letterSpacing;
  const totalArc   = totalWidth / r;  // angular span of the whole string (radians)

  // ── Starting angle ───────────────────────────────────────────────────────
  // Top text:    runAngle starts at left edge (centerAngle - half) and increases.
  // Bottom text: runAngle starts at left edge (centerAngle + half) and decreases,
  //              so char[0] is visually on the LEFT and reads left→right correctly.
  let runAngle = isTop
    ? centerAngle - totalArc / 2          // top: left edge
    : centerAngle + totalArc / 2;         // bottom: left edge (high angle side)

  for (let i = 0; i < chars.length; i++) {
    const charHalfArc = widths[i] / (2 * r);

    // charAngle = angular center of this glyph
    const charAngle = isTop
      ? runAngle + charHalfArc
      : runAngle - charHalfArc;

    // Advance the running angle in the correct direction
    if (isTop) runAngle += widths[i] / r;
    else       runAngle -= widths[i] / r;

    // Only render once the sweep line has passed this character's canvas angle.
    const normChar = ((charAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    if (sweepAngle < normChar) continue;

    // Gentle fade-in over a ~8° window as the line sweeps through
    const alpha = Math.min(1, (sweepAngle - normChar) / 0.14);
    if (alpha <= 0) continue;

    const x   = cx + r * Math.cos(charAngle);
    const y   = cy + r * Math.sin(charAngle);
    const rot = charAngle + (isTop ? Math.PI / 2 : -Math.PI / 2);

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x, y);
    ctx.rotate(rot);

    // Stroke matches circle outline; fill matches circle sector fill
    ctx.strokeStyle = CAD_BLUE;
    ctx.lineWidth   = 0.6;
    ctx.fillStyle   = `${CAD_BLUE}40`;   // ~25% opacity — same hue as circle fill, slightly more visible
    ctx.strokeText(chars[i], 0, 0);      // outline first
    ctx.fillText(chars[i], 0, 0);        // fill on top

    ctx.restore();
  }

  ctx.restore();
}

export default CADLoadingScreen;
