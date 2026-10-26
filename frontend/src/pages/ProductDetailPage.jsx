import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { api } from '../services/api'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../components/ui/Toast.jsx'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { ErrorState } from '../components/ui/ErrorState'
import { StarRating } from '../components/ui/StarRating'
import { ProductCategoryIcon, getCategoryGradient } from '../components/product/productVisuals'

const conditionLabels = {
  new: 'New',
  'like-new': 'Like new',
  good: 'Good',
  fair: 'Fair',
}

export default function ProductDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, isAuthLoading } = useAuth()
  const toast = useToast()
  const [product, setProduct] = useState(null)
  const [activeImage, setActiveImage] = useState('')
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let active = true
    setStatus('loading')
    setError(null)
    setProduct(null)

    api.getProduct(id)
      .then((data) => {
        if (!active) return
        setProduct(data.product)
        setActiveImage(data.product.images?.[0] || '')
        setStatus('success')
      })
      .catch((err) => {
        if (!active) return
        setError({ message: err.message, status: err.status })
        setStatus('error')
      })

    return () => {
      active = false
    }
  }, [id, reloadKey])

  if (status === 'loading') {
    return (
      <div className="bg-[#F8FAFC]">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
          <div className="h-4 w-48 animate-pulse rounded bg-neutral-200" />
          <div className="mt-6 grid gap-8 lg:grid-cols-2">
            <div className="aspect-[4/3] animate-pulse rounded-3xl bg-neutral-200" />
            <div className="space-y-4">
              <div className="h-6 w-28 animate-pulse rounded-full bg-neutral-200" />
              <div className="h-10 w-3/4 animate-pulse rounded bg-neutral-200" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-neutral-200" />
              <div className="h-28 animate-pulse rounded-2xl bg-neutral-200" />
              <div className="h-14 animate-pulse rounded-2xl bg-neutral-200" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    const notFound = error?.status === 400 || error?.status === 404
    return (
      <div className="bg-[#F8FAFC]">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
          <ErrorState
            title={notFound ? 'Listing not found' : 'Unable to load this listing'}
            message={
              notFound
                ? 'This listing may have been removed or the link is no longer valid.'
                : error?.message || 'Please check your connection and try again.'
            }
            onRetry={notFound ? undefined : () => setReloadKey((key) => key + 1)}
          />
          <div className="mt-6 text-center">
            <Link to="/browse">
              <Button variant="outline">Back to Browse</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!product) return null

  const categoryName = product.category?.name || 'Uncategorized'
  const categorySlug = product.category?.slug || product.category?.id
  const isAvailable = product.availability === 'available'
  const ratingAverage = Number(product.rating?.average || 0)
  const reviewCount = Number(product.rating?.count || 0)
  const ownerName = product.owner?.name || 'BorrowBox member'
  const listedDate = product.createdAt
    ? new Date(product.createdAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : null

  const handleBorrowRequest = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location.pathname } })
      return
    }

    toast.info(
      'Borrow requests are coming soon',
      'The request flow will be enabled in the next phase. You can keep browsing listings for now.'
    )
  }

  return (
    <div className="bg-[#F8FAFC]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <nav className="flex flex-wrap items-center gap-2 text-sm text-neutral-500" aria-label="Breadcrumb">
          <Link to="/" className="rounded hover:text-primary-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500">
            Home
          </Link>
          <span aria-hidden="true">/</span>
          <Link to="/browse" className="rounded hover:text-primary-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500">
            Browse
          </Link>
          {categorySlug && (
            <>
              <span aria-hidden="true">/</span>
              <Link
                to={`/browse?category=${encodeURIComponent(categorySlug)}`}
                className="rounded hover:text-primary-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              >
                {categoryName}
              </Link>
            </>
          )}
          <span aria-hidden="true">/</span>
          <span className="max-w-[14rem] truncate font-medium text-navy-900">{product.title}</span>
        </nav>

        <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-10">
          <section aria-label="Product images">
            <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-card">
              {activeImage ? (
                <img src={activeImage} alt={product.title} className="h-full w-full object-cover" />
              ) : (
                <div
                  className="flex h-full w-full items-center justify-center"
                  style={{ background: getCategoryGradient(categoryName) }}
                >
                  <div className="flex h-28 w-28 items-center justify-center rounded-3xl bg-white/20 text-white backdrop-blur-sm">
                    <ProductCategoryIcon category={categoryName} className="h-14 w-14" />
                  </div>
                </div>
              )}
              <div className="absolute left-4 top-4">
                <Badge variant="primary" size="sm">
                  {categoryName}
                </Badge>
              </div>
            </div>

            {product.images?.length > 1 && (
              <div className="mt-4 grid grid-cols-4 gap-3">
                {product.images.map((image, index) => (
                  <button
                    key={image}
                    type="button"
                    onClick={() => setActiveImage(image)}
                    className={`aspect-square overflow-hidden rounded-xl border-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
                      activeImage === image ? 'border-primary-500' : 'border-neutral-200 hover:border-neutral-300'
                    }`}
                    aria-label={`Show product image ${index + 1}`}
                    aria-pressed={activeImage === image}
                  >
                    <img src={image} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </section>

          <section aria-labelledby="product-title">
            <div className="flex flex-wrap items-center gap-2">
              {categorySlug && (
                <Link
                  to={`/browse?category=${encodeURIComponent(categorySlug)}`}
                  className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                >
                  <Badge variant="primary" size="sm">{categoryName}</Badge>
                </Link>
              )}
              <Badge variant={isAvailable ? 'success' : 'warning'} size="sm">
                {isAvailable ? 'Available' : 'Unavailable'}
              </Badge>
              <Badge variant="subtle" size="sm">
                {conditionLabels[product.condition] || 'Condition not listed'}
              </Badge>
            </div>

            <h1 id="product-title" className="mt-4 font-display text-3xl font-bold tracking-tight text-navy-900 sm:text-4xl">
              {product.title}
            </h1>

            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
              <StarRating
                rating={ratingAverage}
                size="md"
                showRating={reviewCount > 0}
                showCount={reviewCount > 0}
                reviewCount={reviewCount}
              />
              {reviewCount === 0 && <span className="text-sm text-neutral-500">No reviews yet</span>}
              <span className="inline-flex items-center gap-1.5 text-sm text-neutral-500">
                <svg className="h-4 w-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {product.location}
              </span>
            </div>

            <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-6 shadow-card">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-neutral-500">Rent per day</p>
                  <p className="mt-1 flex items-baseline gap-1 text-navy-900">
                    <span className="text-4xl font-bold">₹{product.rentPerDay}</span>
                    <span className="text-base text-neutral-500">/day</span>
                  </p>
                </div>
                {product.owner && (
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-50 font-semibold text-primary-700">
                      {ownerName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wider text-neutral-400">Listed by</p>
                      <p className="text-sm font-semibold text-navy-900">{ownerName}</p>
                    </div>
                  </div>
                )}
              </div>

              <Button
                size="lg"
                className="mt-6 w-full"
                onClick={handleBorrowRequest}
                disabled={!isAvailable}
                loading={isAuthLoading}
              >
                {!isAvailable
                  ? 'Currently unavailable'
                  : isAuthenticated
                    ? 'Request to Borrow'
                    : 'Log in to request'}
              </Button>

              <p className="mt-3 text-center text-sm text-neutral-500">
                {isAuthenticated
                  ? 'The owner will review your request before pickup.'
                  : 'Sign in to send a borrow request to the owner.'}
              </p>
            </div>

            <div className="mt-6">
              <h2 className="font-display text-xl font-semibold text-navy-900">About this item</h2>
              <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-neutral-600">
                {product.description}
              </p>
            </div>

            {product.tags?.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2">
                {product.tags.map((tag) => (
                  <Badge key={tag} variant="subtle" size="sm">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            <dl className="mt-6 grid grid-cols-2 gap-4 rounded-2xl border border-neutral-200 bg-white p-5 text-sm shadow-card">
              <div>
                <dt className="text-neutral-500">Condition</dt>
                <dd className="mt-1 font-semibold text-navy-900">{conditionLabels[product.condition] || 'Not listed'}</dd>
              </div>
              <div>
                <dt className="text-neutral-500">Pickup area</dt>
                <dd className="mt-1 font-semibold text-navy-900">{product.location}</dd>
              </div>
              <div>
                <dt className="text-neutral-500">Category</dt>
                <dd className="mt-1 font-semibold text-navy-900">{categoryName}</dd>
              </div>
              {listedDate && (
                <div>
                  <dt className="text-neutral-500">Listed on</dt>
                  <dd className="mt-1 font-semibold text-navy-900">{listedDate}</dd>
                </div>
              )}
            </dl>
          </section>
        </div>
      </div>
    </div>
  )
}
