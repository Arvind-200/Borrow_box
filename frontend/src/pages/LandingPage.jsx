import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { ErrorState } from '../components/ui/ErrorState'
import { ProductGrid } from '../components/product/ProductGrid'
import { CategoryCard } from '../components/category/CategoryCard'
import { SearchBar } from '../components/search/SearchBar'
import { api } from '../services/api'

const steps = [
  {
    step: 'Step 1',
    title: 'Browse local listings',
    description: 'Search tools, cameras, camping gear and more in the catalog.',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
  },
  {
    step: 'Step 2',
    title: 'Check the item details',
    description: 'Review condition, price, description, and pickup area before you decide.',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
      </svg>
    ),
  },
  {
    step: 'Step 3',
    title: 'Borrow requests are coming next',
    description: 'Sending requests, owner approval, and returns are not available yet.',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
]

const platformItems = [
  {
    title: 'Browse local listings',
    description: 'Search the catalog and see each listing pickup area.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
    ),
  },
  {
    title: 'Manage your listings',
    description: 'Create, edit, publish, and unpublish your own items.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
    ),
  },
  {
    title: 'Secure accounts',
    description: 'Passwords are hashed and sessions use HttpOnly cookies.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
    ),
  },
  {
    title: 'Borrow requests',
    description: 'Requesting, accepting, and returning items are not available yet.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
    ),
  },
]

const benefits = [
  {
    title: 'Compare prices',
    description: 'See daily rental prices for items you may only need for a few days.',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
    ),
  },
  {
    title: 'Reduce waste',
    description: 'Give good items a second life and keep them out of landfills.',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
    ),
  },
  {
    title: 'Build community',
    description: 'Browse listings from other members and list your own items.',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
    ),
  },
]

function SectionHeading({ eyebrow, title, description, align = 'center', dark = false }) {
  return (
    <div className={`${align === 'center' ? 'mx-auto text-center items-center' : 'text-left items-start'} flex max-w-2xl flex-col mb-10`}>
      {eyebrow && (
        <span className={`mb-3 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${dark ? 'bg-white/10 text-primary-300' : 'bg-primary-50 text-primary-700'}`}>
          {eyebrow}
        </span>
      )}
      <h2 className={`font-display text-3xl sm:text-4xl font-bold tracking-tight ${dark ? 'text-white' : 'text-navy-900'}`}>
        {title}
      </h2>
      {description && (
        <p className={`mt-3 text-base sm:text-lg ${dark ? 'text-white/65' : 'text-neutral-500'}`}>
          {description}
        </p>
      )}
    </div>
  )
}

export default function LandingPage() {
  const location = useLocation()
  const [categories, setCategories] = useState([])
  const [categoriesStatus, setCategoriesStatus] = useState('loading')
  const [categoriesError, setCategoriesError] = useState('')
  const [categoriesReloadKey, setCategoriesReloadKey] = useState(0)
  const [products, setProducts] = useState([])
  const [productsStatus, setProductsStatus] = useState('loading')
  const [productsError, setProductsError] = useState('')
  const [productsReloadKey, setProductsReloadKey] = useState(0)

  // Scroll to an in-page section when arriving via a hash link
  // (e.g. footer "How It Works" -> /#how-it-works).
  useEffect(() => {
    if (location.hash) {
      const target = document.querySelector(location.hash)
      if (target) {
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' })
      }
    }
  }, [location])

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
      .catch((error) => {
        if (!active) return
        setCategoriesError(error.message || 'Unable to load categories.')
        setCategoriesStatus('error')
      })

    return () => {
      active = false
    }
  }, [categoriesReloadKey])

  useEffect(() => {
    let active = true
    setProductsStatus('loading')
    setProductsError('')

    api.getProducts({ limit: 8, sort: 'recommended' })
      .then((data) => {
        if (!active) return
        setProducts(data.products || [])
        setProductsStatus('success')
      })
      .catch((error) => {
        if (!active) return
        setProductsError(error.message || 'Unable to load listings.')
        setProductsStatus('error')
      })

    return () => {
      active = false
    }
  }, [productsReloadKey])

  return (
    <div className="bg-[#F8FAFC]">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary-50 via-[#F8FAFC] to-[#F8FAFC]">
        <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-primary-200/50 blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute -right-24 top-10 h-80 w-80 rounded-full bg-primary-100/70 blur-3xl" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-12 pb-12 sm:pt-16 sm:pb-14">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary-200 bg-white px-4 py-1.5 text-[13px] font-semibold text-primary-700 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-primary-500" aria-hidden="true" />
              A local marketplace for item listings
            </span>
            <h1 className="mt-5 font-display text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.08] tracking-tight text-navy-900">
              Find local listings.
              <br />
              <span className="text-primary-600">Lend what you have.</span>
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base sm:text-lg text-neutral-500">
              Browse local listings, compare daily prices, and reduce waste. Borrow
              requests, returns, and reviews are coming in future phases.
            </p>
            <div className="mx-auto mt-7 max-w-2xl">
              <SearchBar variant="full" placeholder="Search items: tools, cameras, camping gear..." />
            </div>
            <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link to="/browse" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto">
                  Browse Items
                </Button>
              </Link>
              <Link to="/products/new" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="w-full sm:w-auto bg-white">
                  List an Item
                </Button>
              </Link>
            </div>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-neutral-500">
              <span className="inline-flex items-center gap-1.5">
                <svg className="h-4 w-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Browse without an account
              </span>
              <span className="inline-flex items-center gap-1.5">
                <svg className="h-4 w-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                Owner-managed listings
              </span>
              <span className="inline-flex items-center gap-1.5">
                <svg className="h-4 w-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                Secure account sessions
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="bg-white py-14 sm:py-16" aria-labelledby="categories-heading">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div id="categories-heading">
            <SectionHeading
              eyebrow="Categories"
              title="Browse by category"
              description="Browse items by category in the local marketplace."
            />
          </div>
          {categoriesStatus === 'loading' && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 sm:gap-5" aria-label="Loading categories">
              {[...Array(8)].map((_, index) => (
                <div key={index} className="min-h-[13.5rem] animate-pulse rounded-2xl border border-neutral-200 bg-white p-5 shadow-card">
                  <div className="h-[3.25rem] w-[3.25rem] rounded-xl bg-neutral-200" />
                  <div className="mt-4 h-5 w-2/3 rounded bg-neutral-200" />
                  <div className="mt-2 h-4 w-1/3 rounded bg-neutral-200" />
                  <div className="mt-8 h-4 w-full rounded bg-neutral-100" />
                </div>
              ))}
            </div>
          )}
          {categoriesStatus === 'error' && (
            <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center shadow-card" role="alert">
              <p className="font-semibold text-navy-900">Unable to load categories</p>
              <p className="mt-1 text-sm text-neutral-500">{categoriesError}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => setCategoriesReloadKey((key) => key + 1)}
              >
                Try again
              </Button>
            </div>
          )}
          {categoriesStatus === 'success' && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 sm:gap-5">
              {categories.map((category) => (
                <CategoryCard key={category.id} category={category} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Popular items */}
      <section className="py-14 sm:py-16" aria-labelledby="popular-heading">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <span className="mb-3 inline-flex items-center rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary-700">
                Marketplace
              </span>
              <h2 id="popular-heading" className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-navy-900">
                Recent listings
              </h2>
              <p className="mt-3 text-base sm:text-lg text-neutral-500">
                Available items from the community catalog.
              </p>
            </div>
            <Link
              to="/browse"
              className="inline-flex flex-shrink-0 items-center gap-1 text-sm font-semibold text-primary-600 hover:text-primary-700 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              View all items
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </Link>
          </div>
          {productsStatus === 'loading' && (
            <ProductGrid isLoading skeletonCount={8} />
          )}
          {productsStatus === 'error' && (
            <ErrorState
              title="Unable to load listings"
              message={productsError}
              onRetry={() => setProductsReloadKey((key) => key + 1)}
            />
          )}
          {productsStatus === 'success' && (
            <ProductGrid
              products={products}
              emptyMessage="No listings available yet"
              emptyDescription="Check back soon as members add items to BorrowBox."
            />
          )}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="bg-white py-14 sm:py-16 scroll-mt-32" aria-labelledby="how-heading">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div id="how-heading">
            <SectionHeading
              eyebrow="How it works"
              title="What you can do today"
              description="Browse listings and manage your items now. Borrow requests come next."
            />
          </div>
          <ol className="grid grid-cols-1 gap-5 md:grid-cols-3" role="list">
            {steps.map((item, index) => (
              <li key={item.title}>
                <Card className="relative h-full p-6 sm:p-7 text-left">
                  <span className="absolute right-6 top-6 font-display text-5xl font-bold text-primary-100 select-none" aria-hidden="true">
                    {index + 1}
                  </span>
                  <div className="relative">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                      {item.icon}
                    </div>
                    <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-primary-600">{item.step}</p>
                    <h3 className="mt-1 font-display text-xl font-semibold text-navy-900">{item.title}</h3>
                    <p className="mt-2 text-[15px] leading-relaxed text-neutral-500">{item.description}</p>
                  </div>
                </Card>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Platform status */}
      <section className="bg-navy-900 py-14 sm:py-16" aria-labelledby="platform-heading">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div id="platform-heading">
            <SectionHeading
              dark
              eyebrow="Platform Status"
              title="What works today"
              description="These features are available now. Requests, reviews, reporting, and admin tools are still planned."
            />
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {platformItems.map((item) => (
              <div key={item.title} className="rounded-2xl border border-white/10 bg-white/5 p-6 transition-colors hover:border-primary-500/40">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary-500/15 text-primary-300">
                  {item.icon}
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold text-white">{item.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-white/60">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Community benefits */}
      <section className="bg-white py-14 sm:py-16" aria-labelledby="community-heading">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div id="community-heading">
            <SectionHeading
              eyebrow="Community"
              title="Browse locally, list locally"
              description="How BorrowBox supports browsing and listing items."
            />
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {benefits.map((benefit) => (
              <Card key={benefit.title} className="p-6 sm:p-7">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                  {benefit.icon}
                </div>
                <h3 className="mt-4 font-display text-xl font-semibold text-navy-900">{benefit.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-neutral-500">{benefit.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-4 pb-14 sm:px-6 sm:pb-16 lg:px-8" aria-labelledby="cta-heading">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl bg-gradient-to-br from-primary-500 to-primary-700 px-6 py-12 sm:px-12 sm:py-14 text-center shadow-elevated">
          <div className="pointer-events-none absolute -left-16 -bottom-20 h-64 w-64 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />
          <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-navy-900/20 blur-2xl" aria-hidden="true" />
          <div className="relative mx-auto max-w-2xl">
            <h2 id="cta-heading" className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-white">
              Ready to browse or list locally?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-base sm:text-lg text-white/80">
              Join BorrowBox free. Browse local items or list something you own today.
              Borrow requests are coming soon.
            </p>
            <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link to="/browse" className="w-full sm:w-auto">
                <Button variant="secondary" size="lg" className="w-full sm:w-auto border-0">
                  Browse Items
                </Button>
              </Link>
              <Link to="/signup" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto bg-navy-900 text-white hover:bg-navy-800 focus:ring-white">
                  Create Free Account
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
