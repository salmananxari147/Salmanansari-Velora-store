import multer from 'multer';
import { ApiError } from '../utils/ApiError.js';

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024, files: 6 },
  fileFilter(_req, file, cb) {
    if (!file.mimetype.startsWith('image/')) {
      cb(new ApiError('Only image files can be uploaded', 400));
      return;
    }
    cb(null, true);
  },
});
