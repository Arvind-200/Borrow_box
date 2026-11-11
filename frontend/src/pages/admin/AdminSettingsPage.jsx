import { useEffect, useState } from 'react'
import { api } from '../../services/api'
import { useToast } from '../../components/ui/Toast.jsx'
import { ErrorState } from '../../components/ui/ErrorState'
import { Button } from '../../components/ui/Button'
import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { AdminPanel } from '../../components/admin/AdminPanel'
import { AdminIcon } from '../../components/admin/AdminIcon'
import {
  adminInputClass,
  adminLabelClass,
} from '../../components/admin/adminStyles'
import { formatAdminDateTime } from '../../components/admin/adminFormat'

const EMPTY_SETTINGS = {
  siteName: 'BorrowBox',
  supportEmail: '',
  allowNewListings: true,
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function AdminSettingsPage() {
  const toast = useToast()

  const [settings, setSettings] = useState(null)
  const [form, setForm] = useState(EMPTY_SETTINGS)
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [formError, setFormError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    let active = true
    setStatus('loading')
    setError('')

    api.getAdminSettings()
      .then((result) => {
        if (!active) return
        setSettings(result.settings)
        setForm({
          siteName: result.settings.siteName || 'BorrowBox',
          supportEmail: result.settings.supportEmail || '',
          allowNewListings: result.settings.allowNewListings !== false,
        })
        setStatus('success')
      })
      .catch((requestError) => {
        if (!active) return
        setError(requestError.message || 'Unable to load platform settings.')
        setStatus('error')
      })

    return () => {
      active = false
    }
  }, [reloadKey])

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
    if (formError) setFormError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const siteName = form.siteName.trim()
    const supportEmail = form.supportEmail.trim()

    if (siteName.length < 2) {
      setFormError('Site name must be at least 2 characters.')
      return
    }
    if (supportEmail && !EMAIL_REGEX.test(supportEmail)) {
      setFormError('Support email must be a valid email address.')
      return
    }

    setIsSaving(true)
    setFormError('')

    try {
      const result = await api.updateAdminSettings({
        siteName,
        supportEmail,
        allowNewListings: form.allowNewListings,
      })
      setSettings(result.settings)
      setForm({
        siteName: result.settings.siteName,
        supportEmail: result.settings.supportEmail || '',
        allowNewListings: result.settings.allowNewListings !== false,
      })
      toast.success('Settings saved', 'Platform settings updated successfully.')
    } catch (requestError) {
      setFormError(requestError.message || 'Unable to save settings.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      <AdminPageHeader
        eyebrow="System"
        title="Settings"
        description="Control platform-wide preferences that apply to every marketplace user."
      />

      {status === 'loading' && (
        <div className="grid gap-5 xl:grid-cols-3">
          <div className="h-80 animate-pulse rounded-2xl border border-[#E2E8F0] bg-white xl:col-span-2" />
          <div className="h-56 animate-pulse rounded-2xl border border-[#E2E8F0] bg-white" />
        </div>
      )}

      {status === 'error' && (
        <ErrorState
          title="Unable to load settings"
          message={error}
          onRetry={() => setReloadKey((key) => key + 1)}
        />
      )}

      {status === 'success' && (
        <div className="grid gap-5 xl:grid-cols-3">
          <AdminPanel
            title="Platform identity"
            description="Basic details shown across the marketplace."
            className="xl:col-span-2"
          >
            <form onSubmit={handleSubmit} className="space-y-5">
              <label className="block">
                <span className={adminLabelClass}>Site name</span>
                <input
                  type="text"
                  value={form.siteName}
                  onChange={(event) => updateField('siteName', event.target.value)}
                  className={adminInputClass}
                  maxLength={80}
                  placeholder="BorrowBox"
                  disabled={isSaving}
                />
                <span className="mt-1 block text-xs text-[#94A3B8]">
                  Used as the marketplace name in communications and admin views.
                </span>
              </label>

              <label className="block">
                <span className={adminLabelClass}>Support email</span>
                <input
                  type="email"
                  value={form.supportEmail}
                  onChange={(event) => updateField('supportEmail', event.target.value)}
                  className={adminInputClass}
                  maxLength={120}
                  placeholder="support@example.com"
                  disabled={isSaving}
                />
                <span className="mt-1 block text-xs text-[#94A3B8]">
                  Leave blank if there is no public support address yet.
                </span>
              </label>

              <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-[#0F1626]">
                      Allow new listings
                    </p>
                    <p className="mt-1 text-xs text-[#64748B]">
                      When disabled, owners cannot create new listings. Existing
                      listings and edits remain available.
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={form.allowNewListings}
                    aria-label="Allow new listings"
                    onClick={() =>
                      updateField('allowNewListings', !form.allowNewListings)
                    }
                    disabled={isSaving}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:opacity-60 ${
                      form.allowNewListings ? 'bg-primary-500' : 'bg-[#CBD5E1]'
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
                        form.allowNewListings ? 'translate-x-5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {formError && (
                <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {formError}
                </p>
              )}

              <div className="flex items-center justify-between gap-3 border-t border-[#E2E8F0] pt-4">
                <p className="text-xs text-[#94A3B8]">
                  {settings?.updatedAt
                    ? `Last updated ${formatAdminDateTime(settings.updatedAt)}`
                    : 'Not saved yet'}
                </p>
                <Button type="submit" loading={isSaving}>
                  Save settings
                </Button>
              </div>
            </form>
          </AdminPanel>

          <div className="space-y-5">
            <AdminPanel title="How this is enforced">
              <ul className="space-y-4 text-sm text-[#475569]">
                <li className="flex gap-3">
                  <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-700">
                    <AdminIcon name="shield" className="h-4 w-4" />
                  </span>
                  <span>
                    The listing switch is enforced by the backend, not just this
                    admin screen.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[#F1F5F9] text-[#475569]">
                    <AdminIcon name="activity" className="h-4 w-4" />
                  </span>
                  <span>
                    Every settings change is recorded in the audit log with the
                    admin account that made it.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
                    <AdminIcon name="alert" className="h-4 w-4" />
                  </span>
                  <span>
                    Disabling new listings does not hide or remove content that is
                    already published.
                  </span>
                </li>
              </ul>
            </AdminPanel>

            <AdminPanel title="Current state">
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[#64748B]">New listings</span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      form.allowNewListings
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-rose-50 text-rose-700'
                    }`}
                  >
                    {form.allowNewListings ? 'Accepting' : 'Paused'}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[#64748B]">Updated by</span>
                  <span className="font-medium text-[#334155]">
                    {settings?.updatedBy?.name || '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[#64748B]">Support email</span>
                  <span className="max-w-[12rem] truncate font-medium text-[#334155]">
                    {form.supportEmail || 'Not set'}
                  </span>
                </div>
              </div>
            </AdminPanel>
          </div>
        </div>
      )}
    </div>
  )
}
