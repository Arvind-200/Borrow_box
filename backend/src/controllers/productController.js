import { parseProductQuery } from '../validators/productQuery.js'
import {
  parseProductInput,
  parsePublicationInput,
} from '../validators/productInput.js'
import {
  listProducts as listProductsService,
  getProductById as getProductByIdService,
  listOwnedProducts as listOwnedProductsService,
  getOwnedProduct as getOwnedProductService,
  createProduct as createProductService,
  updateOwnedProduct as updateOwnedProductService,
  updateOwnedProductPublication as updateOwnedProductPublicationService,
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

export async function listMyProducts(req, res, next) {
  try {
    const result = await listOwnedProductsService(req.user._id)
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
}

export async function getMyProduct(req, res, next) {
  try {
    const result = await getOwnedProductService(req.params.id, req.user._id)
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
}

export async function createProduct(req, res, next) {
  try {
    const input = parseProductInput(req.body)
    const result = await createProductService(req.user._id, input)
    res.status(201).json(result)
  } catch (error) {
    next(error)
  }
}

export async function updateProduct(req, res, next) {
  try {
    const input = parseProductInput(req.body)
    const result = await updateOwnedProductService(
      req.params.id,
      req.user._id,
      input
    )
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
}

export async function updateProductPublication(req, res, next) {
  try {
    const { isPublished } = parsePublicationInput(req.body)
    const result = await updateOwnedProductPublicationService(
      req.params.id,
      req.user._id,
      isPublished
    )
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
}
