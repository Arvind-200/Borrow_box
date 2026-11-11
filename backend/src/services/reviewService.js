import mongoose from 'mongoose'
import { Review } from '../models/Review.js'
import { Product } from '../models/Product.js'
import { User } from '../models/User.js'
import { BorrowRequest } from '../models/BorrowRequest.js'
import { ApiError } from '../utils/apiError.js'
import { logAdminAction } from './adminActivityService.js'

const OBJECT_ID_REGEX = /^[a-f0-9]{24}$/i

const POPULATE = [
  { path: 'reviewer', select: 'name' },
  { path: 'reviewee', select: 'name' },
]

const ADMIN_POPULATE = [
  { path: 'reviewer', select: 'name' },
  { path: 'reviewee', select: 'name' },
  { path: 'product', select: 'title' },
  { path: 'moderatedBy', select: 'name' },
]

const MODERATION_ACTIONS = {
  hide: {
    from: ['visible'],
    to: 'hidden',
    requiresReason: true,
    logAction: 'hide_review',
  },
  remove: {
    from: ['visible', 'hidden'],
    to: 'removed',
    requiresReason: true,
    logAction: 'remove_review',
  },
  restore: {
    from: ['hidden', 'removed'],
    to: 'visible',
    requiresReason: false,
    logAction: 'restore_review',
  },
}

const PUBLIC_PRODUCT_FILTER = {
  moderationStatus: 'active',
  isPublished: { $ne: false },
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

function toPublicReview(review) {
  return {
    id: String(review._id),
    borrowRequest: String(review.borrowRequest),
    product: String(review.product),
    reviewer: toPublicUser(review.reviewer),
    reviewee: toPublicUser(review.reviewee),
    reviewerRole: review.reviewerRole,
    rating: review.rating,
    comment: review.comment || '',
    status: review.status,
    createdAt: review.createdAt,
    updatedAt: review.updatedAt,
  }
}

function toAdminProduct(product) {
  if (!product) return null
  if (typeof product === 'object' && product._id) {
    return { id: String(product._id), title: product.title || '' }
  }

  return { id: String(product), title: '' }
}

function toAdminReview(review) {
  return {
    id: String(review._id),
    borrowRequest: String(review.borrowRequest),
    product: toAdminProduct(review.product),
    reviewer: toPublicUser(review.reviewer),
    reviewee: toPublicUser(review.reviewee),
    reviewerRole: review.reviewerRole,
    rating: review.rating,
    comment: review.comment || '',
    status: review.status,
    moderatedBy: toPublicUser(review.moderatedBy),
    moderatedAt: review.moderatedAt,
    moderationReason: review.moderationReason || '',
    createdAt: review.createdAt,
    updatedAt: review.updatedAt,
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

async function averageRating(match) {
  const [summary] = await Review.aggregate([
    { $match: { ...match, status: 'visible' } },
    {
      $group: {
        _id: null,
        average: { $avg: '$rating' },
        count: { $sum: 1 },
      },
    },
  ])

  return {
    ratingAverage: summary ? Math.round(summary.average * 100) / 100 : 0,
    reviewCount: summary ? summary.count : 0,
  }
}

export async function recomputeProductRating(productId) {
  const { ratingAverage, reviewCount } = await averageRating({
    product: new mongoose.Types.ObjectId(productId),
  })

  await Product.updateOne(
    { _id: productId },
    { $set: { ratingAverage, reviewCount } }
  )

  return { ratingAverage, reviewCount }
}

export async function recomputeUserRating(userId) {
  const { ratingAverage, reviewCount } = await averageRating({
    reviewee: new mongoose.Types.ObjectId(userId),
  })

  await User.updateOne(
    { _id: userId },
    { $set: { ratingAverage, reviewCount } }
  )

  return { ratingAverage, reviewCount }
}

export async function createReview(reviewerId, input) {
  const request = await BorrowRequest.findById(input.borrowRequest)
    .select('_id product owner borrower status')
    .lean()

  if (!request) {
    throw new ApiError(404, 'Borrow request not found')
  }
  if (String(request.borrower) !== String(reviewerId)) {
    throw new ApiError(403, 'Only the borrower can review this borrow request')
  }
  if (request.status !== 'Completed') {
    throw new ApiError(409, 'Only completed borrows can be reviewed')
  }

  const existing = await Review.exists({
    borrowRequest: request._id,
    reviewer: reviewerId,
  })
  if (existing) {
    throw new ApiError(409, 'You already reviewed this borrow request')
  }

  let review
  try {
    review = await Review.create({
      borrowRequest: request._id,
      product: request.product,
      reviewer: reviewerId,
      reviewee: request.owner,
      reviewerRole: 'borrower',
      rating: input.rating,
      comment: input.comment,
    })
  } catch (error) {
    if (error?.code === 11000) {
      throw new ApiError(409, 'You already reviewed this borrow request')
    }
    throw error
  }

  await Promise.all([
    recomputeProductRating(request.product),
    recomputeUserRating(request.owner),
  ])

  await review.populate(POPULATE)

  return { review: toPublicReview(review) }
}

export async function listProductReviews(productId, { page, limit }) {
  assertObjectId(productId, 'product')

  const product = await Product.findOne({
    _id: productId,
    ...PUBLIC_PRODUCT_FILTER,
  })
    .select('_id')
    .lean()

  if (!product) {
    throw new ApiError(404, 'Product not found')
  }

  const filter = { product: product._id, status: 'visible' }
  const skip = (page - 1) * limit

  const [documents, total] = await Promise.all([
    Review.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .populate(POPULATE)
      .lean(),
    Review.countDocuments(filter),
  ])

  return {
    reviews: documents.map(toPublicReview),
    pagination: buildPagination(page, limit, total),
  }
}

export async function listMyReviews(reviewerId, { page, limit }) {
  const filter = { reviewer: reviewerId }
  const skip = (page - 1) * limit

  const [documents, total] = await Promise.all([
    Review.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .populate(POPULATE)
      .lean(),
    Review.countDocuments(filter),
  ])

  return {
    reviews: documents.map(toPublicReview),
    pagination: buildPagination(page, limit, total),
  }
}

export async function listReviewsForAdmin({ page, limit, status }) {
  const filter = status ? { status } : {}
  const skip = (page - 1) * limit

  const [documents, total] = await Promise.all([
    Review.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .populate(ADMIN_POPULATE)
      .lean(),
    Review.countDocuments(filter),
  ])

  return {
    reviews: documents.map(toAdminReview),
    pagination: buildPagination(page, limit, total),
  }
}

export async function moderateReview(reviewId, adminId, action, { reason }) {
  assertObjectId(reviewId, 'review')

  const spec = MODERATION_ACTIONS[action]
  if (!spec) {
    throw new ApiError(400, 'Unknown moderation action')
  }
  if (spec.requiresReason && !reason) {
    throw new ApiError(400, 'A moderation reason is required')
  }

  const review = await Review.findById(reviewId)
  if (!review) {
    throw new ApiError(404, 'Review not found')
  }
  if (!spec.from.includes(review.status)) {
    throw new ApiError(
      409,
      `Cannot ${action} a review with status "${review.status}"`
    )
  }

  review.status = spec.to
  review.moderatedBy = adminId
  review.moderatedAt = new Date()
  review.moderationReason = reason

  await review.save()

  await logAdminAction({
    admin: adminId,
    action: spec.logAction,
    targetType: 'review',
    targetId: review._id,
    reason,
    metadata: { status: spec.to },
  })

  const [productRating, revieweeRating] = await Promise.all([
    recomputeProductRating(review.product),
    recomputeUserRating(review.reviewee),
  ])

  await review.populate(ADMIN_POPULATE)

  return {
    review: toAdminReview(review),
    ratings: {
      product: productRating,
      reviewee: revieweeRating,
    },
  }
}

export async function initializeReviewWorkflow() {
  await Review.init()
}
