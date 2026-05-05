import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

// George Brown College Waterfront Campus – 51 Dockside Dr, Toronto ON
const TARGET_LNG = -79.3654;
const TARGET_LAT = 43.6441;

const MapLibreMap = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const key = import.meta.env.VITE_MAPTILER_KEY;
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
      center: [TARGET_LNG, TARGET_LAT],
      zoom: 16.5,
      pitch: 60,
      bearing: -20,
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

  return (
    <div
      ref={containerRef}
      style={{ width: "100vw", height: "100vh", position: "fixed", inset: 0, zIndex: 0 }}
    />
  );
};

export default MapLibreMap;
