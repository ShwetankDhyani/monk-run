const BIOME_PALETTES = {
  'neon-metro': ['#12061f', '#ff2d95', '#00e5ff', '#f4a261'],
  'temple-forest': ['#0b1a10', '#80ff72', '#f4a261', '#2d6a4f'],
  'river-skyline': ['#071018', '#00e5ff', '#94a3b8', '#f4a261'],
  'old-city': ['#1a1008', '#d4a373', '#8b5e34', '#f4a261'],
  'tropical-street': ['#10200e', '#80ff72', '#f4a261', '#ff4d6d'],
  'rice-terrace': ['#0d1f0a', '#80ff72', '#b5e48c', '#f4a261'],
  'colonial-coast': ['#101820', '#00e5ff', '#f4a261', '#ffe8d6'],
  'river-ritual': ['#1a0a08', '#ff4d6d', '#f4a261', '#ffd166'],
  'desert-palace': ['#1a1005', '#f4a261', '#e9c46a', '#ff4d6d'],
  'temple-square': ['#140c08', '#f4a261', '#e76f51', '#80ff72'],
  'desert-glass': ['#100818', '#00e5ff', '#f4a261', '#c77dff'],
  'strait-city': ['#0a1218', '#00e5ff', '#f4a261', '#e9c46a'],
  'fairy-chimney': ['#1a1208', '#e9c46a', '#f4a261', '#bc6c25'],
  'desert-mosque': ['#1a1408', '#e9c46a', '#f4a261', '#ffffff'],
  souk: ['#1a0e08', '#e76f51', '#f4a261', '#80ff72'],
  'coastal-mountain': ['#0a1520', '#00e5ff', '#80ff72', '#f4a261'],
  'savanna-city': ['#151008', '#e9c46a', '#80ff72', '#f4a261'],
  'atlantic-metro': ['#0c1018', '#00e5ff', '#ff4d6d', '#f4a261'],
  'nordic-coast': ['#0a1218', '#a8dadc', '#00e5ff', '#f1faee'],
  'fjord-town': ['#0a1414', '#80ff72', '#a8dadc', '#f4a261'],
  'nordic-island': ['#0d1320', '#00e5ff', '#c77dff', '#f1faee'],
  'canal-color': ['#0c1420', '#00e5ff', '#ff4d6d', '#f4a261'],
  'guild-square': ['#14100c', '#f4a261', '#e9c46a', '#ffd166'],
  'cafe-hill': ['#120e18', '#c77dff', '#f4a261', '#00e5ff'],
  'river-traps': ['#101418', '#00e5ff', '#f4a261', '#80ff72'],
  'gothic-coast': ['#100c14', '#c77dff', '#00e5ff', '#f4a261'],
  'hill-tiles': ['#14100c', '#f4a261', '#00e5ff', '#e9c46a'],
  'ochre-lanes': ['#1a1008', '#e76f51', '#f4a261', '#ffe8d6'],
  lagoon: ['#0a1418', '#00e5ff', '#80ff72', '#f1faee'],
  'ruins-city': ['#14120c', '#e9c46a', '#f4a261', '#ffffff'],
  caldera: ['#0c1420', '#00e5ff', '#ffffff', '#f4a261'],
  imperial: ['#121018', '#c77dff', '#f4a261', '#e9c46a'],
  'gothic-bridge': ['#100c14', '#c77dff', '#00e5ff', '#f1faee'],
  'danube-city': ['#0c1218', '#00e5ff', '#f4a261', '#c77dff'],
  'concrete-art': ['#101018', '#ff4d6d', '#00e5ff', '#80ff72'],
  'beer-gothic': ['#14100c', '#f4a261', '#e9c46a', '#80ff72'],
  'alpine-lake': ['#0a1414', '#00e5ff', '#80ff72', '#f1faee'],
  'rain-neon': ['#0c0c14', '#ff4d6d', '#00e5ff', '#f4a261'],
  'castle-ridge': ['#101418', '#a8dadc', '#f4a261', '#80ff72'],
  'pub-river': ['#10140c', '#80ff72', '#f4a261', '#e9c46a'],
  'rebuilt-square': ['#141018', '#c77dff', '#f4a261', '#00e5ff'],
  'cloth-hall': ['#14100c', '#f4a261', '#e76f51', '#e9c46a'],
  'onion-metro': ['#120818', '#ff4d6d', '#f4a261', '#c77dff'],
  'cast-iron': ['#0c1018', '#00e5ff', '#f4a261', '#ff4d6d'],
  'fog-hills': ['#101418', '#a8dadc', '#f4a261', '#80ff72'],
  'lake-grid': ['#0c1218', '#00e5ff', '#80ff72', '#f4a261'],
  'jazz-balcony': ['#140c10', '#ff4d6d', '#f4a261', '#c77dff'],
  zocalo: ['#14100c', '#f4a261', '#e76f51', '#80ff72'],
  'colonial-color': ['#14100a', '#e76f51', '#80ff72', '#f4a261'],
  'caribbean-ruin': ['#101820', '#00e5ff', '#f4a261', '#ff4d6d'],
  'beach-mountain': ['#0c1820', '#00e5ff', '#80ff72', '#f4a261'],
  'tango-barrio': ['#14100c', '#e76f51', '#00e5ff', '#f4a261'],
  'pacific-cliff': ['#0c1418', '#00e5ff', '#a8dadc', '#f4a261'],
  'andean-stone': ['#14120c', '#e9c46a', '#f4a261', '#80ff72'],
  'andes-city': ['#101418', '#00e5ff', '#c77dff', '#f4a261'],
  'harbor-opera': ['#0c1820', '#00e5ff', '#80ff72', '#f1faee'],
  'laneway-art': ['#101018', '#ff4d6d', '#00e5ff', '#80ff72'],
  'harbor-volcano': ['#0c1820', '#00e5ff', '#80ff72', '#f4a261'],
  'brick-district': ['#14100c', '#e76f51', '#f4a261', '#00e5ff'],
  'rain-harbor': ['#0c1418', '#a8dadc', '#00e5ff', '#f4a261'],
}

let mapsLoader = null

export function getMapsApiKey() {
  return (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_GOOGLE_MAPS_API_KEY) || ''
}

export function loadGoogleMaps(apiKey) {
  if (!apiKey) return Promise.reject(new Error('No API key'))
  if (window.google?.maps) return Promise.resolve(window.google.maps)
  if (mapsLoader) return mapsLoader
  mapsLoader = new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&v=weekly`
    s.async = true
    s.onload = () => {
      if (window.google?.maps) resolve(window.google.maps)
      else reject(new Error('Google Maps failed to initialize'))
    }
    s.onerror = () => reject(new Error('Google Maps script blocked or invalid key'))
    document.head.appendChild(s)
  })
  return mapsLoader
}

export function biomeColors(biome) {
  return BIOME_PALETTES[biome] || ['#07040f', '#f4a261', '#00e5ff', '#80ff72']
}
