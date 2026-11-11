import { Router } from 'express'
import {
  getProduct,
  listProducts,
  listProductLocations,
  listMyProducts,
  getMyProduct,
  createProduct,
  updateProduct,
  updateProductPublication,
  deleteProduct,
  uploadProductImage,
} from '../controllers/productController.js'
import { requireAuth } from '../middleware/auth.js'
import { uploadProductImage as uploadProductImageFile } from '../middleware/upload.js'
import { listProductReviews } from '../controllers/reviewController.js'

const router = Router()

router.post('/images', requireAuth, uploadProductImageFile, uploadProductImage)
router.get('/locations', listProductLocations)
router.get('/mine', requireAuth, listMyProducts)
router.get('/mine/:id', requireAuth, getMyProduct)
router.post('/', requireAuth, createProduct)
router.put('/:id', requireAuth, updateProduct)
router.patch('/:id/publication', requireAuth, updateProductPublication)
router.delete('/:id', requireAuth, deleteProduct)
router.get('/', listProducts)
router.get('/:id/reviews', listProductReviews)
router.get('/:id', getProduct)

export default router
