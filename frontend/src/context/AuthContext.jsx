import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { api } from '../services/api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    let cancelled = false

    api.me()
      .then((data) => {
        if (cancelled) return
        if (data?.user) {
          setUser(data.user)
          setStatus('authenticated')
        } else {
          setStatus('unauthenticated')
        }
      })
      .catch((error) => {
        if (cancelled) return
        setStatus('unauthenticated')
      })

    return () => {
      cancelled = true
    }
  }, [])

  // Revalidate session on browser Back/Forward cache (pageshow event)
  useEffect(() => {
    const handlePageshow = (event) => {
      if (event.persisted) {
        // Page restored from b/f cache; revalidate session
        api.me()
          .then((data) => {
            if (data?.user) {
              setUser(data.user)
              setStatus('authenticated')
            } else {
              setStatus('unauthenticated')
            }
          })
          .catch((error) => {
            setStatus('unauthenticated')
          })
      }
    }
    window.addEventListener('pageshow', handlePageshow)
    return () => window.removeEventListener('pageshow', handlePageshow)
  }, [])

  const login = useCallback(async (email, password) => {
    const data = await api.login({ email, password })
    setUser(data.user)
    setStatus('authenticated')
    return data.user
  }, [])

  const signup = useCallback(async (name, email, password) => {
    const data = await api.signup({ name, email, password })
    return data.user
  }, [])

  const logout = useCallback(async () => {
    await api.logout()
    setUser(null)
    setStatus('unauthenticated')
  }, [])

  const refresh = useCallback(async () => {
    const data = await api.me()
    if (data?.user) {
      setUser(data.user)
      setStatus('authenticated')
    } else {
      setUser(null)
      setStatus('unauthenticated')
    }
  }, [])

  const value = {
    user,
    status,
    isAuthenticated: status === 'authenticated',
    isAuthLoading: status === 'loading',
    login,
    signup,
    logout,
    refresh,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}