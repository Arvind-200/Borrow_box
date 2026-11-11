import { Link, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { LoadingSpinner } from './ui/LoadingSpinner.jsx'
import { AdminIcon } from './admin/AdminIcon.jsx'

export function AdminRoute({ children }) {
  const { user, isAuthenticated, isAuthLoading } = useAuth()
  const location = useLocation()

  if (isAuthLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        state={{ from: `${location.pathname}${location.search}` }}
        replace
      />
    )
  }

  if (user?.role !== 'admin') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0F1626] px-4 py-12">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white p-8 text-center shadow-2xl">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
            <AdminIcon name="shield" className="h-7 w-7" />
          </span>
          <h1 className="mt-5 font-display text-2xl font-bold text-[#0F1626]">
            Admin access required
          </h1>
          <p className="mt-2 text-sm text-[#64748B]">
            Your account does not have permission to open the BorrowBox admin
            console.
          </p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-600"
            >
              <AdminIcon name="arrowLeft" className="h-4 w-4" />
              Back to marketplace
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center rounded-xl border border-[#E2E8F0] bg-white px-5 py-2.5 text-sm font-semibold text-[#334155] transition-colors hover:bg-[#F8FAFC]"
            >
              Switch account
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return children
}
