import { adminTableWrapper } from './adminStyles.js'

export function AdminTableScroll({ label, children }) {
  return (
    <div
      className={adminTableWrapper}
      role="region"
      aria-label={label}
      tabIndex={0}
    >
      {children}
    </div>
  )
}
