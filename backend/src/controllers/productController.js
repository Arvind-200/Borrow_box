import { parseProductQuery } from '../validators/productQuery.js'
import {
  listProducts as listProductsService,
  getProductById as getProductByIdService,
} from '../services/productService.js'

export async function listProducts(req, res, next) {
  try {
    const params = parseProductQuery(req.query)
    const result = await listProductsService(params)
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
}

export async function getProduct(req, res, next) {
  try {
    const result = await getProductByIdService(req.params.id)
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
}
