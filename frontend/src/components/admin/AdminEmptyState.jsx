import { AdminIcon } from './AdminIcon'

export function AdminEmptyState({
  icon = 'search',
  title = 'Nothing to show',
  message = 'There are no records matching the current filters.',
  action,
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F1F5F9] text-[#64748B]">
        <AdminIcon name={icon} className="h-6 w-6" />
      </span>
      <h3 className="mt-4 font-display text-base font-semibold text-[#0F1626]">
        {title}
      </h3>
      <p className="mt-1.5 max-w-sm text-sm text-[#64748B]">{message}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
