import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const protect = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw new ApiError('Please sign in to continue', 401);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) throw new ApiError('Please sign in to continue', 401);
    req.user = user;
    next();
  } catch {
    throw new ApiError('Session expired. Please sign in again', 401);
  }
});

export const admin = (req, _res, next) => {
  if (req.user?.role !== 'admin') {
    return next(new ApiError('Admin access required', 403));
  }
  next();
};
