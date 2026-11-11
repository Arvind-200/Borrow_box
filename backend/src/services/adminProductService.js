import { Product } from '../models/Product.js'
import { ApiError } from '../utils/apiError.js'
import { logAdminAction } from './adminActivityService.js'

const OBJECT_ID_REGEX = /^[a-f0-9]{24}$/i

const ADMIN_POPULATE = [
  { path: 'category', select: 'name slug isActive' },
  { path: 'owner', select: 'name email status' },
]

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function toAdminProductSummary(product) {
  const category =
    product.category && typeof product.category === 'object' && product.category._id
      ? {
          id: String(product.category._id),
          name: product.category.name,
          slug: product.category.slug,
          isActive: product.category.isActive !== false,
        }
      : null

  const owner =
    product.owner && typeof product.owner === 'object' && product.owner._id
      ? {
          id: String(product.owner._id),
          name: product.owner.name,
          email: product.owner.email,
          status: product.owner.status,
        }
      : null

  return {
    id: String(product._id),
    title: product.title,
    description: product.description,
    category,
    owner,
    images: Array.isArray(product.images) ? product.images : [],
    rentPerDay: product.rentPerDay,
    location: product.location,
    availability: product.availability,
    isPublished: product.isPublished !== false,
    condition: product.condition,
    tags: Array.isArray(product.tags) ? product.tags : [],
    moderationStatus: product.moderationStatus,
    rating: {
      average: product.ratingAverage ?? 0,
      count: product.reviewCount ?? 0,
    },
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  }
}

function assertProductId(productId) {
  if (typeof productId !== 'string' || !OBJECT_ID_REGEX.test(productId)) {
    throw new ApiError(400, 'Invalid product id')
  }
}

export async function listProductsForAdmin({
  page,
  limit,
  q,
  moderationStatus,
  availability,
  category,
}) {
  const filter = {}
  if (moderationStatus) filter.moderationStatus = moderationStatus
  if (availability) filter.availability = availability
  if (category) filter.category = category
  if (q) {
    const search = new RegExp(escapeRegex(q), 'i')
    filter.$or = [
      { title: search },
      { description: search },
      { location: search },
      { tags: search },
    ]
  }

  const skip = (page - 1) * limit

  const [documents, total] = await Promise.all([
    Product.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .populate(ADMIN_POPULATE)
      .lean(),
    Product.countDocuments(filter),
  ])

  const totalPages = total === 0 ? 0 : Math.ceil(total / limit)

  return {
    products: documents.map(toAdminProductSummary),
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

export async function getProductForAdmin(productId) {
  assertProductId(productId)

  const product = await Product.findById(productId)
    .populate(ADMIN_POPULATE)
    .lean()

  if (!product) {
    throw new ApiError(404, 'Product not found')
  }

  return { product: toAdminProductSummary(product) }
}

const MODERATION_ACTIONS = {
  hide: {
    from: ['active'],
    to: 'hidden',
    requiresReason: true,
    logAction: 'hide_product',
  },
  remove: {
    from: ['active', 'hidden'],
    to: 'removed',
    requiresReason: true,
    logAction: 'remove_product',
  },
  restore: {
    from: ['hidden', 'removed'],
    to: 'active',
    requiresReason: false,
    logAction: 'restore_product',
  },
}

function toAdminProduct(product) {
  return {
    id: String(product._id),
    title: product.title,
    moderationStatus: product.moderationStatus,
  }
}

export async function moderateProduct(productId, adminId, action, { reason }) {
  assertProductId(productId)

  const spec = MODERATION_ACTIONS[action]
  if (!spec) {
    throw new ApiError(400, 'Unknown product moderation action')
  }
  if (spec.requiresReason && !reason) {
    throw new ApiError(400, 'A moderation reason is required')
  }

  const product = await Product.findById(productId)
  if (!product) {
    throw new ApiError(404, 'Product not found')
  }
  if (!spec.from.includes(product.moderationStatus)) {
    throw new ApiError(
      409,
      `Cannot ${action} a product with moderation status "${product.moderationStatus}"`
    )
  }

  product.moderationStatus = spec.to
  await product.save()

  await logAdminAction({
    admin: adminId,
    action: spec.logAction,
    targetType: 'product',
    targetId: product._id,
    reason,
    metadata: { moderationStatus: spec.to },
  })

  return { product: toAdminProduct(product) }
}
