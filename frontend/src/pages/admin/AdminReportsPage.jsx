import { useEffect, useMemo, useState } from 'react'
import { api } from '../../services/api'
import { useToast } from '../../components/ui/Toast.jsx'
import { ErrorState } from '../../components/ui/ErrorState'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { TableSkeleton } from '../../components/ui/LoadingSpinner'
import { Pagination } from '../../components/ui/Pagination'
import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { AdminPanel } from '../../components/admin/AdminPanel'
import { AdminEmptyState } from '../../components/admin/AdminEmptyState'
import { AdminReasonDialog } from '../../components/admin/AdminReasonDialog'
import {
  AdminFilterGroup,
  AdminSelect,
  AdminToolbar,
} from '../../components/admin/AdminFilters'
import {
  AdminStatusBadge,
  reportStatusTone,
} from '../../components/admin/AdminStatusBadge'
import {
  formatAdminDateTime,
  formatAdminRelative,
  reportTargetLabel,
  titleCase,
} from '../../components/admin/adminFormat'
import {
  adminInputClass,
  adminLabelClass,
  adminTable,
  adminTableHeadCell,
  adminTableCell,
  adminTableRow,
  adminTableWrapper,
} from '../../components/admin/adminStyles'

const LIMIT = 20

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'Open', label: 'Open' },
  { value: 'Resolved', label: 'Resolved' },
  { value: 'Dismissed', label: 'Dismissed' },
]

const TARGET_OPTIONS = [
  { value: '', label: 'All targets' },
  { value: 'product', label: 'Products' },
  { value: 'user', label: 'Users' },
  { value: 'review', label: 'Reviews' },
]

const REASON_OPTIONS = [
  { value: '', label: 'All reasons' },
  { value: 'prohibited_item', label: 'Prohibited item' },
  { value: 'fake_listing', label: 'Fake listing' },
  { value: 'scam_fraud', label: 'Scam or fraud' },
  { value: 'wrong_information', label: 'Wrong information' },
  { value: 'offensive_content', label: 'Offensive content' },
  { value: 'duplicate_listing', label: 'Duplicate listing' },
  { value: 'other', label: 'Other' },
]

const ACTIONS_BY_TARGET = {
  product: [
    { value: 'none', label: 'No further action' },
    { value: 'warn_user', label: 'Warn the owner' },
    { value: 'block_user', label: 'Block the owner' },
    { value: 'hide_product', label: 'Hide the listing' },
    { value: 'remove_product', label: 'Remove the listing' },
  ],
  user: [
    { value: 'none', label: 'No further action' },
    { value: 'warn_user', label: 'Warn the user' },
    { value: 'block_user', label: 'Block the user' },
  ],
  review: [
    { value: 'none', label: 'No further action' },
    { value: 'warn_user', label: 'Warn the reviewer' },
    { value: 'block_user', label: 'Block the reviewer' },
    { value: 'hide_review', label: 'Hide the review' },
    { value: 'remove_review', label: 'Remove the review' },
  ],
}

const ACTION_LABELS = Object.fromEntries(
  Object.values(ACTIONS_BY_TARGET)
    .flat()
    .map((action) => [action.value, action.label])
)

function actionButtonClass(tone) {
  const tones = {
    neutral: 'text-[#475569] hover:bg-[#F1F5F9]',
    success: 'text-emerald-700 hover:bg-emerald-50',
    danger: 'text-rose-700 hover:bg-rose-50',
  }
  return `rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors ${tones[tone] || tones.neutral}`
}

function targetSummary(report) {
  const target = report?.target
  if (!target || target.missing) return 'Target no longer exists'
  if (target.type === 'product') return 'Product listing'
  if (target.type === 'user') return `${titleCase(target.status)} account`
  if (target.type === 'review') return `${target.rating}-star review`
  return titleCase(report?.targetType || '')
}

export default function AdminReportsPage() {
  const toast = useToast()

  const [reports, setReports] = useState([])
  const [pagination, setPagination] = useState(null)
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  const [page, setPage] = useState(1)
  const [reportStatus, setReportStatus] = useState('Open')
  const [targetType, setTargetType] = useState('')
  const [reason, setReason] = useState('')

  const [detailReport, setDetailReport] = useState(null)
  const [resolveTarget, setResolveTarget] = useState(null)
  const [resolutionAction, setResolutionAction] = useState('none')
  const [resolutionNote, setResolutionNote] = useState('')
  const [resolutionError, setResolutionError] = useState('')
  const [dismissTarget, setDismissTarget] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    let active = true
    setStatus('loading')
    setError('')

    api.getAdminReports({
      page,
      limit: LIMIT,
      status: reportStatus,
      targetType,
      reason,
    })
      .then((result) => {
        if (!active) return
        setReports(result.reports || [])
        setPagination(result.pagination)
        setStatus('success')
      })
      .catch((requestError) => {
        if (!active) return
        setError(requestError.message || 'Unable to load reports.')
        setStatus('error')
      })

    return () => {
      active = false
    }
  }, [page, reportStatus, targetType, reason, reloadKey])

  const resolveActions = useMemo(
    () => ACTIONS_BY_TARGET[resolveTarget?.targetType] || ACTIONS_BY_TARGET.product,
    [resolveTarget]
  )

  const updateRow = (updatedReport) => {
    setReports((current) =>
      current.map((item) =>
        item.id === updatedReport.id ? { ...item, ...updatedReport } : item
      )
    )
  }

  const openResolve = (report) => {
    setResolveTarget(report)
    setResolutionAction('none')
    setResolutionNote('')
    setResolutionError('')
  }

  const handleResolve = async () => {
    if (!resolveTarget) return
    setIsSubmitting(true)
    setResolutionError('')

    try {
      const result = await api.resolveAdminReport(resolveTarget.id, {
        action: resolutionAction,
        note: resolutionNote.trim(),
      })
      updateRow(result.report)
      toast.success(
        'Report resolved',
        resolutionAction === 'none'
          ? 'The report was closed without further action.'
          : `Applied: ${ACTION_LABELS[resolutionAction] || resolutionAction}.`
      )
      setResolveTarget(null)
    } catch (requestError) {
      setResolutionError(requestError.message || 'Unable to resolve this report.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDismiss = async (note) => {
    if (!dismissTarget) return
    setIsSubmitting(true)

    try {
      const result = await api.dismissAdminReport(dismissTarget.id, { note })
      updateRow(result.report)
      toast.success('Report dismissed', 'The report was closed with no action.')
      setDismissTarget(null)
    } catch (requestError) {
      toast.error(
        'Could not dismiss report',
        requestError.message || 'Please try again.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-5">
      <AdminPageHeader
        eyebrow="Moderation"
        title="Reports"
        description="Triage community reports and apply a recorded moderation decision."
      />

      <AdminPanel flush>
        <AdminToolbar>
          <div>
            <p className="text-sm font-semibold text-[#0F1626]">
              Report queue
            </p>
            <p className="text-xs text-[#64748B]">
              Open reports appear first so urgent issues are easy to spot.
            </p>
          </div>
          <AdminFilterGroup>
            <AdminSelect
              value={reportStatus}
              onChange={(value) => {
                setReportStatus(value)
                setPage(1)
              }}
              options={STATUS_OPTIONS}
              ariaLabel="Filter reports by status"
            />
            <AdminSelect
              value={targetType}
              onChange={(value) => {
                setTargetType(value)
                setPage(1)
              }}
              options={TARGET_OPTIONS}
              ariaLabel="Filter reports by target type"
            />
            <AdminSelect
              value={reason}
              onChange={(value) => {
                setReason(value)
                setPage(1)
              }}
              options={REASON_OPTIONS}
              ariaLabel="Filter reports by reason"
            />
          </AdminFilterGroup>
        </AdminToolbar>

        {status === 'loading' && <TableSkeleton rows={6} columns={6} />}

        {status === 'error' && (
          <div className="p-5">
            <ErrorState
              title="Unable to load reports"
              message={error}
              onRetry={() => setReloadKey((key) => key + 1)}
            />
          </div>
        )}

        {status === 'success' && reports.length === 0 && (
          <AdminEmptyState
            icon="reports"
            title="No reports found"
            message="The moderation queue is clear for the selected filters."
          />
        )}

        {status === 'success' && reports.length > 0 && (
          <>
            <div className={adminTableWrapper}>
              <table className={adminTable}>
                <thead className="bg-[#F8FAFC]">
                  <tr>
                    <th className={adminTableHeadCell}>Target</th>
                    <th className={adminTableHeadCell}>Reason</th>
                    <th className={adminTableHeadCell}>Reporter</th>
                    <th className={adminTableHeadCell}>Reported</th>
                    <th className={adminTableHeadCell}>Status</th>
                    <th className={adminTableHeadCell}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((report) => (
                    <tr key={report.id} className={adminTableRow}>
                      <td className={adminTableCell}>
                        <p className="max-w-[240px] truncate font-semibold text-[#0F1626]">
                          {reportTargetLabel(report)}
                        </p>
                        <p className="text-xs text-[#94A3B8]">
                          {targetSummary(report)}
                        </p>
                      </td>
                      <td className={adminTableCell}>
                        <span className="inline-flex whitespace-nowrap rounded-md bg-[#F1F5F9] px-2 py-0.5 text-xs font-medium text-[#475569]">
                          {titleCase(report.reason)}
                        </span>
                        {report.description && (
                          <p className="mt-1 max-w-[220px] truncate text-xs text-[#94A3B8]">
                            {report.description}
                          </p>
                        )}
                      </td>
                      <td className={adminTableCell}>
                        <span className="whitespace-nowrap font-medium text-[#334155]">
                          {report.reporter?.name || '—'}
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
                      <td className={adminTableCell}>
                        <div className="flex items-center gap-0.5">
                          <button
                            type="button"
                            className={actionButtonClass('neutral')}
                            onClick={() => setDetailReport(report)}
                          >
                            View
                          </button>
                          {report.status === 'Open' && (
                            <>
                              <button
                                type="button"
                                className={actionButtonClass('success')}
                                onClick={() => openResolve(report)}
                              >
                                Resolve
                              </button>
                              <button
                                type="button"
                                className={actionButtonClass('danger')}
                                onClick={() => setDismissTarget(report)}
                              >
                                Dismiss
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-[#E2E8F0] px-4 py-4">
              <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
                <p className="text-xs text-[#64748B]">
                  {pagination?.total ?? 0} reports · page {pagination?.page} of{' '}
                  {pagination?.totalPages || 1}
                </p>
                <Pagination
                  page={pagination?.page || 1}
                  totalPages={pagination?.totalPages || 1}
                  onPageChange={setPage}
                  ariaLabel="Reports pagination"
                />
              </div>
            </div>
          </>
        )}
      </AdminPanel>

      <Modal
        isOpen={Boolean(detailReport)}
        onClose={() => setDetailReport(null)}
        title="Report details"
        size="lg"
      >
        {detailReport && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <AdminStatusBadge
                label={detailReport.status}
                tone={reportStatusTone(detailReport.status)}
              />
              <span className="text-xs text-[#64748B]">
                {titleCase(detailReport.targetType)} ·{' '}
                {titleCase(detailReport.reason)}
              </span>
            </div>

            <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">
                Target
              </p>
              <p className="mt-1 font-semibold text-[#0F1626]">
                {reportTargetLabel(detailReport)}
              </p>
              <p className="text-xs text-[#64748B]">{targetSummary(detailReport)}</p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">
                Reporter description
              </p>
              <p className="mt-1 whitespace-pre-line text-sm text-[#334155]">
                {detailReport.description || 'No description provided.'}
              </p>
            </div>

            <div className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <p className="text-xs text-[#94A3B8]">Reported by</p>
                <p className="font-medium text-[#334155]">
                  {detailReport.reporter?.name || '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#94A3B8]">Reported at</p>
                <p className="font-medium text-[#334155]">
                  {formatAdminDateTime(detailReport.createdAt)}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#94A3B8]">Resolution</p>
                <p className="font-medium text-[#334155]">
                  {detailReport.status === 'Open'
                    ? 'Pending decision'
                    : ACTION_LABELS[detailReport.resolutionAction] ||
                      titleCase(detailReport.resolutionAction)}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#94A3B8]">Reviewed by</p>
                <p className="font-medium text-[#334155]">
                  {detailReport.reviewedBy?.name || '—'}
                </p>
              </div>
            </div>

            {detailReport.resolutionNote && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">
                  Resolution note
                </p>
                <p className="mt-1 whitespace-pre-line text-sm text-[#334155]">
                  {detailReport.resolutionNote}
                </p>
              </div>
            )}

            {detailReport.status === 'Open' && (
              <div className="flex justify-end gap-2 border-t border-[#E2E8F0] pt-4">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setDetailReport(null)
                    setDismissTarget(detailReport)
                  }}
                >
                  Dismiss
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setDetailReport(null)
                    openResolve(detailReport)
                  }}
                >
                  Resolve report
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal
        isOpen={Boolean(resolveTarget)}
        onClose={() => {
          if (!isSubmitting) setResolveTarget(null)
        }}
        title="Resolve report"
        size="sm"
      >
        {resolveTarget && (
          <div className="space-y-4">
            <p className="text-sm text-[#64748B]">
              Choose what happens to{' '}
              <span className="font-semibold text-[#0F1626]">
                {reportTargetLabel(resolveTarget)}
              </span>
              . The decision is written to the audit log.
            </p>

            <label className="block">
              <span className={adminLabelClass}>Moderation action</span>
              <select
                value={resolutionAction}
                onChange={(event) => setResolutionAction(event.target.value)}
                className={adminInputClass}
                disabled={isSubmitting}
              >
                {resolveActions.map((action) => (
                  <option key={action.value} value={action.value}>
                    {action.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className={adminLabelClass}>
                Resolution note{' '}
                <span className="normal-case text-[#94A3B8]">(optional)</span>
              </span>
              <textarea
                value={resolutionNote}
                onChange={(event) => setResolutionNote(event.target.value)}
                rows={4}
                maxLength={1000}
                placeholder="Add context for the audit log."
                className={`${adminInputClass} resize-none`}
                disabled={isSubmitting}
              />
            </label>

            {resolutionError && (
              <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {resolutionError}
              </p>
            )}

            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                onClick={() => setResolveTarget(null)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button onClick={handleResolve} loading={isSubmitting}>
                Resolve report
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <AdminReasonDialog
        isOpen={Boolean(dismissTarget)}
        onClose={() => {
          if (!isSubmitting) setDismissTarget(null)
        }}
        onConfirm={handleDismiss}
        title="Dismiss report"
        description="Dismiss this report without taking moderation action. Add an optional note for the audit log."
        label="Dismissal note"
        confirmText="Dismiss report"
        required={false}
        variant="secondary"
        loading={isSubmitting}
      />
    </div>
  )
}
