import { Router } from 'express'
import {
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory,
} from '../controllers/categoryController.js'
import { admin, protect } from '../middleware/auth.js'

const router = Router()

router.get('/', getCategories)
router.post('/', protect, admin, createCategory)
router.put('/:id', protect, admin, updateCategory)
router.delete('/:id', protect, admin, deleteCategory)

export default router
