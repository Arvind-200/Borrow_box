import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Button } from '../ui/Button'
import { SearchBar } from '../search/SearchBar'
import { LocationSelector } from '../search/LocationSelector'
import { MobileNavPanel } from './MobileNavPanel'
import { LoadingSpinner } from '../ui/LoadingSpinner'
import { Logo } from '../ui/Logo.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { useToast } from '../ui/Toast.jsx'
import { ConfirmDialog } from '../ui/Modal'

const navLinks = [
  { path: '/', label: 'Home' },
  { path: '/browse', label: 'Browse Items' },
  { path: '/categories', label: 'Categories' },
  { path: '/my-products', label: 'My Products' },
  { path: '/about', label: 'About Us' },
]

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, status, isAuthenticated, isAuthLoading, logout } = useAuth()
  const toast = useToast()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const [isConfirmOpen, setIsConfirmOpen] = useState(false)

  const handleLogout = async () => {
    setIsConfirmOpen(true)
  }

  const handleLogoutConfirm = async () => {
    setIsConfirmOpen(false)
    setIsLoggingOut(true)
    try {
      await logout()
      toast.success('Logged out', 'You have been signed out.')
      navigate('/')
    } catch (error) {
      toast.error('Log out failed', error.message || 'Please try again.')
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <>
      <nav className="bg-navy-900 text-white sticky top-0 z-40 shadow-elevated" aria-label="Primary">
        <div className="container-page">
          {/* Main row: logo left, search center, auth right */}
          <div className="flex items-center gap-3 lg:gap-6 h-16 lg:h-[4.5rem]">
            <Link to="/" className="flex items-center gap-2 flex-shrink-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400" aria-label="BorrowBox Home">
              <Logo variant="dark" size="md" />
            </Link>

            <div className="hidden lg:flex flex-1 justify-center min-w-0 px-2">
              <SearchBar
                variant="navbar"
                className="w-full max-w-3xl"
                placeholder="Search items: tools, cameras, camping gear..."
              />
            </div>

            <div className="hidden lg:flex items-center gap-3 flex-shrink-0 ml-auto">
              {isAuthLoading ? (
                <LoadingSpinner size="sm" />
              ) : isAuthenticated ? (
                <>
                  <span
                    className="max-w-[10rem] truncate text-sm font-medium text-white/85"
                    title={user?.name || 'Account'}
                  >
                    {user?.name || 'Account'}
                  </span>
                  <ConfirmDialog
                    isOpen={isConfirmOpen}
                    onClose={() => setIsConfirmOpen(false)}
                    onConfirm={handleLogoutConfirm}
                    title="Are you sure you want to log out?"
                    confirmText="Yes, Logout"
                    cancelText="Cancel"
                  />
                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="px-4 py-2.5 rounded-xl text-[15px] font-semibold text-white/85 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-60"
                  >
                    Log out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="px-4 py-2.5 rounded-xl text-[15px] font-semibold text-white/85 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    Log in
                  </Link>
                  <Link
                    to="/signup"
                    className="px-5 py-2.5 rounded-xl text-[15px] font-semibold bg-primary-500 text-white hover:bg-primary-600 shadow-sm transition-colors"
                  >
                    Sign up
                  </Link>
                </>
              )}
            </div>

            <div className="lg:hidden flex items-center gap-2 ml-auto">
              <Link
                to="/products/new"
                className="px-3 py-2 rounded-lg text-sm font-semibold bg-primary-500 text-white hover:bg-primary-600 transition-colors"
              >
                List an Item
              </Link>
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="p-2 rounded-lg text-white/85 hover:bg-white/10 hover:text-white transition-colors"
                aria-label="Open menu"
                aria-expanded={mobileMenuOpen}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>

          {/* Secondary row: nav links + location selector */}
          <div className="hidden lg:flex items-center justify-between gap-4 pb-3">
            <div className="flex items-center gap-1.5">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`
                    px-4 py-2.5 rounded-lg text-[15px] font-medium whitespace-nowrap transition-colors
                    ${location.pathname === link.path
                      ? 'bg-white/15 text-white'
                      : 'text-white/65 hover:bg-white/10 hover:text-white'
                    }
                  `}
                  aria-current={location.pathname === link.path ? 'page' : undefined}
                >
                  {link.label}
                </Link>
              ))}
            </div>
            <div className="flex-shrink-0">
              <LocationSelector variant="compact" animated />
            </div>
          </div>
        </div>
      </nav>

      <MobileNavPanel isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
    </>
  )
}
