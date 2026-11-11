import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../services/api'
import { useToast } from '../../components/ui/Toast.jsx'
import { ErrorState } from '../../components/ui/ErrorState'
import { ConfirmDialog } from '../../components/ui/Modal'
import { TableSkeleton } from '../../components/ui/LoadingSpinner'
import { Pagination } from '../../components/ui/Pagination'
import {
  ProductCategoryIcon,
  getCategoryGradient,
} from '../../components/product/productVisuals'
import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { AdminPanel } from '../../components/admin/AdminPanel'
import { AdminEmptyState } from '../../components/admin/AdminEmptyState'
import { AdminReasonDialog } from '../../components/admin/AdminReasonDialog'
import {
  AdminFilterGroup,
  AdminSearchForm,
  AdminSelect,
  AdminToolbar,
} from '../../components/admin/AdminFilters'
import {
  AdminStatusBadge,
  availabilityTone,
  productStatusTone,
} from '../../components/admin/AdminStatusBadge'
import {
  formatAdminCurrency,
  formatAdminDate,
} from '../../components/admin/adminFormat'
import {
  adminTable,
  adminTableHeadCell,
  adminTableCell,
  adminTableRow,
  adminTableWrapper,
} from '../../components/admin/adminStyles'

const LIMIT = 20

const MODERATION_OPTIONS = [
  { value: '', label: 'All moderation' },
  { value: 'active', label: 'Active' },
  { value: 'hidden', label: 'Hidden' },
  { value: 'removed', label: 'Removed' },
]

const AVAILABILITY_OPTIONS = [
  { value: '', label: 'Any availability' },
  { value: 'available', label: 'Available' },
  { value: 'unavailable', label: 'Unavailable' },
]

function actionButtonClass(tone) {
  const tones = {
    warning: 'text-amber-700 hover:bg-amber-50',
    danger: 'text-rose-700 hover:bg-rose-50',
    success: 'text-emerald-700 hover:bg-emerald-50',
  }
  return `rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors ${tones[tone] || tones.warning}`
}

export default function AdminListingsPage() {
  const toast = useToast()

  const [products, setProducts] = useState([])
  const [pagination, setPagination] = useState(null)
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [categories, setCategories] = useState([])

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const [moderationStatus, setModerationStatus] = useState('')
  const [availability, setAvailability] = useState('')
  const [category, setCategory] = useState('')

  const [reasonDialog, setReasonDialog] = useState(null)
  const [restoreTarget, setRestoreTarget] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    let active = true
    api.getAdminCategories()
      .then((result) => {
        if (active) setCategories(result.categories || [])
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    let active = true
    setStatus('loading')
    setError('')

    api.getAdminProducts({
      page,
      limit: LIMIT,
      q: appliedSearch,
      moderationStatus,
      availability,
      category,
    })
      .then((result) => {
        if (!active) return
        setProducts(result.products || [])
        setPagination(result.pagination)
        setStatus('success')
      })
      .catch((requestError) => {
        if (!active) return
        setError(requestError.message || 'Unable to load listings.')
        setStatus('error')
      })

    return () => {
      active = false
    }
  }, [page, appliedSearch, moderationStatus, availability, category, reloadKey])

  const updateRow = (updatedProduct) => {
    setProducts((current) =>
      current.map((item) =>
        item.id === updatedProduct.id ? { ...item, ...updatedProduct } : item
      )
    )
  }

  const handleReasonConfirm = async (reason) => {
    if (!reasonDialog) return
    const { action, product } = reasonDialog
    setIsSubmitting(true)

    try {
      const result =
        action === 'hide'
          ? await api.hideAdminProduct(product.id, { reason })
          : await api.removeAdminProduct(product.id, { reason })
      updateRow(result.product)
      toast.success(
        action === 'hide' ? 'Listing hidden' : 'Listing removed',
        `${product.title} is no longer visible in the marketplace.`
      )
      setReasonDialog(null)
    } catch (requestError) {
      toast.error(
        action === 'hide' ? 'Could not hide listing' : 'Could not remove listing',
        requestError.message || 'Please try again.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRestore = async () => {
    if (!restoreTarget) return
    setIsSubmitting(true)

    try {
      const result = await api.restoreAdminProduct(restoreTarget.id, {})
      updateRow(result.product)
      toast.success('Listing restored', `${restoreTarget.title} is visible again.`)
      setRestoreTarget(null)
    } catch (requestError) {
      toast.error(
        'Could not restore listing',
        requestError.message || 'Please try again.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSearch = () => {
    setPage(1)
    setAppliedSearch(search.trim())
  }

  const categoryOptions = [
    { value: '', label: 'All categories' },
    ...categories.map((item) => ({
      value: item.id,
      label: item.isActive ? item.name : `${item.name} (inactive)`,
    })),
  ]

  return (
    <div className="space-y-5">
      <AdminPageHeader
        eyebrow="Marketplace"
        title="Listings"
        description="Inspect every listing, including hidden items, and moderate content that breaks the rules."
      />

      <AdminPanel flush>
        <AdminToolbar>
          <AdminSearchForm
            value={search}
            onChange={setSearch}
            onSubmit={handleSearch}
            placeholder="Search title, description, location..."
          />
          <AdminFilterGroup>
            <AdminSelect
              value={moderationStatus}
              onChange={(value) => {
                setModerationStatus(value)
                setPage(1)
              }}
              options={MODERATION_OPTIONS}
              ariaLabel="Filter by moderation status"
            />
            <AdminSelect
              value={availability}
              onChange={(value) => {
                setAvailability(value)
                setPage(1)
              }}
              options={AVAILABILITY_OPTIONS}
              ariaLabel="Filter by availability"
            />
            <AdminSelect
              value={category}
              onChange={(value) => {
                setCategory(value)
                setPage(1)
              }}
              options={categoryOptions}
              ariaLabel="Filter by category"
            />
          </AdminFilterGroup>
        </AdminToolbar>

        {status === 'loading' && <TableSkeleton rows={6} columns={6} />}

        {status === 'error' && (
          <div className="p-5">
            <ErrorState
              title="Unable to load listings"
              message={error}
              onRetry={() => setReloadKey((key) => key + 1)}
            />
          </div>
        )}

        {status === 'success' && products.length === 0 && (
          <AdminEmptyState
            icon="listings"
            title="No listings found"
            message="Adjust the search or filters to find the listing you need."
          />
        )}

        {status === 'success' && products.length > 0 && (
          <>
            <div className={adminTableWrapper}>
              <table className={adminTable}>
                <thead className="bg-[#F8FAFC]">
                  <tr>
                    <th className={adminTableHeadCell}>Listing</th>
                    <th className={adminTableHeadCell}>Owner</th>
                    <th className={adminTableHeadCell}>Category</th>
                    <th className={adminTableHeadCell}>Price</th>
                    <th className={adminTableHeadCell}>Moderation</th>
                    <th className={adminTableHeadCell}>Availability</th>
                    <th className={adminTableHeadCell}>Created</th>
                    <th className={adminTableHeadCell}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => {
                    const categoryName = product.category?.name || 'Uncategorized'
                    const image = product.images?.[0]
                    const canOpen =
                      product.moderationStatus === 'active' && product.isPublished

                    return (
                      <tr key={product.id} className={adminTableRow}>
                        <td className={adminTableCell}>
                          <div className="flex items-center gap-3">
                            <div className="h-11 w-11 flex-shrink-0 overflow-hidden rounded-lg">
                              {image ? (
                                <img
                                  src={image}
                                  alt=""
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div
                                  className="flex h-full w-full items-center justify-center"
                                  style={{ background: getCategoryGradient(categoryName) }}
                                >
                                  <ProductCategoryIcon
                                    category={categoryName}
                                    className="h-5 w-5 text-white"
                                  />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              {canOpen ? (
                                <Link
                                  to={`/products/${product.id}`}
                                  className="block max-w-[240px] truncate font-semibold text-[#0F1626] hover:text-primary-700"
                                >
                                  {product.title}
                                </Link>
                              ) : (
                                <p className="max-w-[240px] truncate font-semibold text-[#0F1626]">
                                  {product.title}
                                </p>
                              )}
                              <p className="truncate text-xs text-[#94A3B8]">
                                {product.location}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className={adminTableCell}>
                          <p className="whitespace-nowrap font-medium text-[#334155]">
                            {product.owner?.name || 'Unknown'}
                          </p>
                          <p className="text-xs text-[#94A3B8]">
                            {product.owner?.email || ''}
                          </p>
                        </td>
                        <td className={adminTableCell}>
                          <span className="whitespace-nowrap text-[#475569]">
                            {categoryName}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-[#0F1626]">
                          {formatAdminCurrency(product.rentPerDay)}
                          <span className="text-xs font-normal text-[#94A3B8]">
                            /day
                          </span>
                        </td>
                        <td className={adminTableCell}>
                          <AdminStatusBadge
                            label={
                              product.isPublished
                                ? product.moderationStatus
                                : `${product.moderationStatus} · draft`
                            }
                            tone={productStatusTone(product.moderationStatus)}
                          />
                        </td>
                        <td className={adminTableCell}>
                          <AdminStatusBadge
                            label={
                              product.availability === 'available'
                                ? 'Available'
                                : 'Unavailable'
                            }
                            tone={availabilityTone(product.availability)}
                          />
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-xs text-[#64748B]">
                          {formatAdminDate(product.createdAt)}
                        </td>
                        <td className={adminTableCell}>
                          <div className="flex items-center gap-0.5">
                            {product.moderationStatus === 'active' && (
                              <button
                                type="button"
                                className={actionButtonClass('warning')}
                                onClick={() =>
                                  setReasonDialog({ action: 'hide', product })
                                }
                              >
                                Hide
                              </button>
                            )}
                            {(product.moderationStatus === 'active' ||
                              product.moderationStatus === 'hidden') && (
                              <button
                                type="button"
                                className={actionButtonClass('danger')}
                                onClick={() =>
                                  setReasonDialog({ action: 'remove', product })
                                }
                              >
                                Remove
                              </button>
                            )}
                            {product.moderationStatus !== 'active' && (
                              <button
                                type="button"
                                className={actionButtonClass('success')}
                                onClick={() => setRestoreTarget(product)}
                              >
                                Restore
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="border-t border-[#E2E8F0] px-4 py-4">
              <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
                <p className="text-xs text-[#64748B]">
                  {pagination?.total ?? 0} listings · page {pagination?.page} of{' '}
                  {pagination?.totalPages || 1}
                </p>
                <Pagination
                  page={pagination?.page || 1}
                  totalPages={pagination?.totalPages || 1}
                  onPageChange={setPage}
                  ariaLabel="Listings pagination"
                />
              </div>
            </div>
          </>
        )}
      </AdminPanel>

      <AdminReasonDialog
        isOpen={Boolean(reasonDialog)}
        onClose={() => {
          if (!isSubmitting) setReasonDialog(null)
        }}
        onConfirm={handleReasonConfirm}
        title={reasonDialog?.action === 'hide' ? 'Hide listing' : 'Remove listing'}
        description={
          reasonDialog
            ? reasonDialog.action === 'hide'
              ? `Hide "${reasonDialog.product.title}" from the marketplace. The owner can still see it in their account.`
              : `Remove "${reasonDialog.product.title}" from public view? This is a stronger moderation state than hidden.`
            : ''
        }
        confirmText={reasonDialog?.action === 'hide' ? 'Hide listing' : 'Remove listing'}
        variant={reasonDialog?.action === 'hide' ? 'primary' : 'danger'}
        loading={isSubmitting}
      />

      <ConfirmDialog
        isOpen={Boolean(restoreTarget)}
        onClose={() => {
          if (!isSubmitting) setRestoreTarget(null)
        }}
        onConfirm={handleRestore}
        title="Restore listing?"
        message={
          restoreTarget
            ? `Restore "${restoreTarget.title}" to active moderation status? It will appear in the marketplace again if the owner has published it.`
            : ''
        }
        confirmText="Restore listing"
        variant="primary"
        loading={isSubmitting}
      />
    </div>
  )
}
