import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { ConfirmDialog } from '../ui/Modal'
import {
  ProductCategoryIcon,
  getCategoryGradient,
} from '../product/productVisuals'
import { formatDateOnly } from '../../utils/dateOnly'

const statusVariants = {
  Pending: 'warning',
  Accepted: 'success',
  Rejected: 'danger',
  Cancelled: 'subtle',
}

function formatTimestamp(value) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function BorrowRequestCard({
  request,
  role,
  onAccept,
  onReject,
  onCancel,
  isBusy = false,
}) {
  const [dialog, setDialog] = useState(null)

  const product = request.product
  const status = request.status
  const image = product?.images?.[0]
  const counterpart =
    role === 'owner' ? request.borrower : request.owner
  const counterpartLabel = role === 'owner' ? 'Borrower' : 'Owner'
  const createdDate = formatTimestamp(request.createdAt)
  const decisionDate =
    status === 'Cancelled'
      ? formatTimestamp(request.cancelledAt)
      : status === 'Accepted' || status === 'Rejected'
        ? formatTimestamp(request.decidedAt)
        : null
  const decisionLabel =
    status === 'Cancelled'
      ? 'Cancelled on'
      : status === 'Accepted' || status === 'Rejected'
        ? 'Decided on'
        : null

  const canCancel =
    role === 'borrower' && (status === 'Pending' || status === 'Accepted')
  const canDecide = role === 'owner' && status === 'Pending'

  const closeDialog = () => {
    if (isBusy) return
    setDialog(null)
  }

  const confirmAction = () => {
    const action = dialog
    setDialog(null)
    if (action === 'accept') onAccept?.(request)
    if (action === 'reject') onReject?.(request)
    if (action === 'cancel') onCancel?.(request)
  }

  const dialogConfig = {
    accept: {
      title: 'Accept this request?',
      message:
        'The item will be marked unavailable so no other borrow requests can be accepted for it.',
      confirmText: 'Accept request',
      variant: 'primary',
      onConfirm: confirmAction,
    },
    reject: {
      title: 'Reject this request?',
      message:
        'The borrower will see that this request was rejected. The item stays available.',
      confirmText: 'Reject request',
      variant: 'danger',
      onConfirm: confirmAction,
    },
    cancel: {
      title: 'Cancel this request?',
      message:
        status === 'Accepted'
          ? 'This request has been accepted. Cancelling it releases the item back to available so it can be borrowed again.'
          : 'The owner will no longer see this pending request.',
      confirmText: 'Cancel request',
      variant: 'danger',
      onConfirm: confirmAction,
    },
  }

  return (
    <article className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-card transition-shadow hover:shadow-elevated">
      <div className="flex flex-col sm:flex-row">
        <div className="relative h-40 overflow-hidden sm:h-auto sm:w-40 sm:flex-shrink-0">
          {image ? (
            <img src={image} alt="" className="h-full w-full object-cover" />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center"
              style={{ background: getCategoryGradient() }}
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/25 text-white backdrop-blur-sm">
                <ProductCategoryIcon category="" className="h-7 w-7" />
              </div>
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col p-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={statusVariants[status] || 'default'} size="xs">
              {status}
            </Badge>
            {product?.availability && (
              <Badge variant="subtle" size="xs">
                {product.availability === 'available' ? 'Available' : 'Unavailable'}
              </Badge>
            )}
          </div>

          <h3 className="mt-3 line-clamp-1 font-display text-lg font-semibold text-navy-900">
            {product?.id ? (
              <Link
                to={`/products/${product.id}`}
                className="rounded hover:text-primary-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              >
                {product.title || 'Listing'}
              </Link>
            ) : (
              product?.title || 'Listing unavailable'
            )}
          </h3>

          <p className="mt-1 text-sm text-neutral-500">
            {formatDateOnly(request.startDate)} &ndash; {formatDateOnly(request.endDate)}
          </p>

          {request.message && (
            <p className="mt-3 whitespace-pre-line break-words rounded-xl bg-neutral-50 px-3 py-2 text-sm text-neutral-600">
              {request.message}
            </p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-neutral-500">
            {counterpart?.name && (
              <span>
                <span className="text-neutral-400">{counterpartLabel}:</span>{' '}
                <span className="font-medium text-navy-900">{counterpart.name}</span>
              </span>
            )}
            {product?.location && (
              <>
                <span aria-hidden="true">·</span>
                <span className="truncate">{product.location}</span>
              </>
            )}
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-400">
            {createdDate && <span>Requested {createdDate}</span>}
            {decisionDate && decisionLabel && (
              <span>
                {decisionLabel} {decisionDate}
              </span>
            )}
          </div>

          {(canCancel || canDecide) && (
            <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
              {canDecide && (
                <>
                  <Button
                    size="sm"
                    onClick={() => setDialog('accept')}
                    disabled={isBusy}
                  >
                    Accept
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-white"
                    onClick={() => setDialog('reject')}
                    disabled={isBusy}
                  >
                    Reject
                  </Button>
                </>
              )}
              {canCancel && (
                <Button
                  variant="outline"
                  size="sm"
                  className="ml-auto bg-white text-error-700 hover:bg-error-50"
                  onClick={() => setDialog('cancel')}
                  disabled={isBusy}
                >
                  Cancel request
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={dialog !== null}
        onClose={closeDialog}
        onConfirm={dialogConfig[dialog]?.onConfirm}
        title={dialogConfig[dialog]?.title}
        message={dialogConfig[dialog]?.message}
        confirmText={dialogConfig[dialog]?.confirmText}
        variant={dialogConfig[dialog]?.variant}
        loading={isBusy}
      />
    </article>
  )
}
