import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Logo } from '../ui/Logo.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { useToast } from '../ui/Toast.jsx'
import { AdminIcon } from './AdminIcon.jsx'

const NAV_SECTIONS = [
  {
    label: 'Overview',
    items: [{ to: '/admin', label: 'Dashboard', icon: 'dashboard', end: true }],
  },
  {
    label: 'Marketplace',
    items: [
      { to: '/admin/users', label: 'Users', icon: 'users' },
      { to: '/admin/listings', label: 'Listings', icon: 'listings' },
      { to: '/admin/requests', label: 'Borrow requests', icon: 'requests' },
    ],
  },
  {
    label: 'Moderation',
    items: [
      { to: '/admin/reports', label: 'Reports', icon: 'reports' },
      { to: '/admin/reviews', label: 'Reviews', icon: 'reviews' },
    ],
  },
  {
    label: 'System',
    items: [
      { to: '/admin/categories', label: 'Categories', icon: 'categories' },
      { to: '/admin/activity', label: 'Activity log', icon: 'activity' },
      { to: '/admin/settings', label: 'Settings', icon: 'settings' },
    ],
  },
]

function getInitials(name = '') {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'A'
  )
}

function navClass({ isActive }) {
  return `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
    isActive
      ? 'bg-primary-500/15 text-primary-300'
      : 'text-white/60 hover:bg-white/[0.06] hover:text-white'
  }`
}

function SidebarContent({ onNavigate }) {
  const { user } = useAuth()

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-2.5 border-b border-white/[0.08] px-5">
        <Link
          to="/admin"
          onClick={onNavigate}
          className="flex items-center gap-2 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
          aria-label="BorrowBox admin home"
        >
          <Logo variant="dark" size="md" />
        </Link>
        <span className="rounded-md bg-primary-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-300">
          Admin
        </span>
      </div>

      <div className="px-5 pb-2 pt-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/30">
          Control room
        </p>
        <p className="mt-1 text-xs text-white/45">
          Moderate the marketplace and keep it trusted.
        </p>
      </div>

      <nav
        className="flex-1 space-y-6 overflow-y-auto px-3 py-4"
        aria-label="Admin navigation"
      >
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/30">
              {section.label}
            </p>
            <ul className="space-y-1">
              {section.items.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    onClick={onNavigate}
                    className={navClass}
                  >
                    <AdminIcon
                      name={item.icon}
                      className="h-[18px] w-[18px] flex-shrink-0"
                    />
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/[0.08] p-4">
        <div className="flex items-center gap-3 rounded-xl bg-white/[0.04] p-3">
          <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary-500/20 text-xs font-bold text-primary-300">
            {getInitials(user?.name)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">
              {user?.name || 'Administrator'}
            </p>
            <p className="truncate text-[11px] text-white/40">
              {user?.email || 'admin'}
            </p>
          </div>
        </div>
        <Link
          to="/"
          onClick={onNavigate}
          className="mt-3 flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-white/45 transition-colors hover:bg-white/[0.06] hover:text-white"
        >
          <AdminIcon name="arrowLeft" className="h-4 w-4" />
          Back to marketplace
        </Link>
      </div>
    </div>
  )
}

export function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, logout } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await logout()
      toast.success('Logged out', 'Your admin session has ended.')
      navigate('/')
    } catch (error) {
      toast.error('Log out failed', error.message || 'Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-[#0F1626]/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close admin navigation"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[272px] bg-[#0F1626] shadow-2xl transition-transform duration-200 ease-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <button
          type="button"
          onClick={() => setSidebarOpen(false)}
          className="absolute right-3 top-4 rounded-lg p-2 text-white/50 transition-colors hover:bg-white/10 hover:text-white lg:hidden"
          aria-label="Close menu"
        >
          <AdminIcon name="close" className="h-5 w-5" />
        </button>
        <SidebarContent onNavigate={() => setSidebarOpen(false)} />
      </aside>

      <div className="lg:pl-[272px]">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-[#E2E8F0] bg-white/90 px-4 backdrop-blur sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-2 text-[#475569] transition-colors hover:bg-[#F1F5F9] lg:hidden"
            aria-label="Open admin menu"
            aria-expanded={sidebarOpen}
          >
            <AdminIcon name="menu" className="h-5 w-5" />
          </button>

          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#94A3B8]">
              BorrowBox Admin
            </p>
            <p className="truncate text-sm font-semibold text-[#0F1626]">
              Marketplace operations
            </p>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Link
              to="/"
              className="hidden items-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-xs font-semibold text-[#475569] transition-colors hover:bg-[#F8FAFC] sm:inline-flex"
            >
              <AdminIcon name="arrowLeft" className="h-3.5 w-3.5" />
              Marketplace
            </Link>
            <span className="hidden h-6 w-px bg-[#E2E8F0] sm:block" aria-hidden="true" />
            <span
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0F1626] text-[11px] font-bold text-primary-300"
              title={user?.name || 'Administrator'}
            >
              {getInitials(user?.name)}
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg p-2 text-[#64748B] transition-colors hover:bg-[#F1F5F9] hover:text-[#0F1626]"
              aria-label="Log out"
              title="Log out"
            >
              <AdminIcon name="logout" className="h-[18px] w-[18px]" />
            </button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
