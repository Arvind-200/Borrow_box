import { ProductCard } from './ProductCard'
import { ProductCardSkeleton } from './ProductCardSkeleton'

export function ProductGrid({
  products = [],
  isLoading = false,
  skeletonCount = 8,
  onViewDetails,
  onSave,
  className = '',
  emptyMessage = 'No items found',
  emptyDescription = 'Try adjusting your filters or search terms.',
}) {
  if (isLoading) {
    return (
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 ${className}`} role="list" aria-label="Loading products">
        {[...Array(skeletonCount)].map((_, index) => (
          <ProductCardSkeleton key={index} />
        ))}
      </div>
    )
  }

  if (!products || products.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center py-16 px-4 ${className}`} role="status">
        <div className="w-16 h-16 rounded-2xl bg-neutral-100 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-neutral-900 mb-1">{emptyMessage}</h3>
        <p className="text-neutral-500 text-center max-w-sm">{emptyDescription}</p>
      </div>
    )
  }

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 ${className}`} role="list" aria-label="Products">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onViewDetails={onViewDetails}
          onSave={onSave}
        />
      ))}
    </div>
  )
}