const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/

// Calendar dates are handled as plain YYYY-MM-DD strings so a selected day
// never shifts because of a timezone conversion.
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

export function formatDateOnly(value) {
  if (!isValidDateOnly(value)) return value || ''

  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

export function getTodayDateOnly() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function validateDateRange(startDate, endDate) {
  const errors = {}

  if (!startDate) {
    errors.startDate = 'Start date is required'
  } else if (!isValidDateOnly(startDate)) {
    errors.startDate = 'Enter a valid start date'
  }

  if (!endDate) {
    errors.endDate = 'End date is required'
  } else if (!isValidDateOnly(endDate)) {
    errors.endDate = 'Enter a valid end date'
  }

  if (!errors.startDate && !errors.endDate && endDate < startDate) {
    errors.endDate = 'End date cannot be before the start date'
  }

  return errors
}
