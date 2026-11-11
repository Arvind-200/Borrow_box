import { AdminActivityLog } from '../models/AdminActivityLog.js'

function toAdminActivity(log) {
  const admin =
    log.admin && typeof log.admin === 'object' && log.admin._id
      ? { id: String(log.admin._id), name: log.admin.name || '' }
      : log.admin
        ? { id: String(log.admin), name: '' }
        : null

  return {
    id: String(log._id),
    admin,
    action: log.action,
    targetType: log.targetType,
    targetId: log.targetId ? String(log.targetId) : null,
    reason: log.reason || '',
    metadata: log.metadata || {},
    createdAt: log.createdAt,
  }
}

export async function listAdminActivity({ page, limit, action, targetType }) {
  const filter = {}
  if (action) filter.action = action
  if (targetType) filter.targetType = targetType

  const skip = (page - 1) * limit

  const [documents, total] = await Promise.all([
    AdminActivityLog.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .populate({ path: 'admin', select: 'name' })
      .lean(),
    AdminActivityLog.countDocuments(filter),
  ])

  const totalPages = total === 0 ? 0 : Math.ceil(total / limit)

  return {
    activities: documents.map(toAdminActivity),
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1 && totalPages > 0,
    },
  }
}

export async function logAdminAction({
  admin,
  action,
  targetType,
  targetId,
  reason = '',
  metadata = {},
}) {
  return AdminActivityLog.create({
    admin,
    action,
    targetType,
    targetId,
    reason: reason || '',
    metadata,
  })
}
