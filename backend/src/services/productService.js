import { Product } from '../models/Product.js'
import { Category } from '../models/Category.js'
import { ApiError } from '../utils/apiError.js'

// API IDs are 24-character hex strings. Anything else is treated as a slug.
const OBJECT_ID_REGEX = /^[a-f0-9]{24}$/i

const SORT_SPECS = {
  recommended: { ratingAverage: -1, reviewCount: -1, createdAt: -1, _id: -1 },
  'price-asc': { rentPerDay: 1, _id: 1 },
  'price-desc': { rentPerDay: -1, _id: -1 },
  newest: { createdAt: -1, _id: -1 },
}

const POPULATE = [
  { path: 'category', select: 'name slug' },
  { path: 'owner', select: 'name' },
]

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function toPublicProduct(product) {
  const populatedCategory =
    product.category && typeof product.category === 'object' && product.category._id
      ? product.category
      : null
  const populatedOwner =
    product.owner && typeof product.owner === 'object' && product.owner._id
      ? product.owner
      : null

  return {
    id: String(product._id),
    title: product.title,
    description: product.description,
    category: populatedCategory
      ? {
          id: String(populatedCategory._id),
          name: populatedCategory.name,
          slug: populatedCategory.slug,
        }
      : null,
    images: Array.isArray(product.images) ? product.images : [],
    rentPerDay: product.rentPerDay,
    location: product.location,
    availability: product.availability,
    condition: product.condition,
    tags: Array.isArray(product.tags) ? product.tags : [],
    rating: {
      average: product.ratingAverage ?? 0,
      count: product.reviewCount ?? 0,
    },
    // Only public owner fields are exposed. Email, role, status and passwordHash
    // are never selected into a product response.
    owner: populatedOwner
      ? {
          id: String(populatedOwner._id),
          name: populatedOwner.name,
        }
      : null,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  }
}

async function resolveCategoryFilter(categoryParam) {
  const isObjectId = OBJECT_ID_REGEX.test(categoryParam)
  const category = await Category.findOne({
    isActive: true,
    ...(isObjectId
      ? { _id: categoryParam }
      : { slug: categoryParam.toLowerCase() }),
  })
    .select('_id')
    .lean()

  if (!category) {
    throw new ApiError(400, 'Category not found')
  }

  return category._id
}

export async function listProducts({ q, category, minPrice, maxPrice, sort, page, limit }) {
  const filter = { moderationStatus: 'active' }

  if (category) {
    filter.category = await resolveCategoryFilter(category)
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.rentPerDay = {}
    if (minPrice !== undefined) filter.rentPerDay.$gte = minPrice
    if (maxPrice !== undefined) filter.rentPerDay.$lte = maxPrice
  }

  if (q) {
    const search = new RegExp(escapeRegex(q), 'i')
    const matchingCategories = await Category.find({
      isActive: true,
      $or: [{ name: search }, { slug: search }],
    })
      .select('_id')
      .lean()

    const searchConditions = [
      { title: search },
      { description: search },
      { tags: search },
      { location: search },
    ]

    if (matchingCategories.length > 0) {
      searchConditions.push({
        category: { $in: matchingCategories.map((item) => item._id) },
      })
    }

    filter.$or = searchConditions
  }

  const skip = (page - 1) * limit

  const [documents, total] = await Promise.all([
    Product.find(filter)
      .sort(SORT_SPECS[sort] || SORT_SPECS.recommended)
      .skip(skip)
      .limit(limit)
      .populate(POPULATE)
      .lean(),
    Product.countDocuments(filter),
  ])

  const totalPages = total === 0 ? 0 : Math.ceil(total / limit)

  return {
    products: documents.map(toPublicProduct),
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

export async function getProductById(id) {
  if (!OBJECT_ID_REGEX.test(id)) {
    throw new ApiError(400, 'Invalid product id')
  }

  const product = await Product.findOne({
    _id: id,
    moderationStatus: 'active',
  })
    .populate(POPULATE)
    .lean()

  if (!product) {
    throw new ApiError(404, 'Product not found')
  }

  return { product: toPublicProduct(product) }
}
