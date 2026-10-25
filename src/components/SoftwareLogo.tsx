import { cn } from "@/lib/utils";

// The three programs' marks, icon only (no wordmark), drawn in one ink
// (currentColor) like the sponsor wall: the brands' own colours would clash
// with the page. Used to identify the software each guide covers.
// Sources: Blender, Simple Icons (CC0); Autodesk Fusion, Wikimedia Commons
// "Autodesk Fusion Logo.svg"; Onshape, the mark from onshape.com's header logo.
// Second tones are the same ink at lower opacity. The trademarks belong to
// the Blender Foundation, Autodesk and PTC.

export type SoftwareMark = "Blender" | "Fusion 360" | "Onshape";

const MARKS: Record<SoftwareMark, { viewBox: string; paths: JSX.Element }> = {
  Blender: {
    viewBox: "0 0 24 24",
    paths: <path d="M12.51 13.214c.046-.8.438-1.506 1.03-2.006a3.424 3.424 0 0 1 2.212-.79c.85 0 1.631.3 2.211.79.592.5.983 1.206 1.028 2.005.045.823-.285 1.586-.865 2.153a3.389 3.389 0 0 1-2.374.938 3.393 3.393 0 0 1-2.376-.938c-.58-.567-.91-1.33-.865-2.152M7.35 14.831c.006.314.106.922.256 1.398a7.372 7.372 0 0 0 1.593 2.757 8.227 8.227 0 0 0 2.787 2.001 8.947 8.947 0 0 0 3.66.76 8.964 8.964 0 0 0 3.657-.772 8.285 8.285 0 0 0 2.785-2.01 7.428 7.428 0 0 0 1.592-2.762 6.964 6.964 0 0 0 .25-3.074 7.123 7.123 0 0 0-1.016-2.779 7.764 7.764 0 0 0-1.852-2.043h.002L13.566 2.55l-.02-.015c-.492-.378-1.319-.376-1.86.002-.547.382-.609 1.015-.123 1.415l-.001.001 3.126 2.543-9.53.01h-.013c-.788.001-1.545.518-1.695 1.172-.154.665.38 1.217 1.2 1.22V8.9l4.83-.01-8.62 6.617-.034.025c-.813.622-1.075 1.658-.563 2.313.52.667 1.625.668 2.447.004L7.414 14s-.069.52-.063.831zm12.09 1.741c-.97.988-2.326 1.548-3.795 1.55-1.47.004-2.827-.552-3.797-1.538a4.51 4.51 0 0 1-1.036-1.622 4.282 4.282 0 0 1 .282-3.519 4.702 4.702 0 0 1 1.153-1.371c.942-.768 2.141-1.183 3.396-1.185 1.256-.002 2.455.41 3.398 1.175.48.391.87.854 1.152 1.367a4.28 4.28 0 0 1 .522 1.706 4.236 4.236 0 0 1-.239 1.811 4.54 4.54 0 0 1-1.035 1.626" />,
  },
  "Fusion 360": {
    viewBox: "7 0 78 78",
    paths: (
      <>
        <path opacity={0.45} d="m 13.6308,0.731 0.02,-0.0339 64.1293,14.1717 h 6.6615 V 77.6969 H 11.9881 c -2.513,0 -4.5502,-2.0372 -4.5502,-4.5502 v -6.1561 z" />
        <path fillRule="evenodd" d="M 78.2288,63.6962 H 13.6308 V 0.731 l 0.0199,-0.0379 h 60.0279 c 2.513,0 4.5502,2.0372 4.5502,4.5502 v 58.4528 z M 45.2431,21.075 v 8.3301 h 11.4727 v 6.1855 H 45.2431 v 14.1162 h -8.7295 v -34.917 h 22.2969 v 6.2852 z" />
      </>
    ),
  },
  Onshape: {
    viewBox: "0 0 42 49",
    paths: (
      <>
      <path opacity={0.55} d="M11.2302 24.3207L14.7526 26.3435V21.7777L24.3381 16.1716L20.8735 14.0332L11.2302 19.6971V24.3207Z" />
      <path d="M20.8735 0.97168L28.8421 5.59527L7.8811 18.0212V28.7132L0.258911 24.263V12.993L20.8735 0.97168Z" />
      <path opacity={0.55} d="M26.4168 17.3855L22.8945 19.4083L26.9365 21.7779L26.8788 32.5855L30.4012 30.5627V19.6973L26.4168 17.3855Z" />
      <path d="M41.6612 36.8622L33.6925 41.6014V17.8477L24.0493 12.1838L32.1335 7.50244L41.6612 13.0507V36.8622Z" />
      <path opacity={0.55} d="M24.8578 33.857V29.9269L20.8157 32.2965L11.2302 26.6904V30.6205L20.8734 36.2266L24.8578 33.857Z" />
      <path d="M0.258911 37.0355V28.2507L20.8735 40.0409L30.3435 34.377L30.4012 43.5086L21.1045 48.9991L0.258911 37.0355Z" />
      </>
    ),
  },
};

/** A program's mark in the current text colour. Decorative: the name sits beside it. */
export default function SoftwareLogo({ name, className }: { name: string; className?: string }) {
  const mark = MARKS[name as SoftwareMark];
  if (!mark) return null;
  return (
    <svg aria-hidden="true" viewBox={mark.viewBox} fill="currentColor" className={cn("block", className)}>
      {mark.paths}
    </svg>
  );
}
