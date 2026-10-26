import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/Card'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../components/ui/Toast.jsx'
import { Logo } from '../components/ui/Logo.jsx'

// Only same-origin, non-API paths may be used as return destinations.
function isSafeInternalPath(path) {
  return (
    typeof path === 'string' &&
    path.startsWith('/') &&
    !path.startsWith('//') &&
    !path.startsWith('/api')
  )
}

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  const toast = useToast()
  const [initialEmail] = useState(() => {
    const fromState = location.state?.email
    return typeof fromState === 'string' && fromState.includes('@') ? fromState : ''
  })
  const [formData, setFormData] = useState({ email: initialEmail, password: '' })
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const validate = () => {
    const newErrors = {}
    if (!formData.email) newErrors.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Enter a valid email address'
    if (!formData.password) newErrors.password = 'Password is required'
    else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (isLoading) return
    if (!validate()) return
    setSubmitError('')
    setIsLoading(true)
    try {
      await login(formData.email.trim(), formData.password)
      toast.success('Welcome back!', 'You are now signed in.')
      const returnTo = location.state?.from
      navigate(isSafeInternalPath(returnTo) ? returnTo : '/', { replace: true })
    } catch (error) {
      // Keep the entered email so the user only needs to fix the password.
      setFormData((prev) => ({ ...prev, password: '' }))
      setSubmitError(error.message || 'Unable to sign in. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-[#F8FAFC] py-12 px-4 sm:px-6">
      <div className="mx-auto w-full max-w-md">
        <Link to="/" className="mx-auto mb-6 flex w-fit items-center gap-2 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500" aria-label="BorrowBox Home">
          <Logo size="md" />
        </Link>
        <Card className="p-6 sm:p-8">
          <CardHeader className="text-center">
            <CardTitle className="font-display text-2xl">Welcome back</CardTitle>
            <CardDescription>Sign in to borrow and lend with neighbors</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <Input
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
                placeholder="you@example.com"
                autoComplete="email"
                disabled={isLoading}
              />
              <div>
                <Input
                  label="Password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  error={errors.password}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="mt-2 text-sm font-medium text-primary-600 hover:text-primary-700 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                  aria-pressed={showPassword}
                >
                  {showPassword ? 'Hide password' : 'Show password'}
                </button>
              </div>
              <div className="flex items-center justify-between gap-3">
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-neutral-500">Remember me</span>
                </label>
                <Link to="/forgot-password" className="text-sm font-medium text-primary-600 hover:text-primary-700 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500">
                  Forgot password?
                </Link>
              </div>
              {submitError && (
                <div className="rounded-xl border border-error-500/30 bg-error-50 px-4 py-3 text-sm text-error-700" role="alert">
                  {submitError}
                </div>
              )}
              <Button type="submit" className="w-full" size="lg" loading={isLoading}>
                Sign in
              </Button>
            </form>
          </CardContent>
          <CardFooter className="justify-center">
            <p className="text-sm text-neutral-500">
              Don&apos;t have an account?{' '}
              <Link to="/signup" className="font-semibold text-primary-600 hover:text-primary-700">
                Sign up
              </Link>
            </p>
          </CardFooter>
        </Card>
        <p className="mt-6 text-center text-[13px] text-neutral-500">
          Protected by community guidelines and reporting &amp; safety tools.
        </p>
      </div>
    </div>
  )
}
