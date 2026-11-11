import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../services/api'
import { ErrorState } from '../../components/ui/ErrorState'
import { TableSkeleton } from '../../components/ui/LoadingSpinner'
import { Pagination } from '../../components/ui/Pagination'
import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { AdminPanel } from '../../components/admin/AdminPanel'
import { AdminEmptyState } from '../../components/admin/AdminEmptyState'
import {
  AdminFilterGroup,
  AdminSelect,
  AdminToolbar,
} from '../../components/admin/AdminFilters'
import {
  AdminStatusBadge,
  requestStatusTone,
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

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'Pending', label: 'Pending' },
  { value: 'Accepted', label: 'Accepted' },
  { value: 'Rejected', label: 'Rejected' },
  { value: 'Cancelled', label: 'Cancelled' },
  { value: 'Completed', label: 'Completed' },
]

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState([])
  const [pagination, setPagination] = useState(null)
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [page, setPage] = useState(1)
  const [requestStatus, setRequestStatus] = useState('')

  useEffect(() => {
    let active = true
    setStatus('loading')
    setError('')

    api.getAdminBorrowRequests({ page, limit: LIMIT, status: requestStatus })
      .then((result) => {
        if (!active) return
        setRequests(result.requests || [])
        setPagination(result.pagination)
        setStatus('success')
      })
      .catch((requestError) => {
        if (!active) return
        setError(requestError.message || 'Unable to load borrow requests.')
        setStatus('error')
      })

    return () => {
      active = false
    }
  }, [page, requestStatus, reloadKey])

  return (
    <div className="space-y-5">
      <AdminPageHeader
        eyebrow="Marketplace"
        title="Borrow requests"
        description="Monitor the full request lifecycle between borrowers and listing owners."
      />

      <AdminPanel flush>
        <AdminToolbar>
          <div>
            <p className="text-sm font-semibold text-[#0F1626]">
              Request activity
            </p>
            <p className="text-xs text-[#64748B]">
              Owners accept or reject requests. Admins oversee disputes and abuse.
            </p>
          </div>
          <AdminFilterGroup>
            <AdminSelect
              value={requestStatus}
              onChange={(value) => {
                setRequestStatus(value)
                setPage(1)
              }}
              options={STATUS_OPTIONS}
              ariaLabel="Filter borrow requests by status"
            />
          </AdminFilterGroup>
        </AdminToolbar>

        {status === 'loading' && <TableSkeleton rows={6} columns={6} />}

        {status === 'error' && (
          <div className="p-5">
            <ErrorState
              title="Unable to load borrow requests"
              message={error}
              onRetry={() => setReloadKey((key) => key + 1)}
            />
          </div>
        )}

        {status === 'success' && requests.length === 0 && (
          <AdminEmptyState
            icon="requests"
            title="No borrow requests found"
            message="There are no requests matching this status yet."
          />
        )}

        {status === 'success' && requests.length > 0 && (
          <>
            <div className={adminTableWrapper}>
              <table className={adminTable}>
                <thead className="bg-[#F8FAFC]">
                  <tr>
                    <th className={adminTableHeadCell}>Item</th>
                    <th className={adminTableHeadCell}>Borrower</th>
                    <th className={adminTableHeadCell}>Owner</th>
                    <th className={adminTableHeadCell}>Period</th>
                    <th className={adminTableHeadCell}>Status</th>
                    <th className={adminTableHeadCell}>Requested</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((request) => (
                    <tr key={request.id} className={adminTableRow}>
                      <td className={adminTableCell}>
                        {request.product ? (
                          <>
                            <Link
                              to={`/products/${request.product.id}`}
                              className="block max-w-[220px] truncate font-semibold text-[#0F1626] hover:text-primary-700"
                            >
                              {request.product.title}
                            </Link>
                            <p className="text-xs text-[#94A3B8]">
                              {request.product.location} ·{' '}
                              {formatAdminCurrency(request.product.rentPerDay)}/day
                            </p>
                          </>
                        ) : (
                          <span className="text-[#94A3B8]">Listing deleted</span>
                        )}
                      </td>
                      <td className={adminTableCell}>
                        <span className="whitespace-nowrap font-medium text-[#334155]">
                          {request.borrower?.name || '—'}
                        </span>
                      </td>
                      <td className={adminTableCell}>
                        <span className="whitespace-nowrap font-medium text-[#334155]">
                          {request.owner?.name || '—'}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-xs text-[#64748B]">
                        {formatAdminDate(request.startDate)} →{' '}
                        {formatAdminDate(request.endDate)}
                      </td>
                      <td className={adminTableCell}>
                        <AdminStatusBadge
                          label={request.status}
                          tone={requestStatusTone(request.status)}
                        />
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-xs text-[#64748B]">
                        {formatAdminDate(request.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-[#E2E8F0] px-4 py-4">
              <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
                <p className="text-xs text-[#64748B]">
                  {pagination?.total ?? 0} requests · page {pagination?.page} of{' '}
                  {pagination?.totalPages || 1}
                </p>
                <Pagination
                  page={pagination?.page || 1}
                  totalPages={pagination?.totalPages || 1}
                  onPageChange={setPage}
                  ariaLabel="Borrow requests pagination"
                />
              </div>
            </div>
          </>
        )}
      </AdminPanel>
    </div>
  )
}
