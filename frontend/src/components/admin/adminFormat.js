export function formatAdminNumber(value) {
  return new Intl.NumberFormat().format(value ?? 0)
}

export function formatAdminCurrency(value) {
  return `₹${new Intl.NumberFormat('en-IN').format(value ?? 0)}`
}

export function formatAdminDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatAdminDateTime(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function formatAdminRelative(value) {
  if (!value) return '—'
  const diff = Date.now() - new Date(value).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return formatAdminDate(value)
}

export function reportTargetLabel(report) {
  const target = report?.target
  if (!target) return report?.targetType || 'Unknown target'
  if (target.missing) return 'Deleted content'
  if (target.title) return target.title
  if (target.name) return target.name
  if (target.reviewerName) return `Review by ${target.reviewerName}`
  return report.targetType || 'Unknown target'
}

export function titleCase(value) {
  if (!value) return ''
  return String(value)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase())
}
