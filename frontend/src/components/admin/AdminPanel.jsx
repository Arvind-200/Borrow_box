import { adminCard } from './adminStyles'

export function AdminPanel({
  title,
  description,
  actions,
  children,
  className = '',
  bodyClassName = '',
  flush = false,
}) {
  return (
    <section className={`${adminCard} overflow-hidden ${className}`}>
      {(title || actions) && (
        <div className="flex flex-col gap-3 border-b border-[#E2E8F0] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {title && (
              <h2 className="font-display text-[15px] font-semibold text-[#0F1626]">
                {title}
              </h2>
            )}
            {description && (
              <p className="mt-0.5 text-xs text-[#64748B]">{description}</p>
            )}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={flush ? bodyClassName : `p-5 ${bodyClassName}`}>
        {children}
      </div>
    </section>
  )
}
