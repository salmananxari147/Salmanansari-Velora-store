import { Router } from 'express'
import { getOverview } from '../controllers/adminController.js'
import { admin, protect } from '../middleware/auth.js'

const router = Router()

router.get('/overview', protect, admin, getOverview)

export default router
