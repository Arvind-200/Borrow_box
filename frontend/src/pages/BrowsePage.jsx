import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { ProductGrid } from '../components/product/ProductGrid'
import { mockProducts, mockCategories } from '../data/mockData.jsx'

const SORT_OPTIONS = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
]

const LOCATION_OPTIONS = [
  { value: 'all', label: 'All areas' },
  { value: 'Your Area', label: 'Your Area' },
  { value: 'Nearby', label: 'Nearby' },
]

// CategoryCard links use the lowercase category id (e.g. ?category=tools),
// while products store the display name (e.g. "Tools").
function categoryNameFromParam(param) {
  if (!param) return ''
  const cleaned = param.trim().toLowerCase()
  const match = mockCategories.find(
    (c) => c.id.toLowerCase() === cleaned || c.name.toLowerCase() === cleaned
  )
  return match ? match.name : ''
}

// Empty, non-numeric, or negative entries are ignored (treated as unbounded).
function parsePrice(value) {
  const trimmed = value.trim()
  if (trimmed === '') return undefined
  const parsed = Number(trimmed)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined
}

function matchesQuery(product, query) {
  const text = query.trim().toLowerCase()
  if (!text) return true
  const haystack = [product.name, product.category, product.location, ...(product.tags || [])]
    .join(' ')
    .toLowerCase()
  return haystack.includes(text)
}

export default function BrowsePage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  // Filters initialize from the URL so homepage search (?q=) and
  // category cards (?category=) land with the right results.
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [categoryName, setCategoryName] = useState(() =>
    categoryNameFromParam(searchParams.get('category'))
  )
  const [location, setLocation] = useState(searchParams.get('location') || 'all')
  const [minPrice, setMinPrice] = useState(searchParams.get('min') || '')
  const [maxPrice, setMaxPrice] = useState(searchParams.get('max') || '')
  const [sort, setSort] = useState(searchParams.get('sort') || 'recommended')
  const [filtersOpen, setFiltersOpen] = useState(false)

  // If the user navigates to /browse with new params while already on
  // the page (e.g. clicking another category card), pick them up.
  useEffect(() => {
    setQuery(searchParams.get('q') || '')
    setCategoryName(categoryNameFromParam(searchParams.get('category')))
    setLocation(searchParams.get('location') || 'all')
    setMinPrice(searchParams.get('min') || '')
    setMaxPrice(searchParams.get('max') || '')
    setSort(searchParams.get('sort') || 'recommended')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()])

  // Keep the URL in sync so filtered views are shareable and survive refresh.
  useEffect(() => {
    const params = {}
    if (query.trim()) params.q = query.trim()
    const categoryId = mockCategories.find((c) => c.name === categoryName)?.id
    if (categoryId) params.category = categoryId
    if (location !== 'all') params.location = location
    if (minPrice.trim()) params.min = minPrice.trim()
    if (maxPrice.trim()) params.max = maxPrice.trim()
    if (sort !== 'recommended') params.sort = sort
    const current = searchParams.toString()
    const next = new URLSearchParams(params).toString()
    if (current !== next) {
      setSearchParams(params, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, categoryName, location, minPrice, maxPrice, sort])

  const validMin = parsePrice(minPrice)
  const validMax = parsePrice(maxPrice)
  const priceError =
    validMin !== undefined && validMax !== undefined && validMin > validMax
      ? 'Minimum price cannot be more than maximum price.'
      : null

  const categoriesWithCounts = useMemo(
    () =>
      mockCategories.map((category) => ({
        ...category,
        count: mockProducts.filter((p) => p.category === category.name).length,
      })),
    []
  )

  const filteredProducts = useMemo(() => {
    if (priceError) return []
    const list = mockProducts.filter((product) => {
      if (!matchesQuery(product, query)) return false
      if (categoryName && product.category !== categoryName) return false
      if (location !== 'all' && product.location !== location) return false
      if (validMin !== undefined && product.price < validMin) return false
      if (validMax !== undefined && product.price > validMax) return false
      return true
    })
    if (sort === 'price-asc') return [...list].sort((a, b) => a.price - b.price)
    if (sort === 'price-desc') return [...list].sort((a, b) => b.price - a.price)
    return list
  }, [query, categoryName, location, validMin, validMax, sort, priceError])

  const activeFilters = []
  if (query.trim()) activeFilters.push({ key: 'q', label: `"${query.trim()}"` })
  if (categoryName) activeFilters.push({ key: 'category', label: categoryName })
  if (location !== 'all') activeFilters.push({ key: 'location', label: location })
  if (validMin !== undefined || validMax !== undefined) {
    activeFilters.push({
      key: 'price',
      label: `₹${validMin ?? 0} – ₹${validMax ?? '∞'}/day`,
    })
  }

  const clearAll = () => {
    setQuery('')
    setCategoryName('')
    setLocation('all')
    setMinPrice('')
    setMaxPrice('')
    setSort('recommended')
  }

  const removeFilter = (key) => {
    if (key === 'q') setQuery('')
    if (key === 'category') setCategoryName('')
    if (key === 'location') setLocation('all')
    if (key === 'price') {
      setMinPrice('')
      setMaxPrice('')
    }
  }

  // Product details and borrowing require an account. While logged out,
  // protected taps lead to login, per project rules.
  const handleProtectedAction = () => navigate('/login')

  const filterControls = (
    <div className="space-y-7">
      <section aria-labelledby="filter-category">
        <h3 id="filter-category" className="text-sm font-semibold uppercase tracking-wider text-navy-900">
          Category
        </h3>
        <ul className="mt-3 space-y-1" role="list">
          <li>
            <button
              type="button"
              onClick={() => setCategoryName('')}
              aria-pressed={categoryName === ''}
              className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-[15px] font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
                categoryName === ''
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-neutral-500 hover:bg-neutral-100 hover:text-navy-900'
              }`}
            >
              All categories
              <span className="text-sm text-neutral-500">{mockProducts.length}</span>
            </button>
          </li>
          {categoriesWithCounts.map((category) => (
            <li key={category.id}>
              <button
                type="button"
                onClick={() => setCategoryName(category.name)}
                aria-pressed={categoryName === category.name}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-[15px] font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
                  categoryName === category.name
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-neutral-500 hover:bg-neutral-100 hover:text-navy-900'
                }`}
              >
                {category.name}
                <span className="text-sm text-neutral-500">{category.count}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="filter-location">
        <h3 id="filter-location" className="text-sm font-semibold uppercase tracking-wider text-navy-900">
          Location
        </h3>
        <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Filter by location">
          {LOCATION_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setLocation(option.value)}
              aria-pressed={location === option.value}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
                location === option.value
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-neutral-200 bg-white text-neutral-500 hover:border-neutral-300 hover:text-navy-900'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
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
            onChange={(e) => setMinPrice(e.target.value)}
          />
          <Input
            label="Max"
            id="price-max"
            type="number"
            min="0"
            inputMode="numeric"
            placeholder="800"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
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
            Borrow tools, cameras, and more from neighbors nearby.
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
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <p className="text-sm text-neutral-500" role="status" aria-live="polite">
            <span className="font-semibold text-navy-900">{filteredProducts.length}</span>{' '}
            {filteredProducts.length === 1 ? 'item' : 'items'} found
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
              onChange={(e) => setSort(e.target.value)}
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

            {filteredProducts.length > 0 ? (
              <ProductGrid
                products={filteredProducts}
                onViewDetails={handleProtectedAction}
                onSave={handleProtectedAction}
              />
            ) : (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-neutral-200 bg-white py-16 px-4 text-center shadow-card" role="status">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-50">
                  <svg className="h-8 w-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h2 className="font-display text-xl font-semibold text-navy-900">
                  No items match your filters
                </h2>
                <p className="mt-2 max-w-sm text-[15px] text-neutral-500">
                  {priceError
                    ? 'The minimum price is higher than the maximum price. Adjust the range or clear your filters.'
                    : 'Try a different search term, category, or price range.'}
                </p>
                <Button onClick={clearAll} className="mt-6">
                  Clear all filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
