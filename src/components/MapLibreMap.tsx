import { useEffect, useRef } from "react";
import { useMotionValue, useMotionValueEvent } from "framer-motion";
import type { MotionValue } from "framer-motion";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

// George Brown College Waterfront Campus – 51 Dockside Dr, Toronto ON
const TARGET_LNG = -79.3654;
const TARGET_LAT = 43.6441;

// ---------------------------------------------------------------------------
// Camera keyframe definitions
// ---------------------------------------------------------------------------
/**
 * A single point along the cinematic camera path.
 * `easing` is applied to the normalised t ∈ [0,1] when interpolating FROM
 * this keyframe to the next one, letting each segment have its own curve.
 */
interface CameraKeyframe {
  progress: number;
  center: [number, number];
  zoom: number;
  pitch: number;
  /** Optional per-segment easing applied to t ∈ [0,1] as we leave this frame */
  easing?: (t: number) => number;
}

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

const KEYFRAMES: CameraKeyframe[] = [
  // 0.0 → 0.2  Space view – intentional static hold so the viewer
  //             can orient before the descent begins (per spec).
  { progress: 0.0, center: [0, 0], zoom: 1, pitch: 0 },
  // 0.2 → 0.5  Continent descent – drift toward North America
  { progress: 0.2, center: [0, 0], zoom: 1, pitch: 0 },
  // 0.5 → 0.75  City transition – closing in on Toronto
  { progress: 0.5, center: [-100, 45], zoom: 4, pitch: 15 },
  // 0.75 → 1.0  Final cinematic lock – 51 Dockside Dr (ease-out)
  { progress: 0.75, center: [TARGET_LNG, TARGET_LAT], zoom: 10, pitch: 30, easing: easeOutCubic },
  { progress: 1.0, center: [TARGET_LNG, TARGET_LAT], zoom: 17, pitch: 60 },
];

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function interpolateCamera(progress: number): maplibregl.JumpToOptions {
  const p = Math.max(0, Math.min(1, progress));

  // Find the surrounding keyframe pair
  let lo = KEYFRAMES[0];
  let hi = KEYFRAMES[KEYFRAMES.length - 1];

  for (let i = 0; i < KEYFRAMES.length - 1; i++) {
    if (p >= KEYFRAMES[i].progress && p <= KEYFRAMES[i + 1].progress) {
      lo = KEYFRAMES[i];
      hi = KEYFRAMES[i + 1];
      break;
    }
  }

  const span = hi.progress - lo.progress;
  let t = span === 0 ? 0 : (p - lo.progress) / span;
  if (lo.easing) t = lo.easing(t);

  return {
    center: [lerp(lo.center[0], hi.center[0], t), lerp(lo.center[1], hi.center[1], t)],
    zoom: lerp(lo.zoom, hi.zoom, t),
    pitch: lerp(lo.pitch, hi.pitch, t),
  };
}

// ---------------------------------------------------------------------------

interface MapLibreMapProps {
  scrollProgress?: MotionValue<number>;
}

const MapLibreMap = ({ scrollProgress }: MapLibreMapProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  // Fallback so the hook is always called unconditionally
  const fallbackProgress = useMotionValue(0);
  const activeProgress = scrollProgress ?? fallbackProgress;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const key = yGoQbpsDpz77HOnzaUgA;
    if (!key) {
      console.error(
        "MapLibreMap: VITE_MAPTILER_KEY is not set. " +
          "Add it to your .env file (see .env.example).",
      );
      return;
    }

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: `https://api.maptiler.com/maps/satellite/style.json?key=${key}`,
      // Start at space view; scroll will drive the camera from here
      center: [0, 0],
      zoom: 1,
      pitch: 0,
      bearing: 0,
      antialias: true,
    });

    mapRef.current = map;

    map.on("load", () => {
      // 3D terrain via MapTiler terrain-rgb-v2
      map.addSource("maptiler-dem", {
        type: "raster-dem",
        url: `https://api.maptiler.com/tiles/terrain-rgb-v2/tiles.json?key=${key}`,
        tileSize: 256,
      });
      map.setTerrain({ source: "maptiler-dem", exaggeration: 1.5 });

      // 3D building extrusion layer
      const layers = map.getStyle().layers;
      // Insert buildings below the first symbol (label) layer
      const labelLayer = layers.find((l) => l.type === "symbol");

      // Dynamically resolve the building vector-tile source from the loaded style
      // (MapTiler uses "maptiler_planet" or similar; this avoids hardcoding a
      // Mapbox-specific source name like "composite")
      type LayerWithSourceLayer = { source: string; "source-layer": string };
      const buildingSourceId = (
        layers.find(
          (l): l is maplibregl.LayerSpecification & LayerWithSourceLayer =>
            "source-layer" in l &&
            (l as LayerWithSourceLayer)["source-layer"] === "building",
        ) as LayerWithSourceLayer | undefined
      )?.source;

      if (buildingSourceId) {
        map.addLayer(
          {
            id: "3d-buildings",
            source: buildingSourceId,
            "source-layer": "building",
            type: "fill-extrusion",
            minzoom: 15,
            paint: {
              "fill-extrusion-color": "#aaa",
              // Use coalesce to support both OpenMapTiles (render_height) and
              // Mapbox (height) property names
              "fill-extrusion-height": [
                "interpolate",
                ["linear"],
                ["zoom"],
                15,
                0,
                15.05,
                ["coalesce", ["get", "render_height"], ["get", "height"], 0],
              ],
              "fill-extrusion-base": [
                "interpolate",
                ["linear"],
                ["zoom"],
                15,
                0,
                15.05,
                ["coalesce", ["get", "render_min_height"], ["get", "min_height"], 0],
              ],
              "fill-extrusion-opacity": 0.8,
            },
          },
          labelLayer?.id,
        );
      }
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Drive the camera from scroll progress without causing React re-renders.
  // useMotionValueEvent fires in sync with Framer Motion's rAF scheduler —
  // at most once per animation frame — so no additional throttling is needed.
  // map.jumpTo() is a synchronous, zero-duration camera set (no tweening),
  // keeping WebGL rendering fully decoupled from the React render cycle.
  useMotionValueEvent(activeProgress, "change", (latest) => {
    const map = mapRef.current;
    if (!map) return;
    map.jumpTo(interpolateCamera(latest));
  });

  return (
    <div
      ref={containerRef}
      style={{ width: "100vw", height: "100vh", position: "fixed", inset: 0, zIndex: 0 }}
    />
  );
};

export default MapLibreMap;
