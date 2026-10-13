import { Link } from 'react-router-dom'
import { StarRating } from '../ui/StarRating'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'

const productPlaceholders = {
  Electronics: 'linear-gradient(135deg, #60A5FA, #3B82F6)',
  Cameras: 'linear-gradient(135deg, #C084FC, #F472B6)',
  Tools: 'linear-gradient(135deg, #FBBF24, #F97316)',
  Gaming: 'linear-gradient(135deg, #34D399, #14B8A6)',
  Outdoor: 'linear-gradient(135deg, #34D399, #059669)',
  'Events & Party': 'linear-gradient(135deg, #FB7185, #F472B6)',
  Sports: 'linear-gradient(135deg, #818CF8, #60A5FA)',
  'Home & Utility': 'linear-gradient(135deg, #94A3B8, #64748B)',
}

const categoryIcons = {
  Electronics: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
  ),
  Cameras: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
  ),
  Tools: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
  ),
  Gaming: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
  ),
  Outdoor: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
  ),
  'Events & Party': (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
  ),
  Sports: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
  ),
  'Home & Utility': (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
  ),
}

export function ProductCard({ product, onViewDetails, onSave, className = '' }) {
  const placeholderGradient = productPlaceholders[product.category] || 'linear-gradient(135deg, #34D399, #059669)'
  const categoryIcon = categoryIcons[product.category] || (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
  )

  const handleSaveClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (onSave) onSave(product.id)
  }

  const handleViewDetailsClick = (e) => {
    e.preventDefault()
    if (onViewDetails) onViewDetails(product.id)
  }

  return (
    <article
      className={`
        group bg-white rounded-2xl border border-neutral-200 shadow-card
        hover:shadow-elevated hover:-translate-y-1 hover:border-primary-200 transition-all duration-300 cursor-pointer
        overflow-hidden flex flex-col h-full
        ${className}
      `}
      onClick={onViewDetails ? () => onViewDetails(product.id) : undefined}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ background: placeholderGradient }}>
            <div className="w-16 h-16 rounded-2xl bg-white/25 backdrop-blur-sm flex items-center justify-center text-white">
              {categoryIcon}
            </div>
          </div>
        )}

        <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
          <Badge variant="primary" size="sm" className="font-medium">
            {product.category}
          </Badge>
          <button
            onClick={handleSaveClick}
            className="p-2 rounded-full bg-white/95 backdrop-blur-sm text-neutral-500 hover:text-error-600 hover:bg-white transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            aria-label={`Save ${product.name} to wishlist`}
            aria-pressed="false"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
        </div>

        {product.tags && product.tags.length > 0 && (
          <div className="absolute bottom-3 left-3 flex gap-2">
            {product.tags.map((tag) => (
              <Badge key={tag} variant="subtle" size="xs" className="font-medium">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 sm:p-5 flex flex-col flex-1">
        <Link to={`/products/${product.id}`} onClick={handleViewDetailsClick} className="block rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500">
          <h3 className="font-semibold text-navy-900 line-clamp-1 group-hover:text-primary-600 transition-colors">
            {product.name}
          </h3>
        </Link>

        <div className="mt-3 flex items-center gap-2">
          <StarRating rating={product.rating} size="sm" showRating showCount reviewCount={product.reviewCount} />
        </div>

        <div className="mt-2 flex items-center gap-2 text-sm text-neutral-500">
          <svg className="w-4 h-4 flex-shrink-0 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="truncate">{product.location}</span>
          {product.distance && (
            <>
              <span className="text-neutral-300">·</span>
              <span>{product.distance}</span>
            </>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between gap-2">
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-navy-900">₹{product.price}</span>
            <span className="text-sm text-neutral-500">/day</span>
          </div>
          <Badge
            variant={product.availability === 'Available' ? 'success' : 'warning'}
            size="sm"
            icon={
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 8 8">
                <circle cx="4" cy="4" r="4" />
              </svg>
            }
          >
            {product.availability}
          </Badge>
        </div>

        <div className="mt-4 pt-4 border-t border-neutral-200">
          <Link
            to={`/products/${product.id}`}
            onClick={handleViewDetailsClick}
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