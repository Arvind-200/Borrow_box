import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { api } from '../../services/api'
import { useAuth } from '../../context/AuthContext.jsx'
import { useToast } from '../ui/Toast.jsx'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'

const MAX_DESCRIPTION_LENGTH = 1000

const REPORT_REASONS = [
  { value: 'prohibited_item', label: 'Prohibited or restricted item' },
  { value: 'fake_listing', label: 'Fake listing' },
  { value: 'scam_fraud', label: 'Scam or fraud' },
  { value: 'wrong_information', label: 'Wrong information' },
  { value: 'offensive_content', label: 'Offensive content' },
  { value: 'duplicate_listing', label: 'Duplicate listing' },
  { value: 'other', label: 'Other' },
]

export function ReportModal({
  isOpen,
  onClose,
  targetType,
  targetId,
  targetLabel,
}) {
  const navigate = useNavigate()
  const location = useLocation()
  const { refresh } = useAuth()
  const toast = useToast()

  const [reason, setReason] = useState('')
  const [description, setDescription] = useState('')
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!isOpen) return

    setReason('')
    setDescription('')
    setErrors({})
    setSubmitError('')
    setIsSubmitting(false)
  }, [isOpen, targetType, targetId])

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (isSubmitting) return

    const validationErrors = {}
    if (!reason) validationErrors.reason = 'Please choose a reason.'
    if (description.length > MAX_DESCRIPTION_LENGTH) {
      validationErrors.description = `Description cannot exceed ${MAX_DESCRIPTION_LENGTH} characters`
    }
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return
    if (!targetType || !targetId) return

    setSubmitError('')
    setIsSubmitting(true)

    try {
      await api.createReport({
        targetType,
        targetId,
        reason,
        description: description.trim(),
      })

      toast.success(
        'Report submitted',
        'Thank you. Our moderators will review this report.'
      )
      onClose()
    } catch (error) {
      if (error.status === 401) {
        try {
          await refresh()
          setSubmitError('Your session was refreshed. Please submit the report again.')
        } catch {
          navigate('/login', {
            state: { from: `${location.pathname}${location.search}` },
          })
        }
        return
      }

      if (error.status === 409) {
        toast.info(
          'Report already submitted',
          error.message ||
            'You already have an open report for this item.'
        )
        onClose()
        return
      }

      setSubmitError(
        error.message || 'Unable to submit your report. Please try again.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={isSubmitting ? () => {} : onClose}
      title="Report content"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {targetLabel && (
          <p className="text-sm text-neutral-500">
            Reporting{' '}
            <span className="font-semibold text-navy-900">{targetLabel}</span>
          </p>
        )}

        <div>
          <label
            htmlFor="report-reason"
            className="mb-1.5 block text-sm font-medium text-navy-900"
          >
            Why are you reporting this?
          </label>
          <select
            id="report-reason"
            value={reason}
            onChange={(event) => {
              setReason(event.target.value)
              setErrors((current) => ({ ...current, reason: '' }))
            }}
            className={`w-full rounded-xl border bg-white px-4 py-2.5 text-navy-900 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0 ${
              errors.reason
                ? 'border-error-500 focus:border-error-500 focus:ring-error-500'
                : 'border-neutral-200 focus:border-primary-500 focus:ring-primary-500'
            }`}
            aria-invalid={errors.reason ? 'true' : 'false'}
          >
            <option value="">Select a reason</option>
            {REPORT_REASONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.reason && (
            <p className="mt-1.5 text-sm text-error-600" role="alert">
              {errors.reason}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="report-description"
            className="mb-1.5 block text-sm font-medium text-navy-900"
          >
            Details{' '}
            <span className="font-normal text-neutral-400">(optional)</span>
          </label>
          <textarea
            id="report-description"
            value={description}
            onChange={(event) => {
              setDescription(event.target.value)
              if (errors.description) {
                setErrors((current) => ({ ...current, description: '' }))
              }
            }}
            rows={4}
            maxLength={MAX_DESCRIPTION_LENGTH}
            placeholder="Share anything that helps our moderators review this report."
            className={`w-full rounded-xl border bg-white px-4 py-2.5 text-navy-900 placeholder:text-neutral-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0 ${
              errors.description
                ? 'border-error-500 focus:border-error-500 focus:ring-error-500'
                : 'border-neutral-200 focus:border-primary-500 focus:ring-primary-500'
            }`}
            aria-invalid={errors.description ? 'true' : 'false'}
          />
          <p className="mt-1.5 text-right text-sm text-neutral-400">
            {description.length}/{MAX_DESCRIPTION_LENGTH}
          </p>
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
          <Button type="submit" variant="danger" loading={isSubmitting}>
            Submit report
          </Button>
        </div>
      </form>
    </Modal>
  )
}
