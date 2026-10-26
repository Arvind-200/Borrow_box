import { Button } from './Button'

export function ErrorState({
  title = 'Something went wrong',
  message = 'We could not load this content. Please try again.',
  onRetry,
  retryLabel = 'Try again',
  className = '',
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-2xl border border-neutral-200 bg-white px-4 py-14 text-center shadow-card ${className}`}
      role="alert"
    >
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-error-50 text-error-600">
        <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        </svg>
      </div>
      <h2 className="font-display text-xl font-semibold text-navy-900">{title}</h2>
      <p className="mt-2 max-w-md text-[15px] text-neutral-500">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} className="mt-6">
          {retryLabel}
        </Button>
      )}
    </div>
  )
}
