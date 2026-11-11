import { AdminIcon } from './AdminIcon'
import { adminInputClass } from './adminStyles'

export function AdminToolbar({ children, className = '' }) {
  return (
    <div
      className={`flex flex-col gap-3 border-b border-[#E2E8F0] bg-white px-4 py-3.5 lg:flex-row lg:items-center lg:justify-between ${className}`}
    >
      {children}
    </div>
  )
}

export function AdminSearchForm({
  value,
  onChange,
  onSubmit,
  placeholder = 'Search...',
  className = '',
}) {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit?.()
      }}
      className={`relative w-full max-w-sm ${className}`}
      role="search"
    >
      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[#94A3B8]">
        <AdminIcon name="search" className="h-4 w-4" />
      </span>
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className={`${adminInputClass} pl-9`}
      />
    </form>
  )
}

export function AdminSelect({
  value,
  onChange,
  options,
  ariaLabel,
  className = '',
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      aria-label={ariaLabel}
      className={`${adminInputClass} w-auto min-w-[10rem] cursor-pointer py-2.5 pr-8 ${className}`}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
}

export function AdminFilterGroup({ children, className = '' }) {
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {children}
    </div>
  )
}
