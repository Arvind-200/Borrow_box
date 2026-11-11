import { User } from '../models/User.js'
import { Product } from '../models/Product.js'
import { BorrowRequest } from '../models/BorrowRequest.js'
import { Review } from '../models/Review.js'
import { AdminActivityLog } from '../models/AdminActivityLog.js'
import { ApiError } from '../utils/apiError.js'
import { logAdminAction } from './adminActivityService.js'

const OBJECT_ID_REGEX = /^[a-f0-9]{24}$/i

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function toAdminUserSummary(user, listingCount = 0) {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    rating: {
      average: user.ratingAverage ?? 0,
      count: user.reviewCount ?? 0,
    },
    warningCount: user.warningCount ?? 0,
    lastWarnedAt: user.lastWarnedAt ?? null,
    listingCount,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  }
}

export async function listUsersForAdmin({ page, limit, q, role, status }) {
  const filter = {}
  if (role) filter.role = role
  if (status) filter.status = status
  if (q) {
    const search = new RegExp(escapeRegex(q), 'i')
    filter.$or = [{ name: search }, { email: search }]
  }

  const skip = (page - 1) * limit

  const [users, total] = await Promise.all([
    User.find(filter)
      .select(
        'name email role status ratingAverage reviewCount warningCount lastWarnedAt createdAt updatedAt'
      )
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(filter),
  ])

  const listingCounts =
    users.length === 0
      ? []
      : await Product.aggregate([
          { $match: { owner: { $in: users.map((user) => user._id) } } },
          { $group: { _id: '$owner', count: { $sum: 1 } } },
        ])

  const countByOwner = new Map(
    listingCounts.map((row) => [String(row._id), row.count])
  )

  const totalPages = total === 0 ? 0 : Math.ceil(total / limit)

  return {
    users: users.map((user) =>
      toAdminUserSummary(user, countByOwner.get(String(user._id)) || 0)
    ),
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

export async function getUserForAdmin(userId) {
  const user = await findUser(userId)

  const [
    listingCount,
    borrowRequestsAsBorrower,
    borrowRequestsAsOwner,
    reviewsWritten,
    reviewsReceived,
    recentLogs,
  ] = await Promise.all([
    Product.countDocuments({ owner: user._id }),
    BorrowRequest.countDocuments({ borrower: user._id }),
    BorrowRequest.countDocuments({ owner: user._id }),
    Review.countDocuments({ reviewer: user._id }),
    Review.countDocuments({ reviewee: user._id }),
    AdminActivityLog.find({ targetType: 'user', targetId: user._id })
      .sort({ createdAt: -1, _id: -1 })
      .limit(5)
      .populate({ path: 'admin', select: 'name' })
      .lean(),
  ])

  return {
    user: {
      ...toAdminUserSummary(user, listingCount),
      stats: {
        listings: listingCount,
        borrowRequests: {
          asBorrower: borrowRequestsAsBorrower,
          asOwner: borrowRequestsAsOwner,
        },
        reviews: {
          written: reviewsWritten,
          received: reviewsReceived,
        },
      },
    },
    recentActivity: recentLogs.map((log) => ({
      id: String(log._id),
      action: log.action,
      reason: log.reason || '',
      admin:
        log.admin && typeof log.admin === 'object' && log.admin._id
          ? { id: String(log.admin._id), name: log.admin.name || '' }
          : null,
      createdAt: log.createdAt,
    })),
  }
}

function toAdminUser(user) {
  return {
    id: String(user._id),
    name: user.name,
    role: user.role,
    status: user.status,
    warningCount: user.warningCount ?? 0,
    lastWarnedAt: user.lastWarnedAt ?? null,
  }
}

async function findUser(userId) {
  if (typeof userId !== 'string' || !OBJECT_ID_REGEX.test(userId)) {
    throw new ApiError(400, 'Invalid user id')
  }

  const user = await User.findById(userId)
  if (!user) {
    throw new ApiError(404, 'User not found')
  }

  return user
}

export async function warnUser(userId, adminId, { reason }) {
  if (!reason) {
    throw new ApiError(400, 'A moderation reason is required')
  }

  const user = await findUser(userId)

  user.warningCount = (user.warningCount ?? 0) + 1
  user.lastWarnedAt = new Date()
  await user.save()

  await logAdminAction({
    admin: adminId,
    action: 'warn_user',
    targetType: 'user',
    targetId: user._id,
    reason,
    metadata: { warningCount: user.warningCount },
  })

  return { user: toAdminUser(user) }
}

export async function blockUser(userId, adminId, { reason }) {
  if (!reason) {
    throw new ApiError(400, 'A moderation reason is required')
  }

  const user = await findUser(userId)

  if (String(user._id) === String(adminId)) {
    throw new ApiError(400, 'You cannot block your own account')
  }
  if (user.role === 'admin') {
    throw new ApiError(409, 'Admin accounts cannot be blocked')
  }
  if (user.status === 'blocked') {
    throw new ApiError(409, 'User is already blocked')
  }

  user.status = 'blocked'
  await user.save()

  await logAdminAction({
    admin: adminId,
    action: 'block_user',
    targetType: 'user',
    targetId: user._id,
    reason,
  })

  return { user: toAdminUser(user) }
}

export async function unblockUser(userId, adminId, { reason = '' } = {}) {
  const user = await findUser(userId)

  if (user.status !== 'blocked') {
    throw new ApiError(409, 'User is not blocked')
  }

  user.status = 'active'
  await user.save()

  await logAdminAction({
    admin: adminId,
    action: 'unblock_user',
    targetType: 'user',
    targetId: user._id,
    reason,
  })

  return { user: toAdminUser(user) }
}
