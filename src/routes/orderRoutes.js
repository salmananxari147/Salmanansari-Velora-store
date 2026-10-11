import { Router } from 'express'
import {
  createOrder,
  getMyOrders,
  getOrder,
  getOrders,
  updateOrderStatus,
} from '../controllers/orderController.js'
import { admin, protect } from '../middleware/auth.js'

const router = Router()

router.use(protect)
router.post('/', createOrder)
router.get('/mine', getMyOrders)
router.get('/', admin, getOrders)
router.get('/:id', getOrder)
router.put('/:id/status', admin, updateOrderStatus)

export default router
