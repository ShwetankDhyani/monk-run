/** Geocode city/place names via server proxy (Nominatim). */

const COUNTRY_ALIASES = {
  usa: 'United States',
  'united states of america': 'United States',
  uk: 'United Kingdom',
  'united kingdom of great britain and northern ireland': 'United Kingdom',
  'south korea': 'South Korea',
  'republic of korea': 'South Korea',
  'czech republic': 'Czechia',
  uae: 'United Arab Emirates',
  russia: 'Russia',
}

export function normalizeCountryName(name, countries = []) {
  const raw = String(name || '').trim()
  if (!raw) return ''
  const lower = raw.toLowerCase()
  const alias = COUNTRY_ALIASES[lower]
  if (alias) return alias
  const exact = countries.find((c) => c.toLowerCase() === lower)
  if (exact) return exact
  const partial = countries.find((c) => lower.includes(c.toLowerCase()) || c.toLowerCase().includes(lower))
  return partial || raw
}

export async function searchPlace(query) {
  const q = String(query || '').trim()
  if (q.length < 2) return null

  const url = `/api/geocode?q=${encodeURIComponent(q)}`
  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error('Search failed')
  const data = await res.json()
  if (data?.error) throw new Error(data.error)
  if (!data?.lat || !data?.lng) return null

  return {
    lat: data.lat,
    lng: data.lng,
    label: data.label || q,
    country: data.country || '',
  }
}
