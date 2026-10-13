import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'

export default function NotFoundPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-gray-100">404</h1>
        <h2 className="text-3xl font-semibold text-gray-900 mt-4 mb-2">Page not found</h2>
        <p className="text-gray-600 mb-8 max-w-md mx-auto">
          Sorry, we couldn't find the page you're looking for. It might have been moved or doesn't exist.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/">
            <Button size="lg">Go Home</Button>
          </Link>
          <Link to="/browse">
            <Button variant="outline" size="lg">Browse Items</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}