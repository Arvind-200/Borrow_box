import { useState, useRef, useEffect, useId, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../../services/api'

const icons = {
  camera: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  tools: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  electronics: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
  gaming: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  outdoor: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  events: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
  sports: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>,
  home: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
  history: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  box: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>,
}

export function SearchBar({ variant = 'default', onSearch, placeholder = 'Search for items...', className = '' }) {
  const [query, setQuery] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const [categories, setCategories] = useState([])
  const [productMatches, setProductMatches] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const inputRef = useRef(null)
  const containerRef = useRef(null)
  const navigate = useNavigate()
  const uid = useId().replace(/:/g, '')
  const inputId = `search-input-${uid}`
  const suggestionsId = `search-suggestions-${uid}`

  useEffect(() => {
    let active = true
    api.getCategories()
      .then((data) => {
        if (active) setCategories(data.categories || [])
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    const needle = query.trim()
    if (!needle) {
      setProductMatches([])
      setIsSearching(false)
      return
    }

    let active = true
    setIsSearching(true)
    setProductMatches([])
    const timer = setTimeout(() => {
      api.getProducts({ q: needle, limit: 5 })
        .then((data) => {
          if (active) setProductMatches(data.products || [])
        })
        .catch(() => {
          if (active) setProductMatches([])
        })
        .finally(() => {
          if (active) setIsSearching(false)
        })
    }, 250)

    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [query])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowSuggestions(false)
        setFocusedIndex(-1)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const suggestions = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return []

    const matchingCategories = categories
      .filter((category) => category.name.toLowerCase().includes(needle))
      .slice(0, 4)
      .map((category) => ({
        key: `category-${category.id}`,
        kind: 'category',
        type: 'Category',
        label: category.name,
        icon: category.icon,
        categorySlug: category.slug || category.id,
      }))

    const matchingProducts = productMatches.slice(0, 5).map((product) => ({
      key: `product-${product.id}`,
      kind: 'product',
      type: product.category?.name || 'Product',
      label: product.title,
      icon: product.category?.slug || 'box',
      productId: product.id,
    }))

    return [...matchingCategories, ...matchingProducts]
  }, [query, categories, productMatches])

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setFocusedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setFocusedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (focusedIndex >= 0) {
        handleSelectSuggestion(suggestions[focusedIndex])
      } else if (query.trim()) {
        handleSearch(query.trim())
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
      setFocusedIndex(-1)
      inputRef.current?.blur()
    }
  }

  const handleInputChange = (e) => {
    const value = e.target.value
    setQuery(value)
    setShowSuggestions(value.length > 0)
    setFocusedIndex(-1)
  }

  const handleSelectSuggestion = (suggestion) => {
    setQuery(suggestion.label)
    setShowSuggestions(false)
    setFocusedIndex(-1)

    if (onSearch) {
      onSearch(suggestion.label)
      return
    }

    if (suggestion.kind === 'category') {
      navigate(`/browse?category=${encodeURIComponent(suggestion.categorySlug)}`)
    } else if (suggestion.productId) {
      navigate(`/products/${suggestion.productId}`)
    }
  }

  const handleSearch = (searchQuery) => {
    if (onSearch) {
      onSearch(searchQuery)
      return
    }
    navigate(`/browse?q=${encodeURIComponent(searchQuery)}`)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (query.trim()) {
      handleSearch(query.trim())
    }
  }

  const isFullWidth = variant === 'full'
  const isNavbar = variant === 'navbar'

  return (
    <div ref={containerRef} className={`relative ${isFullWidth ? 'w-full' : 'flex-1'} ${className || 'max-w-2xl'}`}>
      <form onSubmit={handleSubmit} className="relative" role="search">
        <label htmlFor={inputId} className="sr-only">
          Search for items
        </label>
        <div className="relative">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            id={inputId}
            type="search"
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => query.length > 0 && setShowSuggestions(true)}
            placeholder={placeholder}
            className={`
              w-full pl-11 pr-12 py-3.5 text-base text-neutral-900 placeholder:text-neutral-400
              bg-white border border-neutral-200 rounded-xl
              focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
              transition-all duration-200
              ${isNavbar ? 'shadow-sm' : 'shadow-card'}
            `}
            autoComplete="off"
            aria-autocomplete="list"
            aria-controls={suggestionsId}
            aria-expanded={showSuggestions && query.length > 0}
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('')
                setShowSuggestions(false)
                setFocusedIndex(-1)
                inputRef.current?.focus()
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors"
              aria-label="Clear search"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {showSuggestions && query.length > 0 && (
          <div
            id={suggestionsId}
            className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-neutral-200 shadow-elevated overflow-hidden z-50 animate-slide-in"
            role="listbox"
          >
            <div className="p-2 border-b border-neutral-100">
              <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Suggestions</p>
            </div>
            <div className="max-h-60 overflow-y-auto">
              {suggestions.length > 0 ? (
                suggestions.map((suggestion, index) => (
                  <button
                    key={suggestion.key}
                    type="button"
                    onClick={() => handleSelectSuggestion(suggestion)}
                    onMouseEnter={() => setFocusedIndex(index)}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                      text-left text-base text-neutral-900
                      hover:bg-neutral-50 transition-colors
                      ${index === focusedIndex ? 'bg-primary-50 text-primary-700' : ''}
                    `}
                    role="option"
                    aria-selected={index === focusedIndex}
                  >
                    <span className="flex-shrink-0 text-neutral-400" aria-hidden="true">
                      {icons[suggestion.icon] || icons.box}
                    </span>
                    <span className="flex-1 truncate">{suggestion.label}</span>
                    <span className="text-xs text-neutral-400 capitalize">{suggestion.type}</span>
                  </button>
                ))
              ) : (
                <button
                  type="button"
                  onClick={() => handleSearch(query.trim())}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-base text-neutral-900 hover:bg-neutral-50 transition-colors"
                >
                  <span className="flex-1">
                    {isSearching
                      ? 'Searching...'
                      : `No matches — press Enter to search for “${query.trim()}”`}
                  </span>
                </button>
              )}
            </div>
            <div className="p-2 border-t border-neutral-100">
              <Link
                to="/browse"
                onClick={() => setShowSuggestions(false)}
                className="flex items-center justify-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Browse all categories
              </Link>
            </div>
          </div>
        )}
      </form>
    </div>
  )
}
