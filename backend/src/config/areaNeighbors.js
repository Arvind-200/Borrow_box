const AREA_NEIGHBORS = {}

function normalizeArea(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : ''
}

export function getNearbyAreaNames(location) {
  const key = normalizeArea(location)
  if (!key) return []

  const nearby = AREA_NEIGHBORS[key]
  if (!Array.isArray(nearby)) return []

  return nearby.filter(
    (name) => typeof name === 'string' && name.trim().length > 0
  )
}
