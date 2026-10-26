import { listCategories as listCategoriesService } from '../services/categoryService.js'

export async function listCategories(req, res, next) {
  try {
    const result = await listCategoriesService()
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
}
