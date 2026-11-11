import { Category } from '../models/Category.js'
import { Product } from '../models/Product.js'
import { ApiError } from '../utils/apiError.js'
import { logAdminAction } from './adminActivityService.js'

const OBJECT_ID_REGEX = /^[a-f0-9]{24}$/i

function toPublicCategory(category, productCount) {
  return {
    id: String(category._id),
    name: category.name,
    slug: category.slug,
    description: category.description,
    icon: category.icon,
    sortOrder: category.sortOrder,
    productCount,
  }
}

export async function listCategories() {
  const [categories, counts] = await Promise.all([
    Category.find({ isActive: true })
      .sort({ sortOrder: 1, name: 1 })
      .lean(),
    Product.aggregate([
      {
        $match: {
          moderationStatus: 'active',
          isPublished: { $ne: false },
        },
      },
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]),
  ])

  const countByCategory = new Map(
    counts.map((item) => [String(item._id), item.count])
  )

  return {
    categories: categories.map((category) =>
      toPublicCategory(category, countByCategory.get(String(category._id)) || 0)
    ),
    count: categories.length,
  }
}

function toAdminCategory(category, productCount) {
  return {
    ...toPublicCategory(category, productCount),
    isActive: category.isActive !== false,
    createdAt: category.createdAt,
    updatedAt: category.updatedAt,
  }
}

function assertCategoryId(categoryId) {
  if (typeof categoryId !== 'string' || !OBJECT_ID_REGEX.test(categoryId)) {
    throw new ApiError(400, 'Invalid category id')
  }
}

async function findCategory(categoryId) {
  assertCategoryId(categoryId)

  const category = await Category.findById(categoryId)
  if (!category) {
    throw new ApiError(404, 'Category not found')
  }

  return category
}

async function assertUniqueSlug(slug, excludeId) {
  const existing = await Category.findOne({
    slug,
    ...(excludeId ? { _id: { $ne: excludeId } } : {}),
  })
    .select('_id')
    .lean()

  if (existing) {
    throw new ApiError(409, 'A category with this slug already exists')
  }
}

export async function listCategoriesForAdmin() {
  const [categories, counts] = await Promise.all([
    Category.find({}).sort({ sortOrder: 1, name: 1 }).lean(),
    Product.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]),
  ])

  const countByCategory = new Map(
    counts.map((item) => [String(item._id), item.count])
  )

  return {
    categories: categories.map((category) =>
      toAdminCategory(category, countByCategory.get(String(category._id)) || 0)
    ),
    count: categories.length,
  }
}

export async function createCategory(adminId, input) {
  await assertUniqueSlug(input.slug)

  let category
  try {
    category = await Category.create(input)
  } catch (error) {
    if (error?.code === 11000) {
      throw new ApiError(409, 'A category with this slug already exists')
    }
    throw error
  }

  await logAdminAction({
    admin: adminId,
    action: 'create_category',
    targetType: 'category',
    targetId: category._id,
    metadata: { name: category.name, slug: category.slug },
  })

  return { category: toAdminCategory(category, 0) }
}

export async function updateCategory(categoryId, adminId, input) {
  const category = await findCategory(categoryId)

  if (input.slug && input.slug !== category.slug) {
    await assertUniqueSlug(input.slug, category._id)
  }

  Object.assign(category, input)
  try {
    await category.save()
  } catch (error) {
    if (error?.code === 11000) {
      throw new ApiError(409, 'A category with this slug already exists')
    }
    throw error
  }

  await logAdminAction({
    admin: adminId,
    action: 'update_category',
    targetType: 'category',
    targetId: category._id,
    metadata: { fields: Object.keys(input) },
  })

  const productCount = await Product.countDocuments({ category: category._id })

  return { category: toAdminCategory(category, productCount) }
}

export async function setCategoryActive(categoryId, adminId, isActive) {
  const category = await findCategory(categoryId)

  if (category.isActive === isActive) {
    const productCount = await Product.countDocuments({
      category: category._id,
    })
    return { category: toAdminCategory(category, productCount) }
  }

  category.isActive = isActive
  await category.save()

  await logAdminAction({
    admin: adminId,
    action: isActive ? 'activate_category' : 'deactivate_category',
    targetType: 'category',
    targetId: category._id,
    metadata: { name: category.name, isActive },
  })

  const productCount = await Product.countDocuments({ category: category._id })

  return { category: toAdminCategory(category, productCount) }
}
