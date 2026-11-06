import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { api } from '../../services/api'
import { useAuth } from '../../context/AuthContext.jsx'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Modal } from '../ui/Modal'
import { validateDateRange } from '../../utils/dateOnly'

const MAX_MESSAGE_LENGTH = 500

export function RequestBorrowModal({ isOpen, onClose, product, onSuccess }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { refresh } = useAuth()

  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [message, setMessage] = useState('')
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    setStartDate('')
    setEndDate('')
    setMessage('')
    setErrors({})
    setSubmitError('')
    setIsSubmitting(false)
  }, [isOpen, product?.id])

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (isSubmitting) return

    const validationErrors = validateDateRange(startDate, endDate)
    if (message.length > MAX_MESSAGE_LENGTH) {
      validationErrors.message = `Message cannot exceed ${MAX_MESSAGE_LENGTH} characters`
    }
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return
    if (!product?.id) return

    setSubmitError('')
    setIsSubmitting(true)

    try {
      const data = await api.createBorrowRequest({
        product: product.id,
        startDate,
        endDate,
        message: message.trim(),
      })
      onSuccess?.(data?.request)
    } catch (error) {
      if (error.status === 401) {
        try {
          await refresh()
          setSubmitError('Your session was refreshed. Please submit the request again.')
        } catch {
          navigate('/login', {
            state: { from: `${location.pathname}${location.search}` },
          })
        }
        return
      }

      if (error.status === 503) {
        setSubmitError(
          'Borrow requests are temporarily unavailable on this server. Please try again later.'
        )
        return
      }

      setSubmitError(error.message || 'Unable to send your request. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={isSubmitting ? () => {} : onClose}
      title="Request to Borrow"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {product?.title && (
          <p className="text-sm text-neutral-500">
            Requesting <span className="font-semibold text-navy-900">{product.title}</span>
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Start date"
            id="borrow-start-date"
            type="date"
            value={startDate}
            onChange={(event) => {
              setStartDate(event.target.value)
              setErrors((current) => ({ ...current, startDate: '' }))
            }}
            error={errors.startDate}
            required
          />
          <Input
            label="End date"
            id="borrow-end-date"
            type="date"
            value={endDate}
            onChange={(event) => {
              setEndDate(event.target.value)
              setErrors((current) => ({ ...current, endDate: '' }))
            }}
            error={errors.endDate}
            required
          />
        </div>

        <div>
          <label htmlFor="borrow-message" className="mb-1.5 block text-sm font-medium text-navy-900">
            Message <span className="font-normal text-neutral-400">(optional)</span>
          </label>
          <textarea
            id="borrow-message"
            value={message}
            onChange={(event) => {
              setMessage(event.target.value)
              if (errors.message) {
                setErrors((current) => ({ ...current, message: '' }))
              }
            }}
            rows={4}
            maxLength={MAX_MESSAGE_LENGTH}
            placeholder="Share pickup details or ask a question."
            className={`w-full rounded-xl border bg-white px-4 py-2.5 text-navy-900 placeholder:text-neutral-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0 ${
              errors.message
                ? 'border-error-500 focus:border-error-500 focus:ring-error-500'
                : 'border-neutral-200 focus:border-primary-500 focus:ring-primary-500'
            }`}
            aria-invalid={errors.message ? 'true' : 'false'}
            aria-describedby="borrow-message-helper"
          />
          <div className="mt-1.5 flex items-center justify-between gap-3">
            {errors.message ? (
              <p className="text-sm text-error-600" role="alert">{errors.message}</p>
            ) : (
              <span />
            )}
            <p
              id="borrow-message-helper"
              className={`text-sm ${
                message.length > MAX_MESSAGE_LENGTH ? 'text-error-600' : 'text-neutral-400'
              }`}
            >
              {message.length}/{MAX_MESSAGE_LENGTH}
            </p>
          </div>
        </div>

        {submitError && (
          <div className="rounded-xl border border-error-500/30 bg-error-50 px-4 py-3 text-sm text-error-700" role="alert">
            {submitError}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-1">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting} disabled={isSubmitting}>
            Send Request
          </Button>
        </div>
      </form>
    </Modal>
  )
}
