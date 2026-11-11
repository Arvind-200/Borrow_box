import { useEffect, useState } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { adminInputClass, adminLabelClass } from './adminStyles'

export function AdminReasonDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  label = 'Reason',
  placeholder = 'Explain the action for the audit log.',
  required = true,
  variant = 'primary',
  loading = false,
}) {
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) {
      setReason('')
      setError('')
    }
  }, [isOpen])

  const handleConfirm = () => {
    const trimmed = reason.trim()
    if (required && !trimmed) {
      setError('A reason is required.')
      return
    }
    setError('')
    onConfirm(trimmed)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      {description && (
        <p className="mb-4 text-sm text-[#64748B]">{description}</p>
      )}
      <label className="block">
        <span className={adminLabelClass}>
          {label}
          {!required && <span className="ml-1 normal-case text-[#94A3B8]">(optional)</span>}
        </span>
        <textarea
          value={reason}
          onChange={(event) => {
            setReason(event.target.value)
            if (error) setError('')
          }}
          rows={4}
          maxLength={500}
          placeholder={placeholder}
          className={`${adminInputClass} resize-none`}
          disabled={loading}
          autoFocus
        />
      </label>
      <div className="mt-1 flex items-center justify-between text-xs text-[#94A3B8]">
        <span>{error ? <span className="font-medium text-rose-600">{error}</span> : 'Stored on the audit log.'}</span>
        <span>{reason.length}/500</span>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button variant={variant} onClick={handleConfirm} loading={loading}>
          {confirmText}
        </Button>
      </div>
    </Modal>
  )
}
