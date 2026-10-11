import { Router } from 'express'
import {
  createProduct,
  deleteProduct,
  getFacets,
  getProduct,
  getProductById,
  getProducts,
  updateProduct,
} from '../controllers/productController.js'
import { admin, protect } from '../middleware/auth.js'

const router = Router()

router.get('/facets', getFacets)
router.get('/', getProducts)
router.get('/id/:id', protect, admin, getProductById)
router.get('/:slug', getProduct)
router.post('/', protect, admin, createProduct)
router.put('/:id', protect, admin, updateProduct)
router.delete('/:id', protect, admin, deleteProduct)

export default router
