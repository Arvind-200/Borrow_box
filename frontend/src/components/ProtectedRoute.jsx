import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { LoadingSpinner } from './ui/LoadingSpinner.jsx'

export function ProtectedRoute({ children }) {
  const { isAuthenticated, isAuthLoading } = useAuth()
  const location = useLocation()

  if (isAuthLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  return children
}
