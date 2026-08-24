/** OpenStreetMap Nominatim — free geocoding for city/country search. */
export async function searchPlace(query) {
  const q = String(query || '').trim()
  if (q.length < 2) return null

  const url = new URL('https://nominatim.openstreetmap.org/search')
  url.searchParams.set('q', q)
  url.searchParams.set('format', 'json')
  url.searchParams.set('limit', '1')

  const res = await fetch(url.toString(), {
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) throw new Error('Search failed')
  const data = await res.json()
  if (!data?.[0]) return null

  const hit = data[0]
  return {
    lat: parseFloat(hit.lat),
    lng: parseFloat(hit.lon),
    label: hit.display_name,
    country: extractCountry(hit),
  }
}

function extractCountry(hit) {
  if (hit.address?.country) return hit.address.country
  const parts = String(hit.display_name || '').split(',').map((s) => s.trim())
  return parts[parts.length - 1] || ''
}
