import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { api } from '../../services/api'
import { useAuth } from '../../context/AuthContext.jsx'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'
import { formatDateOnly } from '../../utils/dateOnly'

const MAX_COMMENT_LENGTH = 1000

const RATING_LABELS = {
  1: 'Poor',
  2: 'Fair',
  3: 'Good',
  4: 'Very good',
  5: 'Excellent',
}

const STAR_PATH =
  'M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z'

function StarPicker({ value, onChange, disabled }) {
  const [hovered, setHovered] = useState(0)
  const active = hovered || value

  return (
    <div>
      <div role="radiogroup" aria-label="Rating" className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = star <= active
          return (
            <button
              key={star}
              type="button"
              role="radio"
              aria-checked={value === star}
              aria-label={`${star} star${star === 1 ? '' : 's'}`}
              disabled={disabled}
              onClick={() => onChange(star)}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
              onFocus={() => setHovered(star)}
              onBlur={() => setHovered(0)}
              className="rounded-md p-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:cursor-not-allowed"
            >
              <svg
                className={`h-9 w-9 transition-colors ${
                  filled ? 'text-yellow-400' : 'text-neutral-300'
                }`}
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d={STAR_PATH} />
              </svg>
            </button>
          )
        })}
      </div>
      <p className="mt-1 text-sm text-neutral-500" aria-live="polite">
        {value ? RATING_LABELS[value] : 'Select a rating'}
      </p>
    </div>
  )
}

export function ReviewModal({
  isOpen,
  onClose,
  request,
  onSuccess,
  onAlreadyReviewed,
}) {
  const navigate = useNavigate()
  const location = useLocation()
  const { refresh } = useAuth()

  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    setRating(0)
    setComment('')
    setErrors({})
    setSubmitError('')
    setIsSubmitting(false)
  }, [isOpen, request?.id])

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (isSubmitting || !request?.id) return

    const nextErrors = {}
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      nextErrors.rating = 'Choose a star rating'
    }
    if (comment.length > MAX_COMMENT_LENGTH) {
      nextErrors.comment = `Comment cannot exceed ${MAX_COMMENT_LENGTH} characters`
    }
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setSubmitError('')
    setIsSubmitting(true)

    try {
      const data = await api.createReview({
        borrowRequest: request.id,
        rating,
        comment: comment.trim(),
      })
      onSuccess?.(data?.review)
    } catch (error) {
      if (error.status === 401) {
        try {
          await refresh()
          setSubmitError(
            'Your session was refreshed. Please submit the review again.'
          )
        } catch {
          navigate('/login', {
            state: { from: `${location.pathname}${location.search}` },
          })
        }
        return
      }

      if (
        error.status === 409 &&
        /already reviewed/i.test(error.message || '')
      ) {
        onAlreadyReviewed?.(request)
        return
      }

      setSubmitError(
        error.message || 'Unable to submit your review. Please try again.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const targetTitle = request?.product?.title || 'this item'
  const ownerName = request?.owner?.name

  return (
    <Modal
      isOpen={isOpen}
      onClose={isSubmitting ? () => {} : onClose}
      title="Leave a review"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <div className="rounded-xl bg-neutral-50 px-4 py-3">
          <p className="text-sm text-neutral-500">
            Reviewing{' '}
            <span className="font-semibold text-navy-900">{targetTitle}</span>
            {ownerName && (
              <>
                {' '}
                from{' '}
                <span className="font-semibold text-navy-900">{ownerName}</span>
              </>
            )}
          </p>
          {request?.startDate && request?.endDate && (
            <p className="mt-1 text-xs text-neutral-400">
              {formatDateOnly(request.startDate)} &ndash;{' '}
              {formatDateOnly(request.endDate)}
            </p>
          )}
        </div>

        <div>
          <span className="mb-1.5 block text-sm font-medium text-navy-900">
            Your rating
          </span>
          <StarPicker
            value={rating}
            disabled={isSubmitting}
            onChange={(nextRating) => {
              setRating(nextRating)
              setErrors((current) => ({ ...current, rating: '' }))
            }}
          />
          {errors.rating && (
            <p className="mt-1 text-sm text-error-600" role="alert">
              {errors.rating}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="review-comment"
            className="mb-1.5 block text-sm font-medium text-navy-900"
          >
            Comment{' '}
            <span className="font-normal text-neutral-400">(optional)</span>
          </label>
          <textarea
            id="review-comment"
            value={comment}
            onChange={(event) => {
              setComment(event.target.value)
              if (errors.comment) {
                setErrors((current) => ({ ...current, comment: '' }))
              }
            }}
            rows={4}
            maxLength={MAX_COMMENT_LENGTH}
            placeholder="How was the item and the handover?"
            className={`w-full rounded-xl border bg-white px-4 py-2.5 text-navy-900 placeholder:text-neutral-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0 ${
              errors.comment
                ? 'border-error-500 focus:border-error-500 focus:ring-error-500'
                : 'border-neutral-200 focus:border-primary-500 focus:ring-primary-500'
            }`}
            aria-invalid={errors.comment ? 'true' : 'false'}
            aria-describedby="review-comment-helper"
          />
          <div className="mt-1.5 flex items-center justify-between gap-3">
            {errors.comment ? (
              <p className="text-sm text-error-600" role="alert">
                {errors.comment}
              </p>
            ) : (
              <span />
            )}
            <p
              id="review-comment-helper"
              className="text-sm text-neutral-400"
            >
              {comment.length}/{MAX_COMMENT_LENGTH}
            </p>
          </div>
        </div>

        {submitError && (
          <div
            className="rounded-xl border border-error-500/30 bg-error-50 px-4 py-3 text-sm text-error-700"
            role="alert"
          >
            {submitError}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-1">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting} disabled={isSubmitting}>
            Submit review
          </Button>
        </div>
      </form>
    </Modal>
  )
}
