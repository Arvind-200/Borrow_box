import { useState, useRef, useEffect } from 'react'

const mockAreas = [
  { id: 'your-area', label: 'Your Area', subtitle: 'Auto-detected', icon: 'location' },
  { id: 'nearby', label: 'Nearby', subtitle: 'Within 5 km', icon: 'radius' },
  { id: 'area-1', label: 'Central District', subtitle: '2.3 km away', icon: 'map-pin' },
  { id: 'area-2', label: 'Riverside', subtitle: '3.1 km away', icon: 'map-pin' },
  { id: 'area-3', label: 'University Area', subtitle: '4.7 km away', icon: 'map-pin' },
  { id: 'area-4', label: 'Tech Park', subtitle: '5.2 km away', icon: 'map-pin' },
  { id: 'area-5', label: 'Old Town', subtitle: '6.8 km away', icon: 'map-pin' },
]

const icons = {
  location: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  radius: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
  'map-pin': <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
}

export function LocationSelector({ variant = 'default', onChange, selectedAreaId = 'your-area', animated = false }) {
  const [isOpen, setIsOpen] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const buttonRef = useRef(null)
  const listRef = useRef(null)

  const selectedArea = mockAreas.find(a => a.id === selectedAreaId) || mockAreas[0]

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (buttonRef.current && !buttonRef.current.contains(e.target) &&
          listRef.current && !listRef.current.contains(e.target)) {
        setIsOpen(false)
        setFocusedIndex(-1)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setFocusedIndex((prev) => (prev < mockAreas.length - 1 ? prev + 1 : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setFocusedIndex((prev) => (prev > 0 ? prev - 1 : mockAreas.length - 1))
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      if (focusedIndex >= 0) {
        handleSelect(mockAreas[focusedIndex].id)
      } else {
        setIsOpen(!isOpen)
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false)
      setFocusedIndex(-1)
      buttonRef.current?.focus()
    }
  }

  const handleSelect = (areaId) => {
    setIsOpen(false)
    setFocusedIndex(-1)
    if (onChange) {
      onChange(areaId)
    }
  }

  const isCompact = variant === 'compact'

  const revealClasses = animated
    ? `opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 ${isOpen ? 'opacity-100' : ''} transition-opacity duration-300 motion-reduce:transition-none`
    : ''

  return (
    <div ref={buttonRef} className={`relative ${animated ? 'group flex justify-end' : ''}`} onKeyDown={handleKeyDown}>
      <div
        className={
          animated
            ? `w-max max-w-[44px] overflow-hidden transition-[max-width,box-shadow,border-color] duration-300 ease-in-out motion-reduce:transition-none group-hover:max-w-[220px] group-focus-within:max-w-[220px] ${isOpen ? 'max-w-[220px]' : ''}`
            : undefined
        }
      >
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-2 text-base font-medium text-neutral-900
          bg-white border border-neutral-200 rounded-xl
          hover:bg-neutral-50 hover:border-neutral-300
          focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
          transition-all duration-200 shadow-sm
          ${animated
            ? 'h-11 w-full px-0 pr-3 hover:border-primary-300 hover:shadow-md'
            : `px-4 py-2.5 ${isCompact ? 'min-w-[140px]' : 'min-w-[180px]'}`
          }
        `}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`Select location, currently ${selectedArea.label}`}
      >
        <span className={`flex-shrink-0 text-primary-600 ${animated ? 'flex h-11 w-11 items-center justify-center' : ''}`} aria-hidden="true">
          {icons[selectedArea.icon]}
        </span>
        <span className={animated ? `whitespace-nowrap ${revealClasses}` : (isCompact ? 'hidden sm:inline' : 'inline')}>
          {selectedArea.label}
        </span>
        <svg className={`ml-1 transition-transform ${isOpen ? 'rotate-180' : ''} ${animated ? revealClasses : ''}`} width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      </div>

      {isOpen && (
        <div
          ref={listRef}
          className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-neutral-200 shadow-elevated overflow-hidden z-50 animate-slide-in"
          role="listbox"
        >
          <div className="p-2 border-b border-neutral-100">
            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Select your area</p>
          </div>
          <div className="max-h-60 overflow-y-auto">
            {mockAreas.map((area, index) => (
              <button
                key={area.id}
                type="button"
                onClick={() => handleSelect(area.id)}
                onMouseEnter={() => setFocusedIndex(index)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                  text-left text-base text-neutral-900
                  hover:bg-neutral-50 transition-colors
                  ${area.id === selectedAreaId ? 'bg-primary-50 text-primary-700' : ''}
                  ${index === focusedIndex && area.id !== selectedAreaId ? 'bg-neutral-50' : ''}
                `}
                role="option"
                aria-selected={area.id === selectedAreaId}
              >
                <span className="flex-shrink-0 text-neutral-400" aria-hidden="true">
                  {icons[area.icon]}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{area.label}</p>
                  <p className="text-sm text-neutral-500 truncate">{area.subtitle}</p>
                </div>
                {area.id === selectedAreaId && (
                  <svg className="w-5 h-5 text-primary-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}