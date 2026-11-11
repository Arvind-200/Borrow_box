import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { api } from '../../services/api'
import { useAuth } from '../../context/AuthContext.jsx'
import { Button } from '../ui/Button'
import { Pagination } from '../ui/Pagination'
import { StarRating } from '../ui/StarRating'
import { ReportModal } from '../report/ReportModal'

const REVIEWS_PER_PAGE = 5

function formatReviewDate(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function ReviewSkeleton() {
  return (
    <li className="animate-pulse rounded-2xl border border-neutral-200 bg-white p-5 shadow-card">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-full bg-neutral-200" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-1/3 rounded bg-neutral-200" />
          <div className="h-3 w-24 rounded bg-neutral-200" />
          <div className="h-3 w-full rounded bg-neutral-200" />
          <div className="h-3 w-2/3 rounded bg-neutral-200" />
        </div>
      </div>
    </li>
  )
}

function ReviewRow({ review, onReport }) {
  const reviewerName = review.reviewer?.name || 'Borrower'
  const initial = reviewerName.charAt(0).toUpperCase()
  const formattedDate = formatReviewDate(review.createdAt)

  return (
    <li className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-card">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary-50 font-semibold text-primary-700">
          {initial}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="truncate font-semibold text-navy-900">
              {reviewerName}
            </p>
            {formattedDate && (
              <time
                dateTime={review.createdAt}
                className="text-xs text-neutral-400"
              >
                {formattedDate}
              </time>
            )}
          </div>
          <div className="mt-1.5">
            <StarRating
              rating={review.rating}
              size="sm"
              showRating={false}
              showCount={false}
            />
          </div>
          {review.comment && (
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-neutral-600">
              {review.comment}
            </p>
          )}
          {onReport && (
            <button
              type="button"
              onClick={() => onReport(review)}
              className="mt-2 rounded text-xs font-medium text-neutral-400 underline-offset-2 transition-colors hover:text-error-600 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-error-500"
            >
              Report this review
            </button>
          )}
        </div>
      </div>
    </li>
  )
}

export function ReviewSection({ productId, rating }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, isAuthenticated } = useAuth()

  const [reviews, setReviews] = useState([])
  const [pagination, setPagination] = useState(null)
  const [page, setPage] = useState(1)
  const [reloadKey, setReloadKey] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [reportTarget, setReportTarget] = useState(null)

  useEffect(() => {
    setPage(1)
    setReviews([])
    setPagination(null)
  }, [productId])

  useEffect(() => {
    if (!productId) return

    let cancelled = false

    async function loadReviews() {
      setIsLoading(true)
      setError('')

      try {
        const data = await api.getProductReviews(productId, {
          page,
          limit: REVIEWS_PER_PAGE,
        })
        if (cancelled) return
        setReviews(Array.isArray(data?.reviews) ? data.reviews : [])
        setPagination(data?.pagination || null)
      } catch (requestError) {
        if (cancelled) return
        setError(
          requestError.message ||
            'Unable to load reviews right now. Please try again.'
        )
        setReviews([])
        setPagination(null)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    loadReviews()

    return () => {
      cancelled = true
    }
  }, [productId, page, reloadKey])

  const total = pagination?.total ?? rating?.count ?? 0
  const countLabel = `${total} review${total === 1 ? '' : 's'}`

  const handleReport = (review) => {
    if (!isAuthenticated) {
      navigate('/login', {
        state: { from: `${location.pathname}${location.search}` },
      })
      return
    }

    setReportTarget(review)
  }

  const isOwnReview = (review) =>
    Boolean(user?.id) &&
    Boolean(review.reviewer?.id) &&
    String(user.id) === String(review.reviewer.id)

  return (
    <section aria-labelledby="reviews-heading" className="mt-8">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2
          id="reviews-heading"
          className="font-display text-xl font-semibold text-navy-900"
        >
          Reviews
        </h2>
        {total > 0 && (
          <span className="text-sm text-neutral-500">{countLabel}</span>
        )}
      </div>

      {isLoading && (
        <ul className="mt-4 space-y-3">
          <ReviewSkeleton />
          <ReviewSkeleton />
        </ul>
      )}

      {!isLoading && error && (
        <div className="mt-4 rounded-2xl border border-error-500/30 bg-error-50 px-4 py-4">
          <p className="text-sm text-error-700" role="alert">
            {error}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3 bg-white"
            onClick={() => setReloadKey((current) => current + 1)}
          >
            Retry
          </Button>
        </div>
      )}

      {!isLoading && !error && reviews.length === 0 && (
        <div className="mt-4 rounded-2xl border border-dashed border-neutral-300 bg-white px-4 py-8 text-center">
          <p className="font-semibold text-navy-900">No reviews yet</p>
          <p className="mt-1 text-sm text-neutral-500">
            Reviews appear here after a completed borrow.
          </p>
        </div>
      )}

      {!isLoading && !error && reviews.length > 0 && (
        <>
          <ul className="mt-4 space-y-3">
            {reviews.map((review) => (
              <ReviewRow
                key={review.id}
                review={review}
                onReport={isOwnReview(review) ? undefined : handleReport}
              />
            ))}
          </ul>
          <Pagination
            className="mt-6"
            page={pagination?.page || page}
            totalPages={pagination?.totalPages || 0}
            onPageChange={setPage}
            ariaLabel="Review pagination"
          />
        </>
      )}

      <ReportModal
        isOpen={Boolean(reportTarget)}
        onClose={() => setReportTarget(null)}
        targetType="review"
        targetId={reportTarget?.id}
        targetLabel={
          reportTarget
            ? `review by ${reportTarget.reviewer?.name || 'Borrower'}`
            : ''
        }
      />
    </section>
  )
}
