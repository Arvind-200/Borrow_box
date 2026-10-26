export function Logo({ size = 'md', showTagline = false, variant = 'light', className = '' }) {
  const sizeMap = {
    sm: { icon: 'w-8 h-8', title: 'text-base', tagline: 'text-[10px]' },
    md: { icon: 'w-10 h-10', title: 'text-xl', tagline: 'text-[10px]' },
    lg: { icon: 'w-12 h-12', title: 'text-2xl', tagline: 'text-[11px]' },
  }

  const { icon, title, tagline } = sizeMap[size]
  const borrowColor = variant === 'dark' ? 'text-white' : 'text-[#172033]'
  const taglineColor = variant === 'dark' ? 'text-white/80' : 'text-[#172033]/80'

  return (
    <>
      <svg
        viewBox="0 0 32 32"
        className={`flex-shrink-0 ${icon}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Outer circular exchange/borrow arrows */}
        <path d="M10 16 A6 6 0 0 1 22 16" stroke="#34D399" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M22 16 A6 6 0 0 0 10 16" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M22 16 L20.5 15 L21.5 16 L20.5 17" fill="#34D399" />
        <path d="M10 16 L11.5 15 L10.5 16 L11.5 17" fill="#10B981" />
        {/* Open 3D isometric box */}
        <polygon points="16,11 20,14 16,17 12,14" fill="#172033" />
        <polygon points="12,14 12,20 16,17 16,23" fill="#10B981" />
        <polygon points="20,14 20,20 16,23 16,17" fill="#34D399" />
      </svg>
      <div className={`flex flex-col items-start ${className}`}>
        <span className={`font-display font-extrabold tracking-tight ${title}`}>
          <span className={borrowColor}>Borrow</span>
          <span className="text-[#10B981]">Box</span>
        </span>
        {showTagline && (
          <span className={`font-semibold tracking-[0.2em] uppercase ${tagline} ${taglineColor}`}>
            PEER-TO-PEER MARKETPLACE
          </span>
        )}
      </div>
    </>
  )
}
