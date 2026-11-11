import { ApiError } from '../utils/apiError.js'

export const OBJECT_ID_REGEX = /^[a-f0-9]{24}$/i

export function readSingleString(value, name) {
  if (value === undefined) return undefined
  if (typeof value !== 'string') {
    throw new ApiError(400, `${name} must be a single value`)
  }
  return value.trim()
}

export function parsePositiveInteger(value, name, defaultValue, max) {
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

export function parseSearch(value, name = 'q', maxLength = 100) {
  const search = readSingleString(value, name)
  if (search === undefined || search === '') return undefined
  if (search.length > maxLength) {
    throw new ApiError(400, `${name} cannot exceed ${maxLength} characters`)
  }

  return search
}

export function parseEnum(value, name, allowedValues, { lowerCase = false } = {}) {
  const raw = readSingleString(value, name)
  if (raw === undefined || raw === '') return undefined

  const candidate = lowerCase ? raw.toLowerCase() : raw
  const match = allowedValues.find(
    (allowed) =>
      (lowerCase ? allowed.toLowerCase() : allowed) === candidate
  )

  if (!match) {
    throw new ApiError(400, `${name} must be one of: ${allowedValues.join(', ')}`)
  }

  return match
}

export function parseObjectId(value, name) {
  const raw = readSingleString(value, name)
  if (raw === undefined || raw === '') return undefined
  if (!OBJECT_ID_REGEX.test(raw)) {
    throw new ApiError(400, `${name} must be a valid id`)
  }

  return raw
}

export function parseBoolean(value, name) {
  if (value === undefined) return undefined
  if (typeof value === 'boolean') return value
  if (value === 'true') return true
  if (value === 'false') return false

  throw new ApiError(400, `${name} must be true or false`)
}
