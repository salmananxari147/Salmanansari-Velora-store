import { Router } from 'express'
import {
  applyCoupon,
  createCoupon,
  deleteCoupon,
  getCoupons,
  updateCoupon,
} from '../controllers/couponController.js'
import { admin, protect } from '../middleware/auth.js'

const router = Router()

router.post('/apply', applyCoupon)
router.get('/', protect, admin, getCoupons)
router.post('/', protect, admin, createCoupon)
router.put('/:id', protect, admin, updateCoupon)
router.delete('/:id', protect, admin, deleteCoupon)

export default router
