import { useEffect, useState } from 'react'
import { CategoryCard } from '../components/category/CategoryCard'
import { ErrorState } from '../components/ui/ErrorState'
import { api } from '../services/api'

export default function CategoriesPage() {
  const [categories, setCategories] = useState([])
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let active = true
    setStatus('loading')
    setError('')

    api.getCategories()
      .then((data) => {
        if (!active) return
        setCategories(data.categories || [])
        setStatus('success')
      })
      .catch((err) => {
        if (!active) return
        setError(err.message || 'Unable to load categories.')
        setStatus('error')
      })

    return () => {
      active = false
    }
  }, [reloadKey])

  return (
    <div className="bg-[#F8FAFC]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="mx-auto max-w-2xl text-center">
          <span className="mb-3 inline-flex items-center rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary-700">
            Categories
          </span>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-navy-900">
            Browse by category
          </h1>
          <p className="mt-3 text-base sm:text-lg text-neutral-500">
            Pick a category to see matching items available near you.
          </p>
        </div>

        {status === 'loading' && (
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4" aria-label="Loading categories">
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

        {status === 'error' && (
          <ErrorState
            className="mt-10"
            title="Unable to load categories"
            message={error}
            onRetry={() => setReloadKey((key) => key + 1)}
          />
        )}

        {status === 'success' && categories.length > 0 && (
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
            {categories.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        )}

        {status === 'success' && categories.length === 0 && (
          <div className="mt-10 rounded-2xl border border-neutral-200 bg-white p-12 text-center shadow-card">
            <h2 className="font-display text-xl font-semibold text-navy-900">No categories yet</h2>
            <p className="mt-2 text-neutral-500">Categories will appear here as the marketplace grows.</p>
          </div>
        )}
      </div>
    </div>
  )
}
