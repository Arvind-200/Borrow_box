import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { ErrorState } from '../components/ui/ErrorState'
import { Pagination } from '../components/ui/Pagination'
import { ProductGrid } from '../components/product/ProductGrid'
import { api } from '../services/api'

const PAGE_SIZE = 6

const SORT_OPTIONS = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'newest', label: 'Newest' },
]

function parsePrice(value) {
  const trimmed = value.trim()
  if (trimmed === '') return undefined
  const parsed = Number(trimmed)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined
}

function parsePage(value) {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1
}

function normalizeSort(value) {
  return SORT_OPTIONS.some((option) => option.value === value) ? value : 'recommended'
}

function normalizeAvailability(value) {
  return value === 'available' || value === 'unavailable' ? value : ''
}

export default function BrowsePage() {
  const [searchParams, setSearchParams] = useSearchParams()

  const [query, setQuery] = useState(() => searchParams.get('q') || '')
  const [category, setCategory] = useState(() => searchParams.get('category') || '')
  const [location, setLocation] = useState(() => searchParams.get('location') || '')
  const [availability, setAvailability] = useState(() =>
    normalizeAvailability(searchParams.get('availability') || '')
  )
  const [minPrice, setMinPrice] = useState(() => searchParams.get('min') || '')
  const [maxPrice, setMaxPrice] = useState(() => searchParams.get('max') || '')
  const [sort, setSort] = useState(() => normalizeSort(searchParams.get('sort') || ''))
  const [page, setPage] = useState(() => parsePage(searchParams.get('page')))
  const [filtersOpen, setFiltersOpen] = useState(false)

  const [areas, setAreas] = useState([])
  const [nearbyAreas, setNearbyAreas] = useState([])
  const [areasStatus, setAreasStatus] = useState('loading')
  const [areasError, setAreasError] = useState('')
  const [areasReloadKey, setAreasReloadKey] = useState(0)

  const [categories, setCategories] = useState([])
  const [categoriesStatus, setCategoriesStatus] = useState('loading')
  const [categoriesError, setCategoriesError] = useState('')
  const [categoriesReloadKey, setCategoriesReloadKey] = useState(0)

  const [products, setProducts] = useState([])
  const [pagination, setPagination] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    setQuery(searchParams.get('q') || '')
    setCategory(searchParams.get('category') || '')
    setLocation(searchParams.get('location') || '')
    setAvailability(normalizeAvailability(searchParams.get('availability') || ''))
    setMinPrice(searchParams.get('min') || '')
    setMaxPrice(searchParams.get('max') || '')
    setSort(normalizeSort(searchParams.get('sort') || ''))
    setPage(parsePage(searchParams.get('page')))
  }, [searchParams])

  useEffect(() => {
    const params = {}
    if (query.trim()) params.q = query.trim()
    if (category) params.category = category
    if (location.trim()) params.location = location.trim()
    if (availability) params.availability = availability
    if (minPrice.trim()) params.min = minPrice.trim()
    if (maxPrice.trim()) params.max = maxPrice.trim()
    if (sort !== 'recommended') params.sort = sort
    if (page > 1) params.page = String(page)

    const next = new URLSearchParams(params).toString()
    if (searchParams.toString() !== next) {
      setSearchParams(next, { replace: true })
    }
  }, [
    query,
    category,
    location,
    availability,
    minPrice,
    maxPrice,
    sort,
    page,
    searchParams,
    setSearchParams,
  ])

  useEffect(() => {
    let active = true
    setCategoriesStatus('loading')
    setCategoriesError('')

    api.getCategories()
      .then((data) => {
        if (!active) return
        setCategories(data.categories || [])
        setCategoriesStatus('success')
      })
      .catch((err) => {
        if (!active) return
        setCategoriesError(err.message || 'Unable to load categories.')
        setCategoriesStatus('error')
      })

    return () => {
      active = false
    }
  }, [categoriesReloadKey])

  const validMin = parsePrice(minPrice)
  const validMax = parsePrice(maxPrice)
  const priceError =
    validMin !== undefined && validMax !== undefined && validMin > validMax
      ? 'Minimum price cannot be more than maximum price.'
      : null

  useEffect(() => {
    if (priceError) {
      setAreasStatus('success')
      return
    }

    let active = true
    setAreasStatus('loading')
    setAreasError('')

    const timer = setTimeout(() => {
      api.getProductLocations({
        q: query.trim() || undefined,
        category: category || undefined,
        minPrice: validMin,
        maxPrice: validMax,
        availability: availability || undefined,
        nearbyFor: location.trim() || undefined,
      })
        .then((data) => {
          if (!active) return
          setAreas(data.locations || [])
          setNearbyAreas(data.nearbyAreas || [])
          setAreasStatus('success')
        })
        .catch((err) => {
          if (!active) return
          setAreasError(err.message || 'Unable to load areas.')
          setAreasStatus('error')
        })
    }, query.trim() ? 250 : 0)

    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [
    query,
    category,
    availability,
    location,
    validMin,
    validMax,
    priceError,
    areasReloadKey,
  ])

  useEffect(() => {
    if (priceError) {
      setProducts([])
      setPagination(null)
      setError('')
      setIsLoading(false)
      return
    }

    let active = true
    setIsLoading(true)
    setError('')

    const timer = setTimeout(() => {
      api.getProducts({
        q: query.trim() || undefined,
        category: category || undefined,
        location: location.trim() || undefined,
        availability: availability || undefined,
        minPrice: validMin,
        maxPrice: validMax,
        sort,
        page,
        limit: PAGE_SIZE,
      })
        .then((data) => {
          if (!active) return

          const totalPages = data.pagination?.totalPages || 0
          if ((totalPages > 0 && page > totalPages) || (totalPages === 0 && page > 1)) {
            setPage(totalPages > 0 ? totalPages : 1)
            return
          }

          setProducts(data.products || [])
          setPagination(data.pagination || null)
        })
        .catch((err) => {
          if (!active) return
          setProducts([])
          setPagination(null)
          setError(err.message || 'Unable to load listings.')
        })
        .finally(() => {
          if (active) setIsLoading(false)
        })
    }, query.trim() ? 250 : 0)

    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [
    query,
    category,
    location,
    availability,
    validMin,
    validMax,
    sort,
    page,
    priceError,
    reloadKey,
  ])

  const categoryLabel =
    categories.find((item) => item.slug === category || item.id === category)?.name ||
    category

  const allCategoryCount = categories.reduce(
    (total, item) => total + (item.productCount || 0),
    0
  )

  const activeFilters = []
  if (query.trim()) activeFilters.push({ key: 'q', label: `"${query.trim()}"` })
  if (category) activeFilters.push({ key: 'category', label: categoryLabel })
  if (location.trim()) activeFilters.push({ key: 'location', label: `Area: ${location.trim()}` })
  if (availability) {
    activeFilters.push({
      key: 'availability',
      label: availability === 'available' ? 'Available only' : 'Unavailable only',
    })
  }
  if (validMin !== undefined || validMax !== undefined) {
    activeFilters.push({
      key: 'price',
      label: `₹${validMin ?? 0} – ₹${validMax ?? '∞'}/day`,
    })
  }

  const selectedLocation = location.trim()
  const selectedAreaInOptions = areas.some(
    (area) => area.name === selectedLocation
  )
  const areaOptions =
    selectedLocation && !selectedAreaInOptions
      ? [{ name: selectedLocation, count: 0 }, ...areas]
      : areas
  const nearbySuggestions = nearbyAreas.filter(
    (area) =>
      area.count > 0 &&
      area.name.toLowerCase() !== selectedLocation.toLowerCase()
  )

  const updateQuery = (value) => {
    setQuery(value)
    setPage(1)
  }

  const updateCategory = (value) => {
    setCategory(value)
    setPage(1)
  }

  const updateLocation = (value) => {
    setLocation(value)
    setPage(1)
  }

  const updateAvailability = (value) => {
    setAvailability(value)
    setPage(1)
  }

  const updateMinPrice = (value) => {
    setMinPrice(value)
    setPage(1)
  }

  const updateMaxPrice = (value) => {
    setMaxPrice(value)
    setPage(1)
  }

  const updateSort = (value) => {
    setSort(value)
    setPage(1)
  }

  const clearAll = () => {
    setQuery('')
    setCategory('')
    setLocation('')
    setAvailability('')
    setMinPrice('')
    setMaxPrice('')
    setSort('recommended')
    setPage(1)
  }

  const removeFilter = (key) => {
    if (key === 'q') setQuery('')
    if (key === 'category') setCategory('')
    if (key === 'location') setLocation('')
    if (key === 'availability') setAvailability('')
    if (key === 'price') {
      setMinPrice('')
      setMaxPrice('')
    }
    setPage(1)
  }

  const totalItems = pagination?.total ?? products.length

  const filterControls = (
    <div className="space-y-7">
      <section aria-labelledby="filter-category">
        <h3 id="filter-category" className="text-sm font-semibold uppercase tracking-wider text-navy-900">
          Category
        </h3>
        {categoriesStatus === 'loading' && (
          <p className="mt-3 text-sm text-neutral-500" role="status">Loading categories...</p>
        )}
        {categoriesStatus === 'error' && (
          <div className="mt-3">
            <p className="text-sm text-neutral-500" role="alert">{categoriesError}</p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 px-0"
              onClick={() => setCategoriesReloadKey((key) => key + 1)}
            >
              Retry categories
            </Button>
          </div>
        )}
        {categoriesStatus === 'success' && (
          <ul className="mt-3 space-y-1" role="list">
            <li>
              <button
                type="button"
                onClick={() => updateCategory('')}
                aria-pressed={category === ''}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-[15px] font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
                  category === ''
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-neutral-500 hover:bg-neutral-100 hover:text-navy-900'
                }`}
              >
                All categories
                <span className="text-sm text-neutral-500">{allCategoryCount}</span>
              </button>
            </li>
            {categories.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => updateCategory(item.slug || item.id)}
                  aria-pressed={category === item.slug || category === item.id}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-[15px] font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
                    category === item.slug || category === item.id
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-neutral-500 hover:bg-neutral-100 hover:text-navy-900'
                  }`}
                >
                  {item.name}
                  <span className="text-sm text-neutral-500">{item.productCount}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="filter-area">
        <h3 id="filter-area" className="text-sm font-semibold uppercase tracking-wider text-navy-900">
          Area
        </h3>
        <label htmlFor="filter-area-select" className="sr-only">
          Filter by area
        </label>
        <select
          id="filter-area-select"
          value={selectedLocation}
          onChange={(e) => updateLocation(e.target.value)}
          className="mt-3 w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-[15px] font-medium text-navy-900 shadow-sm transition-colors hover:border-neutral-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
        >
          <option value="">All areas</option>
          {areaOptions.map((area) => (
            <option key={area.name} value={area.name}>
              {area.name}
              {area.count > 0 ? ` (${area.count})` : ''}
            </option>
          ))}
        </select>
        {areasStatus === 'loading' && (
          <p className="mt-2 text-sm text-neutral-500" role="status">
            Loading areas...
          </p>
        )}
        {areasStatus === 'error' && (
          <div className="mt-2">
            <p className="text-sm text-neutral-500" role="alert">
              {areasError}
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 px-0"
              onClick={() => setAreasReloadKey((key) => key + 1)}
            >
              Retry areas
            </Button>
          </div>
        )}
      </section>

      <section aria-labelledby="filter-availability">
        <h3 id="filter-availability" className="text-sm font-semibold uppercase tracking-wider text-navy-900">
          Availability
        </h3>
        <label htmlFor="filter-availability-select" className="sr-only">
          Filter by availability
        </label>
        <select
          id="filter-availability-select"
          value={availability}
          onChange={(e) => updateAvailability(e.target.value)}
          className="mt-3 w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-[15px] font-medium text-navy-900 shadow-sm transition-colors hover:border-neutral-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
        >
          <option value="">All availability</option>
          <option value="available">Available only</option>
          <option value="unavailable">Unavailable only</option>
        </select>
      </section>

      <section aria-labelledby="filter-price">
        <h3 id="filter-price" className="text-sm font-semibold uppercase tracking-wider text-navy-900">
          Price per day (₹)
        </h3>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Input
            label="Min"
            id="price-min"
            type="number"
            min="0"
            inputMode="numeric"
            placeholder="0"
            value={minPrice}
            onChange={(e) => updateMinPrice(e.target.value)}
          />
          <Input
            label="Max"
            id="price-max"
            type="number"
            min="0"
            inputMode="numeric"
            placeholder="800"
            value={maxPrice}
            onChange={(e) => updateMaxPrice(e.target.value)}
            error={priceError || undefined}
          />
        </div>
      </section>

      {activeFilters.length > 0 && (
        <Button variant="ghost" size="sm" onClick={clearAll} className="w-full">
          Clear all filters
        </Button>
      )}
    </div>
  )

  return (
    <div className="bg-[#F8FAFC]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="max-w-2xl">
          <span className="mb-3 inline-flex items-center rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary-700">
            Marketplace
          </span>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-navy-900">
            Browse Items
          </h1>
          <p className="mt-3 text-base sm:text-lg text-neutral-500">
            Browse tools, cameras, and more listed by people in your community.
            Every listing shows its per-day rental price.
          </p>
        </div>

        <div className="mt-6 max-w-2xl">
          <Input
            label="Search items"
            id="browse-search"
            type="search"
            placeholder="Try &quot;drill&quot;, &quot;camera&quot;, or &quot;tent&quot;..."
            value={query}
            onChange={(e) => updateQuery(e.target.value)}
            autoComplete="off"
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <p className="text-sm text-neutral-500" role="status" aria-live="polite">
            {isLoading ? (
              'Searching for items...'
            ) : (
              <>
                <span className="font-semibold text-navy-900">{totalItems}</span>{' '}
                {totalItems === 1 ? 'item' : 'items'} found
              </>
            )}
          </p>
          <div className="ml-auto flex items-center gap-3">
            <button
              type="button"
              onClick={() => setFiltersOpen((open) => !open)}
              aria-expanded={filtersOpen}
              aria-controls="mobile-filters"
              className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-[15px] font-semibold text-navy-900 shadow-sm transition-colors hover:border-neutral-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 xl:hidden"
            >
              <svg className="h-5 w-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filters
              {activeFilters.length > 0 && (
                <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-primary-500 px-1.5 text-xs font-bold text-white">
                  {activeFilters.length}
                </span>
              )}
            </button>
            <label htmlFor="browse-sort" className="sr-only">
              Sort items
            </label>
            <select
              id="browse-sort"
              value={sort}
              onChange={(e) => updateSort(e.target.value)}
              className="rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-[15px] font-medium text-navy-900 shadow-sm transition-colors hover:border-neutral-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {activeFilters.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2" aria-label="Active filters">
            {activeFilters.map((filter) => (
              <button
                key={filter.key}
                type="button"
                onClick={() => removeFilter(filter.key)}
                className="inline-flex items-center gap-1.5 rounded-full border border-primary-200 bg-primary-50 px-3 py-1.5 text-sm font-medium text-primary-700 transition-colors hover:border-primary-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                aria-label={`Remove ${filter.label} filter`}
              >
                {filter.label}
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            ))}
            <button
              type="button"
              onClick={clearAll}
              className="rounded-full px-3 py-1.5 text-sm font-semibold text-neutral-500 underline-offset-2 hover:text-navy-900 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              Clear all
            </button>
          </div>
        )}

        <div className="mt-6 xl:grid xl:grid-cols-[280px_minmax(0,1fr)] xl:gap-8 xl:items-start">
          <aside className="hidden xl:block" aria-label="Filters">
            <div className="sticky top-40 rounded-2xl border border-neutral-200 bg-white p-6 shadow-card">
              {filterControls}
            </div>
          </aside>

          <div className="min-w-0">
            {filtersOpen && (
              <div
                id="mobile-filters"
                className="mb-6 rounded-2xl border border-neutral-200 bg-white p-6 shadow-card xl:hidden"
              >
                {filterControls}
              </div>
            )}

            {isLoading && <ProductGrid isLoading skeletonCount={PAGE_SIZE} />}

            {!isLoading && error && (
              <ErrorState
                title="Unable to load listings"
                message={error}
                onRetry={() => setReloadKey((key) => key + 1)}
              />
            )}

            {!isLoading && !error && products.length > 0 && (
              <>
                <ProductGrid products={products} />
                <Pagination
                  className="mt-10"
                  page={pagination?.page || page}
                  totalPages={pagination?.totalPages || 0}
                  onPageChange={(nextPage) => {
                    setPage(nextPage)
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                />
              </>
            )}

            {!isLoading && !error && products.length === 0 && (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-neutral-200 bg-white py-16 px-4 text-center shadow-card" role="status">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-50">
                  <svg className="h-8 w-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h2 className="font-display text-xl font-semibold text-navy-900">
                  {selectedLocation
                    ? `No items in ${selectedLocation}`
                    : 'No items match your filters'}
                </h2>
                <p className="mt-2 max-w-sm text-[15px] text-neutral-500">
                  {priceError
                    ? 'The minimum price is higher than the maximum price. Adjust the range or clear your filters.'
                    : selectedLocation
                      ? 'No listings in this exact area match your current filters.'
                      : 'Try a different search term, category, or price range.'}
                </p>
                {!priceError && selectedLocation && nearbySuggestions.length > 0 && (
                  <div className="mt-6 w-full max-w-md">
                    <p className="text-sm font-semibold text-navy-900">
                      Nearby areas with matching items
                    </p>
                    <div className="mt-3 flex flex-wrap justify-center gap-2">
                      {nearbySuggestions.map((area) => (
                        <button
                          key={area.name}
                          type="button"
                          onClick={() => updateLocation(area.name)}
                          className="rounded-full border border-primary-200 bg-primary-50 px-3 py-1.5 text-sm font-medium text-primary-700 transition-colors hover:border-primary-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                        >
                          {area.name} ({area.count})
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  {selectedLocation && (
                    <Button
                      variant="outline"
                      className="w-full bg-white sm:w-auto"
                      onClick={() => updateLocation('')}
                    >
                      All areas
                    </Button>
                  )}
                  <Button onClick={clearAll} className="w-full sm:w-auto">
                    Clear all filters
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
