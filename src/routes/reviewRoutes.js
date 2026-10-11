import { Router } from 'express'
import { createReview, deleteReview, getReviews } from '../controllers/reviewController.js'
import { admin, protect } from '../middleware/auth.js'

const router = Router()

router.get('/', getReviews)
router.post('/', protect, createReview)
router.delete('/:id', protect, admin, deleteReview)

export default router
