import { Router } from 'express'
import {
  addAddress,
  deleteAddress,
  getCustomers,
  getProfile,
  getWishlist,
  toggleWishlist,
  updateAddress,
  updateProfile,
} from '../controllers/userController.js'
import { admin, protect } from '../middleware/auth.js'

const router = Router()

router.use(protect)
router.get('/profile', getProfile)
router.put('/profile', updateProfile)
router.get('/wishlist', getWishlist)
router.post('/wishlist/:productId', toggleWishlist)
router.post('/addresses', addAddress)
router.put('/addresses/:id', updateAddress)
router.delete('/addresses/:id', deleteAddress)
router.get('/', admin, getCustomers)

export default router
