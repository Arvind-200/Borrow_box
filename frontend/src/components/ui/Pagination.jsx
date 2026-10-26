export function Pagination({ page, totalPages, onPageChange, className = '' }) {
  if (!totalPages || totalPages <= 1) return null

  const canGoPrevious = page > 1
  const canGoNext = page < totalPages

  return (
    <nav className={`flex flex-wrap items-center justify-center gap-3 ${className}`} aria-label="Product pagination">
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={!canGoPrevious}
        className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-navy-900 shadow-sm transition-colors hover:border-neutral-300 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Previous
      </button>

      <span className="px-2 text-sm font-medium text-neutral-500" aria-live="polite">
        Page <span className="font-semibold text-navy-900">{page}</span> of {totalPages}
      </span>

      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={!canGoNext}
        className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-navy-900 shadow-sm transition-colors hover:border-neutral-300 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
      >
        Next
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </nav>
  )
}
