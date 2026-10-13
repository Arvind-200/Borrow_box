export function LoadingSpinner({ size = 'md', className = '' }) {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  }

  return (
    <svg
      className={`${sizes[size]} animate-spin text-primary-600 ${className}`}
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
        fill="none"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  )
}

export function LoadingOverlay({ message = 'Loading...' }) {
  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-4">
      <LoadingSpinner size="lg" />
      <p className="text-gray-600 font-medium">{message}</p>
    </div>
  )
}

export function Skeleton({ className = '', variant = 'text', width, height }) {
  const baseStyles = 'animate-pulse bg-gray-200 rounded'

  if (variant === 'circular') {
    return (
      <div
        className={`${baseStyles} rounded-full ${className}`}
        style={{ width: width || '40px', height: height || '40px' }}
      />
    )
  }

  if (variant === 'rectangular') {
    return (
      <div
        className={`${baseStyles} ${className}`}
        style={{ width: width || '100%', height: height || '200px' }}
      />
    )
  }

  return (
    <div
      className={`${baseStyles} h-4 ${className}`}
      style={{ width: width || '100%' }}
    />
  )
}

export function CardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-card p-6 animate-pulse space-y-4">
      <Skeleton variant="rectangular" height="200px" />
      <div className="space-y-3">
        <Skeleton width="70%" />
        <Skeleton width="50%" />
        <Skeleton width="90%" />
      </div>
      <div className="flex items-center gap-3 pt-4">
        <Skeleton variant="circular" width="40px" height="40px" />
        <div className="space-y-2 flex-1">
          <Skeleton width="80px" />
          <Skeleton width="60px" />
        </div>
      </div>
    </div>
  )
}

export function TableSkeleton({ rows = 5, columns = 4 }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-card overflow-hidden animate-pulse">
      <div className="p-4 border-b border-gray-100">
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {[...Array(columns)].map((_, i) => (
            <Skeleton key={i} width="80%" />
          ))}
        </div>
      </div>
      <div className="divide-y divide-gray-100">
        {[...Array(rows)].map((_, rowIndex) => (
          <div key={rowIndex} className="p-4">
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
              {[...Array(columns)].map((_, colIndex) => (
                <Skeleton key={colIndex} width="90%" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}