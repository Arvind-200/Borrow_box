import { useEffect, useState } from 'react'
import { api } from '../../services/api'
import { useToast } from '../../components/ui/Toast.jsx'
import { ErrorState } from '../../components/ui/ErrorState'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { TableSkeleton } from '../../components/ui/LoadingSpinner'
import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { AdminPanel } from '../../components/admin/AdminPanel'
import { AdminEmptyState } from '../../components/admin/AdminEmptyState'
import { AdminIcon } from '../../components/admin/AdminIcon'
import { AdminStatusBadge } from '../../components/admin/AdminStatusBadge'
import { AdminSearchForm, AdminToolbar } from '../../components/admin/AdminFilters'
import {
  formatAdminDate,
  formatAdminNumber,
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

const EMPTY_FORM = {
  name: '',
  slug: '',
  description: '',
  icon: 'box',
  sortOrder: 0,
  isActive: true,
}

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

function actionButtonClass(tone) {
  const tones = {
    neutral: 'text-[#475569] hover:bg-[#F1F5F9]',
    warning: 'text-amber-700 hover:bg-amber-50',
    success: 'text-emerald-700 hover:bg-emerald-50',
  }
  return `rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors ${tones[tone] || tones.neutral}`
}

export default function AdminCategoriesPage() {
  const toast = useToast()

  const [categories, setCategories] = useState([])
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [search, setSearch] = useState('')

  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formError, setFormError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    let active = true
    setStatus('loading')
    setError('')

    api.getAdminCategories()
      .then((result) => {
        if (!active) return
        setCategories(result.categories || [])
        setStatus('success')
      })
      .catch((requestError) => {
        if (!active) return
        setError(requestError.message || 'Unable to load categories.')
        setStatus('error')
      })

    return () => {
      active = false
    }
  }, [reloadKey])

  const filteredCategories = categories.filter((category) => {
    const term = search.trim().toLowerCase()
    if (!term) return true
    return (
      category.name.toLowerCase().includes(term) ||
      category.slug.toLowerCase().includes(term)
    )
  })

  const openCreate = () => {
    setForm(EMPTY_FORM)
    setFormError('')
    setModal({ mode: 'create' })
  }

  const openEdit = (category) => {
    setForm({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      icon: category.icon || 'box',
      sortOrder: category.sortOrder ?? 0,
      isActive: category.isActive !== false,
    })
    setFormError('')
    setModal({ mode: 'edit', category })
  }

  const closeModal = () => {
    if (!isSubmitting) setModal(null)
  }

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
    if (formError) setFormError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const name = form.name.trim()
    const slug = form.slug.trim()

    if (name.length < 2) {
      setFormError('Category name must be at least 2 characters.')
      return
    }
    if (slug && !SLUG_REGEX.test(slug)) {
      setFormError('Slug may only contain lowercase letters, numbers, and hyphens.')
      return
    }

    setIsSubmitting(true)
    setFormError('')

    const payload = {
      name,
      slug: slug || undefined,
      description: form.description.trim(),
      icon: form.icon.trim() || 'box',
      sortOrder: Number(form.sortOrder) || 0,
      isActive: Boolean(form.isActive),
    }

    try {
      if (modal.mode === 'create') {
        await api.createAdminCategory(payload)
        toast.success('Category created', `${name} is ready to use.`)
      } else {
        await api.updateAdminCategory(modal.category.id, payload)
        toast.success('Category updated', `${name} was saved.`)
      }
      setModal(null)
      setReloadKey((key) => key + 1)
    } catch (requestError) {
      setFormError(requestError.message || 'Unable to save this category.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggle = async (category) => {
    try {
      const result = await api.setAdminCategoryActive(
        category.id,
        category.isActive === false
      )
      setCategories((current) =>
        current.map((item) =>
          item.id === category.id ? { ...item, ...result.category } : item
        )
      )
      toast.success(
        category.isActive === false ? 'Category activated' : 'Category deactivated',
        category.isActive === false
          ? `${category.name} can be used for new listings again.`
          : `${category.name} is hidden from new listing choices. Existing listings are unchanged.`
      )
    } catch (requestError) {
      toast.error(
        'Could not update category',
        requestError.message || 'Please try again.'
      )
    }
  }

  return (
    <div className="space-y-5">
      <AdminPageHeader
        eyebrow="System"
        title="Categories"
        description="Organize the catalog and control which categories owners can use for new listings."
        actions={
          <Button size="sm" onClick={openCreate}>
            <AdminIcon name="plus" className="h-4 w-4" />
            New category
          </Button>
        }
      />

      <AdminPanel flush>
        <AdminToolbar>
          <AdminSearchForm
            value={search}
            onChange={setSearch}
            onSubmit={() => {}}
            placeholder="Search categories..."
          />
          <p className="text-xs text-[#64748B]">
            {formatAdminNumber(categories.length)} categories total
          </p>
        </AdminToolbar>

        {status === 'loading' && <TableSkeleton rows={5} columns={5} />}

        {status === 'error' && (
          <div className="p-5">
            <ErrorState
              title="Unable to load categories"
              message={error}
              onRetry={() => setReloadKey((key) => key + 1)}
            />
          </div>
        )}

        {status === 'success' && filteredCategories.length === 0 && (
          <AdminEmptyState
            icon="categories"
            title="No categories found"
            message={
              categories.length === 0
                ? 'Create your first category to organize marketplace listings.'
                : 'No category matches your search.'
            }
            action={
              categories.length === 0 ? (
                <Button size="sm" onClick={openCreate}>
                  Create category
                </Button>
              ) : null
            }
          />
        )}

        {status === 'success' && filteredCategories.length > 0 && (
          <div className={adminTableWrapper}>
            <table className={adminTable}>
              <thead className="bg-[#F8FAFC]">
                <tr>
                  <th className={adminTableHeadCell}>Category</th>
                  <th className={adminTableHeadCell}>Description</th>
                  <th className={adminTableHeadCell}>Listings</th>
                  <th className={adminTableHeadCell}>Sort</th>
                  <th className={adminTableHeadCell}>Status</th>
                  <th className={adminTableHeadCell}>Updated</th>
                  <th className={adminTableHeadCell}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCategories.map((category) => (
                  <tr key={category.id} className={adminTableRow}>
                    <td className={adminTableCell}>
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[#ECFDF5] text-primary-700">
                          <AdminIcon name="categories" className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-[#0F1626]">
                            {category.name}
                          </p>
                          <p className="truncate font-mono text-xs text-[#94A3B8]">
                            {category.slug}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className={adminTableCell}>
                      <p className="max-w-[280px] truncate text-sm text-[#475569]">
                        {category.description || 'No description'}
                      </p>
                    </td>
                    <td className={adminTableCell}>
                      {formatAdminNumber(category.productCount)}
                    </td>
                    <td className={adminTableCell}>{category.sortOrder ?? 0}</td>
                    <td className={adminTableCell}>
                      <AdminStatusBadge
                        label={category.isActive ? 'Active' : 'Inactive'}
                        tone={category.isActive ? 'success' : 'neutral'}
                      />
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-xs text-[#64748B]">
                      {formatAdminDate(category.updatedAt)}
                    </td>
                    <td className={adminTableCell}>
                      <div className="flex items-center gap-0.5">
                        <button
                          type="button"
                          className={actionButtonClass('neutral')}
                          onClick={() => openEdit(category)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className={actionButtonClass(
                            category.isActive ? 'warning' : 'success'
                          )}
                          onClick={() => handleToggle(category)}
                        >
                          {category.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminPanel>

      <Modal
        isOpen={Boolean(modal)}
        onClose={closeModal}
        title={modal?.mode === 'edit' ? 'Edit category' : 'New category'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className={adminLabelClass}>Name</span>
              <input
                type="text"
                value={form.name}
                onChange={(event) => updateField('name', event.target.value)}
                className={adminInputClass}
                placeholder="e.g. Power tools"
                maxLength={50}
                required
                disabled={isSubmitting}
              />
            </label>
            <label className="block">
              <span className={adminLabelClass}>
                Slug <span className="normal-case text-[#94A3B8]">(optional)</span>
              </span>
              <input
                type="text"
                value={form.slug}
                onChange={(event) => updateField('slug', event.target.value)}
                className={adminInputClass}
                placeholder="auto-generated"
                maxLength={50}
                disabled={isSubmitting}
              />
            </label>
          </div>

          <label className="block">
            <span className={adminLabelClass}>Description</span>
            <textarea
              value={form.description}
              onChange={(event) => updateField('description', event.target.value)}
              rows={3}
              maxLength={300}
              className={`${adminInputClass} resize-none`}
              placeholder="What belongs in this category?"
              disabled={isSubmitting}
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className={adminLabelClass}>Icon key</span>
              <input
                type="text"
                value={form.icon}
                onChange={(event) => updateField('icon', event.target.value)}
                className={adminInputClass}
                placeholder="box"
                maxLength={50}
                disabled={isSubmitting}
              />
            </label>
            <label className="block">
              <span className={adminLabelClass}>Sort order</span>
              <input
                type="number"
                min="0"
                max="100000"
                value={form.sortOrder}
                onChange={(event) => updateField('sortOrder', event.target.value)}
                className={adminInputClass}
                disabled={isSubmitting}
              />
            </label>
          </div>

          <label className="flex items-center gap-2.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 py-3">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(event) => updateField('isActive', event.target.checked)}
              className="h-4 w-4 rounded border-[#CBD5E1] text-primary-600 focus:ring-primary-500"
              disabled={isSubmitting}
            />
            <span className="text-sm text-[#334155]">
              Active — owners can choose this category for new listings
            </span>
          </label>

          {formError && (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {formError}
            </p>
          )}

          <div className="flex justify-end gap-2 border-t border-[#E2E8F0] pt-4">
            <Button
              variant="ghost"
              onClick={closeModal}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting}>
              {modal?.mode === 'edit' ? 'Save category' : 'Create category'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
