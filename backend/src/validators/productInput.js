import { ApiError } from '../utils/apiError.js'
import {
  PRODUCT_AVAILABILITY,
  PRODUCT_CONDITIONS,
} from '../models/Product.js'

const OBJECT_ID_REGEX = /^[a-f0-9]{24}$/i
const MAX_TAGS = 10
const MAX_TAG_LENGTH = 30
const MAX_RENT_PER_DAY = 1000000

function readText(value, name, { min, max, required = true }) {
  if (value === undefined || value === null) {
    if (required) throw new ApiError(400, `${name} is required`)
    return ''
  }
  if (typeof value !== 'string') {
    throw new ApiError(400, `${name} must be a string`)
  }

  const text = value.trim()
  if (required && text.length === 0) {
    throw new ApiError(400, `${name} is required`)
  }
  if (text.length < min) {
    throw new ApiError(400, `${name} must be at least ${min} characters`)
  }
  if (text.length > max) {
    throw new ApiError(400, `${name} cannot exceed ${max} characters`)
  }

  return text
}

function readRentPerDay(value) {
  if (value === undefined || value === null || value === '') {
    throw new ApiError(400, 'Rent per day is required')
  }

  const parsed = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(parsed)) {
    throw new ApiError(400, 'Rent per day must be a number')
  }
  if (parsed < 0) {
    throw new ApiError(400, 'Rent per day cannot be negative')
  }
  if (parsed > MAX_RENT_PER_DAY) {
    throw new ApiError(400, `Rent per day cannot exceed ${MAX_RENT_PER_DAY}`)
  }

  return Math.round(parsed * 100) / 100
}

function readEnum(value, name, allowed, fallback) {
  if (value === undefined || value === null || value === '') return fallback
  if (typeof value !== 'string' || !allowed.includes(value)) {
    throw new ApiError(400, `${name} must be one of: ${allowed.join(', ')}`)
  }
  return value
}

function readTags(value) {
  if (value === undefined || value === null) return []
  if (!Array.isArray(value)) {
    throw new ApiError(400, 'Tags must be an array of strings')
  }

  const seen = new Set()
  const tags = []

  for (const rawTag of value) {
    if (typeof rawTag !== 'string') {
      throw new ApiError(400, 'Tags must be an array of strings')
    }

    const tag = rawTag.trim()
    if (!tag) continue
    if (tag.length > MAX_TAG_LENGTH) {
      throw new ApiError(400, `Each tag must be ${MAX_TAG_LENGTH} characters or fewer`)
    }

    const normalized = tag.toLowerCase()
    if (seen.has(normalized)) continue
    seen.add(normalized)
    tags.push(tag)
  }

  if (tags.length > MAX_TAGS) {
    throw new ApiError(400, `A listing can have at most ${MAX_TAGS} tags`)
  }

  return tags
}

export function parseProductInput(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new ApiError(400, 'A product payload is required')
  }

  const category = typeof body.category === 'string' ? body.category.trim() : ''
  if (!OBJECT_ID_REGEX.test(category)) {
    throw new ApiError(400, 'A valid category is required')
  }

  return {
    title: readText(body.title, 'Title', { min: 3, max: 120 }),
    description: readText(body.description, 'Description', { min: 10, max: 2000 }),
    category,
    rentPerDay: readRentPerDay(body.rentPerDay),
    location: readText(body.location, 'Pickup area', { min: 1, max: 100 }),
    availability: readEnum(
      body.availability,
      'Availability',
      PRODUCT_AVAILABILITY,
      'available'
    ),
    condition: readEnum(body.condition, 'Condition', PRODUCT_CONDITIONS, 'good'),
    tags: readTags(body.tags),
  }
}

export function parsePublicationInput(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new ApiError(400, 'A publication payload is required')
  }
  if (typeof body.isPublished !== 'boolean') {
    throw new ApiError(400, 'isPublished must be a boolean')
  }

  return { isPublished: body.isPublished }
}
