import { Router } from 'express'
import {
  getProduct,
  listProducts,
  listMyProducts,
  getMyProduct,
  createProduct,
  updateProduct,
  updateProductPublication,
} from '../controllers/productController.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

router.get('/mine', requireAuth, listMyProducts)
router.get('/mine/:id', requireAuth, getMyProduct)
router.post('/', requireAuth, createProduct)
router.put('/:id', requireAuth, updateProduct)
router.patch('/:id/publication', requireAuth, updateProductPublication)
router.get('/', listProducts)
router.get('/:id', getProduct)

export default router
