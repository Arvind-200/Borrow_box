import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../services/api'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { ErrorState } from '../components/ui/ErrorState'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../components/ui/Toast.jsx'
import {
  ProductCategoryIcon,
  getCategoryGradient,
} from '../components/product/productVisuals'

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'published', label: 'Published' },
  { value: 'unpublished', label: 'Unpublished' },
]

function formatDate(value) {
  if (!value) return null
  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function ListingSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-card">
      <div className="flex flex-col sm:flex-row">
        <div className="h-40 animate-pulse bg-neutral-200 sm:h-auto sm:w-40 sm:flex-shrink-0" />
        <div className="flex-1 space-y-4 p-5">
          <div className="flex gap-2">
            <div className="h-6 w-20 animate-pulse rounded-full bg-neutral-100" />
            <div className="h-6 w-24 animate-pulse rounded-full bg-neutral-100" />
          </div>
          <div className="h-6 w-3/4 animate-pulse rounded bg-neutral-200" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-neutral-100" />
          <div className="flex gap-2 pt-4">
            <div className="h-9 w-20 animate-pulse rounded-lg bg-neutral-100" />
            <div className="h-9 w-24 animate-pulse rounded-lg bg-neutral-100" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function MyProductsPage() {
  const { refresh } = useAuth()
  const toast = useToast()

  const [products, setProducts] = useState([])
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [filter, setFilter] = useState('all')
  const [pendingId, setPendingId] = useState(null)

  useEffect(() => {
    let active = true
    setStatus('loading')
    setError('')

    api.getMyProducts()
      .then((data) => {
        if (!active) return
        setProducts(data.products || [])
        setStatus('success')
      })
      .catch(async (err) => {
        if (!active) return
        if (err.status === 401) {
          try {
            await refresh()
            if (!active) return
            setError('Your session could not be verified. Please try again.')
          } catch {
            if (!active) return
            setError('Your session has expired. Please log in again.')
          }
          setStatus('error')
          return
        }
        setError(err.message || 'Unable to load your listings.')
        setStatus('error')
      })

    return () => {
      active = false
    }
  }, [refresh, reloadKey])

  const counts = useMemo(() => {
    const published = products.filter((product) => product.isPublished).length
    return {
      all: products.length,
      published,
      unpublished: products.length - published,
    }
  }, [products])

  const filteredProducts = useMemo(() => {
    if (filter === 'published') return products.filter((product) => product.isPublished)
    if (filter === 'unpublished') return products.filter((product) => !product.isPublished)
    return products
  }, [filter, products])

  const handlePublication = async (product) => {
    const nextPublished = !product.isPublished
    setPendingId(product.id)

    try {
      const data = await api.setProductPublication(product.id, nextPublished)
      setProducts((current) =>
        current.map((item) => (item.id === product.id ? data.product : item))
      )
      toast.success(
        nextPublished ? 'Listing published' : 'Listing unpublished',
        nextPublished
          ? 'Your item is now visible in Browse and search.'
          : 'Your item is hidden from Browse and search. You can publish it again anytime.'
      )
    } catch (err) {
      if (err.status === 401) {
        try {
          await refresh()
          toast.error('Could not verify your session', 'Please try again.')
        } catch {
          toast.error('Your session has expired', 'Please log in again.')
        }
        return
      }
      toast.error(
        nextPublished ? 'Could not publish listing' : 'Could not unpublish listing',
        err.message || 'Please try again.'
      )
    } finally {
      setPendingId(null)
    }
  }

  return (
    <div className="bg-[#F8FAFC]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="inline-flex items-center rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary-700">
              My Products
            </span>
            <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-navy-900 sm:text-4xl">
              Manage your listings
            </h1>
            <p className="mt-2 max-w-2xl text-base text-neutral-500">
              Create, update, and control what appears in BorrowBox. Unpublished listings stay private to you.
            </p>
          </div>
          <Link to="/products/new" className="w-full sm:w-auto">
            <Button size="lg" className="w-full sm:w-auto">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              List an Item
            </Button>
          </Link>
        </div>

        {status === 'success' && products.length > 0 && (
          <div className="mt-8 flex flex-wrap items-center gap-2" aria-label="Filter listings">
            {FILTERS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setFilter(option.value)}
                aria-pressed={filter === option.value}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
                  filter === option.value
                    ? 'border-primary-200 bg-primary-50 text-primary-700'
                    : 'border-neutral-200 bg-white text-neutral-500 hover:border-neutral-300 hover:text-navy-900'
                }`}
              >
                {option.label}
                <span className="text-xs text-neutral-400">{counts[option.value]}</span>
              </button>
            ))}
          </div>
        )}

        {status === 'loading' && (
          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            {[...Array(4)].map((_, index) => (
              <ListingSkeleton key={index} />
            ))}
          </div>
        )}

        {status === 'error' && (
          <div className="mt-8">
            <ErrorState
              title="Unable to load your listings"
              message={error}
              onRetry={() => setReloadKey((key) => key + 1)}
            />
          </div>
        )}

        {status === 'success' && products.length === 0 && (
          <div className="mt-8 rounded-2xl border border-neutral-200 bg-white px-6 py-16 text-center shadow-card">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-50 text-primary-600">
              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h2 className="mt-5 font-display text-2xl font-semibold text-navy-900">No products yet</h2>
            <p className="mx-auto mt-2 max-w-md text-[15px] text-neutral-500">
              You have not listed any items. Add your first listing to start lending to people nearby.
            </p>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link to="/products/new" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto">List an Item</Button>
              </Link>
              <Link to="/browse" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="w-full bg-white sm:w-auto">Browse Items</Button>
              </Link>
            </div>
          </div>
        )}

        {status === 'success' && products.length > 0 && filteredProducts.length === 0 && (
          <div className="mt-8 rounded-2xl border border-neutral-200 bg-white px-6 py-14 text-center shadow-card">
            <h2 className="font-display text-xl font-semibold text-navy-900">
              No {filter} listings
            </h2>
            <p className="mx-auto mt-2 max-w-md text-[15px] text-neutral-500">
              {filter === 'published'
                ? 'Publish a listing from the Unpublished tab to make it visible to borrowers.'
                : 'Every listing is currently published. Unpublish one when you need to pause lending.'}
            </p>
            <Button variant="outline" className="mt-5 bg-white" onClick={() => setFilter('all')}>
              View all listings
            </Button>
          </div>
        )}

        {status === 'success' && filteredProducts.length > 0 && (
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {filteredProducts.map((product) => {
              const categoryName = product.category?.name || 'Uncategorized'
              const image = product.images?.[0]
              const updatedDate = formatDate(product.updatedAt)
              const isPending = pendingId === product.id

              return (
                <article
                  key={product.id}
                  className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-card transition-shadow hover:shadow-elevated"
                >
                  <div className="flex flex-col sm:flex-row">
                    <div className="relative h-40 overflow-hidden sm:h-auto sm:w-40 sm:flex-shrink-0">
                      {image ? (
                        <img src={image} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div
                          className="flex h-full w-full items-center justify-center"
                          style={{ background: getCategoryGradient(categoryName) }}
                        >
                          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/25 text-white backdrop-blur-sm">
                            <ProductCategoryIcon category={categoryName} className="h-7 w-7" />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex min-w-0 flex-1 flex-col p-5">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="primary" size="xs">{categoryName}</Badge>
                        <Badge variant={product.isPublished ? 'success' : 'warning'} size="xs">
                          {product.isPublished ? 'Published' : 'Unpublished'}
                        </Badge>
                        <Badge variant="subtle" size="xs">
                          {product.availability === 'available' ? 'Available' : 'Unavailable'}
                        </Badge>
                      </div>

                      <h2 className="mt-3 line-clamp-1 font-display text-lg font-semibold text-navy-900">
                        {product.title}
                      </h2>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-neutral-500">
                        <span className="truncate">{product.location}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-semibold text-navy-900">₹{product.rentPerDay}<span className="font-normal text-neutral-500">/day</span></span>
                      </div>
                      {updatedDate && (
                        <p className="mt-1 text-xs text-neutral-400">Last updated {updatedDate}</p>
                      )}

                      <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
                        <Link to={`/products/${product.id}/edit`}>
                          <Button variant="outline" size="sm" className="bg-white">
                            Edit
                          </Button>
                        </Link>
                        {product.isPublished && (
                          <Link to={`/products/${product.id}`}>
                            <Button variant="ghost" size="sm">View</Button>
                          </Link>
                        )}
                        <Button
                          variant={product.isPublished ? 'secondary' : 'primary'}
                          size="sm"
                          loading={isPending}
                          disabled={isPending}
                          onClick={() => handlePublication(product)}
                          className="ml-auto"
                        >
                          {product.isPublished ? 'Unpublish' : 'Publish'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
