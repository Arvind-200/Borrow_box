import { ApiError } from '../utils/apiError.js'

const SORT_OPTIONS = ['recommended', 'price-asc', 'price-desc', 'newest']
const DEFAULT_PAGE_SIZE = 12
const MAX_PAGE_SIZE = 50
const MAX_SEARCH_LENGTH = 100
const MAX_CATEGORY_LENGTH = 100

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

export function parseProductQuery(query = {}) {
  const q = readSingleString(query.q, 'q')
  if (q && q.length > MAX_SEARCH_LENGTH) {
    throw new ApiError(400, `q cannot exceed ${MAX_SEARCH_LENGTH} characters`)
  }

  const category = readSingleString(query.category, 'category')
  if (category && category.length > MAX_CATEGORY_LENGTH) {
    throw new ApiError(400, `category cannot exceed ${MAX_CATEGORY_LENGTH} characters`)
  }

  const requestedSort = readSingleString(query.sort, 'sort')
  const sort = (requestedSort || 'recommended').toLowerCase()
  if (!SORT_OPTIONS.includes(sort)) {
    throw new ApiError(400, `sort must be one of: ${SORT_OPTIONS.join(', ')}`)
  }

  const minPrice = parsePrice(query.minPrice ?? query.min, 'minPrice')
  const maxPrice = parsePrice(query.maxPrice ?? query.max, 'maxPrice')
  if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
    throw new ApiError(400, 'minPrice cannot be greater than maxPrice')
  }

  const page = parsePositiveInteger(query.page, 'page', 1)
  const limit = parsePositiveInteger(query.limit, 'limit', DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE)

  return {
    q: q || undefined,
    category: category ? category.toLowerCase() : undefined,
    minPrice,
    maxPrice,
    sort,
    page,
    limit,
  }
}
