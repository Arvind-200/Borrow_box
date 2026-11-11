import {
  parseCategoryActiveInput,
  parseCategoryCreateInput,
  parseCategoryUpdateInput,
} from '../validators/categoryInput.js'
import {
  createCategory,
  listCategoriesForAdmin,
  setCategoryActive,
  updateCategory,
} from '../services/categoryService.js'

export async function listCategoriesHandler(req, res, next) {
  try {
    const result = await listCategoriesForAdmin()
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
}

export async function createCategoryHandler(req, res, next) {
  try {
    const input = parseCategoryCreateInput(req.body)
    const result = await createCategory(req.user._id, input)
    res.status(201).json(result)
  } catch (error) {
    next(error)
  }
}

export async function updateCategoryHandler(req, res, next) {
  try {
    const input = parseCategoryUpdateInput(req.body)
    const result = await updateCategory(req.params.id, req.user._id, input)
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
}

export async function setCategoryActiveHandler(req, res, next) {
  try {
    const { isActive } = parseCategoryActiveInput(req.body)
    const result = await setCategoryActive(
      req.params.id,
      req.user._id,
      isActive
    )
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
}
