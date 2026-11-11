import fs from 'node:fs/promises'
import path from 'node:path'
import { Product } from '../models/Product.js'
import { Category } from '../models/Category.js'
import { BorrowRequest } from '../models/BorrowRequest.js'
import { ApiError } from '../utils/apiError.js'
import { withTransaction } from '../utils/transactions.js'
import { getNearbyAreaNames } from '../config/areaNeighbors.js'
import { productsUploadsDir } from '../middleware/upload.js'
import { areNewListingsAllowed } from './platformSettingService.js'

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
  { path: 'owner', select: 'name ratingAverage reviewCount' },
]

const PUBLIC_FILTER = {
  moderationStatus: 'active',
  isPublished: { $ne: false },
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function normalizeArea(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : ''
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
    isPublished: product.isPublished !== false,
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
          rating: {
            average: populatedOwner.ratingAverage ?? 0,
            count: populatedOwner.reviewCount ?? 0,
          },
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

async function buildCatalogFilter({
  q,
  category,
  minPrice,
  maxPrice,
  availability,
  location,
}) {
  const filter = { ...PUBLIC_FILTER }

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

  if (availability) {
    filter.availability = availability
  }

  if (location) {
    filter.location = new RegExp(`^${escapeRegex(location)}$`, 'i')
  }

  return filter
}

export async function listProducts({
  q,
  category,
  minPrice,
  maxPrice,
  availability,
  location,
  sort,
  page,
  limit,
}) {
  const filter = await buildCatalogFilter({
    q,
    category,
    minPrice,
    maxPrice,
    availability,
    location,
  })

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

export async function listProductLocations({
  q,
  category,
  minPrice,
  maxPrice,
  availability,
  nearbyFor,
}) {
  const filter = await buildCatalogFilter({
    q,
    category,
    minPrice,
    maxPrice,
    availability,
  })

  const rows = await Product.aggregate([
    {
      $match: {
        ...filter,
        location: { $type: 'string', $ne: '' },
      },
    },
    {
      $group: {
        _id: { $toLower: { $trim: { input: '$location' } } },
        name: { $first: { $trim: { input: '$location' } } },
        count: { $sum: 1 },
      },
    },
  ])

  const locations = rows
    .map((row) => ({
      name: row.name,
      count: row.count,
    }))
    .sort((left, right) =>
      left.name.localeCompare(right.name, undefined, { sensitivity: 'base' })
    )

  const countByArea = new Map(rows.map((row) => [row._id, row.count]))
  const nearbyAreas = getNearbyAreaNames(nearbyFor).map((name) => ({
    name,
    count: countByArea.get(normalizeArea(name)) || 0,
  }))

  return {
    locations,
    nearbyAreas,
    count: locations.length,
  }
}

export async function getProductById(id) {
  if (!OBJECT_ID_REGEX.test(id)) {
    throw new ApiError(400, 'Invalid product id')
  }

  const product = await Product.findOne({
    _id: id,
    ...PUBLIC_FILTER,
  })
    .populate(POPULATE)
    .lean()

  if (!product) {
    throw new ApiError(404, 'Product not found')
  }

  return { product: toPublicProduct(product) }
}

async function ensureActiveCategory(categoryId) {
  const category = await Category.findOne({
    _id: categoryId,
    isActive: true,
  })
    .select('_id')
    .lean()

  if (!category) {
    throw new ApiError(400, 'Category not found')
  }
}

async function findOwnedProduct(id, ownerId, session) {
  if (!OBJECT_ID_REGEX.test(id)) {
    throw new ApiError(400, 'Invalid product id')
  }

  const query = Product.findById(id)
  if (session) query.session(session)
  const product = await query

  if (!product) {
    throw new ApiError(404, 'Product not found')
  }
  if (String(product.owner) !== String(ownerId)) {
    throw new ApiError(403, 'You can only manage your own listings')
  }

  return product
}

export async function listOwnedProducts(ownerId) {
  const products = await Product.find({ owner: ownerId })
    .sort({ createdAt: -1, _id: -1 })
    .populate(POPULATE)
    .lean()

  return {
    products: products.map(toPublicProduct),
    count: products.length,
  }
}

export async function getOwnedProduct(id, ownerId) {
  const product = await findOwnedProduct(id, ownerId)
  await product.populate(POPULATE)
  return { product: toPublicProduct(product) }
}

export async function createProduct(ownerId, input) {
  if (!(await areNewListingsAllowed())) {
    throw new ApiError(
      403,
      'New listings are currently disabled by an administrator'
    )
  }

  await ensureActiveCategory(input.category)

  const product = await Product.create({
    ...input,
    owner: ownerId,
  })
  await product.populate(POPULATE)

  return { product: toPublicProduct(product) }
}

export async function updateOwnedProduct(id, ownerId, input) {
  await ensureActiveCategory(input.category)

  const existingProduct = await findOwnedProduct(id, ownerId)
  const reopeningProduct =
    input.availability === 'available' &&
    existingProduct.availability !== 'available'

  if (reopeningProduct) {
    const product = await withTransaction(async (session) => {
      const ownedProduct = await findOwnedProduct(id, ownerId, session)
      const acceptedRequest = await BorrowRequest.exists({
        product: ownedProduct._id,
        status: 'Accepted',
      }).session(session)

      if (acceptedRequest) {
        throw new ApiError(
          409,
          'This product has an accepted borrowing request and cannot be marked available'
        )
      }

      Object.assign(ownedProduct, input)
      await ownedProduct.save({ session })
      return ownedProduct
    })

    await product.populate(POPULATE)
    return { product: toPublicProduct(product) }
  }

  Object.assign(existingProduct, input)
  await existingProduct.save()
  await existingProduct.populate(POPULATE)

  return { product: toPublicProduct(existingProduct) }
}

export async function updateOwnedProductPublication(id, ownerId, isPublished) {
  const product = await findOwnedProduct(id, ownerId)
  product.isPublished = isPublished
  await product.save()
  await product.populate(POPULATE)

  return { product: toPublicProduct(product) }
}

const LOCAL_PRODUCT_IMAGE_PREFIX = '/uploads/products/'

function toLocalImageFile(image) {
  if (
    typeof image !== 'string' ||
    !image.startsWith(LOCAL_PRODUCT_IMAGE_PREFIX)
  ) {
    return null
  }

  const filename = image.slice(LOCAL_PRODUCT_IMAGE_PREFIX.length)
  if (!filename || filename !== path.basename(filename)) {
    return null
  }

  return path.join(productsUploadsDir, filename)
}

async function removeLocalImageFiles(images) {
  const files = (Array.isArray(images) ? images : [])
    .map(toLocalImageFile)
    .filter(Boolean)

  await Promise.all(
    files.map((file) => fs.rm(file, { force: true }).catch(() => {}))
  )
}

export async function deleteOwnedProduct(id, ownerId) {
  const product = await findOwnedProduct(id, ownerId)

  const [acceptedRequest, pendingRequest] = await Promise.all([
    BorrowRequest.exists({ product: product._id, status: 'Accepted' }),
    BorrowRequest.exists({ product: product._id, status: 'Pending' }),
  ])

  if (acceptedRequest) {
    throw new ApiError(
      409,
      'This item is currently borrowed and cannot be deleted until the loan is cancelled'
    )
  }

  if (pendingRequest) {
    throw new ApiError(
      409,
      'This item has pending borrow requests. Reject them before deleting the listing'
    )
  }

  const images = Array.isArray(product.images) ? product.images : []
  const productId = String(product._id)

  await product.deleteOne()
  await removeLocalImageFiles(images)

  return { id: productId }
}
