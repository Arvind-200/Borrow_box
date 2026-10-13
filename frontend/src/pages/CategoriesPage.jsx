import { CategoryCard } from '../components/category/CategoryCard'
import { mockCategories } from '../data/mockData.jsx'

export default function CategoriesPage() {
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
        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
          {mockCategories.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      </div>
    </div>
  )
}
