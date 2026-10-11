import { Router } from 'express'
import {
  addCartItem,
  clearCart,
  getCart,
  removeCartItem,
  replaceCart,
  syncCart,
  updateCartItem,
} from '../controllers/cartController.js'
import { protect } from '../middleware/auth.js'

const router = Router()

router.use(protect)
router.get('/', getCart)
router.post('/sync', syncCart)
router.put('/replace', replaceCart)
router.post('/', addCartItem)
router.put('/', updateCartItem)
router.delete('/clear', clearCart)
router.delete('/', removeCartItem)

export default router
