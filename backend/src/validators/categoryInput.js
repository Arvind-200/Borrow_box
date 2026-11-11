import { ApiError } from '../utils/apiError.js'
import { readSingleString } from './queryHelpers.js'

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export function slugifyCategoryName(name) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50)
    .replace(/-+$/g, '')
}

function parseName(value, { required }) {
  const name = readSingleString(value, 'name')
  if (!name) {
    if (required) throw new ApiError(400, 'Category name is required')
    return undefined
  }
  if (name.length < 2) {
    throw new ApiError(400, 'Category name must be at least 2 characters')
  }
  if (name.length > 50) {
    throw new ApiError(400, 'Category name cannot exceed 50 characters')
  }

  return name
}

function parseSlug(value, required) {
  const slug = readSingleString(value, 'slug')
  if (!slug) {
    if (required) throw new ApiError(400, 'Category slug is required')
    return undefined
  }
  if (slug.length > 50) {
    throw new ApiError(400, 'Category slug cannot exceed 50 characters')
  }
  if (!SLUG_REGEX.test(slug)) {
    throw new ApiError(
      400,
      'Category slug may only contain lowercase letters, numbers, and hyphens'
    )
  }

  return slug
}

function parseDescription(value) {
  const description = readSingleString(value, 'description')
  if (description === undefined) return undefined
  if (description.length > 300) {
    throw new ApiError(400, 'Category description cannot exceed 300 characters')
  }

  return description
}

function parseIcon(value) {
  const icon = readSingleString(value, 'icon')
  if (icon === undefined) return undefined
  if (icon.length > 50) {
    throw new ApiError(400, 'Category icon name cannot exceed 50 characters')
  }

  return icon || 'box'
}

function parseSortOrder(value) {
  if (value === undefined || value === null || value === '') return undefined

  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new ApiError(400, 'sortOrder must be a non-negative integer')
  }
  if (parsed > 100000) {
    throw new ApiError(400, 'sortOrder cannot exceed 100000')
  }

  return parsed
}

function parseIsActive(value) {
  if (value === undefined) return undefined
  if (typeof value !== 'boolean') {
    throw new ApiError(400, 'isActive must be true or false')
  }

  return value
}

export function parseCategoryCreateInput(body = {}) {
  const name = parseName(body.name, { required: true })
  const slug =
    parseSlug(body.slug, false) || slugifyCategoryName(name)

  if (!slug) {
    throw new ApiError(400, 'A valid category slug is required')
  }

  return {
    name,
    slug,
    description: parseDescription(body.description) || '',
    icon: parseIcon(body.icon) || 'box',
    sortOrder: parseSortOrder(body.sortOrder) ?? 0,
    isActive: parseIsActive(body.isActive) ?? true,
  }
}

export function parseCategoryActiveInput(body = {}) {
  const isActive = parseIsActive(body.isActive)
  if (isActive === undefined) {
    throw new ApiError(400, 'isActive is required')
  }

  return { isActive }
}

export function parseCategoryUpdateInput(body = {}) {
  const input = {
    name: parseName(body.name, { required: false }),
    slug: parseSlug(body.slug, false),
    description: parseDescription(body.description),
    icon: parseIcon(body.icon),
    sortOrder: parseSortOrder(body.sortOrder),
    isActive: parseIsActive(body.isActive),
  }

  if (!input.slug && input.name) {
    input.slug = slugifyCategoryName(input.name)
    if (!input.slug) {
      throw new ApiError(400, 'A valid category slug could not be generated')
    }
  }

  const fields = Object.entries(input).filter(
    ([, value]) => value !== undefined
  )
  if (fields.length === 0) {
    throw new ApiError(400, 'At least one category field is required')
  }

  return Object.fromEntries(fields)
}
