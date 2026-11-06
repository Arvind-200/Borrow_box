import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../services/api'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../components/ui/Toast.jsx'
import { Button } from '../components/ui/Button'
import { ErrorState } from '../components/ui/ErrorState'
import { Pagination } from '../components/ui/Pagination'
import { BorrowRequestCard } from '../components/borrow/BorrowRequestCard'

const PAGE_SIZE = 10

const TABS = [
  { value: 'my', label: 'My Requests' },
  { value: 'incoming', label: 'Incoming Requests' },
]

const STATUS_FILTERS = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'cancelled', label: 'Cancelled' },
]

const STATUS_LABEL = {
  pending: 'pending',
  accepted: 'accepted',
  rejected: 'rejected',
  cancelled: 'cancelled',
}

function parsePage(value) {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1
}

function normalizeStatus(value) {
  return STATUS_FILTERS.some((option) => option.value === value && value !== '')
    ? value
    : ''
}

function RequestSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-card">
      <div className="flex flex-col sm:flex-row">
        <div className="h-40 animate-pulse bg-neutral-200 sm:h-auto sm:w-40 sm:flex-shrink-0" />
        <div className="flex-1 space-y-4 p-5">
          <div className="flex gap-2">
            <div className="h-6 w-20 animate-pulse rounded-full bg-neutral-100" />
            <div className="h-6 w-24 animate-pulse rounded-full bg-neutral-100" />
          </div>
          <div className="h-6 w-3/4 animate-pulse rounded bg-neutral-200" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-neutral-100" />
          <div className="h-10 w-full animate-pulse rounded-xl bg-neutral-100" />
        </div>
      </div>
    </div>
  )
}

export default function RequestsPage() {
  const { refresh } = useAuth()
  const toast = useToast()
  const [searchParams, setSearchParams] = useSearchParams()

  const tabParam = searchParams.get('tab')
  const tab = tabParam === 'incoming' ? 'incoming' : 'my'
  const status = normalizeStatus(searchParams.get('status') || '')
  const page = parsePage(searchParams.get('page'))

  const [requests, setRequests] = useState([])
  const [pagination, setPagination] = useState(null)
  const [statusState, setStatusState] = useState('loading')
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [processingId, setProcessingId] = useState(null)

  const fetchKeyRef = useRef(`${tab}|${status}`)

  const updateParams = (changes) => {
    const next = new URLSearchParams(searchParams)
    Object.entries(changes).forEach(([key, value]) => {
      if (value === '' || value === null || value === undefined) {
        next.delete(key)
      } else {
        next.set(key, String(value))
      }
    })
    setSearchParams(next)
  }

  const handleTabChange = (nextTab) => {
    if (nextTab === tab) return
    setRequests([])
    setPagination(null)
    updateParams({
      tab: nextTab === 'my' ? '' : nextTab,
      page: '',
    })
  }

  const handleStatusChange = (nextStatus) => {
    if (nextStatus === status) return
    setRequests([])
    setPagination(null)
    updateParams({ status: nextStatus, page: '' })
  }

  const handlePageChange = (nextPage) => {
    updateParams({ page: nextPage <= 1 ? '' : nextPage })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  useEffect(() => {
    const currentKey = `${tab}|${status}`
    if (fetchKeyRef.current !== currentKey) {
      fetchKeyRef.current = currentKey
      setRequests([])
      setPagination(null)
    }

    let active = true
    setStatusState('loading')
    setError('')

    const params = { page, limit: PAGE_SIZE }
    if (status) params.status = status

    const fetcher =
      tab === 'incoming' ? api.getIncomingBorrowRequests : api.getMyBorrowRequests

    fetcher(params)
      .then((data) => {
        if (!active) return

        const totalPages = data.pagination?.totalPages || 0
        if ((totalPages > 0 && page > totalPages) || (totalPages === 0 && page > 1)) {
          setSearchParams(
            (current) => {
              const next = new URLSearchParams(current)
              if (totalPages > 1) next.set('page', String(totalPages))
              else next.delete('page')
              return next
            },
            { replace: true }
          )
          return
        }

        setRequests(data.requests || [])
        setPagination(data.pagination || null)
        setStatusState('success')
      })
      .catch(async (err) => {
        if (!active) return
        if (err.status === 401) {
          try {
            await refresh()
            if (!active) return
            setError('Your session could not be verified. Please try again.')
          } catch {
            if (!active) return
            setError('Your session has expired. Please log in again.')
          }
          setStatusState('error')
          return
        }
        setError(err.message || 'Unable to load borrow requests.')
        setStatusState('error')
      })

    return () => {
      active = false
    }
  }, [tab, status, page, reloadKey, refresh, setSearchParams])

  const runAction = async (request, action) => {
    if (processingId) return
    setProcessingId(request.id)

    const call =
      action === 'accept'
        ? api.acceptBorrowRequest
        : action === 'reject'
          ? api.rejectBorrowRequest
          : api.cancelBorrowRequest

    try {
      await call(request.id)

      if (action === 'accept') {
        toast.success('Request accepted', 'The item is now marked unavailable.')
      } else if (action === 'reject') {
        toast.success('Request rejected', 'The item stays available for other borrowers.')
      } else {
        toast.success(
          'Request cancelled',
          request.status === 'Accepted'
            ? 'The item has been released back to available.'
            : 'Your borrow request has been cancelled.'
        )
      }

      setReloadKey((key) => key + 1)
    } catch (err) {
      if (err.status === 401) {
        try {
          await refresh()
          toast.error('Could not verify your session', 'Please try again.')
        } catch {
          toast.error('Your session has expired', 'Please log in again.')
        }
        return
      }

      if (err.status === 409) {
        toast.error(
          'This request changed',
          err.message || 'The latest request details have been loaded.'
        )
        setReloadKey((key) => key + 1)
        return
      }

      if (err.status === 503) {
        toast.error(
          'Borrow decisions are temporarily unavailable',
          err.message || 'Please try again later.'
        )
        return
      }

      toast.error(
        action === 'accept'
          ? 'Could not accept request'
          : action === 'reject'
            ? 'Could not reject request'
            : 'Could not cancel request',
        err.message || 'Please try again.'
      )
    } finally {
      setProcessingId(null)
    }
  }

  const activeTab = TABS.find((item) => item.value === tab) || TABS[0]
  const isInitialLoading = statusState === 'loading' && requests.length === 0
  const isRefreshing = statusState === 'loading' && requests.length > 0
  const totalItems = pagination?.total ?? requests.length
  const statusLabel = STATUS_LABEL[status]

  return (
    <div className="bg-[#F8FAFC]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="max-w-2xl">
          <span className="inline-flex items-center rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary-700">
            Borrow Requests
          </span>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-navy-900 sm:text-4xl">
            Requests
          </h1>
          <p className="mt-2 text-base text-neutral-500">
            Track the items you want to borrow and the requests for your own listings.
          </p>
        </div>

        <div
          role="tablist"
          aria-label="Borrow request views"
          className="mt-8 flex w-full max-w-md rounded-xl border border-neutral-200 bg-white p-1 shadow-sm"
        >
          {TABS.map((item) => {
            const selected = item.value === tab
            return (
              <button
                key={item.value}
                type="button"
                role="tab"
                id={`requests-tab-${item.value}`}
                aria-selected={selected}
                aria-controls="requests-panel"
                onClick={() => handleTabChange(item.value)}
                className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
                  selected
                    ? 'bg-primary-500 text-white shadow-sm'
                    : 'text-neutral-500 hover:text-navy-900'
                }`}
              >
                {item.label}
              </button>
            )
          })}
        </div>

        <div
          id="requests-panel"
          role="tabpanel"
          aria-labelledby={`requests-tab-${tab}`}
          className="mt-6"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2" aria-label="Filter by status">
              {STATUS_FILTERS.map((option) => (
                <button
                  key={option.value || 'all'}
                  type="button"
                  onClick={() => handleStatusChange(option.value)}
                  aria-pressed={status === option.value}
                  className={`inline-flex items-center rounded-full border px-4 py-2 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
                    status === option.value
                      ? 'border-primary-200 bg-primary-50 text-primary-700'
                      : 'border-neutral-200 bg-white text-neutral-500 hover:border-neutral-300 hover:text-navy-900'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            {!isInitialLoading && !error && (
              <p className="text-sm text-neutral-500" role="status" aria-live="polite">
                <span className="font-semibold text-navy-900">{totalItems}</span>{' '}
                {totalItems === 1 ? 'request' : 'requests'}
              </p>
            )}
          </div>

          {isRefreshing && (
            <p className="mt-4 text-sm text-neutral-500" role="status">
              Updating requests...
            </p>
          )}

          {isInitialLoading && (
            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              {[...Array(4)].map((_, index) => (
                <RequestSkeleton key={index} />
              ))}
            </div>
          )}

          {statusState === 'error' && (
            <div className="mt-6">
              <ErrorState
                title="Unable to load borrow requests"
                message={error}
                onRetry={() => setReloadKey((key) => key + 1)}
              />
            </div>
          )}

          {!isInitialLoading && statusState !== 'error' && requests.length === 0 && (
            <div className="mt-6 rounded-2xl border border-neutral-200 bg-white px-6 py-16 text-center shadow-card">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-50 text-primary-600">
                <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h2 className="mt-5 font-display text-2xl font-semibold text-navy-900">
                {status
                  ? `No ${statusLabel} requests`
                  : tab === 'incoming'
                    ? 'No incoming requests yet'
                    : 'No borrow requests yet'}
              </h2>
              <p className="mx-auto mt-2 max-w-md text-[15px] text-neutral-500">
                {tab === 'incoming'
                  ? status
                    ? `None of your listings have ${statusLabel} requests right now.`
                    : 'When someone asks to borrow one of your listings, their request will appear here.'
                  : status
                    ? `You have no ${statusLabel} requests right now.`
                    : 'Browse items and send a borrow request to get started.'}
              </p>
              <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                {tab === 'incoming' ? (
                  <Link to="/my-products" className="w-full sm:w-auto">
                    <Button size="lg" className="w-full sm:w-auto">
                      Manage your listings
                    </Button>
                  </Link>
                ) : (
                  <Link to="/browse" className="w-full sm:w-auto">
                    <Button size="lg" className="w-full sm:w-auto">
                      Browse Items
                    </Button>
                  </Link>
                )}
                {status && (
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full bg-white sm:w-auto"
                    onClick={() => handleStatusChange('')}
                  >
                    View all requests
                  </Button>
                )}
              </div>
            </div>
          )}

          {requests.length > 0 && (
            <>
              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                {requests.map((request) => (
                  <BorrowRequestCard
                    key={request.id}
                    request={request}
                    role={tab === 'incoming' ? 'owner' : 'borrower'}
                    onAccept={(item) => runAction(item, 'accept')}
                    onReject={(item) => runAction(item, 'reject')}
                    onCancel={(item) => runAction(item, 'cancel')}
                    isBusy={processingId === request.id}
                  />
                ))}
              </div>
              <Pagination
                className="mt-10"
                page={pagination?.page || page}
                totalPages={pagination?.totalPages || 0}
                onPageChange={handlePageChange}
              />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
