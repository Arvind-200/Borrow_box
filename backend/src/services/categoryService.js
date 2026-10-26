import { Category } from '../models/Category.js'
import { Product } from '../models/Product.js'

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
      { $match: { moderationStatus: 'active' } },
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
