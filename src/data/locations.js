/** 55 curated Street View-ready coordinates with country truth + vibe metadata. */
export const LOCATIONS = [
  { id: 'tokyo-shibuya', lat: 35.6595, lng: 139.7004, country: 'Japan', code: 'JP', city: 'Tokyo', biome: 'neon-metro', hint: 'Crosswalks pulse like mantras at dusk.' },
  { id: 'kyoto-fushimi', lat: 34.9671, lng: 135.7727, country: 'Japan', code: 'JP', city: 'Kyoto', biome: 'temple-forest', hint: 'Vermilion gates stack toward the mountain.' },
  { id: 'seoul-hongdae', lat: 37.5563, lng: 126.9236, country: 'South Korea', code: 'KR', city: 'Seoul', biome: 'neon-metro', hint: 'Hangul neon above student alleys.' },
  { id: 'beijing-hutong', lat: 39.9375, lng: 116.3947, country: 'China', code: 'CN', city: 'Beijing', biome: 'old-city', hint: 'Gray brick lanes and bicycle bells.' },
  { id: 'shanghai-bund', lat: 31.2400, lng: 121.4900, country: 'China', code: 'CN', city: 'Shanghai', biome: 'river-skyline', hint: 'Art deco facing a glass skyline.' },
  { id: 'bangkok-khao', lat: 13.7590, lng: 100.4970, country: 'Thailand', code: 'TH', city: 'Bangkok', biome: 'tropical-street', hint: 'Tuk-tuks and temple gold in humidity.' },
  { id: 'chiangmai-old', lat: 18.7883, lng: 98.9853, country: 'Thailand', code: 'TH', city: 'Chiang Mai', biome: 'temple-forest', hint: 'Orange robes drift past brick walls.' },
  { id: 'hanoi-old', lat: 21.0337, lng: 105.8500, country: 'Vietnam', code: 'VN', city: 'Hanoi', biome: 'tropical-street', hint: 'Scooter rivers around French balconies.' },
  { id: 'singapore-marina', lat: 1.2834, lng: 103.8607, country: 'Singapore', code: 'SG', city: 'Singapore', biome: 'river-skyline', hint: 'Supertrees and mirrored towers.' },
  { id: 'bali-ubud', lat: -8.5069, lng: 115.2625, country: 'Indonesia', code: 'ID', city: 'Ubud', biome: 'rice-terrace', hint: 'Emerald steps carved into volcanic hills.' },
  { id: 'mumbai-colaba', lat: 18.9219, lng: 72.8347, country: 'India', code: 'IN', city: 'Mumbai', biome: 'colonial-coast', hint: 'Gateway arches meet Arabian haze.' },
  { id: 'varanasi-ghat', lat: 25.3109, lng: 83.0107, country: 'India', code: 'IN', city: 'Varanasi', biome: 'river-ritual', hint: 'Stone steps pour into sacred water.' },
  { id: 'jaipur-pink', lat: 26.9239, lng: 75.8267, country: 'India', code: 'IN', city: 'Jaipur', biome: 'desert-palace', hint: 'Salmon facades and lattice windows.' },
  { id: 'kathmandu-durbar', lat: 27.7045, lng: 85.3072, country: 'Nepal', code: 'NP', city: 'Kathmandu', biome: 'temple-square', hint: 'Pagoda roofs stacked like prayers.' },
  { id: 'dubai-marina', lat: 25.0805, lng: 55.1403, country: 'United Arab Emirates', code: 'AE', city: 'Dubai', biome: 'desert-glass', hint: 'Glass needles rise from heat shimmer.' },
  { id: 'istanbul-galata', lat: 41.0256, lng: 28.9744, country: 'Turkey', code: 'TR', city: 'Istanbul', biome: 'strait-city', hint: 'Two continents share one skyline.' },
  { id: 'cappadocia', lat: 38.6431, lng: 34.8289, country: 'Turkey', code: 'TR', city: 'Göreme', biome: 'fairy-chimney', hint: 'Stone cones and balloon shadows.' },
  { id: 'cairo-islamic', lat: 30.0444, lng: 31.2620, country: 'Egypt', code: 'EG', city: 'Cairo', biome: 'desert-mosque', hint: 'Minarets pierce dusty gold light.' },
  { id: 'marrakech-medina', lat: 31.6295, lng: -7.9811, country: 'Morocco', code: 'MA', city: 'Marrakech', biome: 'souk', hint: 'Pink walls and spice-colored alleys.' },
  { id: 'cape-town-water', lat: -33.9036, lng: 18.4201, country: 'South Africa', code: 'ZA', city: 'Cape Town', biome: 'coastal-mountain', hint: 'Table Mountain watches the harbor.' },
  { id: 'nairobi-cbd', lat: -1.2864, lng: 36.8172, country: 'Kenya', code: 'KE', city: 'Nairobi', biome: 'savanna-city', hint: 'Acacia light over colonial avenues.' },
  { id: 'lagos-vi', lat: 6.4281, lng: 3.4219, country: 'Nigeria', code: 'NG', city: 'Lagos', biome: 'atlantic-metro', hint: 'Lagoon bridges and restless traffic.' },
  { id: 'reykjavik', lat: 64.1466, lng: -21.9426, country: 'Iceland', code: 'IS', city: 'Reykjavík', biome: 'nordic-coast', hint: 'Colored tin roofs under aurora skies.' },
  { id: 'bergen', lat: 60.3971, lng: 5.3244, country: 'Norway', code: 'NO', city: 'Bergen', biome: 'fjord-town', hint: 'Bryggen timber leans into mist.' },
  { id: 'stockholm-gamla', lat: 59.3250, lng: 18.0708, country: 'Sweden', code: 'SE', city: 'Stockholm', biome: 'nordic-island', hint: 'Cobblestones island-hop the archipelago.' },
  { id: 'copenhagen-ny', lat: 55.6794, lng: 12.5922, country: 'Denmark', code: 'DK', city: 'Copenhagen', biome: 'canal-color', hint: 'Painted warehouses hug the canal.' },
  { id: 'amsterdam-canal', lat: 52.3676, lng: 4.9041, country: 'Netherlands', code: 'NL', city: 'Amsterdam', biome: 'canal-color', hint: 'Bikes tilt past leaning gables.' },
  { id: 'brussels-grand', lat: 50.8467, lng: 4.3525, country: 'Belgium', code: 'BE', city: 'Brussels', biome: 'guild-square', hint: 'Gilded guildhouses frame the square.' },
  { id: 'paris-montmartre', lat: 48.8867, lng: 2.3431, country: 'France', code: 'FR', city: 'Paris', biome: 'cafe-hill', hint: 'Stairs climb toward a white dome.' },
  { id: 'lyon-vieux', lat: 45.7620, lng: 4.8276, country: 'France', code: 'FR', city: 'Lyon', biome: 'river-traps', hint: 'Traboules hide between two rivers.' },
  { id: 'barcelona-gothic', lat: 41.3833, lng: 2.1764, country: 'Spain', code: 'ES', city: 'Barcelona', biome: 'gothic-coast', hint: 'Stone labyrinths near Mediterranean light.' },
  { id: 'lisbon-alfama', lat: 38.7125, lng: -9.1320, country: 'Portugal', code: 'PT', city: 'Lisbon', biome: 'hill-tiles', hint: 'Trams climb azulejo-clad hills.' },
  { id: 'rome-trastevere', lat: 41.8897, lng: 12.4692, country: 'Italy', code: 'IT', city: 'Rome', biome: 'ochre-lanes', hint: 'Ochre walls and scooter echo.' },
  { id: 'venice-sanmarco', lat: 45.4341, lng: 12.3388, country: 'Italy', code: 'IT', city: 'Venice', biome: 'lagoon', hint: 'No cars — only water and stone.' },
  { id: 'athens-plaka', lat: 37.9725, lng: 23.7283, country: 'Greece', code: 'GR', city: 'Athens', biome: 'ruins-city', hint: 'Whitewashed lanes below the Acropolis.' },
  { id: 'santorini', lat: 36.4618, lng: 25.3753, country: 'Greece', code: 'GR', city: 'Oia', biome: 'caldera', hint: 'Blue domes cling to black cliffs.' },
  { id: 'vienna-innerm', lat: 48.2082, lng: 16.3738, country: 'Austria', code: 'AT', city: 'Vienna', biome: 'imperial', hint: 'Palaces and coffeehouse mirrors.' },
  { id: 'prague-old', lat: 50.0870, lng: 14.4208, country: 'Czechia', code: 'CZ', city: 'Prague', biome: 'gothic-bridge', hint: 'Charles Bridge saints watch the Vltava.' },
  { id: 'budapest-pest', lat: 47.4979, lng: 19.0402, country: 'Hungary', code: 'HU', city: 'Budapest', biome: 'danube-city', hint: 'Parliament spines along the Danube.' },
  { id: 'berlin-mitte', lat: 52.5200, lng: 13.4050, country: 'Germany', code: 'DE', city: 'Berlin', biome: 'concrete-art', hint: 'Graffiti layers over divided history.' },
  { id: 'munich-marien', lat: 48.1372, lng: 11.5755, country: 'Germany', code: 'DE', city: 'Munich', biome: 'beer-gothic', hint: 'Glockenspiel square under alpine sky.' },
  { id: 'zurich-old', lat: 47.3690, lng: 8.5430, country: 'Switzerland', code: 'CH', city: 'Zürich', biome: 'alpine-lake', hint: 'Clean streets sloping to a cold lake.' },
  { id: 'london-soho', lat: 51.5136, lng: -0.1365, country: 'United Kingdom', code: 'GB', city: 'London', biome: 'rain-neon', hint: 'Black cabs in drizzle and brick.' },
  { id: 'edinburgh-royal', lat: 55.9502, lng: -3.1875, country: 'United Kingdom', code: 'GB', city: 'Edinburgh', biome: 'castle-ridge', hint: 'Volcanic rock crowned by a castle.' },
  { id: 'dublin-temple', lat: 53.3459, lng: -6.2674, country: 'Ireland', code: 'IE', city: 'Dublin', biome: 'pub-river', hint: 'Liffey bridges and painted doors.' },
  { id: 'warsaw-old', lat: 52.2497, lng: 21.0122, country: 'Poland', code: 'PL', city: 'Warsaw', biome: 'rebuilt-square', hint: 'Reconstructed pastel market square.' },
  { id: 'krakow-main', lat: 50.0619, lng: 19.9373, country: 'Poland', code: 'PL', city: 'Kraków', biome: 'cloth-hall', hint: 'Cloth Hall anchors a vast square.' },
  { id: 'moscow-arbat', lat: 55.7520, lng: 37.5910, country: 'Russia', code: 'RU', city: 'Moscow', biome: 'onion-metro', hint: 'Onion domes beyond long avenues.' },
  { id: 'nyc-soho', lat: 40.7233, lng: -73.9980, country: 'United States', code: 'US', city: 'New York', biome: 'cast-iron', hint: 'Cast-iron loft facades and yellow cabs.' },
  { id: 'sf-painted', lat: 37.7763, lng: -122.4328, country: 'United States', code: 'US', city: 'San Francisco', biome: 'fog-hills', hint: 'Steep streets and painted ladies.' },
  { id: 'chicago-river', lat: 41.8887, lng: -87.6233, country: 'United States', code: 'US', city: 'Chicago', biome: 'lake-grid', hint: 'River bends through a steel canyon.' },
  { id: 'neworleans-fq', lat: 29.9584, lng: -90.0644, country: 'United States', code: 'US', city: 'New Orleans', biome: 'jazz-balcony', hint: 'Iron balconies drip with beads.' },
  { id: 'mexico-city-centro', lat: 19.4326, lng: -99.1332, country: 'Mexico', code: 'MX', city: 'Mexico City', biome: 'zocalo', hint: 'Cathedral square on an old lakebed.' },
  { id: 'oaxaca', lat: 17.0605, lng: -96.7254, country: 'Mexico', code: 'MX', city: 'Oaxaca', biome: 'colonial-color', hint: 'Green stone churches and mole aromas.' },
  { id: 'havana-malecon', lat: 23.1412, lng: -82.3570, country: 'Cuba', code: 'CU', city: 'Havana', biome: 'caribbean-ruin', hint: 'Pastel ruins face the sea wall.' },
  { id: 'rio-ipanema', lat: -22.9838, lng: -43.2096, country: 'Brazil', code: 'BR', city: 'Rio de Janeiro', biome: 'beach-mountain', hint: 'Twin peaks watch a curved beach.' },
  { id: 'buenos-aires-san', lat: -34.6345, lng: -58.3632, country: 'Argentina', code: 'AR', city: 'Buenos Aires', biome: 'tango-barrio', hint: 'Caminito colors and tango ghosts.' },
  { id: 'lima-miraflores', lat: -12.1211, lng: -77.0297, country: 'Peru', code: 'PE', city: 'Lima', biome: 'pacific-cliff', hint: 'Cliffs drop into Pacific fog.' },
  { id: 'cusco-plaza', lat: -13.5167, lng: -71.9788, country: 'Peru', code: 'PE', city: 'Cusco', biome: 'andean-stone', hint: 'Inca stones under colonial balconies.' },
  { id: 'santiago-bellavista', lat: -33.4310, lng: -70.6340, country: 'Chile', code: 'CL', city: 'Santiago', biome: 'andes-city', hint: 'Street art with Andes on the horizon.' },
  { id: 'sydney-circular', lat: -33.8580, lng: 151.2110, country: 'Australia', code: 'AU', city: 'Sydney', biome: 'harbor-opera', hint: 'Opera sails beside a green bridge.' },
  { id: 'melbourne-laneway', lat: -37.8152, lng: 144.9658, country: 'Australia', code: 'AU', city: 'Melbourne', biome: 'laneway-art', hint: 'Coffee steam in graffiti alleys.' },
  { id: 'auckland-viaduct', lat: -36.8434, lng: 174.7645, country: 'New Zealand', code: 'NZ', city: 'Auckland', biome: 'harbor-volcano', hint: 'Sails and volcanic cones.' },
  { id: 'queenstown', lat: -45.0312, lng: 168.6626, country: 'New Zealand', code: 'NZ', city: 'Queenstown', biome: 'alpine-lake', hint: 'Remarkables rise from lake glass.' },
  { id: 'toronto-distillery', lat: 43.6503, lng: -79.3596, country: 'Canada', code: 'CA', city: 'Toronto', biome: 'brick-district', hint: 'Victorian industrial brick canyons.' },
  { id: 'vancouver-gastown', lat: 49.2845, lng: -123.1110, country: 'Canada', code: 'CA', city: 'Vancouver', biome: 'rain-harbor', hint: 'Steam clock in a rainy harbor town.' },
]

export const COUNTRIES = [...new Set(LOCATIONS.map((l) => l.country))].sort()

export const MONK_VIBES = [
  { id: 'saffron', label: 'Saffron Sage', color: '#f4a261', accent: '#ffcc8a' },
  { id: 'cyan', label: 'Cyan Bodhisattva', color: '#00e5ff', accent: '#7af0ff' },
  { id: 'acid', label: 'Acid Lotus', color: '#80ff72', accent: '#b8ffb0' },
  { id: 'ember', label: 'Ember Koan', color: '#ff4d6d', accent: '#ff8fa3' },
  { id: 'violet', label: 'Void Violet', color: '#c77dff', accent: '#e0aaff' },
]

export function getLocation(id) {
  return LOCATIONS.find((l) => l.id === id) || LOCATIONS[0]
}

export { LOCATIONS as default }

export function pickRoundLocations(count, seed = Date.now()) {
  let s = seed % 2147483647
  if (s <= 0) s += 2147483646
  const rand = () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
  const copy = [...LOCATIONS]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy.slice(0, Math.min(count, copy.length))
}
