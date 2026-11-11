import { parseAdminProductQuery } from '../validators/adminProductQuery.js'
import { parseModerationReason } from '../validators/moderationActionInput.js'
import {
  getProductForAdmin,
  listProductsForAdmin,
  moderateProduct,
} from '../services/adminProductService.js'

export async function listProductsHandler(req, res, next) {
  try {
    const query = parseAdminProductQuery(req.query)
    const result = await listProductsForAdmin(query)
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
}

export async function getProductHandler(req, res, next) {
  try {
    const result = await getProductForAdmin(req.params.id)
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
}

function makeModerationHandler(action) {
  return async function moderationHandler(req, res, next) {
    try {
      const { reason } = parseModerationReason(req.body, {
        required: action !== 'restore',
      })
      const result = await moderateProduct(
        req.params.id,
        req.user._id,
        action,
        { reason }
      )
      res.status(200).json(result)
    } catch (error) {
      next(error)
    }
  }
}

export const hideProduct = makeModerationHandler('hide')
export const removeProduct = makeModerationHandler('remove')
export const restoreProduct = makeModerationHandler('restore')
