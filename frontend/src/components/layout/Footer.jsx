import { Link } from 'react-router-dom'
import { Logo } from '../ui/Logo.jsx'

const borrowLinks = [
  { label: 'Browse Items', path: '/browse' },
  { label: 'Categories', path: '/categories' },
  { label: 'How It Works', path: '/#how-it-works' },
]

const lendLinks = [
  { label: 'List an Item', path: '/products/new' },
  { label: 'How Lending Works', path: '/#how-it-works' },
  { label: 'Community Guidelines', path: '/guidelines' },
]

const supportLinks = [
  { label: 'Help Center', path: '/help' },
  { label: 'Contact Us', path: '/contact' },
  { label: 'Safety & Reporting', path: '/safety' },
]

const legalLinks = [
  { label: 'Privacy Policy', path: '/privacy' },
  { label: 'Terms of Service', path: '/terms' },
  { label: 'Cookie Policy', path: '/cookies' },
  { label: 'Trust & Safety', path: '/safety' },
]

const trustBadges = [
  {
    title: 'Verified Profiles',
    description: 'Identity verified users',
    icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
  },
  {
    title: 'Ratings & Reviews',
    description: 'Two-way review system',
    icon: <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>,
  },
  {
    title: 'Community Guidelines',
    description: 'Safe & respectful borrowing',
    icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
  },
  {
    title: 'Reporting & Safety',
    description: '24/7 safety support',
    icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 lg:gap-10 mb-12">
          <div className="col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4" aria-label="BorrowBox Home">
              <Logo variant="dark" showTagline size="lg" />
            </Link>
            <div className="flex gap-3">
              <a href="#" className="p-2 rounded-lg text-white/55 hover:text-white hover:bg-white/10 transition-colors" aria-label="Twitter">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z" /></svg>
              </a>
              <a href="#" className="p-2 rounded-lg text-white/55 hover:text-white hover:bg-white/10 transition-colors" aria-label="Facebook">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" /></svg>
              </a>
              <a href="#" className="p-2 rounded-lg text-white/55 hover:text-white hover:bg-white/10 transition-colors" aria-label="Instagram">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" stroke="currentColor" strokeWidth="2" /><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" stroke="currentColor" strokeWidth="2" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" stroke="currentColor" strokeWidth="2" /></svg>
              </a>
              <a href="#" className="p-2 rounded-lg text-white/55 hover:text-white hover:bg-white/10 transition-colors" aria-label="LinkedIn">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
              </a>
            </div>
          </div>

          <FooterColumn title="Borrow" links={borrowLinks} />
          <FooterColumn title="Lend" links={lendLinks} />
          <FooterColumn title="Support" links={supportLinks} />
          <FooterColumn title="Legal" links={legalLinks} />
        </div>

        <div className="mb-10">
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-5">Trust & Safety</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {trustBadges.map((badge) => (
              <div key={badge.title} className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="w-11 h-11 flex-shrink-0 flex items-center justify-center rounded-xl bg-primary-500/15 text-primary-300">
                  {badge.icon}
                </div>
                <div className="min-w-0">
                  <h4 className="font-semibold text-white text-[15px] leading-snug">{badge.title}</h4>
                  <p className="text-[13px] text-white/55 leading-snug">{badge.description}</p>
                </div>
              </div>
            ))}
          </div>
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
