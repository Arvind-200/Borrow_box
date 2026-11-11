const TONES = {
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  warning: 'bg-amber-50 text-amber-700 ring-amber-200',
  danger: 'bg-rose-50 text-rose-700 ring-rose-200',
  info: 'bg-sky-50 text-sky-700 ring-sky-200',
  neutral: 'bg-slate-100 text-slate-600 ring-slate-200',
}

const DOTS = {
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-rose-500',
  info: 'bg-sky-500',
  neutral: 'bg-slate-400',
}

export function AdminStatusBadge({ label, tone = 'neutral', dot = true }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${TONES[tone] || TONES.neutral}`}
    >
      {dot && (
        <span
          className={`h-1.5 w-1.5 rounded-full ${DOTS[tone] || DOTS.neutral}`}
          aria-hidden="true"
        />
      )}
      {label}
    </span>
  )
}

export function userStatusTone(status) {
  return status === 'blocked' ? 'danger' : 'success'
}

export function roleTone(role) {
  return role === 'admin' ? 'info' : 'neutral'
}

export function productStatusTone(status) {
  if (status === 'hidden') return 'warning'
  if (status === 'removed') return 'danger'
  return 'success'
}

export function availabilityTone(availability) {
  return availability === 'available' ? 'success' : 'neutral'
}

export function requestStatusTone(status) {
  if (status === 'Pending') return 'warning'
  if (status === 'Accepted') return 'info'
  if (status === 'Completed') return 'success'
  if (status === 'Rejected') return 'danger'
  return 'neutral'
}

export function reportStatusTone(status) {
  if (status === 'Open') return 'warning'
  if (status === 'Resolved') return 'success'
  return 'neutral'
}

export function reviewStatusTone(status) {
  if (status === 'hidden') return 'warning'
  if (status === 'removed') return 'danger'
  return 'success'
}
