import { useEffect, useState } from 'react'
import { api } from '../../services/api'
import { useAuth } from '../../context/AuthContext.jsx'
import { useToast } from '../../components/ui/Toast.jsx'
import { ErrorState } from '../../components/ui/ErrorState'
import { Modal, ConfirmDialog } from '../../components/ui/Modal'
import { TableSkeleton } from '../../components/ui/LoadingSpinner'
import { Pagination } from '../../components/ui/Pagination'
import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { AdminPanel } from '../../components/admin/AdminPanel'
import { AdminEmptyState } from '../../components/admin/AdminEmptyState'
import { AdminReasonDialog } from '../../components/admin/AdminReasonDialog'
import {
  AdminFilterGroup,
  AdminSelect,
  AdminSearchForm,
  AdminToolbar,
} from '../../components/admin/AdminFilters'
import {
  AdminStatusBadge,
  roleTone,
  userStatusTone,
} from '../../components/admin/AdminStatusBadge'
import {
  formatAdminDate,
  formatAdminNumber,
  formatAdminRelative,
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

const ROLE_OPTIONS = [
  { value: '', label: 'All roles' },
  { value: 'user', label: 'Users' },
  { value: 'admin', label: 'Admins' },
]

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'blocked', label: 'Blocked' },
]

function initials(name = '') {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'U'
  )
}

function actionButtonClass(tone) {
  const tones = {
    neutral: 'text-[#475569] hover:bg-[#F1F5F9]',
    warning: 'text-amber-700 hover:bg-amber-50',
    danger: 'text-rose-700 hover:bg-rose-50',
    success: 'text-emerald-700 hover:bg-emerald-50',
  }
  return `rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${tones[tone] || tones.neutral}`
}

export default function AdminUsersPage() {
  const { user: currentAdmin } = useAuth()
  const toast = useToast()

  const [users, setUsers] = useState([])
  const [pagination, setPagination] = useState(null)
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const [role, setRole] = useState('')
  const [userStatus, setUserStatus] = useState('')

  const [reasonDialog, setReasonDialog] = useState(null)
  const [unblockTarget, setUnblockTarget] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [detail, setDetail] = useState(null)
  const [detailStatus, setDetailStatus] = useState('idle')
  const [detailError, setDetailError] = useState('')

  useEffect(() => {
    let active = true
    setStatus('loading')
    setError('')

    api.getAdminUsers({
      page,
      limit: LIMIT,
      q: appliedSearch,
      role,
      status: userStatus,
    })
      .then((result) => {
        if (!active) return
        setUsers(result.users || [])
        setPagination(result.pagination)
        setStatus('success')
      })
      .catch((requestError) => {
        if (!active) return
        setError(requestError.message || 'Unable to load users.')
        setStatus('error')
      })

    return () => {
      active = false
    }
  }, [page, appliedSearch, role, userStatus, reloadKey])

  const updateUserRow = (updatedUser) => {
    setUsers((current) =>
      current.map((item) =>
        item.id === updatedUser.id ? { ...item, ...updatedUser } : item
      )
    )
  }

  const refetchDetail = async (userId) => {
    try {
      const result = await api.getAdminUser(userId)
      setDetail(result)
      setDetailStatus('success')
    } catch (requestError) {
      setDetailError(requestError.message || 'Unable to load this user.')
      setDetailStatus('error')
    }
  }

  const handleView = async (user) => {
    setDetail({ user })
    setDetailStatus('loading')
    setDetailError('')
    await refetchDetail(user.id)
  }

  const handleReasonConfirm = async (reason) => {
    if (!reasonDialog) return
    const { type, user } = reasonDialog
    setIsSubmitting(true)

    try {
      if (type === 'warn') {
        const result = await api.warnAdminUser(user.id, { reason })
        updateUserRow(result.user)
        toast.success('User warned', `${user.name} now has ${result.user.warningCount} warning${result.user.warningCount === 1 ? '' : 's'}.`)
      } else {
        const result = await api.blockAdminUser(user.id, { reason })
        updateUserRow(result.user)
        toast.success('User blocked', `${user.name} can no longer sign in.`)
      }
      setReasonDialog(null)
      if (detail?.user?.id === user.id) {
        await refetchDetail(user.id)
      }
    } catch (requestError) {
      toast.error(
        reasonDialog.type === 'warn' ? 'Could not warn user' : 'Could not block user',
        requestError.message || 'Please try again.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUnblock = async () => {
    if (!unblockTarget) return
    setIsSubmitting(true)

    try {
      const result = await api.unblockAdminUser(unblockTarget.id, {})
      updateUserRow(result.user)
      toast.success('User unblocked', `${unblockTarget.name} can sign in again.`)
      setUnblockTarget(null)
      if (detail?.user?.id === unblockTarget.id) {
        await refetchDetail(unblockTarget.id)
      }
    } catch (requestError) {
      toast.error(
        'Could not unblock user',
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

  return (
    <div className="space-y-5">
      <AdminPageHeader
        eyebrow="Community"
        title="Users"
        description="Review accounts, issue warnings, and block users who break marketplace rules."
      />

      <AdminPanel flush>
        <AdminToolbar>
          <AdminSearchForm
            value={search}
            onChange={setSearch}
            onSubmit={handleSearch}
            placeholder="Search by name or email..."
          />
          <AdminFilterGroup>
            <AdminSelect
              value={role}
              onChange={(value) => {
                setRole(value)
                setPage(1)
              }}
              options={ROLE_OPTIONS}
              ariaLabel="Filter by role"
            />
            <AdminSelect
              value={userStatus}
              onChange={(value) => {
                setUserStatus(value)
                setPage(1)
              }}
              options={STATUS_OPTIONS}
              ariaLabel="Filter by account status"
            />
          </AdminFilterGroup>
        </AdminToolbar>

        {status === 'loading' && <TableSkeleton rows={6} columns={6} />}

        {status === 'error' && (
          <div className="p-5">
            <ErrorState
              title="Unable to load users"
              message={error}
              onRetry={() => setReloadKey((key) => key + 1)}
            />
          </div>
        )}

        {status === 'success' && users.length === 0 && (
          <AdminEmptyState
            icon="users"
            title="No users found"
            message="Try a different search term or clear the role and status filters."
          />
        )}

        {status === 'success' && users.length > 0 && (
          <>
            <div className={adminTableWrapper}>
              <table className={adminTable}>
                <thead className="bg-[#F8FAFC]">
                  <tr>
                    <th className={adminTableHeadCell}>User</th>
                    <th className={adminTableHeadCell}>Role</th>
                    <th className={adminTableHeadCell}>Status</th>
                    <th className={adminTableHeadCell}>Listings</th>
                    <th className={adminTableHeadCell}>Rating</th>
                    <th className={adminTableHeadCell}>Warnings</th>
                    <th className={adminTableHeadCell}>Joined</th>
                    <th className={adminTableHeadCell}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => {
                    const isSelf = String(user.id) === String(currentAdmin?.id)
                    return (
                      <tr key={user.id} className={adminTableRow}>
                        <td className={adminTableCell}>
                          <div className="flex items-center gap-3">
                            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#E8EDF5] text-[11px] font-bold text-[#334155]">
                              {initials(user.name)}
                            </span>
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-[#0F1626]">
                                {user.name}
                                {isSelf && (
                                  <span className="ml-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#94A3B8]">
                                    you
                                  </span>
                                )}
                              </p>
                              <p className="truncate text-xs text-[#94A3B8]">
                                {user.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className={adminTableCell}>
                          <AdminStatusBadge
                            label={titleCase(user.role)}
                            tone={roleTone(user.role)}
                            dot={false}
                          />
                        </td>
                        <td className={adminTableCell}>
                          <AdminStatusBadge
                            label={titleCase(user.status)}
                            tone={userStatusTone(user.status)}
                          />
                        </td>
                        <td className={adminTableCell}>
                          {formatAdminNumber(user.listingCount)}
                        </td>
                        <td className={adminTableCell}>
                          <span className="font-semibold text-[#0F1626]">
                            {Number(user.rating?.average || 0).toFixed(1)}
                          </span>
                          <span className="ml-1 text-xs text-[#94A3B8]">
                            ({formatAdminNumber(user.rating?.count)})
                          </span>
                        </td>
                        <td className={adminTableCell}>
                          <span
                            className={`inline-flex min-w-[1.75rem] items-center justify-center rounded-md px-1.5 py-0.5 text-xs font-semibold ${
                              user.warningCount > 0
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-[#F1F5F9] text-[#64748B]'
                            }`}
                          >
                            {formatAdminNumber(user.warningCount)}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-xs text-[#64748B]">
                          {formatAdminDate(user.createdAt)}
                        </td>
                        <td className={adminTableCell}>
                          <div className="flex items-center gap-0.5">
                            <button
                              type="button"
                              className={actionButtonClass('neutral')}
                              onClick={() => handleView(user)}
                            >
                              View
                            </button>
                            {!isSelf && (
                              <button
                                type="button"
                                className={actionButtonClass('warning')}
                                onClick={() => setReasonDialog({ type: 'warn', user })}
                              >
                                Warn
                              </button>
                            )}
                            {user.status === 'blocked' ? (
                              <button
                                type="button"
                                className={actionButtonClass('success')}
                                onClick={() => setUnblockTarget(user)}
                              >
                                Unblock
                              </button>
                            ) : (
                              !isSelf &&
                              user.role !== 'admin' && (
                                <button
                                  type="button"
                                  className={actionButtonClass('danger')}
                                  onClick={() => setReasonDialog({ type: 'block', user })}
                                >
                                  Block
                                </button>
                              )
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
                  {formatAdminNumber(pagination?.total)} users · page{' '}
                  {pagination?.page} of {pagination?.totalPages || 1}
                </p>
                <Pagination
                  page={pagination?.page || 1}
                  totalPages={pagination?.totalPages || 1}
                  onPageChange={setPage}
                  ariaLabel="Users pagination"
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
        title={reasonDialog?.type === 'warn' ? 'Warn user' : 'Block user'}
        description={
          reasonDialog
            ? reasonDialog.type === 'warn'
              ? `Send a recorded warning to ${reasonDialog.user.name}. The warning count is visible to admins only.`
              : `Block ${reasonDialog.user.name}? They will be signed out and prevented from signing in until unblocked.`
            : ''
        }
        confirmText={reasonDialog?.type === 'warn' ? 'Issue warning' : 'Block user'}
        variant={reasonDialog?.type === 'warn' ? 'primary' : 'danger'}
        loading={isSubmitting}
      />

      <ConfirmDialog
        isOpen={Boolean(unblockTarget)}
        onClose={() => {
          if (!isSubmitting) setUnblockTarget(null)
        }}
        onConfirm={handleUnblock}
        title="Unblock user?"
        message={
          unblockTarget
            ? `Restore access for ${unblockTarget.name}? They will be able to sign in and use BorrowBox again.`
            : ''
        }
        confirmText="Unblock user"
        variant="primary"
        loading={isSubmitting}
      />

      <Modal
        isOpen={Boolean(detail)}
        onClose={() => setDetail(null)}
        title={detail?.user?.name || 'User details'}
        size="lg"
      >
        {detailStatus === 'loading' && (
          <div className="space-y-3">
            <div className="h-20 animate-pulse rounded-xl bg-[#F1F5F9]" />
            <div className="h-24 animate-pulse rounded-xl bg-[#F1F5F9]" />
          </div>
        )}

        {detailStatus === 'error' && (
          <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {detailError}
          </p>
        )}

        {detailStatus === 'success' && detail?.user && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <AdminStatusBadge
                label={titleCase(detail.user.role)}
                tone={roleTone(detail.user.role)}
                dot={false}
              />
              <AdminStatusBadge
                label={titleCase(detail.user.status)}
                tone={userStatusTone(detail.user.status)}
              />
              <span className="text-xs text-[#64748B]">{detail.user.email}</span>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: 'Listings', value: detail.user.stats.listings },
                {
                  label: 'As borrower',
                  value: detail.user.stats.borrowRequests.asBorrower,
                },
                {
                  label: 'As owner',
                  value: detail.user.stats.borrowRequests.asOwner,
                },
                {
                  label: 'Reviews',
                  value:
                    detail.user.stats.reviews.written +
                    detail.user.stats.reviews.received,
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3 text-center"
                >
                  <p className="font-display text-xl font-bold text-[#0F1626]">
                    {formatAdminNumber(stat.value)}
                  </p>
                  <p className="mt-0.5 text-[11px] text-[#64748B]">{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-3 text-sm sm:grid-cols-2">
              <div className="rounded-xl border border-[#E2E8F0] p-3">
                <p className="text-xs text-[#94A3B8]">Rating</p>
                <p className="mt-1 font-semibold text-[#0F1626]">
                  {Number(detail.user.rating?.average || 0).toFixed(1)} / 5 ·{' '}
                  {formatAdminNumber(detail.user.rating?.count)} reviews
                </p>
              </div>
              <div className="rounded-xl border border-[#E2E8F0] p-3">
                <p className="text-xs text-[#94A3B8]">Warnings</p>
                <p className="mt-1 font-semibold text-[#0F1626]">
                  {formatAdminNumber(detail.user.warningCount)}
                  {detail.user.lastWarnedAt
                    ? ` · last ${formatAdminDate(detail.user.lastWarnedAt)}`
                    : ''}
                </p>
              </div>
              <div className="rounded-xl border border-[#E2E8F0] p-3">
                <p className="text-xs text-[#94A3B8]">Joined</p>
                <p className="mt-1 font-semibold text-[#0F1626]">
                  {formatAdminDate(detail.user.createdAt)}
                </p>
              </div>
              <div className="rounded-xl border border-[#E2E8F0] p-3">
                <p className="text-xs text-[#94A3B8]">Reviews received</p>
                <p className="mt-1 font-semibold text-[#0F1626]">
                  {formatAdminNumber(detail.user.stats.reviews.received)}
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
                Recent moderation activity
              </h3>
              {detail.recentActivity.length === 0 ? (
                <p className="mt-2 text-sm text-[#94A3B8]">
                  No moderation actions recorded for this account.
                </p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {detail.recentActivity.map((activity) => (
                    <li
                      key={activity.id}
                      className="flex items-center justify-between gap-3 rounded-lg bg-[#F8FAFC] px-3 py-2 text-sm"
                    >
                      <span className="font-medium text-[#334155]">
                        {titleCase(activity.action)}
                      </span>
                      <span className="text-xs text-[#94A3B8]">
                        {formatAdminRelative(activity.createdAt)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
