export function Badge({ children, variant = 'default', size = 'md', className = '', icon = null }) {
  const variants = {
    default: 'bg-neutral-100 text-neutral-700 border border-neutral-200',
    primary: 'bg-primary-50 text-primary-700 border border-primary-100',
    success: 'bg-success-50 text-success-700 border border-success-100',
    warning: 'bg-warning-50 text-warning-700 border border-warning-100',
    danger: 'bg-error-50 text-error-700 border border-error-100',
    info: 'bg-primary-50 text-primary-700 border border-primary-100',
    outline: 'bg-transparent text-neutral-600 border border-neutral-300 hover:bg-neutral-50',
    subtle: 'bg-neutral-50 text-neutral-600 border border-neutral-200',
  }

  const sizes = {
    xs: 'px-2 py-0.5 text-xs gap-1',
    sm: 'px-2.5 py-1 text-xs gap-1.5',
    md: 'px-3 py-1 text-sm gap-1.5',
    lg: 'px-4 py-1.5 text-base gap-2',
  }

  return (
    <span
      className={`
        inline-flex items-center font-medium rounded-full border
        ${variants[variant] || variants.default}
        ${sizes[size] || sizes.md}
        ${className}
      `}
    >
      {icon && <span className="flex-shrink-0" aria-hidden="true">{icon}</span>}
      <span className="truncate">{children}</span>
    </span>
  )
}