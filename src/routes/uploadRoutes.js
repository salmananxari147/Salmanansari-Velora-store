import { Router } from 'express'
import multer from 'multer'
import { uploadImages } from '../controllers/uploadController.js'
import { admin, protect } from '../middleware/auth.js'

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true)
    else cb(new Error('Only image files are allowed'))
  },
})

const router = Router()

router.post('/', protect, admin, upload.array('images', 6), uploadImages)

export default router
