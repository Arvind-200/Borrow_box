import { forwardRef } from 'react'

export const Input = forwardRef(function Input({
  label,
  error,
  helperText,
  className = '',
  id,
  ...props
}, ref) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-navy-900 mb-1.5">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={`
          w-full px-4 py-2.5 rounded-xl border transition-all duration-200
          bg-white text-navy-900 placeholder:text-neutral-400
          focus:outline-none focus:ring-2 focus:ring-offset-0
          disabled:bg-neutral-100 disabled:text-neutral-500 disabled:cursor-not-allowed
          ${error
            ? 'border-error-500 focus:ring-error-500 focus:border-error-500'
            : 'border-neutral-200 focus:ring-primary-500 focus:border-primary-500'
          }
          ${className}
        `}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
        {...props}
      />
      {error && (
        <p id={`${inputId}-error`} className="mt-1.5 text-sm text-error-600" role="alert">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p id={`${inputId}-helper`} className="mt-1.5 text-sm text-neutral-500">
          {helperText}
        </p>
      )}
    </div>
  )
})

Input.displayName = 'Input'