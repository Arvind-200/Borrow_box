export function StarRating({ rating = 0, maxRating = 5, size = 'md', showRating = true, showCount = false, reviewCount = 0, className = '' }) {
  const sizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  }

  const starSize = sizes[size] || sizes.md

  const fullStars = Math.floor(rating)
  const hasHalfStar = rating % 1 >= 0.5
  const emptyStars = maxRating - fullStars - (hasHalfStar ? 1 : 0)

  const stars = []

  for (let i = 0; i < fullStars; i++) {
    stars.push(
      <svg key={`full-${i}`} className={`${starSize} text-yellow-400 fill-current`} viewBox="0 0 20 20" aria-hidden="true">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    )
  }

  if (hasHalfStar) {
    stars.push(
      <svg key="half" className={`${starSize} text-yellow-400`} viewBox="0 0 20 20" aria-hidden="true">
        <defs>
          <linearGradient id="halfStarGradient" x1="0" y1="0" x2="100%" y2="0">
            <stop offset="50%" stopColor="currentColor" />
            <stop offset="50%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path fill="url(#halfStarGradient)" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    )
  }

  for (let i = 0; i < emptyStars; i++) {
    stars.push(
      <svg key={`empty-${i}`} className={`${starSize} text-neutral-300 fill-current`} viewBox="0 0 20 20" aria-hidden="true">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    )
  }

  return (
    <div className={`flex items-center gap-1 ${className}`} aria-label={`Rating: ${rating} out of ${maxRating} stars`}>
      <div className="flex items-center" role="img" aria-label={`${rating} out of ${maxRating} stars`}>
        {stars}
      </div>
      {showRating && (
        <span className="ml-1.5 text-sm font-semibold text-navy-900">{rating.toFixed(1)}</span>
      )}
      {showCount && reviewCount > 0 && (
        <span className="ml-1 text-sm text-neutral-500">({reviewCount})</span>
      )}
    </div>
  )
}