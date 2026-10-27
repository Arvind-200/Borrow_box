import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../services/api'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { ErrorState } from '../components/ui/ErrorState'
import { Input } from '../components/ui/Input'
import { useToast } from '../components/ui/Toast'
import {
  ProductCategoryIcon,
  getCategoryGradient,
} from '../components/product/productVisuals'

const CONDITION_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'like-new', label: 'Like new' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
]

const AVAILABILITY_OPTIONS = [
  { value: 'available', label: 'Available to borrow' },
  { value: 'unavailable', label: 'Currently unavailable' },
]

const EMPTY_FORM = {
  title: '',
  category: '',
  rentPerDay: '',
  location: '',
  condition: 'good',
  availability: 'available',
  description: '',
  tags: '',
}

const fieldClass =
  'w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-navy-900 transition-all duration-200 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500'

function parseTags(value) {
  return value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
}

function validateForm(form) {
  const errors = {}
  const title = form.title.trim()
  const description = form.description.trim()
  const location = form.location.trim()
  const rent = Number(form.rentPerDay)
  const tags = parseTags(form.tags)

  if (title.length < 3) errors.title = 'Title must be at least 3 characters.'
  else if (title.length > 120) errors.title = 'Title cannot exceed 120 characters.'

  if (!form.category) errors.category = 'Choose a category.'

  if (form.rentPerDay.trim() === '' || !Number.isFinite(rent)) {
    errors.rentPerDay = 'Enter a valid daily rent.'
  } else if (rent < 0) {
    errors.rentPerDay = 'Daily rent cannot be negative.'
  } else if (rent > 1000000) {
    errors.rentPerDay = 'Daily rent cannot exceed ₹10,00,000.'
  }

  if (!location) errors.location = 'Pickup area is required.'
  else if (location.length > 100) errors.location = 'Pickup area cannot exceed 100 characters.'

  if (description.length < 10) {
    errors.description = 'Description must be at least 10 characters.'
  } else if (description.length > 2000) {
    errors.description = 'Description cannot exceed 2000 characters.'
  }

  if (tags.length > 10) errors.tags = 'Use at most 10 tags.'
  else if (tags.some((tag) => tag.length > 30)) {
    errors.tags = 'Each tag must be 30 characters or fewer.'
  }

  return errors
}

function FieldError({ children }) {
  if (!children) return null
  return (
    <p className="mt-1.5 text-sm text-error-600" role="alert">
      {children}
    </p>
  )
}

export default function ProductFormPage() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const toast = useToast()

  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const [categories, setCategories] = useState([])
  const [categoriesStatus, setCategoriesStatus] = useState('loading')
  const [categoriesError, setCategoriesError] = useState('')
  const [categoriesReloadKey, setCategoriesReloadKey] = useState(0)

  const [product, setProduct] = useState(null)
  const [productStatus, setProductStatus] = useState(isEdit ? 'loading' : 'ready')
  const [productError, setProductError] = useState(null)
  const [productReloadKey, setProductReloadKey] = useState(0)

  useEffect(() => {
    let active = true
    setCategoriesStatus('loading')
    setCategoriesError('')

    api.getCategories()
      .then((data) => {
        if (!active) return
        setCategories(data.categories || [])
        setCategoriesStatus('success')
      })
      .catch((error) => {
        if (!active) return
        setCategoriesError(error.message || 'Unable to load categories.')
        setCategoriesStatus('error')
      })

    return () => {
      active = false
    }
  }, [categoriesReloadKey])

  useEffect(() => {
    if (!isEdit) return

    let active = true
    setProductStatus('loading')
    setProductError(null)

    api.getMyProduct(id)
      .then((data) => {
        if (!active) return
        const item = data.product
        setProduct(item)
        setForm({
          title: item.title || '',
          category: item.category?.id || '',
          rentPerDay: String(item.rentPerDay ?? ''),
          location: item.location || '',
          condition: item.condition || 'good',
          availability: item.availability || 'available',
          description: item.description || '',
          tags: (item.tags || []).join(', '),
        })
        setProductStatus('success')
      })
      .catch((error) => {
        if (!active) return
        setProductError(error)
        setProductStatus('error')
      })

    return () => {
      active = false
    }
  }, [id, isEdit, productReloadKey])

  const selectedCategory = useMemo(
    () => categories.find((category) => category.id === form.category),
    [categories, form.category]
  )

  const previewCategory = selectedCategory?.name || 'Category'
  const previewRent = Number(form.rentPerDay)
  const previewTags = parseTags(form.tags).slice(0, 2)

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    if (errors[name]) {
      setErrors((current) => ({ ...current, [name]: undefined }))
    }
    if (submitError) setSubmitError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (isSaving) return

    const nextErrors = validateForm(form)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      setSubmitError('Please fix the highlighted fields before saving.')
      return
    }

    setSubmitError('')
    setIsSaving(true)

    const payload = {
      title: form.title.trim(),
      category: form.category,
      rentPerDay: Number(form.rentPerDay),
      location: form.location.trim(),
      condition: form.condition,
      availability: form.availability,
      description: form.description.trim(),
      tags: parseTags(form.tags),
    }

    try {
      if (isEdit) {
        await api.updateProduct(id, payload)
        toast.success('Listing updated', 'Your changes are now saved.')
      } else {
        await api.createProduct(payload)
        toast.success('Listing created', 'Your item is now available in Browse.')
      }
      navigate('/my-products')
    } catch (error) {
      setSubmitError(error.message || 'Unable to save this listing. Please try again.')
      toast.error('Could not save listing', error.message || 'Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const isLoading = categoriesStatus === 'loading' || (isEdit && productStatus === 'loading')

  return (
    <div className="bg-[#F8FAFC]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <nav className="flex flex-wrap items-center gap-2 text-sm text-neutral-500" aria-label="Breadcrumb">
          <Link to="/my-products" className="rounded hover:text-primary-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500">
            My Products
          </Link>
          <span aria-hidden="true">/</span>
          <span className="font-medium text-navy-900">{isEdit ? 'Edit listing' : 'List an item'}</span>
        </nav>

        <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="inline-flex items-center rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary-700">
              {isEdit ? 'Owner tools' : 'Lend an item'}
            </span>
            <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-navy-900 sm:text-4xl">
              {isEdit ? 'Edit your listing' : 'List a new item'}
            </h1>
            <p className="mt-2 max-w-2xl text-base text-neutral-500">
              {isEdit
                ? 'Update the details borrowers see. Changes are visible as soon as you save.'
                : 'Add clear details and a fair daily price so neighbors know exactly what to expect.'}
            </p>
          </div>
          {isEdit && product?.isPublished && (
            <Link to={`/products/${id}`}>
              <Button variant="outline" size="sm" className="bg-white">
                View public listing
              </Button>
            </Link>
          )}
        </div>

        {isLoading && (
          <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-card sm:p-8">
              <div className="h-6 w-40 animate-pulse rounded bg-neutral-200" />
              <div className="mt-6 space-y-5">
                {[...Array(7)].map((_, index) => (
                  <div key={index} className="h-12 animate-pulse rounded-xl bg-neutral-100" />
                ))}
              </div>
            </div>
            <div className="h-96 animate-pulse rounded-2xl bg-neutral-200" />
          </div>
        )}

        {!isLoading && categoriesStatus === 'error' && (
          <div className="mt-8">
            <ErrorState
              title="Unable to load categories"
              message={categoriesError}
              onRetry={() => setCategoriesReloadKey((key) => key + 1)}
            />
          </div>
        )}

        {!isLoading && categoriesStatus === 'success' && isEdit && productStatus === 'error' && (
          <div className="mt-8">
            <ErrorState
              title={productError?.status === 403 ? 'You cannot edit this listing' : 'Unable to load this listing'}
              message={
                productError?.status === 403
                  ? 'Only the owner can edit this listing.'
                  : productError?.message || 'Please check your connection and try again.'
              }
              onRetry={
                productError?.status === 403 || productError?.status === 404
                  ? undefined
                  : () => setProductReloadKey((key) => key + 1)
              }
            />
            <div className="mt-6 text-center">
              <Link to="/my-products">
                <Button variant="outline" className="bg-white">Back to My Products</Button>
              </Link>
            </div>
          </div>
        )}

        {!isLoading && categoriesStatus === 'success' && (!isEdit || productStatus === 'success') && (
          <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
              {isEdit && product && !product.isPublished && (
                <div className="rounded-2xl border border-warning-200 bg-warning-50 px-5 py-4 text-sm text-warning-800" role="status">
                  This listing is unpublished. It does not appear in Browse or search until you publish it from My Products.
                </div>
              )}

              <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-card sm:p-8" aria-labelledby="item-basics">
                <div className="flex items-center justify-between gap-3">
                  <h2 id="item-basics" className="font-display text-xl font-semibold text-navy-900">
                    Item basics
                  </h2>
                  <span className="text-sm text-neutral-500">1 of 3</span>
                </div>

                <div className="mt-6 space-y-5">
                  <Input
                    label="Listing title"
                    id="product-title"
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    placeholder="e.g. Cordless drill with bit set"
                    error={errors.title}
                    maxLength={120}
                    required
                  />

                  <div>
                    <label htmlFor="product-category" className="mb-1.5 block text-sm font-medium text-navy-900">
                      Category
                    </label>
                    <select
                      id="product-category"
                      name="category"
                      value={form.category}
                      onChange={handleChange}
                      className={`${fieldClass} ${errors.category ? 'border-error-500' : ''}`}
                      aria-invalid={errors.category ? 'true' : 'false'}
                      required
                    >
                      <option value="">Choose a category</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    <FieldError>{errors.category}</FieldError>
                  </div>

                  <div>
                    <label htmlFor="product-description" className="mb-1.5 block text-sm font-medium text-navy-900">
                      Description
                    </label>
                    <textarea
                      id="product-description"
                      name="description"
                      value={form.description}
                      onChange={handleChange}
                      rows={5}
                      maxLength={2000}
                      placeholder="Describe the item, what is included, and anything a borrower should know."
                      className={`${fieldClass} resize-y ${errors.description ? 'border-error-500' : ''}`}
                      aria-invalid={errors.description ? 'true' : 'false'}
                      required
                    />
                    <div className="mt-1.5 flex items-start justify-between gap-4">
                      <FieldError>{errors.description}</FieldError>
                      <span className="ml-auto text-xs text-neutral-400">{form.description.length}/2000</span>
                    </div>
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-card sm:p-8" aria-labelledby="pricing-availability">
                <div className="flex items-center justify-between gap-3">
                  <h2 id="pricing-availability" className="font-display text-xl font-semibold text-navy-900">
                    Pricing &amp; availability
                  </h2>
                  <span className="text-sm text-neutral-500">2 of 3</span>
                </div>

                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  <Input
                    label="Rent per day (₹)"
                    id="product-rent"
                    name="rentPerDay"
                    type="number"
                    min="0"
                    max="1000000"
                    step="0.01"
                    inputMode="decimal"
                    value={form.rentPerDay}
                    onChange={handleChange}
                    placeholder="350"
                    error={errors.rentPerDay}
                    required
                  />
                  <Input
                    label="Pickup area"
                    id="product-location"
                    name="location"
                    value={form.location}
                    onChange={handleChange}
                    placeholder="e.g. Riverside"
                    error={errors.location}
                    maxLength={100}
                    required
                  />

                  <div>
                    <label htmlFor="product-condition" className="mb-1.5 block text-sm font-medium text-navy-900">
                      Condition
                    </label>
                    <select
                      id="product-condition"
                      name="condition"
                      value={form.condition}
                      onChange={handleChange}
                      className={fieldClass}
                    >
                      {CONDITION_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="product-availability" className="mb-1.5 block text-sm font-medium text-navy-900">
                      Availability
                    </label>
                    <select
                      id="product-availability"
                      name="availability"
                      value={form.availability}
                      onChange={handleChange}
                      className={fieldClass}
                    >
                      {AVAILABILITY_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-card sm:p-8" aria-labelledby="listing-details">
                <div className="flex items-center justify-between gap-3">
                  <h2 id="listing-details" className="font-display text-xl font-semibold text-navy-900">
                    Listing details
                  </h2>
                  <span className="text-sm text-neutral-500">3 of 3</span>
                </div>

                <div className="mt-6">
                  <Input
                    label="Tags (optional)"
                    id="product-tags"
                    name="tags"
                    value={form.tags}
                    onChange={handleChange}
                    placeholder="DIY, Home repair, Cordless"
                    helperText="Separate tags with commas. Up to 10 tags, 30 characters each."
                    error={errors.tags}
                  />
                </div>
              </section>

              {submitError && (
                <div className="rounded-xl border border-error-500/30 bg-error-50 px-4 py-3 text-sm text-error-700" role="alert">
                  {submitError}
                </div>
              )}

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Link to="/my-products">
                  <Button variant="ghost" className="w-full sm:w-auto" disabled={isSaving}>
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" size="lg" loading={isSaving} className="w-full sm:w-auto">
                  {isEdit ? 'Save changes' : 'Create listing'}
                </Button>
              </div>
            </form>

            <aside className="space-y-5 lg:sticky lg:top-40">
              <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-card">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <div
                    className="flex h-full w-full items-center justify-center"
                    style={{ background: getCategoryGradient(previewCategory) }}
                  >
                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/25 text-white backdrop-blur-sm">
                      <ProductCategoryIcon category={previewCategory} className="h-10 w-10" />
                    </div>
                  </div>
                  <div className="absolute left-3 top-3">
                    <Badge variant="primary" size="sm">{previewCategory}</Badge>
                  </div>
                  {previewTags.length > 0 && (
                    <div className="absolute bottom-3 left-3 flex gap-2">
                      {previewTags.map((tag) => (
                        <Badge key={tag} variant="subtle" size="xs">{tag}</Badge>
                      ))}
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <h2 className="line-clamp-1 font-semibold text-navy-900">
                    {form.title.trim() || 'Your item title'}
                  </h2>
                  <div className="mt-2 flex items-center gap-2 text-sm text-neutral-500">
                    <svg className="h-4 w-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="truncate">{form.location.trim() || 'Pickup area'}</span>
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <p className="text-2xl font-bold text-navy-900">
                      ₹{Number.isFinite(previewRent) && form.rentPerDay !== '' ? previewRent : 0}
                      <span className="text-sm font-normal text-neutral-500">/day</span>
                    </p>
                    <Badge variant={form.availability === 'available' ? 'success' : 'warning'} size="sm">
                      {form.availability === 'available' ? 'Available' : 'Unavailable'}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-primary-100 bg-primary-50 p-5">
                <h3 className="font-display text-base font-semibold text-navy-900">Make your listing stand out</h3>
                <ul className="mt-3 space-y-2 text-sm text-neutral-600">
                  <li className="flex gap-2"><span className="text-primary-600">•</span>Use a specific title and a fair daily price.</li>
                  <li className="flex gap-2"><span className="text-primary-600">•</span>Mention included accessories and pickup details.</li>
                  <li className="flex gap-2"><span className="text-primary-600">•</span>Keep availability current so borrowers know what to expect.</li>
                </ul>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  )
}
