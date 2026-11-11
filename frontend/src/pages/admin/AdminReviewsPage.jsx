import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../services/api'
import { useToast } from '../../components/ui/Toast.jsx'
import { ErrorState } from '../../components/ui/ErrorState'
import { ConfirmDialog } from '../../components/ui/Modal'
import { TableSkeleton } from '../../components/ui/LoadingSpinner'
import { Pagination } from '../../components/ui/Pagination'
import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { AdminPanel } from '../../components/admin/AdminPanel'
import { AdminEmptyState } from '../../components/admin/AdminEmptyState'
import { AdminReasonDialog } from '../../components/admin/AdminReasonDialog'
import {
  AdminFilterGroup,
  AdminSelect,
  AdminToolbar,
} from '../../components/admin/AdminFilters'
import {
  AdminStatusBadge,
  reviewStatusTone,
} from '../../components/admin/AdminStatusBadge'
import {
  formatAdminDate,
  titleCase,
} from '../../components/admin/adminFormat'
import {
  adminTable,
  adminTableHeadCell,
  adminTableCell,
  adminTableRow,
  adminTableWrapper,
} from '../../components/admin/adminStyles'

const LIMIT = 20

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'visible', label: 'Visible' },
  { value: 'hidden', label: 'Hidden' },
  { value: 'removed', label: 'Removed' },
]

function RatingStars({ rating }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`h-3.5 w-3.5 ${star <= rating ? 'text-amber-400' : 'text-[#E2E8F0]'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path d="M9.05 2.93c.3-.92 1.6-.92 1.9 0l1.12 3.45a1 1 0 0 0 .95.69h3.63c.97 0 1.37 1.24.59 1.81l-2.94 2.13a1 1 0 0 0-.36 1.12l1.12 3.45c.3.92-.75 1.68-1.54 1.11l-2.94-2.13a1 1 0 0 0-1.17 0l-2.94 2.13c-.78.57-1.84-.19-1.54-1.11l1.12-3.45a1 1 0 0 0-.36-1.12L2.76 8.88c-.78-.57-.38-1.81.59-1.81H6.98a1 1 0 0 0 .95-.69L9.05 2.93z" />
        </svg>
      ))}
    </span>
  )
}

function actionButtonClass(tone) {
  const tones = {
    warning: 'text-amber-700 hover:bg-amber-50',
    danger: 'text-rose-700 hover:bg-rose-50',
    success: 'text-emerald-700 hover:bg-emerald-50',
  }
  return `rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors ${tones[tone] || tones.warning}`
}

export default function AdminReviewsPage() {
  const toast = useToast()

  const [reviews, setReviews] = useState([])
  const [pagination, setPagination] = useState(null)
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [page, setPage] = useState(1)
  const [reviewStatus, setReviewStatus] = useState('')

  const [reasonDialog, setReasonDialog] = useState(null)
  const [restoreTarget, setRestoreTarget] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    let active = true
    setStatus('loading')
    setError('')

    api.getAdminReviews({ page, limit: LIMIT, status: reviewStatus })
      .then((result) => {
        if (!active) return
        setReviews(result.reviews || [])
        setPagination(result.pagination)
        setStatus('success')
      })
      .catch((requestError) => {
        if (!active) return
        setError(requestError.message || 'Unable to load reviews.')
        setStatus('error')
      })

    return () => {
      active = false
    }
  }, [page, reviewStatus, reloadKey])

  const updateRow = (updatedReview) => {
    setReviews((current) =>
      current.map((item) =>
        item.id === updatedReview.id ? { ...item, ...updatedReview } : item
      )
    )
  }

  const handleReasonConfirm = async (reason) => {
    if (!reasonDialog) return
    const { action, review } = reasonDialog
    setIsSubmitting(true)

    try {
      const result =
        action === 'hide'
          ? await api.hideAdminReview(review.id, { reason })
          : await api.removeAdminReview(review.id, { reason })
      updateRow(result.review)
      toast.success(
        action === 'hide' ? 'Review hidden' : 'Review removed',
        'The change is reflected in the reviewer and product ratings.'
      )
      setReasonDialog(null)
    } catch (requestError) {
      toast.error(
        action === 'hide' ? 'Could not hide review' : 'Could not remove review',
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
      const result = await api.restoreAdminReview(restoreTarget.id, {})
      updateRow(result.review)
      toast.success('Review restored', 'The review is visible again.')
      setRestoreTarget(null)
    } catch (requestError) {
      toast.error(
        'Could not restore review',
        requestError.message || 'Please try again.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-5">
      <AdminPageHeader
        eyebrow="Moderation"
        title="Reviews"
        description="Moderate ratings and comments written after completed borrows."
      />

      <AdminPanel flush>
        <AdminToolbar>
          <div>
            <p className="text-sm font-semibold text-[#0F1626]">Community reviews</p>
            <p className="text-xs text-[#64748B]">
              Hiding or removing a review recalculates product and user ratings.
            </p>
          </div>
          <AdminFilterGroup>
            <AdminSelect
              value={reviewStatus}
              onChange={(value) => {
                setReviewStatus(value)
                setPage(1)
              }}
              options={STATUS_OPTIONS}
              ariaLabel="Filter reviews by status"
            />
          </AdminFilterGroup>
        </AdminToolbar>

        {status === 'loading' && <TableSkeleton rows={6} columns={6} />}

        {status === 'error' && (
          <div className="p-5">
            <ErrorState
              title="Unable to load reviews"
              message={error}
              onRetry={() => setReloadKey((key) => key + 1)}
            />
          </div>
        )}

        {status === 'success' && reviews.length === 0 && (
          <AdminEmptyState
            icon="reviews"
            title="No reviews found"
            message="There are no reviews matching this status yet."
          />
        )}

        {status === 'success' && reviews.length > 0 && (
          <>
            <div className={adminTableWrapper}>
              <table className={adminTable}>
                <thead className="bg-[#F8FAFC]">
                  <tr>
                    <th className={adminTableHeadCell}>Review</th>
                    <th className={adminTableHeadCell}>Rating</th>
                    <th className={adminTableHeadCell}>Comment</th>
                    <th className={adminTableHeadCell}>Status</th>
                    <th className={adminTableHeadCell}>Date</th>
                    <th className={adminTableHeadCell}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reviews.map((review) => (
                    <tr key={review.id} className={adminTableRow}>
                      <td className={adminTableCell}>
                        <p className="whitespace-nowrap font-semibold text-[#0F1626]">
                          {review.reviewer?.name || 'Unknown'} →{' '}
                          {review.reviewee?.name || 'Unknown'}
                        </p>
                        {review.product?.id ? (
                          <Link
                            to={`/products/${review.product.id}`}
                            className="block max-w-[220px] truncate text-xs text-[#64748B] hover:text-primary-700"
                          >
                            {review.product.title || 'View product'}
                          </Link>
                        ) : (
                          <p className="text-xs text-[#94A3B8]">Product removed</p>
                        )}
                      </td>
                      <td className={adminTableCell}>
                        <RatingStars rating={review.rating} />
                        <p className="mt-0.5 text-[11px] text-[#94A3B8]">
                          {review.reviewerRole === 'borrower' ? 'Borrower' : 'Owner'}
                        </p>
                      </td>
                      <td className={adminTableCell}>
                        <p className="max-w-[260px] truncate text-sm text-[#475569]">
                          {review.comment || 'No comment'}
                        </p>
                        {review.moderationReason && (
                          <p className="mt-0.5 max-w-[260px] truncate text-xs text-rose-600">
                            {review.moderationReason}
                          </p>
                        )}
                      </td>
                      <td className={adminTableCell}>
                        <AdminStatusBadge
                          label={titleCase(review.status)}
                          tone={reviewStatusTone(review.status)}
                        />
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-xs text-[#64748B]">
                        {formatAdminDate(review.createdAt)}
                      </td>
                      <td className={adminTableCell}>
                        <div className="flex items-center gap-0.5">
                          {review.status === 'visible' && (
                            <button
                              type="button"
                              className={actionButtonClass('warning')}
                              onClick={() =>
                                setReasonDialog({ action: 'hide', review })
                              }
                            >
                              Hide
                            </button>
                          )}
                          {(review.status === 'visible' ||
                            review.status === 'hidden') && (
                            <button
                              type="button"
                              className={actionButtonClass('danger')}
                              onClick={() =>
                                setReasonDialog({ action: 'remove', review })
                              }
                            >
                              Remove
                            </button>
                          )}
                          {review.status !== 'visible' && (
                            <button
                              type="button"
                              className={actionButtonClass('success')}
                              onClick={() => setRestoreTarget(review)}
                            >
                              Restore
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-[#E2E8F0] px-4 py-4">
              <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
                <p className="text-xs text-[#64748B]">
                  {pagination?.total ?? 0} reviews · page {pagination?.page} of{' '}
                  {pagination?.totalPages || 1}
                </p>
                <Pagination
                  page={pagination?.page || 1}
                  totalPages={pagination?.totalPages || 1}
                  onPageChange={setPage}
                  ariaLabel="Reviews pagination"
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
        title={reasonDialog?.action === 'hide' ? 'Hide review' : 'Remove review'}
        description={
          reasonDialog
            ? reasonDialog.action === 'hide'
              ? `Hide the ${reasonDialog.review.rating}-star review by ${reasonDialog.review.reviewer?.name || 'this user'}? It will no longer appear publicly.`
              : `Remove the ${reasonDialog.review.rating}-star review by ${reasonDialog.review.reviewer?.name || 'this user'}? This is a stronger moderation state than hidden.`
            : ''
        }
        confirmText={reasonDialog?.action === 'hide' ? 'Hide review' : 'Remove review'}
        variant={reasonDialog?.action === 'hide' ? 'primary' : 'danger'}
        loading={isSubmitting}
      />

      <ConfirmDialog
        isOpen={Boolean(restoreTarget)}
        onClose={() => {
          if (!isSubmitting) setRestoreTarget(null)
        }}
        onConfirm={handleRestore}
        title="Restore review?"
        message={
          restoreTarget
            ? `Restore this ${restoreTarget.rating}-star review to visible status? Ratings will be recalculated.`
            : ''
        }
        confirmText="Restore review"
        variant="primary"
        loading={isSubmitting}
      />
    </div>
  )
}
