import { AdminIcon } from './AdminIcon'

const TONES = {
  primary: 'bg-primary-50 text-primary-700',
  navy: 'bg-[#E8EDF5] text-[#334155]',
  amber: 'bg-amber-50 text-amber-700',
  rose: 'bg-rose-50 text-rose-700',
  sky: 'bg-sky-50 text-sky-700',
}

export function AdminStatCard({
  label,
  value,
  sublabel,
  icon = 'dashboard',
  tone = 'primary',
  trend,
}) {
  return (
    <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
            {label}
          </p>
          <p className="mt-2 font-display text-3xl font-bold tracking-tight text-[#0F1626]">
            {value}
          </p>
        </div>
        <span
          className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${TONES[tone] || TONES.primary}`}
        >
          <AdminIcon name={icon} className="h-5 w-5" />
        </span>
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs text-[#64748B]">
        {trend && (
          <span className="font-semibold text-primary-700">{trend}</span>
        )}
        {sublabel && <span className="truncate">{sublabel}</span>}
      </div>
    </div>
  )
}
