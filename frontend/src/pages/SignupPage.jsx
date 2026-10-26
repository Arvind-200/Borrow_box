import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/Card'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../components/ui/Toast.jsx'
import { Logo } from '../components/ui/Logo.jsx'

export default function SignupPage() {
  const navigate = useNavigate()
  const { signup } = useAuth()
  const toast = useToast()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
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
    if (!formData.name.trim()) newErrors.name = 'Full name is required'
    else if (formData.name.trim().length < 2) newErrors.name = 'Name must be at least 2 characters'
    if (!formData.email) newErrors.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Enter a valid email address'
    if (!formData.password) newErrors.password = 'Password is required'
    else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters'
    if (!formData.confirmPassword) newErrors.confirmPassword = 'Please confirm your password'
    else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match'
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
      // The backend does not authenticate on signup, so we send the user
      // to login with their email prefilled.
      await signup(formData.name.trim(), formData.email.trim(), formData.password)
      toast.success('Account created', 'Please log in to continue.')
      navigate('/login', { state: { email: formData.email.trim() }, replace: true })
    } catch (error) {
      setSubmitError(error.message || 'Unable to create your account. Please try again.')
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
            <CardTitle className="font-display text-2xl">Create an account</CardTitle>
            <CardDescription>Join BorrowBox and start borrowing today</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <Input
                label="Full Name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                error={errors.name}
                placeholder="Jane Neighbor"
                autoComplete="name"
                disabled={isLoading}
              />
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
                  placeholder="Create a password"
                  autoComplete="new-password"
                  helperText="At least 6 characters"
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
              <Input
                label="Confirm Password"
                name="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={handleChange}
                error={errors.confirmPassword}
                placeholder="Repeat your password"
                autoComplete="new-password"
                disabled={isLoading}
              />
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="terms"
                  required
                  className="mt-1 h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="terms" className="text-sm text-neutral-500">
                  I agree to the{' '}
                  <Link to="/terms" className="font-medium text-primary-600 hover:text-primary-700">Terms of Service</Link>
                  {' '}and{' '}
                  <Link to="/privacy" className="font-medium text-primary-600 hover:text-primary-700">Privacy Policy</Link>
                </label>
              </div>
              {submitError && (
                <div className="rounded-xl border border-error-500/30 bg-error-50 px-4 py-3 text-sm text-error-700" role="alert">
                  {submitError}
                </div>
              )}
              <Button type="submit" className="w-full" size="lg" loading={isLoading}>
                Create account
              </Button>
            </form>
          </CardContent>
          <CardFooter className="justify-center">
            <p className="text-sm text-neutral-500">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-primary-600 hover:text-primary-700">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </Card>
        <p className="mt-6 text-center text-[13px] text-neutral-500">
          Free to join. Borrow nearby and lend what you own.
        </p>
      </div>
    </div>
  )
}
