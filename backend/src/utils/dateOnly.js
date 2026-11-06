import { ApiError } from './apiError.js'

const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/

// Date-only values are stored as YYYY-MM-DD strings so a selected calendar
// date never shifts because of a timezone conversion.
export function isValidDateOnly(value) {
  if (typeof value !== 'string') return false

  const match = DATE_ONLY_PATTERN.exec(value)
  if (!match) return false

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])

  if (year < 1000 || month < 1 || month > 12 || day < 1 || day > 31) {
    return false
  }

  const date = new Date(Date.UTC(year, month - 1, day))
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  )
}

export function parseDateOnly(value, name = 'Date') {
  if (typeof value !== 'string') {
    throw new ApiError(400, `${name} must be a valid date in YYYY-MM-DD format`)
  }

  const date = value.trim()
  if (!isValidDateOnly(date)) {
    throw new ApiError(400, `${name} must be a valid date in YYYY-MM-DD format`)
  }

  return date
}

export function assertDateRangeOrder(startDate, endDate) {
  if (endDate < startDate) {
    throw new ApiError(400, 'endDate cannot be earlier than startDate')
  }
}
