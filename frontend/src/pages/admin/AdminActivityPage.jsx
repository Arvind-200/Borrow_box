import { useEffect, useState } from 'react'
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
import { AdminStatusBadge } from '../../components/admin/AdminStatusBadge'
import {
  formatAdminDateTime,
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

const ACTION_OPTIONS = [
  { value: '', label: 'All actions' },
  { value: 'warn_user', label: 'User warned' },
  { value: 'block_user', label: 'User blocked' },
  { value: 'unblock_user', label: 'User unblocked' },
  { value: 'hide_product', label: 'Listing hidden' },
  { value: 'remove_product', label: 'Listing removed' },
  { value: 'restore_product', label: 'Listing restored' },
  { value: 'hide_review', label: 'Review hidden' },
  { value: 'remove_review', label: 'Review removed' },
  { value: 'restore_review', label: 'Review restored' },
  { value: 'resolve_report', label: 'Report resolved' },
  { value: 'dismiss_report', label: 'Report dismissed' },
  { value: 'create_category', label: 'Category created' },
  { value: 'update_category', label: 'Category updated' },
  { value: 'activate_category', label: 'Category activated' },
  { value: 'deactivate_category', label: 'Category deactivated' },
  { value: 'update_settings', label: 'Settings updated' },
]

const TARGET_OPTIONS = [
  { value: '', label: 'All targets' },
  { value: 'user', label: 'Users' },
  { value: 'product', label: 'Listings' },
  { value: 'review', label: 'Reviews' },
  { value: 'report', label: 'Reports' },
  { value: 'category', label: 'Categories' },
  { value: 'setting', label: 'Settings' },
]

const ACTION_LABELS = Object.fromEntries(
  ACTION_OPTIONS.filter((option) => option.value).map((option) => [
    option.value,
    option.label,
  ])
)

function actionTone(action) {
  if (action.startsWith('block') || action.startsWith('remove')) return 'danger'
  if (action.startsWith('dismiss')) return 'neutral'
  if (action.startsWith('hide') || action.startsWith('warn')) return 'warning'
  if (
    action.startsWith('unblock') ||
    action.startsWith('restore') ||
    action.startsWith('activate')
  ) {
    return 'success'
  }
  return 'info'
}

export default function AdminActivityPage() {
  const [activities, setActivities] = useState([])
  const [pagination, setPagination] = useState(null)
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [page, setPage] = useState(1)
  const [action, setAction] = useState('')
  const [targetType, setTargetType] = useState('')

  useEffect(() => {
    let active = true
    setStatus('loading')
    setError('')

    api.getAdminActivityLogs({
      page,
      limit: LIMIT,
      action,
      targetType,
    })
      .then((result) => {
        if (!active) return
        setActivities(result.activities || [])
        setPagination(result.pagination)
        setStatus('success')
      })
      .catch((requestError) => {
        if (!active) return
        setError(requestError.message || 'Unable to load admin activity.')
        setStatus('error')
      })

    return () => {
      active = false
    }
  }, [page, action, targetType, reloadKey])

  return (
    <div className="space-y-5">
      <AdminPageHeader
        eyebrow="System"
        title="Activity log"
        description="A tamper-evident trail of every moderation, category, and settings change."
      />

      <AdminPanel flush>
        <AdminToolbar>
          <div>
            <p className="text-sm font-semibold text-[#0F1626]">Audit trail</p>
            <p className="text-xs text-[#64748B]">
              Newest decisions appear first. Actions cannot be edited or deleted.
            </p>
          </div>
          <AdminFilterGroup>
            <AdminSelect
              value={action}
              onChange={(value) => {
                setAction(value)
                setPage(1)
              }}
              options={ACTION_OPTIONS}
              ariaLabel="Filter activity by action"
            />
            <AdminSelect
              value={targetType}
              onChange={(value) => {
                setTargetType(value)
                setPage(1)
              }}
              options={TARGET_OPTIONS}
              ariaLabel="Filter activity by target type"
            />
          </AdminFilterGroup>
        </AdminToolbar>

        {status === 'loading' && <TableSkeleton rows={6} columns={5} />}

        {status === 'error' && (
          <div className="p-5">
            <ErrorState
              title="Unable to load activity"
              message={error}
              onRetry={() => setReloadKey((key) => key + 1)}
            />
          </div>
        )}

        {status === 'success' && activities.length === 0 && (
          <AdminEmptyState
            icon="activity"
            title="No admin activity found"
            message="Moderation actions and system changes will appear here."
          />
        )}

        {status === 'success' && activities.length > 0 && (
          <>
            <div className={adminTableWrapper}>
              <table className={adminTable}>
                <thead className="bg-[#F8FAFC]">
                  <tr>
                    <th className={adminTableHeadCell}>When</th>
                    <th className={adminTableHeadCell}>Admin</th>
                    <th className={adminTableHeadCell}>Action</th>
                    <th className={adminTableHeadCell}>Target</th>
                    <th className={adminTableHeadCell}>Reason / details</th>
                  </tr>
                </thead>
                <tbody>
                  {activities.map((activity) => {
                    const details = Object.entries(activity.metadata || {})
                    return (
                      <tr key={activity.id} className={adminTableRow}>
                        <td className="whitespace-nowrap px-5 py-4 text-xs text-[#64748B]">
                          {formatAdminDateTime(activity.createdAt)}
                        </td>
                        <td className={adminTableCell}>
                          <span className="whitespace-nowrap font-medium text-[#334155]">
                            {activity.admin?.name || 'Administrator'}
                          </span>
                        </td>
                        <td className={adminTableCell}>
                          <AdminStatusBadge
                            label={
                              ACTION_LABELS[activity.action] ||
                              titleCase(activity.action)
                            }
                            tone={actionTone(activity.action)}
                            dot={false}
                          />
                        </td>
                        <td className={adminTableCell}>
                          <p className="whitespace-nowrap text-xs font-semibold uppercase tracking-wider text-[#64748B]">
                            {activity.targetType}
                          </p>
                          <p
                            className="max-w-[9rem] truncate font-mono text-[11px] text-[#94A3B8]"
                            title={activity.targetId || ''}
                          >
                            {activity.targetId || '—'}
                          </p>
                        </td>
                        <td className={adminTableCell}>
                          <p className="max-w-[320px] truncate text-sm text-[#475569]">
                            {activity.reason || '—'}
                          </p>
                          {details.length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-1">
                              {details.slice(0, 4).map(([key, value]) => (
                                <span
                                  key={key}
                                  className="rounded bg-[#F1F5F9] px-1.5 py-0.5 text-[10px] font-medium text-[#64748B]"
                                >
                                  {key}: {String(value)}
                                </span>
                              ))}
                            </div>
                          )}
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
                  {pagination?.total ?? 0} actions · page {pagination?.page} of{' '}
                  {pagination?.totalPages || 1}
                </p>
                <Pagination
                  page={pagination?.page || 1}
                  totalPages={pagination?.totalPages || 1}
                  onPageChange={setPage}
                  ariaLabel="Activity pagination"
                />
              </div>
            </div>
          </>
        )}
      </AdminPanel>
    </div>
  )
}
