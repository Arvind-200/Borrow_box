import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../services/api'
import { ErrorState } from '../../components/ui/ErrorState'
import { Button } from '../../components/ui/Button'
import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { AdminStatCard } from '../../components/admin/AdminStatCard'
import { AdminPanel } from '../../components/admin/AdminPanel'
import { AdminIcon } from '../../components/admin/AdminIcon'
import { AdminStatusBadge, reportStatusTone } from '../../components/admin/AdminStatusBadge'
import {
  AdminCategoryBars,
  AdminDonut,
  AdminRequestsChart,
} from '../../components/admin/AdminCharts'
import {
  formatAdminNumber,
  formatAdminRelative,
  reportTargetLabel,
  titleCase,
} from '../../components/admin/adminFormat'
import {
  adminTable,
  adminTableHeadCell,
  adminTableCell,
  adminTableRow,
  adminTableWrapper,
} from '../../components/admin/adminStyles'

const ACTIVITY_ICONS = {
  user: 'users',
  product: 'listings',
  review: 'reviews',
  report: 'reports',
  category: 'categories',
  setting: 'settings',
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[...Array(4)].map((_, index) => (
          <div
            key={index}
            className="h-36 animate-pulse rounded-2xl border border-[#E2E8F0] bg-white"
          />
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-3">
        <div className="h-[340px] animate-pulse rounded-2xl border border-[#E2E8F0] bg-white xl:col-span-2" />
        <div className="h-[340px] animate-pulse rounded-2xl border border-[#E2E8F0] bg-white" />
      </div>
    </div>
  )
}

export default function AdminDashboardPage() {
  const [data, setData] = useState(null)
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let active = true
    setStatus('loading')
    setError('')

    api.getAdminDashboard()
      .then((result) => {
        if (!active) return
        setData(result)
        setStatus('success')
      })
      .catch((requestError) => {
        if (!active) return
        setError(requestError.message || 'Unable to load dashboard metrics.')
        setStatus('error')
      })

    return () => {
      active = false
    }
  }, [reloadKey])

  const handleRefresh = () => setReloadKey((key) => key + 1)

  const metrics = data?.metrics
  const listingDonut = data
    ? [
        { label: 'Active', value: data.listingStatus.active, color: '#10B981' },
        {
          label: 'Unpublished',
          value: data.listingStatus.unpublished,
          color: '#CBD5E1',
        },
        { label: 'Hidden', value: data.listingStatus.hidden, color: '#F59E0B' },
        { label: 'Removed', value: data.listingStatus.removed, color: '#F43F5E' },
      ]
    : []

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Overview"
        title="Marketplace dashboard"
        description="A live view of community activity, moderation load, and marketplace health."
        actions={
          <div className="flex items-center gap-2">
            {status === 'success' && (
              <span className="hidden text-xs text-[#94A3B8] sm:inline">
                Updated {new Date().toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
              </span>
            )}
            <Button
              variant="secondary"
              size="sm"
              onClick={handleRefresh}
              disabled={status === 'loading'}
            >
              <AdminIcon name="activity" className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        }
      />

      {status === 'loading' && <DashboardSkeleton />}

      {status === 'error' && (
        <ErrorState
          title="Unable to load the dashboard"
          message={error}
          onRetry={handleRefresh}
        />
      )}

      {status === 'success' && data && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <AdminStatCard
              label="Total users"
              value={formatAdminNumber(metrics.users.total)}
              trend={`+${formatAdminNumber(metrics.users.newThisWeek)}`}
              sublabel={`${formatAdminNumber(metrics.users.active)} active · ${formatAdminNumber(metrics.users.blocked)} blocked`}
              icon="users"
              tone="sky"
            />
            <AdminStatCard
              label="Active listings"
              value={formatAdminNumber(metrics.listings.active)}
              sublabel={`${formatAdminNumber(metrics.listings.total)} total · ${formatAdminNumber(metrics.listings.hidden)} hidden`}
              icon="listings"
              tone="primary"
            />
            <AdminStatCard
              label="Pending requests"
              value={formatAdminNumber(metrics.requests.pending)}
              trend={`+${formatAdminNumber(metrics.requests.thisWeek)}`}
              sublabel={`${formatAdminNumber(metrics.requests.total)} requests all time`}
              icon="requests"
              tone="amber"
            />
            <AdminStatCard
              label="Open reports"
              value={formatAdminNumber(metrics.reports.open)}
              sublabel={`${formatAdminNumber(metrics.reports.total)} reports all time`}
              icon="reports"
              tone={metrics.reports.open > 0 ? 'rose' : 'navy'}
            />
          </div>

          <div className="grid gap-5 xl:grid-cols-3">
            <AdminPanel
              title="Borrow requests"
              description="New requests created during the last seven days."
              className="xl:col-span-2"
              actions={
                <Link
                  to="/admin/requests"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary-700 hover:text-primary-800"
                >
                  View requests
                  <AdminIcon name="chevronRight" className="h-3.5 w-3.5" />
                </Link>
              }
            >
              <AdminRequestsChart data={data.requestsLast7Days} />
            </AdminPanel>

            <AdminPanel
              title="Listing status"
              description="Where every listing currently sits."
              actions={
                <Link
                  to="/admin/listings"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary-700 hover:text-primary-800"
                >
                  Manage
                  <AdminIcon name="chevronRight" className="h-3.5 w-3.5" />
                </Link>
              }
            >
              <AdminDonut data={listingDonut} centerLabel="Listings" />
            </AdminPanel>
          </div>

          <div className="grid gap-5 xl:grid-cols-3">
            <AdminPanel
              title="Top categories"
              description="Live listings grouped by category."
            >
              {data.listingMix.length > 0 ? (
                <AdminCategoryBars data={data.listingMix} />
              ) : (
                <p className="py-8 text-center text-sm text-[#94A3B8]">
                  No live listings yet.
                </p>
              )}
            </AdminPanel>

            <AdminPanel
              title="Moderation queue"
              description="Newest open reports waiting for a decision."
              className="xl:col-span-2"
              flush
              actions={
                <Link
                  to="/admin/reports"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary-700 hover:text-primary-800"
                >
                  Open queue
                  <AdminIcon name="chevronRight" className="h-3.5 w-3.5" />
                </Link>
              }
            >
              {data.moderationQueue.length === 0 ? (
                <p className="px-5 py-10 text-center text-sm text-[#94A3B8]">
                  The moderation queue is clear.
                </p>
              ) : (
                <div className={adminTableWrapper}>
                  <table className={adminTable}>
                    <thead className="bg-[#F8FAFC]">
                      <tr>
                        <th className={adminTableHeadCell}>Target</th>
                        <th className={adminTableHeadCell}>Reason</th>
                        <th className={adminTableHeadCell}>Reported</th>
                        <th className={adminTableHeadCell}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.moderationQueue.map((report) => (
                        <tr key={report.id} className={adminTableRow}>
                          <td className={adminTableCell}>
                            <p className="max-w-[220px] truncate font-semibold text-[#0F1626]">
                              {reportTargetLabel(report)}
                            </p>
                            <p className="text-xs capitalize text-[#94A3B8]">
                              {report.targetType}
                            </p>
                          </td>
                          <td className={adminTableCell}>
                            <span className="whitespace-nowrap capitalize text-[#475569]">
                              {titleCase(report.reason)}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-5 py-4 text-xs text-[#64748B]">
                            {formatAdminRelative(report.createdAt)}
                          </td>
                          <td className={adminTableCell}>
                            <AdminStatusBadge
                              label={report.status}
                              tone={reportStatusTone(report.status)}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </AdminPanel>
          </div>

          <AdminPanel
            title="Recent admin activity"
            description="Every moderation decision is recorded in the audit log."
            actions={
              <Link
                to="/admin/activity"
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary-700 hover:text-primary-800"
              >
                Full audit log
                <AdminIcon name="chevronRight" className="h-3.5 w-3.5" />
              </Link>
            }
          >
            {data.recentActivity.length === 0 ? (
              <p className="py-8 text-center text-sm text-[#94A3B8]">
                No admin actions have been recorded yet.
              </p>
            ) : (
              <ul className="space-y-3">
                {data.recentActivity.map((activity) => (
                  <li
                    key={activity.id}
                    className="flex items-start gap-3 rounded-xl border border-[#E2E8F0] px-3.5 py-3"
                  >
                    <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[#F1F5F9] text-[#475569]">
                      <AdminIcon
                        name={ACTIVITY_ICONS[activity.targetType] || 'activity'}
                        className="h-4 w-4"
                      />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[#0F1626]">
                        {titleCase(activity.action)}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-[#64748B]">
                        {activity.admin?.name || 'Administrator'}
                        {activity.reason ? ` · ${activity.reason}` : ''}
                      </p>
                    </div>
                    <span className="whitespace-nowrap text-[11px] text-[#94A3B8]">
                      {formatAdminRelative(activity.createdAt)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </AdminPanel>
        </>
      )}
    </div>
  )
}
