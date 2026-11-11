import { Report, REPORT_TARGET_MODELS } from '../models/Report.js'
import { Product } from '../models/Product.js'
import { User } from '../models/User.js'
import { Review } from '../models/Review.js'
import { MAX_ADMIN_ACTIVITY_REASON_LENGTH } from '../models/AdminActivityLog.js'
import { ApiError } from '../utils/apiError.js'
import { logAdminAction } from './adminActivityService.js'
import { moderateProduct } from './adminProductService.js'
import { blockUser, warnUser } from './adminUserService.js'
import { moderateReview } from './reviewService.js'

const OBJECT_ID_REGEX = /^[a-f0-9]{24}$/i

const ADMIN_POPULATE = [
  { path: 'reporter', select: 'name' },
  { path: 'reviewedBy', select: 'name' },
]

const TARGET_LABELS = {
  product: 'Product',
  user: 'User',
  review: 'Review',
}

const ALLOWED_ACTIONS = {
  product: ['none', 'warn_user', 'block_user', 'hide_product', 'remove_product'],
  review: ['none', 'warn_user', 'block_user', 'hide_review', 'remove_review'],
  user: ['none', 'warn_user', 'block_user'],
}

function assertObjectId(id, label) {
  if (typeof id !== 'string' || !OBJECT_ID_REGEX.test(id)) {
    throw new ApiError(400, `Invalid ${label} id`)
  }
}

function toPublicUser(user) {
  if (!user || typeof user !== 'object' || !user._id) return null

  return {
    id: String(user._id),
    name: user.name,
  }
}

function toPublicReport(report) {
  return {
    id: String(report._id),
    targetType: report.targetType,
    targetId: String(report.targetId),
    reason: report.reason,
    description: report.description || '',
    status: report.status,
    createdAt: report.createdAt,
  }
}

function toAdminReport(report, snapshot) {
  return {
    id: String(report._id),
    targetType: report.targetType,
    targetId: String(report.targetId),
    target: snapshot || null,
    reason: report.reason,
    description: report.description || '',
    status: report.status,
    resolutionAction: report.resolutionAction,
    resolutionNote: report.resolutionNote || '',
    reporter: toPublicUser(report.reporter),
    reviewedBy: toPublicUser(report.reviewedBy),
    reviewedAt: report.reviewedAt,
    createdAt: report.createdAt,
    updatedAt: report.updatedAt,
  }
}

function buildPagination(page, limit, total) {
  const totalPages = total === 0 ? 0 : Math.ceil(total / limit)

  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1 && totalPages > 0,
  }
}

async function loadTarget(targetType, targetId) {
  if (targetType === 'product') {
    return Product.findById(targetId)
      .select('_id title owner moderationStatus')
      .lean()
  }
  if (targetType === 'user') {
    return User.findById(targetId).select('_id name role status').lean()
  }
  if (targetType === 'review') {
    return Review.findById(targetId)
      .select('_id reviewer product rating status')
      .populate({ path: 'reviewer', select: 'name' })
      .lean()
  }

  return null
}

function assertNotSelfReport(reporterId, targetType, target) {
  if (targetType === 'product' && String(target.owner) === String(reporterId)) {
    throw new ApiError(409, 'You cannot report your own listing')
  }
  if (targetType === 'review') {
    const reviewerId = target.reviewer?._id || target.reviewer
    if (String(reviewerId) === String(reporterId)) {
      throw new ApiError(409, 'You cannot report your own review')
    }
  }
  if (targetType === 'user' && String(target._id) === String(reporterId)) {
    throw new ApiError(400, 'You cannot report yourself')
  }
}

async function buildSnapshots(reports) {
  const ids = { product: new Set(), user: new Set(), review: new Set() }
  reports.forEach((report) => {
    if (ids[report.targetType]) {
      ids[report.targetType].add(String(report.targetId))
    }
  })

  const [products, users, reviews] = await Promise.all([
    ids.product.size
      ? Product.find({ _id: { $in: [...ids.product] } })
          .select('_id title owner moderationStatus')
          .lean()
      : [],
    ids.user.size
      ? User.find({ _id: { $in: [...ids.user] } })
          .select('_id name role status')
          .lean()
      : [],
    ids.review.size
      ? Review.find({ _id: { $in: [...ids.review] } })
          .select('_id rating comment status reviewer product')
          .populate({ path: 'reviewer', select: 'name' })
          .lean()
      : [],
  ])

  const snapshots = new Map()

  products.forEach((product) => {
    snapshots.set(`product:${product._id}`, {
      id: String(product._id),
      type: 'product',
      title: product.title,
      ownerId: String(product.owner),
      moderationStatus: product.moderationStatus,
    })
  })
  users.forEach((user) => {
    snapshots.set(`user:${user._id}`, {
      id: String(user._id),
      type: 'user',
      name: user.name,
      role: user.role,
      status: user.status,
    })
  })
  reviews.forEach((review) => {
    snapshots.set(`review:${review._id}`, {
      id: String(review._id),
      type: 'review',
      rating: review.rating,
      comment: review.comment || '',
      status: review.status,
      reviewerName: review.reviewer?.name || '',
      productId: review.product ? String(review.product) : null,
    })
  })

  return snapshots
}

function snapshotFor(report, snapshots) {
  return (
    snapshots.get(`${report.targetType}:${report.targetId}`) || {
      id: String(report.targetId),
      type: report.targetType,
      missing: true,
    }
  )
}

async function resolveOffenderId(report) {
  if (report.targetType === 'user') {
    return String(report.targetId)
  }

  const target = await loadTarget(report.targetType, report.targetId)
  if (!target) {
    throw new ApiError(404, `${TARGET_LABELS[report.targetType]} not found`)
  }

  if (report.targetType === 'product') {
    return String(target.owner)
  }

  return String(target.reviewer?._id || target.reviewer)
}

async function applyReportAction(report, adminId, action, note) {
  if (action === 'none') return

  const allowed = ALLOWED_ACTIONS[report.targetType] || []
  if (!allowed.includes(action)) {
    throw new ApiError(
      400,
      `Cannot apply "${action}" to a ${report.targetType} report`
    )
  }

  const reason = (note || 'Upheld report').slice(
    0,
    MAX_ADMIN_ACTIVITY_REASON_LENGTH
  )

  if (action === 'warn_user' || action === 'block_user') {
    const offenderId = await resolveOffenderId(report)
    if (action === 'warn_user') {
      await warnUser(offenderId, adminId, { reason })
    } else {
      await blockUser(offenderId, adminId, { reason })
    }
    return
  }

  if (action === 'hide_product' || action === 'remove_product') {
    await moderateProduct(
      String(report.targetId),
      adminId,
      action === 'hide_product' ? 'hide' : 'remove',
      { reason }
    )
    return
  }

  if (action === 'hide_review' || action === 'remove_review') {
    await moderateReview(
      String(report.targetId),
      adminId,
      action === 'hide_review' ? 'hide' : 'remove',
      { reason }
    )
  }
}

export async function createReport(reporterId, input) {
  const target = await loadTarget(input.targetType, input.targetId)
  if (!target) {
    throw new ApiError(404, `${TARGET_LABELS[input.targetType]} not found`)
  }

  assertNotSelfReport(reporterId, input.targetType, target)

  const duplicate = await Report.exists({
    reporter: reporterId,
    targetType: input.targetType,
    targetId: target._id,
    status: 'Open',
  })
  if (duplicate) {
    throw new ApiError(
      409,
      'You already have an open report for this item'
    )
  }

  let report
  try {
    report = await Report.create({
      reporter: reporterId,
      targetType: input.targetType,
      targetModel: REPORT_TARGET_MODELS[input.targetType],
      targetId: target._id,
      reason: input.reason,
      description: input.description,
    })
  } catch (error) {
    if (error?.code === 11000) {
      throw new ApiError(
        409,
        'You already have an open report for this item'
      )
    }
    throw error
  }

  return { report: toPublicReport(report) }
}

export async function listReportsForAdmin({
  page,
  limit,
  status,
  targetType,
  reason,
}) {
  const filter = {}
  if (status) filter.status = status
  if (targetType) filter.targetType = targetType
  if (reason) filter.reason = reason

  const skip = (page - 1) * limit

  const [documents, total] = await Promise.all([
    Report.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .populate(ADMIN_POPULATE)
      .lean(),
    Report.countDocuments(filter),
  ])

  const snapshots = await buildSnapshots(documents)

  return {
    reports: documents.map((report) =>
      toAdminReport(report, snapshotFor(report, snapshots))
    ),
    pagination: buildPagination(page, limit, total),
  }
}

export async function getReportForAdmin(reportId) {
  assertObjectId(reportId, 'report')

  const report = await Report.findById(reportId)
    .populate(ADMIN_POPULATE)
    .lean()
  if (!report) {
    throw new ApiError(404, 'Report not found')
  }

  const snapshots = await buildSnapshots([report])

  return { report: toAdminReport(report, snapshotFor(report, snapshots)) }
}

export async function resolveReport(reportId, adminId, { action, note }) {
  assertObjectId(reportId, 'report')

  const report = await Report.findById(reportId)
  if (!report) {
    throw new ApiError(404, 'Report not found')
  }
  if (report.status !== 'Open') {
    throw new ApiError(409, 'Only open reports can be resolved')
  }

  await applyReportAction(report, adminId, action, note)

  report.status = 'Resolved'
  report.resolutionAction = action
  report.resolutionNote = note
  report.reviewedBy = adminId
  report.reviewedAt = new Date()
  await report.save()

  await logAdminAction({
    admin: adminId,
    action: 'resolve_report',
    targetType: 'report',
    targetId: report._id,
    reason: (note || '').slice(0, MAX_ADMIN_ACTIVITY_REASON_LENGTH),
    metadata: {
      action,
      reportTargetType: report.targetType,
      reportTargetId: String(report.targetId),
    },
  })

  await report.populate(ADMIN_POPULATE)
  const snapshots = await buildSnapshots([report])

  return { report: toAdminReport(report, snapshotFor(report, snapshots)) }
}

export async function dismissReport(reportId, adminId, { note }) {
  assertObjectId(reportId, 'report')

  const report = await Report.findById(reportId)
  if (!report) {
    throw new ApiError(404, 'Report not found')
  }
  if (report.status !== 'Open') {
    throw new ApiError(409, 'Only open reports can be dismissed')
  }

  report.status = 'Dismissed'
  report.resolutionAction = 'none'
  report.resolutionNote = note
  report.reviewedBy = adminId
  report.reviewedAt = new Date()
  await report.save()

  await logAdminAction({
    admin: adminId,
    action: 'dismiss_report',
    targetType: 'report',
    targetId: report._id,
    reason: (note || '').slice(0, MAX_ADMIN_ACTIVITY_REASON_LENGTH),
  })

  await report.populate(ADMIN_POPULATE)
  const snapshots = await buildSnapshots([report])

  return { report: toAdminReport(report, snapshotFor(report, snapshots)) }
}
