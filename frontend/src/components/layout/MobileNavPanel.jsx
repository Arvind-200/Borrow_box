import { useEffect, Fragment, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { createPortal } from 'react-dom'
import { Button } from '../ui/Button'
import { SearchBar } from '../search/SearchBar'
import { LocationSelector } from '../search/LocationSelector'
import { LoadingSpinner } from '../ui/LoadingSpinner'
import { Logo } from '../ui/Logo.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { useToast } from '../ui/Toast.jsx'
import { ConfirmDialog } from '../ui/Modal'

const navLinks = [
  { path: '/', label: 'Home', icon: 'home' },
  { path: '/browse', label: 'Browse Items', icon: 'search' },
  { path: '/categories', label: 'Categories', icon: 'categories' },
  { path: '/my-products', label: 'My Products', icon: 'box' },
  { path: '/about', label: 'About Us', icon: 'info' },
]

const icons = {
  home: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
  search: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
  categories: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" /></svg>,
  info: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  box: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>,
}

export function MobileNavPanel({ isOpen, onClose }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, isAuthenticated, isAuthLoading, logout } = useAuth()
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
      onClose()
    } catch (error) {
      toast.error('Log out failed', error.message || 'Please try again.')
    } finally {
      setIsLoggingOut(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = 'unset'
      }
    }
  }, [isOpen])

  if (!isOpen) return null

  const panelContent = (
    <Fragment>
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-fade-in lg:hidden"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="fixed inset-y-0 right-0 w-full max-w-sm lg:hidden z-50 flex flex-col animate-slide-in">
        <div className="flex items-center justify-between p-4 border-b border-neutral-100 bg-white">
          <Link to="/" className="flex items-center gap-2" aria-label="BorrowBox Home" onClick={onClose}>
            <Logo size="md" />
          </Link>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors lg:hidden"
            aria-label="Close menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-white">
          <div className="space-y-4">
            <SearchBar variant="full" placeholder="Search items: tools, cameras, camping gear..." />
            <LocationSelector variant="default" />
          </div>

          <nav aria-label="Main navigation">
            <ul className="space-y-1" role="list">
              {navLinks.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    onClick={onClose}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-colors
                      ${location.pathname === link.path
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900'
                      }
                    `}
                  >
                    <span className="flex-shrink-0 text-neutral-400" aria-hidden="true">
                      {icons[link.icon]}
                    </span>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="pt-4 border-t border-neutral-100 space-y-3">
            {isAuthLoading ? (
              <div className="flex justify-center py-2">
                <LoadingSpinner size="sm" />
              </div>
            ) : isAuthenticated ? (
              <>
                <p className="px-1 text-sm font-medium text-neutral-700 truncate" title={user?.name || 'Account'}>
                  Signed in as {user?.name || 'Account'}
                </p>
                <ConfirmDialog
                    isOpen={isConfirmOpen}
                    onClose={() => setIsConfirmOpen(false)}
                    onConfirm={handleLogoutConfirm}
                    title="Are you sure you want to log out?"
                    confirmText="Yes, Logout"
                    cancelText="Cancel"
                  />
                  <Button variant="outline" onClick={handleLogout} disabled={isLoggingOut} className="w-full bg-white">
                    Log out
                  </Button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={onClose}>
                  <Button variant="ghost" className="w-full justify-start px-4 py-3 text-left">
                    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    Log in
                  </Button>
                </Link>
                <Link to="/signup" onClick={onClose}>
                  <Button className="w-full justify-start px-4 py-3 text-left">
                    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    Sign up
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-neutral-100 bg-white">
          <p className="text-xs text-center text-neutral-500">
            Borrow what you need. Lend what you have.
          </p>
        </div>
      </div>
    </Fragment>
  )

  return createPortal(panelContent, document.body)
}