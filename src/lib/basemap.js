/**
 * Leaflet basemap for guess/reveal maps.
 *
 * CARTO's public `basemaps.cartocdn.com/dark_all` tiles now bake in an
 * "API KEY REQUIRED" watermark without a key — unusable for pinning.
 * Default to Esri Dark Gray Canvas (no key for typical web use).
 *
 * Override with VITE_MAP_TILE_URL / VITE_MAP_TILE_ATTR when you have a
 * keyed provider (CARTO, MapTiler, Stadia, etc.).
 */

const WORLD_BOUNDS = [
  [-85, -180],
  [85, 180],
]

const DEFAULT = {
  // Esri uses {z}/{y}/{x} (y before x)
  url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
  attribution:
    'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
  /** Optional labels overlay (same XYZ scheme). */
  labelsUrl:
    'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
  bounds: WORLD_BOUNDS,
}

export function getBasemap() {
  const url = String(import.meta.env?.VITE_MAP_TILE_URL || '').trim()
  const attribution = String(import.meta.env?.VITE_MAP_TILE_ATTR || '').trim()
  if (url) {
    return {
      url,
      attribution: attribution || DEFAULT.attribution,
      labelsUrl: String(import.meta.env?.VITE_MAP_TILE_LABELS_URL || '').trim() || null,
      bounds: WORLD_BOUNDS,
    }
  }
  return DEFAULT
}
