import { isCloudinaryConfigured, uploadBuffer } from '../config/cloudinary.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const uploadImages = asyncHandler(async (req, res) => {
  if (!isCloudinaryConfigured()) {
    throw new ApiError('Image upload is not configured. Add Cloudinary keys or paste image URLs.', 503);
  }
  if (!req.files?.length) throw new ApiError('Choose an image to upload', 400);
  const urls = [];
  for (const file of req.files) {
    urls.push(await uploadBuffer(file.buffer));
  }
  res.json({ urls });
});
