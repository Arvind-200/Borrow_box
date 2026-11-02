import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { useAuth } from '../context/AuthContext.jsx'

const points = [
  {
    title: 'Compare prices',
    description: 'See the per-day rental price on each listing.',
  },
  {
    title: 'Reduce waste',
    description: 'Give good items a second life locally.',
  },
  {
    title: 'Build community',
    description: 'Browse and list items with people in your community.',
  },
]

export default function AboutPage() {
  const { isAuthenticated } = useAuth()

  return (
    <div className="bg-[#F8FAFC] py-12 px-4 sm:px-6">
      <div className="mx-auto w-full max-w-3xl">
        <div className="text-center">
          <span className="mb-3 inline-flex items-center rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary-700">
            About Us
          </span>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-navy-900">
            A local marketplace for listing and discovering items.
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-base text-neutral-500">
            BorrowBox lets people list items with a pickup area so others can
            browse what is available in the community. Borrow requests, returns,
            and reviews are planned for future phases.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-3">
          {points.map((point) => (
            <Card key={point.title} className="p-6">
              <h2 className="font-display text-lg font-semibold text-navy-900">{point.title}</h2>
              <p className="mt-2 text-[15px] leading-relaxed text-neutral-500">{point.description}</p>
            </Card>
          ))}
        </div>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link to="/browse" className="w-full sm:w-auto">
            <Button size="lg" className="w-full sm:w-auto">
              Browse Items
            </Button>
          </Link>
          {!isAuthenticated && (
            <Link to="/signup" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto bg-white">
                Create Free Account
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
