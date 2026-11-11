import { ApiError } from '../utils/apiError.js'
import { readSingleString } from './queryHelpers.js'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function parseSiteName(value) {
  const siteName = readSingleString(value, 'siteName')
  if (siteName === undefined) return undefined
  if (siteName.length < 2) {
    throw new ApiError(400, 'siteName must be at least 2 characters')
  }
  if (siteName.length > 80) {
    throw new ApiError(400, 'siteName cannot exceed 80 characters')
  }

  return siteName
}

function parseSupportEmail(value) {
  const supportEmail = readSingleString(value, 'supportEmail')
  if (supportEmail === undefined) return undefined
  if (supportEmail === '') return ''
  if (!EMAIL_REGEX.test(supportEmail)) {
    throw new ApiError(400, 'supportEmail must be a valid email address')
  }

  return supportEmail.toLowerCase()
}

function parseAllowNewListings(value) {
  if (value === undefined) return undefined
  if (typeof value !== 'boolean') {
    throw new ApiError(400, 'allowNewListings must be true or false')
  }

  return value
}

export function parsePlatformSettingInput(body = {}) {
  const input = {
    siteName: parseSiteName(body.siteName),
    supportEmail: parseSupportEmail(body.supportEmail),
    allowNewListings: parseAllowNewListings(body.allowNewListings),
  }

  const fields = Object.entries(input).filter(
    ([, value]) => value !== undefined
  )
  if (fields.length === 0) {
    throw new ApiError(400, 'At least one setting is required')
  }

  return Object.fromEntries(fields)
}
