import { Link } from 'react-router-dom'
import { Logo } from '../ui/Logo.jsx'

const browseLinks = [
  { label: 'Browse Items', path: '/browse' },
  { label: 'Categories', path: '/categories' },
  { label: 'How It Works', path: '/#how-it-works' },
]

const lendLinks = [
  { label: 'List an Item', path: '/products/new' },
  { label: 'My Products', path: '/my-products' },
  { label: 'How It Works', path: '/#how-it-works' },
]

const accountLinks = [
  { label: 'Log in', path: '/login' },
  { label: 'Sign up', path: '/signup' },
  { label: 'About Us', path: '/about' },
]

const platformItems = [
  {
    title: 'Browse local listings',
    description: 'Search the catalog and see each listing pickup area.',
    icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
  },
  {
    title: 'Manage your listings',
    description: 'Create, edit, publish, and unpublish your own items.',
    icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>,
  },
  {
    title: 'Secure accounts',
    description: 'Passwords are hashed and sessions use HttpOnly cookies.',
    icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>,
  },
]

function FooterColumn({ title, links }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-5">{title}</h3>
      <ul className="space-y-4" role="list">
        {links.map((link) => (
          <li key={`${title}-${link.path}-${link.label}`}>
            <Link to={link.path} className="text-[15px] text-white/70 hover:text-white transition-colors">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function Footer() {
  return (
    <footer className="bg-navy-900 text-white/70">
      <div className="container-page py-14 lg:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-10 mb-12">
          <div className="col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4" aria-label="BorrowBox Home">
              <Logo variant="dark" showTagline size="lg" />
            </Link>
            <p className="max-w-sm text-[15px] leading-relaxed text-white/60">
              A local marketplace for browsing items and managing your own listings.
            </p>
          </div>

          <FooterColumn title="Browse" links={browseLinks} />
          <FooterColumn title="Lend" links={lendLinks} />
          <FooterColumn title="Account" links={accountLinks} />
        </div>

        <div className="mb-10">
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-5">Available Today</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {platformItems.map((item) => (
              <div key={item.title} className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="w-11 h-11 flex-shrink-0 flex items-center justify-center rounded-xl bg-primary-500/15 text-primary-300">
                  {item.icon}
                </div>
                <div className="min-w-0">
                  <h4 className="font-semibold text-white text-[15px] leading-snug">{item.title}</h4>
                  <p className="text-[13px] text-white/55 leading-snug">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-white/50">
            Borrow requests are available now. Reviews, reporting, and admin tools are coming in future phases.
          </p>
        </div>

        <div className="pt-7 border-t border-white/10">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-5">
            <p className="text-sm text-white/50 text-center lg:text-left">
              &copy; {new Date().getFullYear()} BorrowBox. All rights reserved.
            </p>
            <p className="text-sm text-white/50 text-center lg:text-left">
              Made with care for local communities
            </p>
            <div className="flex items-center gap-3 text-[13px] text-white/60">
              <span className="px-3 py-1.5 rounded-full bg-white/10">India</span>
              <span className="px-3 py-1.5 rounded-full bg-white/10">English</span>
              <span className="px-3 py-1.5 rounded-full bg-white/10">₹ INR</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
