import { Link, useNavigate } from 'react-router-dom'
import { StarRating } from '../ui/StarRating'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { getCategoryGradient, ProductCategoryIcon } from './productVisuals'

export function ProductCard({ product, onSave, className = '' }) {
  const navigate = useNavigate()

  const categoryName = product.category?.name || 'Uncategorized'
  const title = product.title || product.name || 'Untitled item'
  const image = product.images?.[0] || product.image
  const rentPerDay = product.rentPerDay ?? product.price ?? 0
  const rating = Number(product.rating?.average ?? product.rating ?? 0)
  const reviewCount = Number(product.rating?.count ?? product.reviewCount ?? 0)
  const isAvailable = String(product.availability || 'available').toLowerCase() === 'available'
  const availabilityLabel = isAvailable ? 'Available' : 'Unavailable'
  const placeholderGradient = getCategoryGradient(categoryName)
  const productPath = `/products/${product.id}`

  const handleCardClick = () => navigate(productPath)

  const handleSaveClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (onSave) onSave(product.id)
  }

  return (
    <article
      className={`
        group bg-white rounded-2xl border border-neutral-200 shadow-card
        hover:shadow-elevated hover:-translate-y-1 hover:border-primary-200 transition-all duration-300 cursor-pointer
        overflow-hidden flex flex-col h-full
        ${className}
      `}
      onClick={handleCardClick}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100">
        {image ? (
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ background: placeholderGradient }}>
            <div className="w-16 h-16 rounded-2xl bg-white/25 backdrop-blur-sm flex items-center justify-center text-white">
              <ProductCategoryIcon category={categoryName} className="w-7 h-7" />
            </div>
          </div>
        )}

        <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
          <Badge variant="primary" size="sm" className="font-medium">
            {categoryName}
          </Badge>
          {onSave && (
            <button
              onClick={handleSaveClick}
              className="p-2 rounded-full bg-white/95 backdrop-blur-sm text-neutral-500 hover:text-error-600 hover:bg-white transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              aria-label={`Save ${title} to wishlist`}
              aria-pressed="false"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>
          )}
        </div>

        {product.tags && product.tags.length > 0 && (
          <div className="absolute bottom-3 left-3 flex gap-2">
            {product.tags.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="subtle" size="xs" className="font-medium">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 sm:p-5 flex flex-col flex-1">
        <Link
          to={productPath}
          onClick={(e) => e.stopPropagation()}
          className="block rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
        >
          <h3 className="font-semibold text-navy-900 line-clamp-1 group-hover:text-primary-600 transition-colors">
            {title}
          </h3>
        </Link>

        <div className="mt-3 flex items-center gap-2">
          <StarRating
            rating={rating}
            size="sm"
            showRating={reviewCount > 0}
            showCount={reviewCount > 0}
            reviewCount={reviewCount}
          />
          {reviewCount === 0 && (
            <span className="text-sm text-neutral-500">No reviews yet</span>
          )}
        </div>

        <div className="mt-2 flex items-center gap-2 text-sm text-neutral-500">
          <svg className="w-4 h-4 flex-shrink-0 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="truncate">{product.location || 'Location not specified'}</span>
        </div>

        <div className="mt-4 flex items-center justify-between gap-2">
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-navy-900">₹{rentPerDay}</span>
            <span className="text-sm text-neutral-500">/day</span>
          </div>
          <Badge
            variant={isAvailable ? 'success' : 'warning'}
            size="sm"
            icon={
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 8 8">
                <circle cx="4" cy="4" r="4" />
              </svg>
            }
          >
            {availabilityLabel}
          </Badge>
        </div>

        <div className="mt-4 pt-4 border-t border-neutral-200">
          <Link
            to={productPath}
            onClick={(e) => e.stopPropagation()}
            className="w-full"
          >
            <Button variant="outline" className="w-full" size="md">
              View Details
            </Button>
          </Link>
        </div>
      </div>
    </article>
  )
}
