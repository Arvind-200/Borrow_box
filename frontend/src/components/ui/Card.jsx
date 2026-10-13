export function Card({ children, className = '', hover = false, padding = 'p-6' }) {
  return (
    <div
      className={`
        bg-white rounded-2xl border border-neutral-200 shadow-card
        ${hover ? 'hover:shadow-elevated hover:-translate-y-0.5 transition-all duration-300 cursor-pointer' : ''}
        ${padding} ${className}
      `}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className = '' }) {
  return (
    <div className={`mb-4 ${className}`}>
      {children}
    </div>
  )
}

export function CardTitle({ children, className = '' }) {
  return (
    <h3 className={`text-lg font-semibold text-navy-900 font-display ${className}`}>
      {children}
    </h3>
  )
}

export function CardDescription({ children, className = '' }) {
  return (
    <p className={`mt-1 text-sm text-neutral-500 ${className}`}>
      {children}
    </p>
  )
}

export function CardContent({ children, className = '' }) {
  return (
    <div className={className}>
      {children}
    </div>
  )
}

export function CardFooter({ children, className = '' }) {
  return (
    <div className={`mt-4 pt-4 border-t border-neutral-200 flex items-center gap-3 ${className}`}>
      {children}
    </div>
  )
}