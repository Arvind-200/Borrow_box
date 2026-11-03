import { ApiError } from '../utils/apiError.js'
import { PRODUCT_AVAILABILITY } from '../models/Product.js'

const SORT_OPTIONS = ['recommended', 'price-asc', 'price-desc', 'newest']
const DEFAULT_PAGE_SIZE = 12
const MAX_PAGE_SIZE = 50
const MAX_SEARCH_LENGTH = 100
const MAX_CATEGORY_LENGTH = 100
const MAX_LOCATION_LENGTH = 100

function readSingleString(value, name) {
  if (value === undefined) return undefined
  if (typeof value !== 'string') {
    throw new ApiError(400, `${name} must be a single value`)
  }
  return value.trim()
}

function parsePositiveInteger(value, name, defaultValue, max) {
  const raw = readSingleString(value, name)
  if (raw === undefined || raw === '') return defaultValue

  if (!/^\d+$/.test(raw)) {
    throw new ApiError(400, `${name} must be a positive integer`)
  }

  const parsed = Number(raw)
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new ApiError(400, `${name} must be a positive integer`)
  }
  if (max !== undefined && parsed > max) {
    throw new ApiError(400, `${name} cannot exceed ${max}`)
  }

  return parsed
}

function parsePrice(value, name) {
  const raw = readSingleString(value, name)
  if (raw === undefined || raw === '') return undefined

  if (!/^\d+(?:\.\d+)?$/.test(raw)) {
    throw new ApiError(400, `${name} must be a non-negative number`)
  }

  const parsed = Number(raw)
  if (!Number.isFinite(parsed)) {
    throw new ApiError(400, `${name} must be a non-negative number`)
  }

  return parsed
}

function parseLocation(value, name) {
  const location = readSingleString(value, name)
  if (location && location.length > MAX_LOCATION_LENGTH) {
    throw new ApiError(400, `${name} cannot exceed ${MAX_LOCATION_LENGTH} characters`)
  }

  return location || undefined
}

function parseAvailability(value) {
  const availability = readSingleString(value, 'availability')
  if (!availability) return undefined

  const normalized = availability.toLowerCase()
  if (!PRODUCT_AVAILABILITY.includes(normalized)) {
    throw new ApiError(
      400,
      `availability must be one of: ${PRODUCT_AVAILABILITY.join(', ')}`
    )
  }

  return normalized
}

function parseCatalogFilters(query = {}) {
  const q = readSingleString(query.q, 'q')
  if (q && q.length > MAX_SEARCH_LENGTH) {
    throw new ApiError(400, `q cannot exceed ${MAX_SEARCH_LENGTH} characters`)
  }

  const category = readSingleString(query.category, 'category')
  if (category && category.length > MAX_CATEGORY_LENGTH) {
    throw new ApiError(400, `category cannot exceed ${MAX_CATEGORY_LENGTH} characters`)
  }

  const minPrice = parsePrice(query.minPrice ?? query.min, 'minPrice')
  const maxPrice = parsePrice(query.maxPrice ?? query.max, 'maxPrice')
  if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
    throw new ApiError(400, 'minPrice cannot be greater than maxPrice')
  }

  return {
    q: q || undefined,
    category: category ? category.toLowerCase() : undefined,
    minPrice,
    maxPrice,
    availability: parseAvailability(query.availability),
  }
}

export function parseProductQuery(query = {}) {
  const requestedSort = readSingleString(query.sort, 'sort')
  const sort = (requestedSort || 'recommended').toLowerCase()
  if (!SORT_OPTIONS.includes(sort)) {
    throw new ApiError(400, `sort must be one of: ${SORT_OPTIONS.join(', ')}`)
  }

  const page = parsePositiveInteger(query.page, 'page', 1)
  const limit = parsePositiveInteger(query.limit, 'limit', DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE)

  return {
    ...parseCatalogFilters(query),
    location: parseLocation(query.location, 'location'),
    sort,
    page,
    limit,
  }
}

export function parseLocationQuery(query = {}) {
  return {
    ...parseCatalogFilters(query),
    nearbyFor: parseLocation(query.nearbyFor, 'nearbyFor'),
  }
}
