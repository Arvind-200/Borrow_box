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
    title: 'Find an item nearby',
    description: 'Search tools, cameras, camping gear and more listed by neighbors around you.',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
  },
  {
    step: 'Step 2',
    title: 'Send a borrow request',
    description: 'Pick your dates and send a request. The owner can accept or decline.',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
      </svg>
    ),
  },
  {
    step: 'Step 3',
    title: 'Pick it up and return it',
    description: 'Meet nearby, use the item, and return it on time to keep trust high.',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
]

const trustItems = [
  {
    title: 'Verified Profiles',
    description: 'Borrow and lend with people who stand behind their identity.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
    ),
  },
  {
    title: 'Ratings & Reviews',
    description: 'Two-way reviews keep borrowers and lenders accountable.',
    icon: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
    ),
  },
  {
    title: 'Community Guidelines',
    description: 'Clear, respectful rules for every borrow and every listing.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
    ),
  },
  {
    title: 'Reporting & Safety',
    description: 'Report a listing anytime and get help when something feels off.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
    ),
  },
]

const benefits = [
  {
    title: 'Save money',
    description: 'Rent what you need for days, not the full price of buying it new.',
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
    description: 'Meet trusted neighbors and share skills, tools, and stories.',
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
              Your neighborhood rental marketplace
            </span>
            <h1 className="mt-5 font-display text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.08] tracking-tight text-navy-900">
              Borrow what you need.
              <br />
              <span className="text-primary-600">Lend what you have.</span>
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base sm:text-lg text-neutral-500">
              Lend less waste, borrow what you need from trusted neighbors. Save money,
              reduce waste, and find tools, cameras, and camping gear close to home.
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
              <Link to="/my-products" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="w-full sm:w-auto bg-white">
                  List an Item
                </Button>
              </Link>
            </div>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-neutral-500">
              <span className="inline-flex items-center gap-1.5">
                <svg className="h-4 w-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Verified profiles
              </span>
              <span className="inline-flex items-center gap-1.5">
                <svg className="h-4 w-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118L2.075 9.307c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                Ratings &amp; reviews
              </span>
              <span className="inline-flex items-center gap-1.5">
                <svg className="h-4 w-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                Nearby pickup
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
              description="Trusted categories from neighbors near you."
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
                Popular items near you
              </h2>
              <p className="mt-3 text-base sm:text-lg text-neutral-500">
                Available listings from your local community.
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
              emptyDescription="Check back soon as neighbors add items to BorrowBox."
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
              title="Borrowing made simple"
              description="Three steps from search to return."
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

      {/* Trust and safety */}
      <section className="bg-navy-900 py-14 sm:py-16" aria-labelledby="trust-heading">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div id="trust-heading">
            <SectionHeading
              dark
              eyebrow="Trust & Safety"
              title="A marketplace you can trust"
              description="Safety is built into every borrow, listing, and review."
            />
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {trustItems.map((item) => (
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
              title="Borrow nearby, share locally"
              description="Why neighbors choose BorrowBox every week."
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
              Ready to borrow from your neighbors?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-base sm:text-lg text-white/80">
              Join BorrowBox free. Browse local items or list something you own today.
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
