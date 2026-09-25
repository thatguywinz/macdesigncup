/* The desktop hero's scroll timeline, in hero scroll progress (0..1 across
   the pinned span: the section is 160svh, so the span is 60svh).
   Shared by the page shell (DOM layers) and the lazy scene chunk (camera,
   door CTA, bloom). No three.js here: the shell imports it too. */

/** Poster type lifts and fades out over this span. */
export const COPY_OUT: [number, number] = [0, 0.28];

/** The Enter slab at the door fades out over this span. */
export const CTA_OUT: [number, number] = [0.02, 0.16];

/** The printer hologram fades out as the camera pushes past it, so the stop
 *  frame never holds a sliver of it cut by the frame's corner. */
export const PRINTER_OUT: [number, number] = [0.22, 0.6];

/** Plaques the stop frame would cut at its edge fade out over this span, so
 *  the camera arrives on whole ones only (frame.ts, cutAtStop). */
export const PLAQUE_OUT: [number, number] = [0.4, 0.72];

/** Progress at which the camera arrives at its stop in front of the door. */
export const DOLLY_END = 0.8;

/** The stage's lower edge melts into the page over this span. */
export const SPILL_IN: [number, number] = [0.7, 1];
