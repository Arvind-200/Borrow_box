export function AdminPageHeader({ eyebrow, title, description, actions }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && (
          <span className="inline-flex items-center rounded-full bg-primary-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary-700">
            {eyebrow}
          </span>
        )}
        <h1 className="mt-2 font-display text-2xl font-bold tracking-tight text-[#0F1626] sm:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="mt-1.5 max-w-2xl text-sm text-[#64748B]">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}
