import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../components/ui/Toast.jsx'

export default function MyProductsPage() {
  const { isAuthenticated, isAuthLoading } = useAuth()
  const toast = useToast()

  if (isAuthLoading) {
    return (
      <div className="bg-[#F8FAFC] py-12 px-4 sm:px-6">
        <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  const pageHeader = (
    <div className="text-center">
      <span className="mb-3 inline-flex items-center rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary-700">
        My Products
      </span>
      <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-navy-900">
        Manage your listings
      </h1>
      <p className="mx-auto mt-3 max-w-xl text-base text-neutral-500">
        Your add, edit, unpublish, and incoming-request tools live here.
      </p>
    </div>
  )

  if (!isAuthenticated) {
    // Fallback; ProtectedRoute redirects unauthenticated users to /login
    // before this component renders, so this branch is not reached in practice.
    return (
      <div className="bg-[#F8FAFC] py-12 px-4 sm:px-6">
        <div className="mx-auto w-full max-w-2xl">{pageHeader}</div>
        <Card className="mt-8 p-6 sm:p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <h2 className="font-display text-xl font-semibold text-navy-900">
            Sign in to manage your items
          </h2>
          <p className="mx-auto mt-2 max-w-md text-[15px] text-neutral-500">
            Listing tools are protected. Sign in or create a free account,
            and you will be ready the moment they launch.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/login" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto">
                Sign in
              </Button>
            </Link>
            <Link to="/browse" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto bg-white">
                Browse Items
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="bg-[#F8FAFC] py-12 px-4 sm:px-6">
      <div className="mx-auto w-full max-w-2xl">{pageHeader}</div>
      <Card className="mt-8 p-6 sm:p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
        <h2 className="font-display text-xl font-semibold text-navy-900">No products yet</h2>
        <p className="mx-auto mt-2 max-w-md text-[15px] text-neutral-500">
          You haven't listed any items yet. List your first product to start lending to people nearby.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link to="/browse" className="w-full sm:w-auto">
            <Button variant="outline" size="lg" className="w-full sm:w-auto bg-white">
              Browse Items
            </Button>
          </Link>
          <Button
            size="lg"
            variant="primary"
            className="w-full sm:w-auto"
            onClick={() =>
              toast.info(
                'Listing creation is coming soon',
                'Product creation and owner tools will be enabled in the next phase.'
              )
            }
          >
            + List a Product
          </Button>
        </div>
      </Card>
    </div>
  )
}
